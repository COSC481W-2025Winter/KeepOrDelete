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

    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.innerText = message;
        notification.style.display = 'block';
    
        // Hide the message after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }    

    // Change Directory Button
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "../main_menu.html";
    });

    document.getElementById("deleteButton").addEventListener("click", async () => { //gets the html element containing the button for delete
        const filePath = files[currentIndex]; //gets the current index, in the array of files that the user selected
        try {
            const result = await window.file.deleteFile(filePath); //calls the preload.js and invokes method that is contained in context
            // - bridge but actually exists at line 52 of index.js

            if (result.success) { //success is a built in boolean callback
                await window.file.showMessageBox({
                    type: "info",
                    title: "Success",
                    message: "File deleted successfully"
                }); //THIS SHOULD GET REMOVED EVENTUALLY, IT IS JUST FOR DEBUGGING TO KNOW WHETHER IT WORKED OR NOT 
            } else {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error",
                    message: result.message
                });            }
        } catch (error) {
            console.error("Error deleting file:", error);
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "Error deleting file: " + error.message
            });
        }
    });

    // Go through files in directory +1
    document.getElementById("nextButton").addEventListener("click", async () => {
        if (files.length > 0) {
            if (currentIndex < files.length - 1) {
                currentIndex = (currentIndex + 1);
                displayFile(files[currentIndex]);
            }
            else {
                window.file.showMessageBox({
                    type: "warning",
                    title: "No Next File",
                    message: "No more files in selected Directory"
                });
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
                window.file.showMessageBox({
                    type: "warning",
                    title: "No Previous File",
                    message: "No previous files in selected Directory"
                });
            }
        }

    });

    document.getElementById('renameButton').addEventListener('click', async (event) => {
        event.preventDefault();
        const renameInput = document.getElementById('renameInput');
        const newName = renameInput.value.trim();
        const currentFile = files[currentIndex];
        const renameContainer = document.getElementById('renameContainer');

        try {
            //call the renameFileHandler function inside the renameHandler.js file
            const result = await window.fileOperations.renameFileHandler(newName, currentFile, window.file, showNotification);
            if (result !== 'error') {
                files[currentIndex] = result; //update file list with new path
                displayFile(files[currentIndex]);
                //reset input after success by calling resetRenameInput function inside the renameHandler.js file
                window.fileOperations.resetRenameInput(renameContainer);  
                console.log(`File renamed to: ${result}`); //log successful renaming
            }
            else
                window.fileOperations.resetRenameInput(renameContainer)
        } catch (error) {
            console.error("Rename operation failed:", error);
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
