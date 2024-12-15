require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const rateLimit = require("express-rate-limit");
const { Configuration, OpenAIApi } = require("openai"); // OpenAI imports
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your .env file contains the API key
});

const openai = new OpenAIApi(configuration);

// Declare `app` only once
const app = express();

// Constants
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

console.log('API Base URL:', API_URL);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

console.log("Loaded OpenAI API Key:", OPENAI_API_KEY);
console.log("JWT Secret:", JWT_SECRET);
console.log("App Port:", PORT);

// Data
let users = []; // Array to store user accounts
let contentData = []; // Array to store uploaded content data
let refreshTokens = []; // Array to store valid refresh tokens
let savedPosts = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, 'dist')));

// Redirect all other routes to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

console.log("Content data initialized:", contentData);

// Endpoint to save a post
app.post('/save-post', (req, res) => {
    const { postId, caption, url } = req.body;
    if (!postId || !caption || !url) {
        return res.status(400).json({ error: 'Missing post data' });
    }

    // Save post in the "saved" section
    savedPosts.push({ postId, caption, url });
    res.status(200).json({ message: 'Post saved successfully' });
});

// Endpoint to get saved posts
app.get('/saved-posts', (req, res) => {
    res.status(200).json(savedPosts);
});


// Function to get AI response
async function getAIResponse(question) {
    try {
        console.log("Fetching AI response...");
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: question }],
            max_tokens: 100,
        });

        console.log("AI response received:", response.data);
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error fetching AI response:", error.response?.data || error.message);
        throw new Error("Failed to fetch AI response");
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            console.error("Error: No question provided.");
            return res.status(400).json({ error: "Question is required." });
        }

        console.log("Received question:", question);

        // Send the question to OpenAI
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo", // Replace with your desired model
            messages: [{ role: "user", content: question }], // Chat-style input
            max_tokens: 150,
        });
        const aiReply = response.data.choices[0].message.content.trim();
        console.log("AI Reply:", aiReply);

        res.json({ reply: aiReply });
    } catch (error) {
        console.error("Error in /chat endpoint:", error.message); // Log the error message
        console.error(error.response?.data || error); // Log detailed error information

        // Respond with an appropriate error message
        res.status(500).json({
            error: "Failed to process your request.",
            details: error.response?.data || error.message,
        });
    }
});

// Endpoint to serve random content
app.get("/content/random", (req, res) => {
    const randomContent = content[Math.floor(Math.random() * content.length)];
    res.json(randomContent);
});

(async () => {
    try {
        const response = await openai.listModels();
        console.log("Available models:", response.data);
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
})();

// Default route for the homepage
app.get("/", (req, res) => {res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to store files
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Extract original file extension
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '')}`; // Remove spaces for clean filenames
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
    }
});

app.get("/content/search", (req, res) => {
    console.log("Search endpoint hit with query:", req.query.query); // Debug log
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: "Search query is required." });
    }

    // Assuming `contentData` is populated with your JSON data
    const results = contentData.filter(item =>
        item.caption.toLowerCase().includes(query.toLowerCase())
    );

    console.log("Search results:", results); // Debug log
    res.status(200).json({ data: results });
});

// Route to fetch images
app.get("/content/images", (req, res) => {
    // Filter contentData to return only images
    const images = contentData.filter(item => item.type === "Images");

    // If no images are found, return an empty array
    if (images.length === 0) {
        return res.status(200).json({ data: [] });
    }

    // Return the filtered images
    res.status(200).json({ data: images });
});

// Route to fetch videos
app.get("/content/videos", (req, res) => {
    // Filter contentData to return only videos
    const videos = contentData.filter(item => item.type === "Videos");

    // If no videos are found, return an empty array
    if (videos.length === 0) {
        return res.status(200).json({ data: [] });
    }

    // Return the filtered videos
    res.status(200).json({ data: videos });
});


app.get("/content/animations", (req, res) => {
    console.log("GET /content/animations called");
    console.log("Content Data:", contentData);

    const animations = contentData.filter(item => item.type === "Animations");
    if (animations.length === 0) {
        console.log("No animations found.");
        return res.status(200).json({ data: [] });
    }

    console.log("Animations found:", animations);
    res.status(200).json({ data: animations });
});

app.get("/content/vr", (req, res) => {
    console.log("GET /content/vr called"); // Debug log
    const vrContent = contentData.filter(item => item.type === "VR");
    if (vrContent.length === 0) {
        return res.status(200).json({ data: [] });
    }
    res.status(200).json({ data: vrContent });
});

const fs = require('fs');

app.get('/api/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'uploads');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading images directory');
        }
        // Filter out non-image files (if needed)
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));
        res.json(imageFiles.map(file => `/uploads/${file}`));
    });
});

// Middleware for token validation
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    console.log("Authorization header:", authHeader); // Debug the header
    console.log("Extracted Token:", token); // Debug the token

    if (!token) {
        console.error("Token missing in request.");
        return res.status(401).json({ message: "Authorization token required." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("Invalid token:", err.message); // Debug invalid token
            return res.status(403).json({ message: "Invalid token." });
        }

        console.log("Authenticated user from token:", user); // Log authenticated user
        req.user = user;
        next();
    });
}

app.post("/upload", authenticateToken, upload.single("file"), (req, res) => {
    console.log("Upload endpoint hit"); // Debug log
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    try {
        const { caption, category } = req.body;
        if (!caption || !category) {
            return res.status(400).json({ message: "Caption and category are required." });
        }

        const filePath = `/uploads/${req.file.filename}`;
        const newPost = {
            id: uuidv4(),
            url: filePath,
            caption,
            type: category, // E.g., "Images" or "Videos"
            userId: req.user.id, // The logged-in user's ID
            username: req.user.username, // The logged-in user's username
            likes: 0,
            comments: [],
        };

        console.log("New Post Created:", newPost); // Debug log
        contentData.push(newPost);

        res.status(200).json({ message: "Content uploaded successfully!", post: newPost });
    } catch (error) {
        res.status(500).json({ message: "Error uploading content.", error });
    }
});

// Register Endpoint
app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        console.error("Username already exists:", username); // Log duplicate username
        return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), username, password: hashedPassword };
    users.push(user);

    console.log("Registered user:", user); // Log newly registered user
    console.log("Users array:", users); // Log the updated users array

    res.status(201).json({ message: "User registered successfully!" });
});

// Login Endpoint with Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: { message: "Too many login attempts. Please try again later." },
});

app.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ message: "Invalid username or password." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid username or password." });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    console.log("Generated Token:", token); // Debugging log
    const refreshToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    refreshTokens.push(refreshToken);

    res.status(200).json({ message: "Login successful!", token, refreshToken });
});

// Refresh Token Endpoint
app.post("/token", (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "Refresh token required." });
    if (!refreshTokens.includes(token)) return res.status(403).json({ message: "Invalid refresh token." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token." });

        const newAccessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "15m" });
        res.json({ accessToken: newAccessToken });
    });
});

// Logout Endpoint
app.post("/logout", authenticateToken, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.status(200).json({ message: "Logged out successfully." });
});

// Get Current User Info
app.get("/user", authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const { password, ...userWithoutPassword } = user; // Exclude password
    res.status(200).json({ user: userWithoutPassword });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error", error: err.message });
    }
    res.status(500).json({ message: "An unexpected error occurred.", error: err.message });
});

app.post('/content/:id/like', authenticateToken, (req, res) => {
    console.log("Current contentData:", contentData); // Log the contentData array
    const { id } = req.params;
    console.log("Incoming like request for post ID:", id); // Debug log
    const post = contentData.find(post => post.id === id);
    if (!post) {
        console.error("Post not found for ID:", id); // Debug log
        return res.status(404).json({ message: "Post not found" });
    }

    post.likes = (post.likes || 0) + 1; // Increment the like count
    console.log("Updated likes:", post.likes); // Debug log
    res.status(200).json({ likes: post.likes });
    
});

console.log("Loaded OpenAI API Key:", process.env.OPENAI_API_KEY);

// Test the OpenAI setup
(async () => {
    try {
        const response = await openai.listModels();
        console.log("Available models:", response.data);
    } catch (error) {
        console.error("OpenAI API Error:", error.message);
    }
})();

// Handle Undefined Routes
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

async function fetchAIResponse() {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            prompt: "Your prompt here",
            max_tokens: 100,
        });
        console.log(response.data);
    } catch (error) {
        console.error("Error fetching AI response:", error.message);
    }
}

// Call fetchAIResponse at the top level using an IIFE (Immediately Invoked Function Expression)
(async () => {
    await fetchAIResponse();
})();

// Error Handling
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error", error: err.message });
    }
    res.status(500).json({ message: "An unexpected error occurred.", error: err.message });
});

app.get("/user/:username", authenticateToken, (req, res) => {
    const { username } = req.params;

    console.log("Requested username:", username); // Log the incoming username
    console.log("Available users:", users);       // Log the users array for debugging

    const user = users.find(u => u.username === username);
    if (!user) {
        console.error("User not found:", username); // Log the missing username
        return res.status(404).json({ message: "User not found." });
    }

    const userPosts = contentData.filter(post => post.userId === user.id);
    res.status(200).json({ user: { id: user.id, username: user.username }, posts: userPosts });
});

app.get("/content/:category", (req, res) => {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const content = contentData
        .filter(item => item.type.toLowerCase() === category.toLowerCase())
        .map(item => ({
            ...item,
            username: users.find(user => user.id === item.userId)?.username || "Unknown User",
        }));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);

    const paginatedContent = content.slice(startIndex, endIndex);

    res.json({
        total: content.length,
        page: parseInt(page),
        limit: parseInt(limit),
        data: paginatedContent,
    });
});

app.post("/recommendations", authenticateToken, async (req, res) => {
    const { userPreferences } = req.body;
    console.log("Recommendations endpoint hit");
    console.log("Request body:", req.body); // Debug the incoming request

    if (!userPreferences) {
        return res.status(400).json({ message: "User preferences are required." });
    }

    // Recommendation logic here
    const recommendations = contentData.slice(0, 5); // Example: default to first 5 posts
    res.status(200).json({ recommendations });
});

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
});

// Start the Server
module.exports = app;
