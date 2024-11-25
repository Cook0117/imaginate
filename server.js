require('dotenv').config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const rateLimit = require("express-rate-limit");
const { Configuration, OpenAIApi } = require("openai"); // Move OpenAI imports here

const app = express(); // Declare `app` only once
const PORT = 3000;
const JWT_SECRET = "your_secret_key";

let users = []; // Array to store user accounts
let contentData = []; // Array to store uploaded content data
let refreshTokens = []; // Array to store valid refresh tokens

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|mp4|webm|mkv/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Only images and videos are allowed."));
        }
    },
});

app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Middleware for token validation
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Authorization token required." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token." });
        req.user = user; // Attach user info to request
        next();
    });
}

// Register Endpoint
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
        return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), username, password: hashedPassword };
    users.push(user);

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

// Upload Content
app.post("/upload", authenticateToken, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    try {
        const { caption, category } = req.body;
        if (!caption || !category) {
            return res.status(400).json({ message: "Caption and category are required." });
        }

        const filePath = `/uploads/${req.file.filename}`;
        const newPost = { id: uuidv4(), url: filePath, caption, type: category };
        contentData.push(newPost);

        res.status(200).json({ message: "Content uploaded successfully!", url: filePath, id: newPost.id });
    } catch (error) {
        res.status(500).json({ message: "Error uploading content.", error });
    }
});

// Delete Content by ID
app.delete("/content/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const initialLength = contentData.length;
    contentData = contentData.filter(item => item.id !== id);

    if (contentData.length < initialLength) {
        res.status(200).json({ message: "Post deleted successfully!" });
    } else {
        res.status(404).json({ message: "Post not found." });
    }
});

// Get Content by Category with Pagination
app.get("/content/:category", (req, res) => {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const content = contentData.filter(item => item.type.toLowerCase() === category.toLowerCase());
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

// Handle Undefined Routes
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error", error: err.message });
    }
    res.status(500).json({ message: "An unexpected error occurred.", error: err.message });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.post("/content/:id/like", authenticateToken, (req, res) => {
    const { id } = req.params;
    const post = contentData.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    post.likes = (post.likes || 0) + 1; // Increment the likes
    res.status(200).json({ message: "Post liked successfully", likes: post.likes });
});

app.post("/content/:id/comment", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const post = contentData.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments = post.comments || [];
    post.comments.push({ user: req.user.username, comment });
    res.status(200).json({ message: "Comment added successfully", comments: post.comments });
});

app.post("/content/:id/save", authenticateToken, (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.savedPosts = user.savedPosts || [];
    if (!user.savedPosts.includes(id)) {
        user.savedPosts.push(id);
    }
    res.status(200).json({ message: "Post saved successfully" });
});

app.get("/content/:id/share", (req, res) => {
    const { id } = req.params;
    const post = contentData.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const shareableLink = `http://localhost:3000/content/${id}`;
    res.status(200).json({ message: "Shareable link generated", link: shareableLink });
});

const express = require("express");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/recommendations", async (req, res) => {
    const { userPreferences, availablePosts } = req.body;

    try {
        const prompt = `
        Based on the user's preferences and interaction history, recommend 5 posts.
        User Preferences:
        ${JSON.stringify(userPreferences)}

        Available Posts:
        ${JSON.stringify(availablePosts)}

        Return only the recommended post IDs.
        `;

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 200,
            temperature: 0.7,
        });

        const recommendations = JSON.parse(response.data.choices[0].text.trim());
        res.status(200).json({ recommendations });
    } catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({ message: "Error generating recommendations" });
    }
});

// Error Handling and Server Start
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error", error: err.message });
    }
    res.status(500).json({ message: "An unexpected error occurred.", error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});