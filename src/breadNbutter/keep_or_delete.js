//const path = require("node:path");
//const fs = require("fs");

window.onload = async function () {
    let files = [];
    let currentIndex = 0;
    let keptFiles = [];
    let deletedFiles = [];
    const previewContainer = document.getElementById("previewContainer");
    let inspectMode = false;

    try {
        // Fetch the selected directory path
        const dirPath = await window.file.getFilePath();

        document.getElementById("dirPath").innerText =
            dirPath ? `Selected Directory: \n${dirPath}` : "No directory selected";

        if (dirPath) {
            // Fetch files in the directory
            files = await window.file.getFilesInDirectory();
            removedFileTypes = new Set (await window.file.getRemovedFileTypes());
            console.log("Removed file types: " + removedFileTypes);

            // Keep only files not in removedFileTypes
            files = files.filter(file => {
                const fileType = file.split(".").pop(); 
                return !removedFileTypes.has(fileType); 
            });
        }

        if (files.length > 0) {
            displayCurrentFile();
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
        deleteFile();
    });

    // Delete function
    async function deleteFile() {
        // Don't attempt deletion if there are no [more] files.
        if (files.length == 0) {
            await window.file.showMessageBox({
                 type: "error",
                 title: "Error",
                 message: "No file(s) to delete."
            });
            return;
        }

        try {
            const filePath = files[currentIndex]; //gets the current index, in the array of files that the user selected
            const result = await window.file.deleteFile(filePath); //calls the preload.js and invokes method that is contained in context
            // - bridge but actually exists at line 52 of index.js

            if (result.success) {
                let newArr = [];
                for (let file of files) {
                    if (file !== filePath) {
                        newArr.push(file);
                    }
                }
                files = newArr; // Update files array

                // When deleting final file, display second to last file.
                if (currentIndex == files.length) {
                   currentIndex--;
                }

                displayCurrentFile();

                //files = files.filter(file => file !== filePath); //dynamically filter files that gets rid of deleted
                //this creates a new array called that has the condition that it is not filePath


                //success is a built in boolean callback
                //await window.file.showMessageBox({
                //    type: "info",
                //    title: "Success",
                //    message: "File deleted successfully"
                //}); //THIS SHOULD GET REMOVED EVENTUALLY, IT IS JUST FOR DEBUGGING TO KNOW WHETHER IT WORKED OR NOT 
            } else {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error",
                    message: result.message
                });
            }
        } catch (error) {
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
        nextFile();
    });

    // Next file function (aka Keep)
    function nextFile() {
        if (files.length > 0 && currentIndex < files.length - 1) {
            currentIndex++;
            keepCurrentFile(currentIndex - 1);
            displayCurrentFile();
        } else {
            window.file.showMessageBox({
                type: "warning",
                title: "No Next File",
                message: "No more files in selected Directory"
            });
          keepCurrentFile(currentIndex);
          resetPreviewPosition();
       }
    }

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
      if (currentIndex < 0 || currentIndex >= files.length) {
         document.getElementById("currentItem").innerText = "No files in queue.";
      } else {
         filename = files[currentIndex];
         document.getElementById("currentItem").innerText = `Current File: \n${filename}`;
         refreshPreview();
      }
   }

    async function refreshPreview() {
        if (files.length == 0) {
            previewContainer.innerHTML = "";
            return;
        }

        const filename = files[currentIndex];
        const mimeType = window.file.getMimeType(filename);

        // Declaring this function here so I can short circuit on null
        // mime type AND use it as a fallback on unsupported mime type.
        const displayUnsupported = function () {
           previewContainer.innerHTML = `<div class="unsupportedPreview"><p>No preview available for this filetype.</p></div>`;
        };

        console.log(`${filename} has MIME type ${mimeType}.`);

        // Handle null MIME so we don't have to check for it later.
        if (mimeType == null) {
           displayUnsupported();
           resetPreviewPosition();
           return;
        }

        if (mimeType.startsWith("text/")) {
            var fileContents = window.file.getFileContents(filename).replaceAll("<", "&lt;");

            // Escape HTML tags so they aren't interpreted as actual HTML.
            fileContents.replaceAll("<", "&lt;");

            // <pre> tag displays preformatted text. Displays all whitespace chars.
            previewContainer.innerHTML = `<div class="txtPreview"><pre>${fileContents}</pre></div>`;
        } else if (mimeType == "application/pdf") {
            previewContainer.innerHTML = `<div class="pdfPreview"><iframe data-testid="pdf-iframe" src="${filename}#toolbar=0"></iframe></div>`;
        } else if (filename.includes("docx")) {
            const pdfPath = await window.file.convertDocxToPdf(filename);
            previewContainer.innerHTML = `<div class="pdfPreview"><iframe data-testid="pdf-iframe" src="${pdfPath}#toolbar=0"></iframe></div>`;
        } else if (mimeType.startsWith("image/")) {
            previewContainer.innerHTML = `<div class="imgPreview"><img data-testid="img-element" src="${filename}" alt="Image failed to load." /></div>`;
        } else if (mimeType.startsWith("video/")) {
            previewContainer.innerHTML = `<div class="videoPreview"><video controls autoplay muted disablepictureinpicture><source data-testid="video-src" src="${filename}" alt="Video failed to load." /></video></div>`;
        } else {
            previewContainer.innerHTML = `<div class="unsupportedPreview"><p>No preview available for this filetype.</p></div>`;
        }
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
        const icon = document.createElement("div");
        icon.classList.add("swipeIcon");
        // Keep Icon
        if (direction === "left") {
            icon.innerHTML = "✅"; 
            icon.style.color = "green";
            translateX = "120%";
            rotateDeg = "20deg";
        // Delete Icon
        } else {
            icon.innerHTML = "🗑️"; 
            icon.style.color = "red";
            translateX = "-120%";
            rotateDeg = "-20deg";
        }
        previewContainer.appendChild(icon); 
        icon.classList.add("show");
        
        // Swipe animation
        previewContainer.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
        previewContainer.style.transform = `translateX(${translateX}) rotate(${rotateDeg})`;
        previewContainer.style.opacity = "0";

        // File handling will occurr after CSS animation
        previewContainer.addEventListener("transitionend", function handleTransitionEnd() {
            if (direction === "left") nextFile();
            else deleteFile();
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
            animateSwipe(diffX < 0 ? "right" : "left");
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
        startSwipe(e);
        document.addEventListener("mousemove", moveSwipe);
        document.addEventListener("mouseup", endSwipe);
    });
    // Touch event listeners for swipe
    previewContainer.addEventListener("touchstart", (e) => {
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
    
 };
