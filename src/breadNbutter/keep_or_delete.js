
window.onload = async function () {
    let files = JSON.parse(localStorage.getItem("files")) || [];
    let currentIndex = 0;
    const previewContainer = document.getElementById("previewContainer");
    let inspectMode = false;
    let keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || [];
    let filesToBeDeleted = JSON.parse(localStorage.getItem("deletedFiles")) || [];
    const hasShownTooltip = sessionStorage.getItem("tooltipShown");
    try {
        // Fetch the selected directory path
        const dirPath = await window.file.getFilePath();

        document.getElementById("dirPath").innerText =
            dirPath ? `Selected Directory: \n${dirPath}` : "No directory selected";

        if (dirPath) {
            // Fetch files in the directory
            files = await window.file.getFilesInDirectory();
            localStorage.setItem("files", JSON.stringify(files));
            console.log("Filtered file list:", files);
            removedFileTypes = new Set(await window.file.getRemovedFileTypes());
            console.log("Initial file list:", files);
            console.log("Removed file types:", Array.from(removedFileTypes));
            // Keep only files not in removedFileTypes 
            files = files.filter(file => {
                const fileName = file.split("/").pop();
                const shouldKeep = fileName !== ".DS_Store";
                if (!shouldKeep) {
                    console.log(`Removing: ${file} (Reason: ${fileName === ".DS_Store" ? "DS_Store file" : "Blocked file type"})`);
                }

                return shouldKeep;
            });
            files = files.filter(file => {
                const fileType = file.split(".").pop();
                return !removedFileTypes.has(fileType);
            });
            //if there is anything kept or deleted already, filter files on page load
            if (keptFiles.length > 0 || filesToBeDeleted.length > 0) {
                files = files.filter(file =>
                    !(keptFiles.includes(file) || filesToBeDeleted.includes(file))
                );
            }
        }

        if (files.length > 0) {
            displayCurrentFile();
            setTimeout(() => {
                resetRenameInput(document.getElementById('renameContainer'));
            }, 10);
        } else {
            document.getElementById("currentItem").innerText = "No files found.";
        }

    } catch (error) {
        console.error(error);
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


    // Delete button press
    document.getElementById("deleteButton").addEventListener("click", async () => {
        if (!hasFiles()) return;
        animateSwipe("left");;
    });

    // Delete function
    async function deleteFile() {
        // Don't attempt deletion if there are no [more] files.
        if (files.length === 0) {
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "No file(s) to delete."
            });
            return;
        }
        try {
            const filePath = files[currentIndex];
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
            }
            files = newArr; // Update files array
            localStorage.setItem("files", JSON.stringify(files));
            localStorage.setItem("deletedFiles", JSON.stringify(filesToBeDeleted));
            currentIndex = 0;
            //code below doesnt work
            // When deleting final file, display second to last file.
            /*if (currentIndex == files.length) {
                currentIndex--;
            } else {
                currentIndex++;
            }*/
            displayCurrentFile();
        }
        catch (error) {
            console.error("Error deleting file:", error);
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "Error deleting file: " + error.message
            });
        }
        resetPreviewPosition();
    };

    // Go through files in directory +1
    document.getElementById("nextButton").addEventListener("click", async () => {
        if (!hasFiles()) return;
        animateSwipe("right");
    });

    // Next file function (aka Keep)
    async function nextFile() {
        if (!hasFiles()) return;
        try {
            const filePath = files[currentIndex];

            keptFiles.push(filePath);
            console.log(keptFiles[0]);
            let newArr = [];
            for (let file of files) {
                if (file !== filePath) {
                    newArr.push(file);
                }
            }
            files = newArr; // Update files array
            localStorage.setItem("files", JSON.stringify(files));
            localStorage.setItem("keptFiles", JSON.stringify(keptFiles));
            currentIndex = 0;

            displayCurrentFile();
            /*currentIndex++;
            displayCurrentFile();
            keepCurrentFile(currentIndex - 1);*/
        } catch {
            console.error("Error keeping file:", error);
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "Error keeping file: " + error.message
            });
            resetPreviewPosition();
            //keepCurrentFile(currentIndex);
        }
    }

    document.getElementById('renameButton').addEventListener('click', async (event) => {
        if (!hasFiles()) return;
        event.preventDefault();
        event.stopPropagation();
        await handleRename();
    });

    // Add event listener for Enter key
    document.getElementById('renameInput').addEventListener('keypress', async (event) => {
        if (!hasFiles()) return;
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            await handleRename();
        }
    });

    async function handleRename() {
        //const renameContainer = document.getElementById('renameContainer');
        const renameInput = document.getElementById('renameInput');
        const newName = renameInput.value.trim();
        let currentFile = files[currentIndex];

        if (!newName) {
            showNotification('Please enter a new file name.', 'error');
            resetRenameInput(renameContainer);
            return;
        }

        // Check for illegal characters and warn the user
        if (containsIllegalCharacters(newName)) {
            showNotification('⚠️ File name contains illegal characters.', 'error');
            resetRenameInput(renameContainer);
            return;  // Prevent further action if invalid
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

            // Step 3: Check if the new name already exists (excluding the current file)
            if (allFileNames.includes(finalName) && currentFile !== newFilePath) {
                showNotification(`A file named "${finalName}" already exists.`, 'error');
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
    }


    function resetRenameInput(container) {
        container.innerHTML = '';  // Clear the old input field

        const newRenameInput = document.createElement('input');
        newRenameInput.type = 'text';
        newRenameInput.id = 'renameInput';
        newRenameInput.placeholder = 'Enter new file name';

        container.appendChild(newRenameInput);

        // Remove old event listeners before adding new ones
        newRenameInput.removeEventListener("keypress", renameOnEnter);
        newRenameInput.addEventListener("keypress", renameOnEnter);

        // Reattach Enter event listener
        newRenameInput.addEventListener("keypress", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await handleRename();
            }
        });

        // Temporary blur to prevent highlighting the input immediately
        setTimeout(() => {
            newRenameInput.blur();  // Remove highlight after creation
        }, 100);

        // Optionally, refocus the input when the user interacts with it
        //newRenameInput.addEventListener('focus', () => {
        //  console.log('Input refocused when user interacts.');
        //});
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

    // Attach event listeners when renaming input is created
    function attachRenameListeners() {
        const renameInput = document.getElementById('renameInput');
        // Remove existing event listeners (prevents duplicates)
        renameInput.removeEventListener("keypress", renameOnEnter);
        // Attach Enter key event
        renameInput.addEventListener("keypress", renameOnEnter);
    }

    async function renameOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            const renameInput = document.getElementById('renameInput');
            const newName = renameInput.value.trim();

            if (!newName) {
                showNotification('Please enter a new file name.', 'error');
                return;
            }

            if (containsIllegalCharacters(newName)) {
                showNotification('⚠️ File name contains illegal characters.', 'error');
                return;
            }

            await handleRename();
        }
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    function displayCurrentFile() {
        if (currentIndex < 0 || currentIndex >= files.length) {
            document.getElementById("currentItem").innerText = "No files in queue.";
        } else {
            filePath = files[currentIndex];
            let fileName = filePath.split(/[\\/]/).pop();
            document.getElementById("currentItem").innerText = "Current File: " + fileName;

            let stats = window.file.getFileSize(filePath);
            let fileSize = stats.size;
            let formattedSize = formatFileSize(fileSize);
            document.getElementById("currentItemSize").innerText = "File Size: " + formattedSize;

            refreshPreview();
        }

        // Reset rename input field
        resetRenameInput(document.getElementById('renameContainer'));
        //reset inspect mode upon file change
        inspectMode = false;
        document.getElementById("inspectButton").innerText = "Inspect Document";
        // Attach Enter event listener for renaming
        //attachRenameListeners();
    }

    async function refreshPreview() {
        if (files.length == 0) {
            previewContainer.innerHTML = "";
            return;
        }

        const filename = files[currentIndex];

        previewContainer.innerHTML = await window.file.generatePreviewHTML(filename)

        resetPreviewPosition();
    }


    // Resets preview container position post swipe
    function resetPreviewPosition() {
        previewContainer.style.transition = "transform 0.2s ease-out";
        previewContainer.style.transform = "translateX(0px) rotate(0deg)";
        previewContainer.style.opacity = "1";
    }

    // Swipe animation handler
    function animateSwipe(direction) {
        if (!hasFiles()) return;
        const icon = document.createElement("div");
        icon.classList.add("swipeIcon");
        // Keep Icon
        if (direction === "left") {
            icon.innerHTML = "🗑️";
            icon.style.color = "red";
            translateX = "-120%";
            rotateDeg = "-20deg";
            // Delete Icon
        } else {
            icon.innerHTML = "✅";
            icon.style.color = "green";
            translateX = "120%";
            rotateDeg = "20deg";

        }
        previewContainer.appendChild(icon);
        icon.classList.add("show");

        // Swipe animation
        previewContainer.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
        previewContainer.style.transform = `translateX(${translateX}) rotate(${rotateDeg})`;
        previewContainer.style.opacity = "0";

        // File handling will occurr after CSS animation
        previewContainer.addEventListener("transitionend", function handleTransitionEnd() {
            if (direction === "right") nextFile();
            else deleteFile();
            if (!hasFiles()){
                previewContainer.innerHTML = "You've reached the end! Press the 'Review and Finalize' button to wrap up."; 
                icon.remove();
            };
            previewContainer.removeEventListener("transitionend", handleTransitionEnd);
        });
    }

    // Detects when swipe is started
    function startSwipe(e) {
        // Prevent swiping in Inspect Mode
        if (inspectMode) return;
        // Starting position
        startX = e.clientX || e.touches[0].clientX;
        currentX = startX;
        // Track swiping state
        isSwiping = true;
        startTime = new Date().getTime();
    }

    // Tracks swipe movement
    function moveSwipe(e) {
        if (!isSwiping) return;
        // Get current position
        currentX = e.clientX || e.touches[0].clientX;
        // Calculate distance moved
        let diffX = currentX - startX;
        // Use distance moved to move the previewContainer
        previewContainer.style.transform = `translateX(${diffX}px) rotate(${diffX / 15}deg)`;
    }

    function endSwipe(e) {
        if (!isSwiping || inspectMode) return;
        isSwiping = false;
        // Get final distance swiped
        let diffX = currentX - startX;
        // Swipe duration
        let timeTaken = new Date().getTime() - startTime;
        // Swipe speed
        let velocity = Math.abs(diffX) / timeTaken;
        // Starts animation based on speed of swipe or distance swiped
        if (Math.abs(diffX) > 50 || velocity > 0.6) {
            animateSwipe(diffX > 0 ? "right" : "left");
        } else {
            resetPreviewPosition();
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
        localStorage.setItem("deletedFiles", JSON.stringify(deletedFiles));
        window.location.href = "../final_page.html";
    });
    // Mouse event listeners for swipe
    previewContainer.addEventListener("mousedown", (e) => {
        if (!hasFiles()) return;
        startSwipe(e);
        document.addEventListener("mousemove", moveSwipe);
        document.addEventListener("mouseup", endSwipe);
    });
    // Touch event listeners for swipe
    previewContainer.addEventListener("touchstart", (e) => {
        if (!hasFiles()) return;
        startSwipe(e);
        document.addEventListener("touchmove", moveSwipe);
        document.addEventListener("touchend", endSwipe);
    });

    document.getElementById("inspectButton").addEventListener("click", () => {
        const iframe = document.querySelector("#previewContainer iframe");
        const textPreview = document.querySelector("#previewContainer pre");
        // Toggle inspect mode state
        inspectMode = !inspectMode;

        if (iframe) {
            // Toggle pointer-events for PDF(allows pdf interaction)
            iframe.style.pointerEvents = inspectMode ? "auto" : "none";
        }

        if (textPreview) {
            // Toggle user-select for text files (allows highlighting)
            textPreview.style.userSelect = inspectMode ? "text" : "none";
        }

        // Update button text
        document.getElementById("inspectButton").innerText = inspectMode ? "Exit Inspect" : "Inspect Document";
    });


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

    // Arrow key file swiping
    document.addEventListener("keydown", async (e) => {
        if (!hasFiles()) return;
        if (e.key === "ArrowRight") {
            animateSwipe("right");
        } else if (e.key === "ArrowLeft") {
            animateSwipe("left");
        }
    });


    document.getElementById("aiButton").addEventListener("click", () => {
        if (!hasFiles()) return;
        LLM();
    });
    function LLM() {
        popup.style.display = 'inline-block';
        const filename = files[currentIndex];
        const fileContents = window.file.getFileContents(filename);
        if (!fileContents || fileContents.length === 0) {
            popupContent.textContent = 'No file contents found.';
            return;
        }
        else {
            popupContent.textContent = 'Thinking...';
            // Here id implenment a if statement to check file type and change the API Call
            // Chat can take images so .png or .jpg will have a different call.
            window.openai.openaiRequest([
                { role: "system", content: "You will review the following text and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension." },
                { role: "user", content: fileContents }
            ])
                .then(response => {
                    const suggestion = response.choices[0].message;
                    console.log("Renaming Suggestion:", suggestion.content);

                    // Display the popup and suggested name. 
                    const popup = document.getElementById('popup');
                    const popupContent = document.getElementById('popupContent');
                    popupContent.textContent = suggestion.content;

                    // Add a click event listener to the popup. Populates the input field wih the suggestion.
                    popup.onclick = () => {
                        const renameInput = document.getElementById('renameInput');
                        if (renameInput && !renameInput.value.trim()) {
                            renameInput.value = suggestion.content;
                        }
                        popup.style.display = 'none';
                    }

                })
                .catch(error => {
                    console.error('Error sending OpenAI request:', error);
                });

        }
    }


    // Checks to see if user is a test agent
    const isTesting = navigator.userAgent.includes("Playwright");
    let tooltip;

    // Only runs if user is real
    if (!isTesting && !hasShownTooltip) {
        tooltip = document.getElementById("tooltip");
        tooltip.classList.add("show");

        // Dismiss tooltip on user input
        document.addEventListener("mousedown", dismissTooltip);
        document.addEventListener("keydown", dismissTooltip);
        document.addEventListener("touchstart", dismissTooltip);

        // WIGGLE IS THE MOST IMPORTANT PART OF THE PROJECT
        triggerWiggle();
        setInterval(triggerWiggle, 3000);
        sessionStorage.setItem("tooltipShown", "true");
    }

    // Dismiss tooltip
    function dismissTooltip() {
        tooltip.classList.remove("show");
        tooltip.classList.add("hide");

        setTimeout(() => tooltip.remove(), 400);
    }

    // WIGGLE WIGGLE WIGGLE
    function triggerWiggle() {
        if (!tooltip.classList.contains("wiggle")) {
            tooltip.classList.add("wiggle");
            setTimeout(() => tooltip.classList.remove("wiggle"), 500);
        }
    }

    // Checks if there are files left
    function hasFiles() {
        if (files.length === 0) {
            console.warn("No files left.");
            return false;
        }
        return true;
    }

};
