//const path = require("node:path");
//const fs = require("fs");

window.onload = async function () {
    let files = [];
    let currentIndex = 0;
    let keptFiles = [];
    let filesToBeDeleted = []; //global array of files waiting to be deleted --the chopping block
    //this array is going to need to be sent over to another js page that can store the real delete function, move
    //this delete function will just populate the array and the next one will execute the node trash removal

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
            displayCurrentFile();
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
        const filePath = files[currentIndex];
        //dont attempt deletion if there are no [more] files.
        if (files.length == 0) {
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "No file(s) to delete."
            });
            return;
        }
        try {
            //now this function just updates are of files and removes file to be deleted, and adds it to the array that
            //is waiting to be deleted
            filesToBeDeleted.push(filePath); //add the file to the array that is waiting to be deleted
            // - bridge but actually exists at line 52 of index.js
            console.log(filesToBeDeleted[0]);
            let newArr = [];
            for (let file of files) {
                if (file !== filePath) {
                    newArr.push(file);
                }
                files = newArr; // Update files array
                currentIndex = 0;
                // When deleting final file, display second to last file.
                /*if (currentIndex == files.length) {
                    currentIndex--;
                } else {
                    currentIndex++;
                }*/
                displayCurrentFile();
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "Error deleting file: " + error.message
            });
        }
    });

    //go through files in directory +1
    document.getElementById("nextButton").addEventListener("click", async () => {
        if (files.length > 0) {
            if (currentIndex < files.length - 1) {
                currentIndex = (currentIndex + 1);
                displayCurrentFile();
                keepCurrentFile(currentIndex - 1);
            }
            else {
                window.file.showMessageBox({
                    type: "warning",
                    title: "No Next File",
                    message: "No more files in selected Directory"
                });
                keepCurrentFile(currentIndex);
            }
        }
    });
    // Go through files in directory - 1
    document.getElementById("prevButton").addEventListener("click", () => {
        if (files.length > 0) {
            if (currentIndex > 0) {
                currentIndex = (currentIndex - 1);
                displayCurrentFile();
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
        event.stopPropagation();

        const renameContainer = document.getElementById('renameContainer');
        const renameInput = document.getElementById('renameInput');
        const newName = renameInput.value.trim();
        let currentFile = files[currentIndex];

        if (!newName) {
            showNotification('Please enter a new file name.', 'error');
            resetRenameInput(renameContainer);
            return;
        }

        // Ensure the new name has the correct file extension
        const originalExtension = currentFile.substring(currentFile.lastIndexOf('.'));
        const finalName = newName.includes('.') ? newName : `${newName}${originalExtension}`;

        const directoryPath = window.file.pathDirname(currentFile);
        const newFilePath = window.file.pathJoin(directoryPath, finalName);

        try {
            // Step 1: Get all file paths in the directory
            const allFilePaths = await window.file.getFilesInDirectory();

            // Step 2: Extract file names using path.basename
            const allFileNames = allFilePaths.map(filePath => window.file.pathBasename(filePath));

            // Step 3: Check if the new name already exists
            if (allFileNames.includes(finalName)) {
                showNotification(`A file named "${finalName}" already exists. Please choose a different name.`, 'error');
                resetRenameInput(renameContainer);
                return;  // **This return ensures we don't continue to the renaming operation**
            }

            console.log('Renaming:', currentFile, 'to', newFilePath);

            // Step 4: Perform the rename
            const response = await window.file.renameFile(currentFile, newFilePath);
            if (response.success) {
                showNotification(`File renamed successfully to ${finalName}`, 'success');
                files[currentIndex] = newFilePath;
                displayCurrentFile();
                resetRenameInput(renameContainer);
            } else {
                showNotification(response.message || 'Failed to rename the file.', 'error');
                resetRenameInput(renameContainer);
            }
        } catch (error) {
            console.error('Error renaming file:', error);
            showNotification(`An error occurred: ${error.message}`, 'error');
            resetRenameInput(renameContainer);
        }
    });

    function resetRenameInput(container) {
        container.innerHTML = '';  // Clear the old input field

        const newRenameInput = document.createElement('input');
        newRenameInput.type = 'text';
        newRenameInput.id = 'renameInput';
        newRenameInput.placeholder = 'Enter new file name';

        container.appendChild(newRenameInput);

        // Temporary blur to prevent highlighting the input immediately
        setTimeout(() => {
            newRenameInput.blur();  // Remove highlight after creation
        }, 100);

        // Optionally, refocus the input when the user interacts with it
        newRenameInput.addEventListener('focus', () => {
            console.log('Input refocused when user interacts.');
        });
    }

    function displayCurrentFile() {
        // Preview fn handles its own array length conditions.
        refreshPreview()

        if (currentIndex < 0 || currentIndex >= files.length) {
            document.getElementById("currentItem").innerText = "No files in queue.";
        } else {
            filename = files[currentIndex];
            document.getElementById("currentItem").innerText = `Current File: \n${filename}`;
        }
    }

    function refreshPreview() {
        var container = document.getElementById("previewContainer");

        if (files.length == 0) {
            container.innerHTML = "";
            return;
        }

        const filename = files[currentIndex];

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

    //track Kept Files
    function keepCurrentFile(index) {
        if (files.length > 0) {
            const currentFile = files[index];
            if (!keptFiles.includes(currentFile)) {
                keptFiles.push(currentFile);
            }
        }
    }

    //button to go to the final page
    document.getElementById("finalPageButton").addEventListener("click", () => {
        localStorage.setItem("keptFiles", JSON.stringify(keptFiles));
        localStorage.setItem("deletedFiles", JSON.stringify(filesToBeDeleted));
        window.location.href = "../final_page.html";
    });

    document.getElementById("trash_button").addEventListener("click", () => {
        localStorage.setItem("keptFiles", JSON.stringify(keptFiles));
        localStorage.setItem("deletedFiles", JSON.stringify(filesToBeDeleted));
    });
};
