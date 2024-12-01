
document.addEventListener("DOMContentLoaded", function () {


    const sendButton = document.getElementById("send-button");
    const chatInput = document.getElementById("chat-input");
    const chatResponse = document.getElementById("chat-response");

    if (!sendButton || !chatInput || !chatResponse) {
        console.error("Required elements are missing in the DOM.");
        return;
    }

    // Add click event listener to the send button
    sendButton.addEventListener("click", async () => {
        const userMessage = chatInput.value.trim();
        if (!userMessage) {
            chatResponse.innerText = "Please enter a question.";
            return;
        }

        // Make the POST request to /chat
        try {
            chatResponse.innerText = "Preparing AI response...";
            const response = await fetch("http://localhost:3000/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: userMessage }),
            });

            if (response.ok) {
                const data = await response.json();
                chatResponse.innerText = data.reply || "No response received.";
            } else {
                console.error("Error:", response.status, response.statusText);
                chatResponse.innerText = "Failed to fetch response from server.";
            }
        } catch (error) {
            console.error("Error:", error.message);
            chatResponse.innerText = "An error occurred while connecting to the server.";
        }
    });

    document.getElementById("toggle-chatbot").addEventListener("click", function () {
    const chatbot = document.getElementById("chatbot-container");
    chatbot.style.display = chatbot.style.display === "none" ? "block" : "none";
});

    function showSection(sectionId, loadFunction) {
        // Hide all sections
        document.querySelectorAll(".content-section").forEach((section) => {
            section.style.display = "none";
        });
    
        // Show the selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = "block";
            if (typeof loadFunction === "function") {
                loadFunction(); // Call the provided load function
            }
        } else {
            console.error(`Section with ID '${sectionId}' not found.`);
        }
    }

    // Navigation event listeners for different content types
    const showImagesButton = document.getElementById("showImagesButton");
    const showVideosButton = document.getElementById("showVideosButton");
    const showAnimationButton = document.getElementById("showAnimationButton");
    const showVrButton = document.getElementById("showVrButton");

    if (showImagesButton) showImagesButton.addEventListener("click", () => showSection("imagesSection", loadImages));
    if (showVideosButton) showVideosButton.addEventListener("click", () => showSection("videosSection", loadVideos));
    if (showAnimationButton) showAnimationButton.addEventListener("click", () => showSection("animationSection", loadAnimations));
    if (showVrButton) showVrButton.addEventListener("click", () => showSection("vrSection", loadVr));

    // Generic function to toggle modals
    function toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = (modal.style.display === "none" || modal.style.display === "") ? "flex" : "none";
        } else {
            console.error(`Modal with ID '${modalId}' not found.`);
        }
    }

    // Modal event listeners
    const uploadButton = document.getElementById("openUploadButton");
    const closeUploadModalButton = document.getElementById("closeUploadModal");
    const registerButton = document.getElementById("registerButton");
    const closeRegisterModalButton = document.getElementById("closeRegisterModal");
    const loginButton = document.getElementById("loginButton");
    const closeLoginModalButton = document.getElementById("closeLoginModal");

    if (uploadButton) uploadButton.addEventListener("click", () => toggleModal("uploadModal"));
    if (closeUploadModalButton) closeUploadModalButton.addEventListener("click", () => toggleModal("uploadModal"));
    if (registerButton) registerButton.addEventListener("click", () => toggleModal("registerModal"));
    if (closeRegisterModalButton) closeRegisterModalButton.addEventListener("click", () => toggleModal("registerModal"));
    if (loginButton) loginButton.addEventListener("click", () => toggleModal("loginModal"));
    if (closeLoginModalButton) closeLoginModalButton.addEventListener("click", () => toggleModal("loginModal"));

    // Form submissions
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const username = document.getElementById("registerUsername").value;
            const password = document.getElementById("registerPassword").value;

            try {
                const response = await fetch("http://localhost:3000/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    alert("Registration successful!");
                    toggleModal("registerModal");
                } else {
                    const data = await response.json();
                    alert(data.message);
                }
            } catch (error) {
                console.error("Error during registration:", error);
            }
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const username = document.getElementById("loginUsername").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const response = await fetch("http://localhost:3000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("token", data.token);
                    alert("Login successful!");
                    toggleModal("loginModal");
                } else {
                    const data = await response.json();
                    alert(data.message);
                }
            } catch (error) {
                console.error("Error during login:", error);
            }
        });
    }

    const uploadForm = document.getElementById("uploadForm");
    if (uploadForm && !uploadForm.dataset.listenerAdded) {
        uploadForm.dataset.listenerAdded = true; // Mark the listener as added
        uploadForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent default form submission behavior
    
            console.log("Submit button clicked!"); // Debugging log
    
            const formData = new FormData();
            formData.append("file", document.getElementById("file").files[0]);
            formData.append("caption", document.getElementById("caption").value);
            formData.append("category", document.getElementById("category").value);
    
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("You must be logged in to upload content.");
                    return;
                }
    
                const response = await fetch("http://localhost:3000/upload", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
    
                if (response.ok) {
                    const data = await response.json();
                    console.log("Upload successful:", data); // Debugging log
                    alert("Content uploaded successfully!");
                    toggleModal("uploadModal"); // Close the modal after successful upload
                } else {
                    const error = await response.json();
                    console.error("Upload failed:", error); // Debugging log
                    alert(`Error: ${error.message}`);
                }
            } catch (error) {
                console.error("Error uploading content:", error); // Debugging log
            }
        });
    }

async function loadImages() {
    const contentFeedImages = document.getElementById("contentFeedImages");
    contentFeedImages.innerHTML = ""; // Clear existing content

    try {
        const response = await fetch("http://localhost:3000/content/images");
        if (!response.ok) throw new Error("Failed to fetch images");

        const responseData = await response.json();
        const images = responseData.data;

        if (!Array.isArray(images)) {
            throw new Error("Invalid data format: Expected an array");
        }

        images.forEach((image) => {
            // Define postDiv here
            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <img src="http://localhost:3000${image.url}" alt="${image.caption}" style="width: 100%; cursor: pointer;" 
                     onclick="openViewModal('<img src=\\'http://localhost:3000${image.url}\\' alt=\\'${image.caption}\\' style=\\'width: 100%;\\'>')">
                <p>${image.caption}</p>
            `;
            contentFeedImages.appendChild(postDiv); // Append the postDiv
        });
    } catch (error) {
        console.error("Error loading images:", error);
    }
}

async function loadVideos() {
    const contentFeedVideos = document.getElementById("contentFeedVideos");
    contentFeedVideos.innerHTML = ""; // Clear existing videos

    try {
        const response = await fetch("http://localhost:3000/content/videos");
        if (!response.ok) throw new Error("Failed to fetch videos");

        const responseData = await response.json();
        const videos = responseData.data;

        if (!Array.isArray(videos)) {
            throw new Error("Invalid data format: Expected an array");
        }

        videos.forEach((video) => {
            const videoDiv = document.createElement("div");
            videoDiv.className = "post";
            videoDiv.innerHTML = `
                <video src="http://localhost:3000${video.url}" controls style="width: 100%;"></video>
                <p>${video.caption}</p>
            `;
            contentFeedVideos.appendChild(videoDiv);
        });
    } catch (error) {
        console.error("Error loading videos:", error);
    }
}

async function loadAnimations() {
    const contentFeedAnimation = document.getElementById("contentFeedAnimation");
    contentFeedAnimation.innerHTML = ""; // Clear existing animations

    try {
        const response = await fetch("http://localhost:3000/content/animations");
        if (!response.ok) throw new Error("Failed to fetch animations");

        const responseData = await response.json();
        const animations = responseData.data;

        if (!Array.isArray(animations)) {
            throw new Error("Invalid data format: Expected an array");
        }

        animations.forEach((animation) => {
            const animationDiv = document.createElement("div");
            animationDiv.className = "post";
            animationDiv.innerHTML = `
                <video src="http://localhost:3000${animation.url}" controls style="width: 100%;"></video>
                <p>${animation.caption}</p>
            `;
            contentFeedAnimation.appendChild(animationDiv);
        });
    } catch (error) {
        console.error("Error loading animations:", error);
    }
}

async function loadVr() {
    const contentFeedVr = document.getElementById("contentFeedVr");
    contentFeedVr.innerHTML = ""; // Clear existing VR/AR content

    try {
        const response = await fetch("http://localhost:3000/content/vr");
        if (!response.ok) throw new Error("Failed to fetch VR/AR content");

        const responseData = await response.json();
        const vrContent = responseData.data;

        if (!Array.isArray(vrContent)) {
            throw new Error("Invalid data format: Expected an array");
        }

        vrContent.forEach((vr) => {
            const vrDiv = document.createElement("div");
            vrDiv.className = "post";
            vrDiv.innerHTML = `
                <video src="http://localhost:3000${vr.url}" controls style="width: 100%;"></video>
                <p>${vr.caption}</p>
            `;
            contentFeedVr.appendChild(vrDiv);
        });
    } catch (error) {
        console.error("Error loading VR/AR content:", error);
    }
}

 // Open the modal and insert dynamic content
 function openViewModal(contentHTML, username) {
    const contentModal = document.getElementById("contentModal");
    const modalContentArea = document.getElementById("modalContentArea");

    modalContentArea.innerHTML = `
        <div class="modal-username">
            <a href="#" onclick="viewUserProfile('${username}')">${username}</a>
        </div>
        ${contentHTML}
    `;

    contentModal.style.display = "flex";
}

// Attach globally
window.openViewModal = openViewModal;

// Close the modal
function closeContentModal() {
    const contentModal = document.getElementById("contentModal");

    // Hide the modal
    contentModal.style.display = "none";

    // Clear the modal content area to remove the previous content
    const modalContentArea = document.getElementById("modalContentArea");
    modalContentArea.innerHTML = "";
}

// Attach to the global window object
window.closeContentModal = closeContentModal;

async function uploadContent() {
    const formData = new FormData();
    formData.append("file", document.getElementById("file").files[0]);
    formData.append("caption", document.getElementById("caption").value);
    formData.append("category", document.getElementById("category").value);

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to upload content.");
            return;
        }

        const response = await fetch("http://localhost:3000/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Upload successful:", data);
            alert("Content uploaded successfully!");
        } else {
            const error = await response.json();
            console.error("Upload failed:", error);
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error("Error uploading content:", error);
    }
}

// Function to view a user's profile
async function viewUserProfile(username) {
    try {
        const response = await fetch(`http://localhost:3000/user/${username}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user profile.");
        }

        const userData = await response.json();
        console.log(userData); // Debugging log
        displayUserProfile(userData); // Render user profile
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

async function fetchContentData() {
    try {
        const response = await fetch("http://localhost:3000/content");
        if (response.ok) {
            const data = await response.json();
            return data; // Assuming the server sends an array of posts
        } else {
            console.error("Failed to fetch content data:", await response.json());
        }
    } catch (error) {
        console.error("Error fetching content data:", error);
    }
    return [];
}

async function fetchAndDisplayRecommendations() {
    const recommendationsContainer = document.getElementById("recommendationsContainer");
if (!recommendationsContainer) {
    console.error("Element #recommendationsContainer not found");
    return;
}
    recommendationsContainer.innerHTML = ""; // Clear previous recommendations

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to see recommendations.");
            return;
        }

        const userPreferences = {
            likedCategories: ["Images", "Videos"], // Example categories
            likedPosts: [], // Empty array if user hasn't liked anything yet
        };

        const response = await fetch("http://localhost:3000/recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(userPreferences),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Recommendations API Response:", data);
            const recommendations = data.recommendations;

            recommendations.forEach((post) => {
                const postHTML = createPostHTML(post);
                recommendationsContainer.innerHTML += postHTML;
            });
        } else {
            console.error("Error fetching recommendations:", await response.json());
        }
    } catch (error) {
        console.error("Error fetching recommendations:", error);
    }
    if (recommendations.length === 0) {
        recommendationsContainer.innerHTML = "<p>No recommendations available at the moment.</p>";
    }
}

// Attach function globally
window.viewUserProfile = viewUserProfile;

function createPostHTML(post) {
    return `
        <div class="post">
            <div class="post-header">
                <a href="#" onclick="viewUserProfile('${post.username}')">${post.username}</a>
            </div>
            <div class="post-media">
                ${
                    post.type === "Images"
                        ? `<img src="http://localhost:3000${post.url}" alt="${post.caption}" />`
                        : `<video src="http://localhost:3000${post.url}" controls></video>`
                }
            </div>
            <p>${post.caption}</p>
            <div class="post-actions">
                <!-- Like Button -->
                <button class="like-button" onclick="likePost('${post.id}')">
                    ❤️ <span id="like-count-${post.id}">${post.likes || 0}</span>
                </button>
            </div>
        </div>
    `;
}

async function likePost(postId) {
    console.log(`Liking post with ID: ${postId}`); // Debugging log
    const url = `http://localhost:3000/content/${postId}/like`;
    console.log("URL being called:", url);

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to like posts.");
            return;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Like successful, new likes count:", data.likes);

            const likeCountElement = document.getElementById(`like-count-${postId}`);
            if (likeCountElement) {
                likeCountElement.textContent = data.likes;
            }
        } else {
            const error = await response.json();
            console.error("Error liking the post:", error);
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error("Error liking the post:", error);
    }
}

// Attach to the global window object
window.likePost = likePost;

async function loadPosts() {
    const contentFeed = document.getElementById("contentFeed");
    contentFeed.innerHTML = ""; // Clear existing posts

    try {
        const response = await fetch("http://localhost:3000/content/images");
        if (!response.ok) throw new Error("Failed to fetch posts");

        const responseData = await response.json();
        responseData.data.forEach(post => {
            contentFeed.innerHTML += createPostHTML(post);
        });
    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

async function askAI(message) {
    const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    if (response.ok) {
        const data = await response.json();
        console.log("AI Reply:", data.reply);
        return data.reply;
    } else {
        console.error("Error:", await response.json());
    }
}

let requestCount = 0;
const MAX_REQUESTS = 10; // Example: 10 requests per minute
const REQUEST_INTERVAL = 60000; // 1 minute in milliseconds

setInterval(() => {
    requestCount = 0; // Reset request count every minute
}, REQUEST_INTERVAL);

async function getAIResponse(question) {
    let retryCount = 0;
    const maxRetries = 5;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (retryCount < maxRetries) {
        try {
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: question }],
                max_tokens: 150,
            });

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            if (error.response?.status === 429 && retryCount < maxRetries) {
                retryCount++;
                console.warn(`Rate limit hit. Retrying in ${retryCount * 1000}ms...`);
                await delay(retryCount * 1000);
            } else {
                console.error("OpenAI API Error:", error.response?.data || error.message);
                throw new Error("Failed to fetch AI response");
            }
        }
    }
}
});
