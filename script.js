
document.addEventListener("DOMContentLoaded", function () {
    loadRandomContent();


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

    async function loadRandomContent() {
        const randomContentFeed = document.getElementById("randomContentFeed");
        randomContentFeed.innerHTML = ""; // Clear existing content

        try {
            const [images, videos, animations, vrContent] = await Promise.all([
                fetch("http://localhost:3000/content/images").then(res => res.json()),
                fetch("http://localhost:3000/content/videos").then(res => res.json()),
                fetch("http://localhost:3000/content/animations").then(res => res.json()),
                fetch("http://localhost:3000/content/vr").then(res => res.json()),
            ]);

            function getRandomItem(array) {
                return array[Math.floor(Math.random() * array.length)];
            }

            // Helper function to create content
            const createPost = (item, type) => {
                const postDiv = document.createElement("div");
                postDiv.className = "post";

                if (type === "image") {
                    postDiv.innerHTML = `<img src="http://localhost:3000${item.url}" alt="${item.caption}" style="width: 100%;"><p>${item.caption}</p>`;
                } else {
                    postDiv.innerHTML = `<video src="http://localhost:3000${item.url}" controls style="width: 100%;"></video><p>${item.caption}</p>`;
                }

                randomContentFeed.appendChild(postDiv);
            };

            if (images.length) createPost(getRandomItem(images), "image");
            if (videos.length) createPost(getRandomItem(videos), "video");
            if (animations.length) createPost(getRandomItem(animations), "video");
            if (vrContent.length) createPost(getRandomItem(vrContent), "video");
        } catch (error) {
            console.error("Error loading random content:", error);
        }
    }

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
if (uploadForm) {
    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevents default form submission behavior

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
} else {
    console.error("Upload form not found!"); // Debugging log
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
            const postDiv = document.createElement("div");
            postDiv.className = "post";

            // Make the image clickable
            postDiv.innerHTML = `
                <img src="http://localhost:3000${image.url}" alt="${image.caption}" style="width: 100%; cursor: pointer;" 
                     onclick="openViewModal('<img src=\\'http://localhost:3000${image.url}\\' alt=\\'${image.caption}\\' style=\\'width: 100%;\\'>')">
                <p>${image.caption}</p>
            `;
            contentFeedImages.appendChild(postDiv);
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
 function openViewModal(contentHTML) {
    const contentModal = document.getElementById("contentModal");
    const modalContentArea = document.getElementById("modalContentArea");

    // Insert the provided content into the modal
    modalContentArea.innerHTML = contentHTML;

    // Display the modal
    contentModal.style.display = "flex";
}

// Attach to the global window object
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


async function fetchRecommendations() {
    try {
        const userPreferences = {
            likedCategories: ["Images", "Videos"],
            viewedPosts: ["post1", "post2"],
            likedPosts: ["post3"]
        };

        const response = await fetch("http://localhost:3000/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userPreferences,
                availablePosts: [
                    { id: "post1", category: "Images", caption: "Sunset at the beach" },
                    { id: "post2", category: "Videos", caption: "A tutorial on painting" },
                    { id: "post3", category: "Images", caption: "A beautiful mountain view" },
                    { id: "post4", category: "Animation", caption: "Funny animated short" },
                    { id: "post5", category: "Images", caption: "Stunning cityscape at night" }
                ],
            }),
        });

        const { recommendations } = await response.json();

        displayRecommendations(recommendations);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
    }
}

function displayRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById("recommendations");
    recommendationsContainer.innerHTML = ""; // Clear previous recommendations

    recommendations.forEach((postId) => {
        const post = availablePosts.find((post) => post.id === postId);
        const postElement = document.createElement("div");
        postElement.className = "post";
        postElement.innerHTML = `
            <p>${post.caption}</p>
            <button onclick="viewPost('${post.id}')">View Post</button>
        `;
        recommendationsContainer.appendChild(postElement);
    });
}
});
