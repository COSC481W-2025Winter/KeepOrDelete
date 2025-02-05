window.onload = async function () {
    let files = [];
    let currentIndex = 0;

    try {
        // Fetch the selected directory path
        const dirPath = await window.file.getFilePath();

        document.getElementById("dirPath").innerText =
            dirPath ? `Selected Directory: ${dirPath}` : "No directory selected";

        if (dirPath) {
            // Fetch files in the directory
            files = await window.file.getFilesInDirectory();
        }

        if (files.length > 0) {
            displayFile(files[currentIndex]);
        } else {
            document.getElementById("currentItem").innerText = "No files found.";
        }

    } catch (error) {
        console.error("Failed to fetch directory path or files:", error);
    }

    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "../main_menu.html";
    });

    document.getElementById("nextButton").addEventListener("click", () => {
        if (files.length > 0) {
            currentIndex = (currentIndex + 1) % files.length;
            displayFile(files[currentIndex]);
        }
    });

    document.getElementById("prevButton").addEventListener("click", () => {
        if (files.length > 0) {
            currentIndex = (currentIndex - 1 + files.length) % files.length;
            displayFile(files[currentIndex]);
        }
    });

    function displayFile(filename) {
        document.getElementById("currentItem").innerText = `Current File: ${filename}`;
    }
};
