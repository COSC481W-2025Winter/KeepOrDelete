window.onload = async function () {
    // Get references to the kept and deleted files 
    const keptFilesList = document.getElementById("keptFilesList");
    const deletedFilesList = document.getElementById("deletedFilesList");

    let keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || [];
    let deletedFiles = JSON.parse(localStorage.getItem("deletedFiles")) || [];

    // Remove duplicate file entries
    keptFiles = [...new Set(keptFiles)];

    if (keptFiles.length === 0) {
        keptFilesList.innerHTML = "<p>No kept files.</p>";
    } else {
        // Loop through each kept file and create a renameable input field
        keptFiles.forEach(file => {
            const fileName = window.file.pathBasename(file); // Extract full filename

            const listItem = document.createElement("li");
            const renameInput = document.createElement("input");

            renameInput.type = "text";
            renameInput.value = fileName; // Display full name, including extension
            renameInput.classList.add("rename-input");
            renameInput.dataset.oldname = file; // Store full path for renaming

            listItem.appendChild(renameInput);
            keptFilesList.appendChild(listItem);

            renameInput.addEventListener("keypress", async function (event) {
                if (event.key === "Enter") {
                    await handleRename(renameInput, fileName);
                }
            });
            
            // Rename when clicking outside the input field
            renameInput.addEventListener("blur", async function () {
                await handleRename(renameInput, fileName);
            });
        });
    }

    async function handleRename(renameInput) {
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
                renameInput.dataset.oldname = newFilePath; // Update dataset to new path
                renameInput.value = newName;
                renameInput.blur(); // Remove focus after renaming
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

    if (deletedFiles.length === 0) {
        deletedFilesList.innerHTML = "<p>No deleted files.</p>";
    } else {
        deletedFiles.forEach(file => {
            const listItem = document.createElement("li");
            listItem.innerText = file;
            deletedFilesList.appendChild(listItem);
        });
    }

    //Back button functionality
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "./breadNbutter/keep_or_delete.html";
    });

    document.getElementById("finalizeButton").addEventListener("click", async () => {
        localStorage.clear(); // Clears stored session data
        window.location.href = "./main_menu.html";
    });

    document.getElementById("exitButton").addEventListener("click", async () => {
        window.file.quitApp(); // Calls the function to quit the app
    });
    
};

