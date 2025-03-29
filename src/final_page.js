window.onload = async function () {
    // Get references to the kept and deleted files 
    const keptFilesList = document.getElementById("keptFilesList");
    const deletedFilesList = document.getElementById("deletedFilesList");
    const fileObjects = JSON.parse(localStorage.getItem("fileObjects")) || [];

    // Render the file lists based on the stored file objects
    function renderFileLists() {
        keptFilesList.innerHTML = "";
        deletedFilesList.innerHTML = "";

        const keptFiles = fileObjects.filter(f => f.status === "keep");
        const deletedFiles = fileObjects.filter(f => f.status === "delete");

        if (keptFiles.length === 0) {
            keptFilesList.innerHTML = "<p>No kept files.</p>";
        } else {
            keptFiles.forEach(file => renderKeptFile(file));
        }

        if (deletedFiles.length === 0) {
            deletedFilesList.innerHTML = "<p>No deleted files.</p>";
        } else {
            deletedFiles.forEach(file => renderDeletedFile(file));
        }
    }

    // Display the kept files 
    function renderKeptFile(file) {
        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.value = file.name;
        renameInput.classList.add("rename-input");
        renameInput.dataset.oldname = file.path;

        const listItem = document.createElement("li");
        listItem.appendChild(renameInput);
        keptFilesList.appendChild(listItem);

        renameInput.addEventListener("keypress", async function (event) {
            if (event.key === "Enter") {
                await handleRename(renameInput, file);
                renderFileLists();
            }
        });

        renameInput.addEventListener("blur", async function () {
            await handleRename(renameInput, file);
            renderFileLists();
        });
    }

    // Display the deleted files 
    function renderDeletedFile(file) {
        const listItem = document.createElement("li");
        listItem.innerText = file.name;
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Move to keep";
        deleteButton.classList.add("deleteUndo");
        deleteButton.dataset.path = file.path;
        listItem.appendChild(deleteButton);
        deletedFilesList.appendChild(listItem);

        deleteButton.addEventListener("click", () => {
            // Update file status to keep
            file.status = "keep";
            // Update the stored file objects
            localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
            // Re-render lists
            renderFileLists();
        });
    }

    async function handleRename(renameInput, fileObj) {
        let newName = renameInput.value.trim();
        const oldFilePath = renameInput.dataset.oldname;  // Ensure oldFilePath is correctly defined
        if (!oldFilePath) return; // Prevent errors if filePath is undefined

        const directoryPath = window.file.pathDirname(oldFilePath);
        const currentFileName = window.file.pathBasename(oldFilePath);  // Get current file name

        if (!newName || newName === currentFileName) return; // No change, no rename needed

        // Check for illegal characters
        if (containsIllegalCharacters(newName)) {
            showNotification('⚠️ Invalid characters in file name.', 'error');
            renameInput.value = currentFileName; // Reset input
            return;
        }

        // Ensure correct file extension
        const originalExtension = currentFileName.includes('.') ? currentFileName.split('.').pop() : '';
        const newExtension = newName.includes('.') ? newName.split('.').pop() : '';

        if (originalExtension && originalExtension !== newExtension) {
            newName = `${newName}.${originalExtension}`;
        }

        const newFilePath = window.file.pathJoin(directoryPath, newName);

        try {
            const allFilePaths = await window.file.getFilesInDirectory();

            // Exclude the current file from duplicate check
            const isDuplicate = allFilePaths.some(filePath =>
                filePath !== oldFilePath && window.file.pathBasename(filePath) === newName
            );

            if (isDuplicate) {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error",
                    message: `A different file named "${newName}" already exists.`
                });
                renameInput.value = currentFileName; // Reset input
                renameInput.blur();
                return;
            }

            // Perform rename
            const response = await window.file.renameFile(oldFilePath, newFilePath);
            if (response.success) {
                fileObj.name = newName;
                fileObj.path = newFilePath;
                renameInput.dataset.oldname= newFilePath;
                renameInput.blur();
                localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
            } else {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error",
                    message: "Failed to rename file."
                });
            }
        } catch (error) {
            console.error("Error renaming file:", error);
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "An error occurred: " + error.message
            });
        }
    }

    function containsIllegalCharacters(name) {
        const illegalWindows = /[\/\\:*?"<>|]/;
        const illegalMacLinux = /\//;
        const illegalMac = /:/;

        const platform = window.file.platform; // Get platform from preload.js

        const isWindows = platform === 'win32';
        const isMac = platform === 'darwin';

        if (isWindows && illegalWindows.test(name)) return true;
        if (isMac && (illegalMacLinux.test(name) || illegalMac.test(name))) return true;
        if (!isWindows && !isMac && illegalMacLinux.test(name)) return true;

        return false;
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

    //Back button functionality
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "./main_page/keep_or_delete.html";
    });

    document.getElementById("finalizeButton").addEventListener("click", async () => {
        // Recheck for deleted files in case any were changed to keet
        const deletedFiles = fileObjects.filter(f => f.status === "delete");
        //iterate through deleted files array and send to trash
        for (let i = 0; i < deletedFiles.length; i++) {
            const result = await window.file.deleteFile(deletedFiles[i].path);
            if (!result.success) {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error deleting file",
                    message: result.message
                });
                break;
            }
        }
        localStorage.clear(); // Clears stored session data
        localStorage.setItem("finalPage", 'true');
        window.location.href = "./main_page/keep_or_delete.html";
    });

    document.getElementById("exitButton").addEventListener("click", async () => {
        // Recheck for deleted files in case any were changed to keet
        const deletedFiles = fileObjects.filter(f => f.status === "delete");
        // Delete files
        for (let i = 0; i < deletedFiles.length; i++) {
            const result = await window.file.deleteFile(deletedFiles[i].path);
            if (!result.success) {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error deleting file",
                    message: result.message
                });
                break;
            }
        }
        window.file.quitApp(); // Calls the function to quit the app
        localStorage.clear(); // Clears stored session data
    });
    renderFileLists();
};

