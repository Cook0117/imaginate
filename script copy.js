document.addEventListener("DOMContentLoaded", function() {

document.querySelectorAll(".dropdown-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const dropdownMenu = button.nextElementSibling;
        if (dropdownMenu.style.display === "none") {
            dropdownMenu.style.display = "block";
        } else {
            dropdownMenu.style.display = "none";
        }
    });
});
// Function to toggle the upload modal visibility
function toggleUploadModal() {
    const modal = document.getElementById("uploadModal");
    modal.style.display = (modal.style.display === "none" || modal.style.display === "") ? "flex" : "none";
}

// Event listener for opening the modal when the "Upload" button is clicked
document.getElementById("openUploadButton").addEventListener("click", toggleUploadModal);

// Optional: Close the modal when clicking outside the modal content
window.onclick = function(event) {
    const modal = document.getElementById("uploadModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Function to upload an image and refresh the image feed
document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData();
    formData.append("file", document.getElementById("file").files[0]);
    formData.append("caption", document.getElementById("caption").value);
    formData.append("category", document.getElementById("category").value);

    try {
        const response = await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message);
            toggleUploadModal(); // Close modal after upload
            loadImages(); // Refresh the image feed
        } else {
            console.error("Upload failed:", response.statusText);
            alert("An error occurred during upload.");
        }
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("An error occurred. Please check the console for details.");
    }
});

// Function to load images from the server and display them
async function loadImages() {
    try {
        const response = await fetch("http://localhost:3000/content");
        const images = await response.json();

        const imagesSection = document.getElementById("imagesSection");
        imagesSection.innerHTML = ""; // Clear existing images

        images.forEach((item) => {
            const imageElement = document.createElement("div");
            imageElement.className = "post";
            imageElement.innerHTML = `
                <img src="${item.url}" alt="${item.caption}" style="width: 100%; max-width: 300px; border-radius: 8px;">
                <p>${item.caption}</p>
            `;
            imagesSection.appendChild(imageElement);
        });
    } catch (error) {
        console.error("Error loading images:", error);
    }
}

// Event listener to show images when the "Images" tab is clicked
document.querySelector(".nav-tab.images").addEventListener("click", () => {
    // Hide all other sections if necessary, and show imagesSection
    document.getElementById("imagesSection").style.display = "block";
    loadImages(); // Load and display images
});
});