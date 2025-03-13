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

            // Enable renaming on Enter key press
            renameInput.addEventListener("keypress", async function (event) {
                if (event.key === "Enter") {
                    let newName = renameInput.value.trim();
                    const oldName = renameInput.dataset.oldname;

                    if (!newName || newName === fileName) return;
                    renameInput.blur(); // Remove focus if no change

                    // Check for illegal characters and warn the user
                    if (containsIllegalCharacters(newName)) {
                        showNotification('⚠️ File name contains illegal characters. Avoid using \\ / : * ? " < > | on Windows, and / or : on macOS/Linux.', 'error');
                        renameInput.value = fileName; // Reset input
                        return;
                    }

                    // Extract original extension
                    const originalExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
                    const newExtension = newName.includes('.') ? newName.split('.').pop() : '';

                    // Ensure the correct extension
                    if (originalExtension && originalExtension !== newExtension) {
                        newName = `${newName}.${originalExtension}`;
                    }

                    const directoryPath = window.file.pathDirname(oldName);
                    const newFilePath = window.file.pathJoin(directoryPath, newName);

                    try {
                        const allFilePaths = await window.file.getFilesInDirectory();
                        const allFileNames = allFilePaths.map(filePath => window.file.pathBasename(filePath));

                        if (allFileNames.includes(newName)) {
                            await window.file.showMessageBox({
                                type: "error",
                                title: "Error",
                                message: "A file named " + newName + " already exists."
                            });
                            renameInput.value = fileName; // Reset input
                            renameInput.blur(); // Remove focus
                            return;
                        }

                        //Rename the file
                        const response = await window.file.renameFile(oldName, newFilePath);
                        if (response.success) {
                            renameInput.dataset.oldname = newFilePath; // Update stored path
                            renameInput.value = newName; //Display new file name
                            renameInput.blur(); // Remove focus after renaming
                        } else {
                            await window.file.showMessageBox({
                                type: "error",
                                title: "Error",
                                message: "Error renaming file: " + error.message
                            });
                        }
                    } catch (error) {
                        console.error("Error renaming file:", error);
                        await window.file.showMessageBox({
                            type: "error",
                            title: "Error",
                            message: "An error occured: " + error.message
                        });
                    }
                }
            });
        });
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
        window.file.quitApp(); // Calls the function to quit the app
    });
    
};

