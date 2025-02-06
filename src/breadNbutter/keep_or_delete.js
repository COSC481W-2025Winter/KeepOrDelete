//const path = require("node:path");
//const fs = require("fs");

window.onload = async function () {
    let files = [];
    let currentIndex = 0;

    try {
        // Fetch the selected directory path
        const dirPath = await window.file.getFilePath();

        document.getElementById("dirPath").innerText =
            dirPath ? `Selected Directory: \n${dirPath}` : "No directory selected";

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

    // Change Directory Button
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "../main_menu.html";
    });

    document.getElementById("deleteButton").addEventListener("click", async () => {
        const filePath = files[currentIndex];
        try {
            const result = await window.file.deleteFile(filePath);

            if (result.success) {
                alert("File deleted successfully!");
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Error deleting file: " + error.message);
        }
    });

    // Go through files in directory +1
    document.getElementById("nextButton").addEventListener("click", () => {
        if (files.length > 0) {
            if (currentIndex < files.length - 1) {
                currentIndex = (currentIndex + 1);
                displayFile(files[currentIndex]);
            }
            else {
                alert("No more files in selected Directory")
            }
        }
    });
    // Go through files in directory - 1
    document.getElementById("prevButton").addEventListener("click", () => {
        if (files.length > 0) {
            if (currentIndex > 0) {
                currentIndex = (currentIndex - 1);
                displayFile(files[currentIndex]);
            }
            else {
                alert("No previous files selected Directory")
            }
        }

    });

    function displayFile(filename) {
        document.getElementById("currentItem").innerText = `Current File: \n${filename}`;
        refreshPreview(filename)
    }

   function refreshPreview(filename) {
      var container = document.getElementById("previewContainer");

      const mimeType = window.file.getMimeType(filename);

      console.log(`${filename} has MIME type ${mimeType}.`);

      if (mimeType != null && mimeType.startsWith("text/")) {
         var fileContents = window.file.getFileContents(filename).replaceAll("<", "&lt;");

         // Escape HTML tags so they aren't interpreted as actual HTML.
         fileContents.replaceAll("<", "&lt;");

         // <pre> tag displays preformatted text. Displays all whitespace chars.
         container.innerHTML = `<div class="txtPreview"><pre>${fileContents}</pre></div>`;
      } else {
         container.innerHTML = `<div class="unsupportedPreview"><p>No preview available for this filetype.</p></div>`;
      }
   }     
};
