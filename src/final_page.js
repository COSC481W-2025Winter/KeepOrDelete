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
            renameInput.type = "text";
            renameInput.value = fileName; // Display full name, including extension
            renameInput.classList.add("rename-input");
            renameInput.dataset.oldname = file; // Store full path for renaming
            //this block ensures we dont get duplicates and we only display files, if they don't exist in the other array
            let filecheck = false;
            for (let i = 0; i < deletedFiles.length; i++) { //since deletedFiles IS correct, we base our keptFiles off them not existing in deleted
                if (deletedFiles[i] === file) {
                    filecheck = true;
                }
            }
            //only display if file doesn't exist in both arrays
            if (!filecheck) {
                const listItem = document.createElement("li");
                const renameInput = document.createElement("input");
                listItem.appendChild(renameInput);
                keptFilesList.appendChild(listItem);
            }
            //filecheck = false;

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
            let filecheck = false;
            for (let i = 0; i < keptFiles.length; i++) {
                if (keptFiles[i] === file) {
                    filecheck = true;
                }
            }
            //only display files that dont exist in both arrays
            if (!filecheck) {
                const listItem = document.createElement("li");
                listItem.innerText = file;
                const deleteButton = document.createElement("button");
                deleteButton.innerText = "Undo";
                deleteButton.id = "deleteUndo";
                deleteButton.dataset.file = file;
                listItem.appendChild(deleteButton); // Attach button to the list item
                deletedFilesList.appendChild(listItem);
                deleteButton.addEventListener("click", async () => {
                    const filePath = deleteButton.dataset.file; //get file in dataset
                    keptFiles.push(filePath); //push to array and localstorage
                    localStorage.setItem("keptFiles", JSON.stringify(keptFiles));
                    const index = deletedFiles.indexOf(filePath);
                    if (index > -1) { //remove from deletedfiles
                        deletedFiles.splice(index, 1);
                        localStorage.setItem("deletedFiles", JSON.stringify(deletedFiles));
                    }
                    listItem.remove();//remove from li's
                    const newListItem = document.createElement("li"); //create new li in kept files part
                    newListItem.innerHTML = `
                    ${filePath} 
                    <input type="text" placeholder="Rename file" data-oldname="${filePath}">
                    <button class="renameBtn">Rename</button>
                `;
                    keptFilesList.appendChild(newListItem);
                    //console.log(keptFiles[keptFiles.length - 1]); debugging, checks that it got added to array
                });
            }

        });
    }

    //Back button functionality
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "./breadNbutter/keep_or_delete.html";
    });

    document.getElementById("finalizeButton").addEventListener("click", async () => {
        //iterate through deleted files array and send to trash
        for (let i = 0; i < deletedFiles.length; i++) {
            const result = await window.file.deleteFile(deletedFiles[i]);
            if (!result.success) {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error deleting file",
                    message: result.message
                });
                console.log(`error deleting "${deletedFiles[i]}"`);
                break;
            }
        }
        localStorage.clear(); // Clears stored session data
        window.location.href = "./main_menu.html";
    });

    document.getElementById("exitButton").addEventListener("click", async () => {
        window.file.quitApp(); // Calls the function to quit the app
    });

};

