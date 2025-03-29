// File data object
class FileObject {
    constructor({ name, path, modifiedDate, createdDate, size, status = null }) {
      this.name = name;
      this.path = path;
      this.modifiedDate = new Date(modifiedDate);
      this.createdDate = new Date(createdDate);
      this.size = size;
      this.status = status;
    }
}

let fileObjects = []; // Array for FileObject instances
let currentIndex = 0; // Track file index
let inspectMode = false; // Inspect mode toggle
// Variables for swipe tracking
let startX;
let currentX;
let isSwiping;
let startTime; 

window.onload = async function () {
    // Cache DOM references
    const previewContainer = document.getElementById("previewContainer");
    const dirPathElement = document.getElementById("dirPath");
    const currentItemElement = document.getElementById("currentItem");
    const currentItemSizeElement = document.getElementById("currentItemSize");
    const notificationElement = document.getElementById("notification");
    const popupContentElement =  document.getElementById('popupContent');
    const popupElement = document.getElementById('popup')
    const closeModal = document.getElementById("closeModal");
    const renameModal = document.getElementById("renameModal");
    const renameContainer = document.getElementById("renameContainer");
    let renameInputElement = document.getElementById('renameInput');
    const renameButton = document.getElementById('renameButton');
    const confirmRenameButton = document.getElementById("confirmRename");
    const backButton = document.getElementById("backButton");
    const deleteButton = document.getElementById("deleteButton");
    const nextButton = document.getElementById("nextButton");
    const finalPageButton = document.getElementById("finalPageButton");
    const settingsButton = document.getElementById("settingsButton");
    const inspectButton = document.getElementById("inspectButton");
    const trashButton = document.getElementById("trash_button");
    const tooltip = document.getElementById("tooltip");

    const hasShownTooltip = sessionStorage.getItem("tooltipShown");

    // Get stored file objects
    const storedObjects = JSON.parse(localStorage.getItem("fileObjects")) || [];
    //this stretch of code checks if we are navigating to this page from the final page from
    //final page after finalize and select new directory, if yes, no directory shown, if no, get dir
    let finalPage = localStorage.getItem("finalPage") === "true"; //boolean
    if (finalPage) {
        backButton.innerText = "Select a Directory"
        localStorage.removeItem("fileObjects"); // Clear old file data
        dirPathElement.innerText = "No directory selected";
        localStorage.setItem("finalPage", "false");
        fileObjects = []; //files is now empty because files shouldnt carry over from final page
    } else {
        // Convert stored file objects to actual FileObject instances
        fileObjects = storedObjects.map(f => new FileObject(f));
        const dirPath = await window.file.getFilePath(); //else, keep the directory
        if (dirPath) {
            dirPathElement.innerText = `Selected Directory: \n${dirPath}`;
        }
        if(fileObjects.length === 0){
            backButton.innerText = "Select Directory"
        }
        //display files
        if (hasFiles()) {
            displayCurrentFile();
            setTimeout(() => {
                resetRenameInput(renameContainer);
            }, 10);
        } else {
            currentItemElement.innerText = "No files found.";
        }
    }

    // Select directory and load new files
    async function selectNewDirectory() {
        const dirPath = await window.file.selectDirectory();
        if (!dirPath) {
            alert("Directory selection was canceled.");
            return;
        }
        showTooltip();
        dirPathElement.innerText = `Selected Directory: \n${dirPath}`;    
        let files = await window.file.getFileData(dirPath);
        const removedFileTypes = new Set(await window.file.getRemovedFileTypes());
    
        // Filter out DS_Store and unselected extensions
        files = files.filter(file => {
            const fileName = file.name.split("/").pop();
            const fileType = file.name.split(".").pop();
            return fileName !== ".DS_Store" && !removedFileTypes.has(fileType);
        });
    
        // Convert raw data into FileObject instances
        fileObjects = files.map(f => new FileObject(f));
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
        currentIndex = 0;
    
        if (hasFiles()) {
            backButton.innerText = "Change Directory"
            displayCurrentFile();
        } else {
            currentItemElement.innerText = "No files found.";
        }
    }
    

    function showNotification(message) {
        const notification = notificationElement;
        notification.innerText = message;
        notification.style.display = 'block';

        // Hide the message after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Change Directory Button
    backButton.addEventListener("click", async () => {
        await selectNewDirectory();
    });


    // Delete button press
    deleteButton.addEventListener("click", async () => {
        if (!hasFiles()) return;
        animateSwipe("left");
    });

    // Delete function
    async function deleteFile() {
        // Don't attempt deletion if there are no [more] files.
        if (!hasFiles()) {
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "No file(s) to delete."
            });
            return;
        }
        fileObjects[currentIndex].status = "delete";
        currentIndex++;
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
        displayCurrentFile();
        resetPreviewPosition();
    };

    // Go through files in directory +1
    nextButton.addEventListener("click", async () => {
        if (!hasFiles()) return;
        animateSwipe("right");
    });

    // Next file function (aka Keep)
    async function nextFile() {
        if (!hasFiles()) return;
        fileObjects[currentIndex].status = "keep";
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
        currentIndex++;
        displayCurrentFile();
    }

    renameButton.addEventListener('click', async (event) => {
        if (!hasFiles()) return;
        renameModal.showModal();
        popupContentElement.innerText = "AI Suggested Name"
    });

    closeModal.addEventListener("click", () => {
        renameModal.close();
        resetRenameInput(renameContainer);
    });

    confirmRenameButton.addEventListener('click', async (event) => {
        if (!hasFiles()) return;
        event.preventDefault();
        event.stopPropagation();
        await handleRename();
    });

    // Add event listener for Enter key
    renameInputElement.addEventListener('keypress', async (event) => {
        if (!hasFiles()) return;
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            await handleRename();
        }
    });

    async function handleRename() {
        const newName = renameInputElement.value.trim();
        let currentFile = fileObjects[currentIndex].path;

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
                renameModal.close();
                showNotification(`File renamed successfully to ${finalName}`, 'success');
                fileObjects[currentIndex].name = window.file.pathBasename(newFilePath);
                fileObjects[currentIndex].path = newFilePath;
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

        renameInputElement = document.createElement('input');
        renameInputElement.type = 'text';
        renameInputElement.id = 'renameInput';
        renameInputElement.placeholder = 'Enter new file name';

        container.appendChild(renameInputElement);

        // Add event listener
        renameInputElement.addEventListener("keypress", renameOnEnter);

        // Temporary blur to prevent highlighting the input immediately
        setTimeout(() => {
            renameInputElement.blur();  // Remove highlight after creation
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
        // Remove existing event listeners (prevents duplicates)
        renameInputElement.removeEventListener("keypress", renameOnEnter);
        // Attach Enter key event
        renameInputElement.addEventListener("keypress", renameOnEnter);
    }

    async function renameOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            const newName = renameInputElement.value.trim();

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
        while (currentIndex < fileObjects.length && fileObjects[currentIndex].status !== null) {
            currentIndex++;
        }

        if (currentIndex >= fileObjects.length) {
            currentItemElement.innerText = "No files in queue.";
            currentItemSizeElement.innerText = "";
            previewContainer.innerHTML = "You've reached the end! Press the 'Review and Finalize' button to wrap up.";
            return
        }
         
        const file = fileObjects[currentIndex];
        currentItemElement.innerText = "Current File: " + file.name;
        let formattedSize = formatFileSize(file.size);
        currentItemSizeElement.innerText = "| File Size: " + formattedSize;
        refreshPreview(file.path);
        // Reset rename input field
        resetRenameInput(renameContainer);
        //reset inspect mode upon file change
        inspectMode = false;
        inspectButton.innerText = "Inspect Document";
        // Attach Enter event listener for renaming
        //attachRenameListeners();
    }

    async function refreshPreview(filePath) {
        const previewHTML = await window.file.generatePreviewHTML(filePath);
        previewContainer.innerHTML = previewHTML || "<p>Preview not available</p>";
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
        let translateX;
        let rotateDeg;
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
            if (!hasFiles()) {
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
        if (e.type === "touchmove") {
            currentX = e.touches[0].clientX;
        } else {
            currentX = e.clientX;
        }
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

    //button to go to the final page
    finalPageButton.addEventListener("click", () => {
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
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

    inspectButton.addEventListener("click", () => {
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
        inspectButton.innerText = inspectMode ? "Exit Inspect" : "Inspect Document";
    });

    //button to go to the final page
    finalPageButton.addEventListener("click", () => {
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
        window.location.href = "../final_page.html";
    });

    trashButton.addEventListener("click", () => {
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
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

    popupElement.addEventListener("click", () => {
        if (!hasFiles()) return;
        LLM();
    });
      function LLM() {
        popupElement.style.display = "inline-block";
        const filename = fileObjects[currentIndex].path;
        // Check for file types using mime 
        //--------------------------------------------------------------------
        const mimeType = window.file.getMimeType(filename);
        if ( mimeType.startsWith("text/")) {
                      // Text
                      const fileContents = window.file.getFileContents(filename);
                      if (!fileContents || fileContents.length === 0) {
                          popupContentElement.textContent = "No file contents found.";
                          setTimeout(() => {
                            popupContentElement.textContent = "Try another file buddy 😭"; 
                          }, 4000);
                          return;
                        } 
                        popupContentElement.textContent = "Thinking...";
                      window.openai
                        .openaiRequest([
                          {
                            role: "system",
                            content:
                              "You will review the following text and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension.",
                          },
                          { role: "user", content: fileContents },
                        ])
                        .then((response) => {
                          const suggestion = response.choices[0].message;
                          console.log("Renaming Suggestion:", suggestion.content);                                
      
                          // Add a click event listener to the popup. Populates the input field wih the suggestion.
                          if (renameInputElement) {
                            renameInputElement.value = suggestion.content;
                          
                              // Remove previous animation classes
                            renameInputElement.classList.remove("glowing", "wiggle");
                          
                              // Force reflow to restart animations
                            void renameInputElement.offsetWidth;
                          
                              // Add animation classes again
                              renameInputElement.classList.add("glowing", "wiggle");
                          
                              // Remove the classes after the animation completes
                            setTimeout(() => { 
                                renameInputElement.classList.remove("glowing", "wiggle"); 
                            }, 500);
                          }
                          popupContentElement.textContent = "Get new AI Name";
                        })
                        .catch((error) => {
                          console.error("Error sending OpenAI request:", error);
                        });
            }
        // PDF
        else if(mimeType == "application/pdf"){
            // Creating a Async function to process all PDF contents before using data.
            async function pdfAIcall() {
                  const pdfContent = await window.file.getPDFtext(filename);
                  console.log("PDF Content:", pdfContent);
                  popupContentElement.textContent = "Thinking...";
                  window.openai
                  .openaiRequest([
                    {
                      role: "system",
                      content:
                        "You will review the following text and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension.",
                    },
                    { role: "user", content: pdfContent},
                  ])
                  .then((response) => {
                    const suggestion = response.choices[0].message;
                    console.log("Renaming Suggestion:", suggestion.content);                                
                    if (renameInputElement) {
                        renameInputElement.value = suggestion.content;
                        renameInputElement.classList.remove("glowing", "wiggle");
                        void renameInputElement.offsetWidth;
                        renameInputElement.classList.add("glowing", "wiggle");
                        setTimeout(() => { 
                            renameInputElement.classList.remove("glowing", "wiggle"); 
                        }, 500);
                    }
                    popupContentElement.textContent = "Get new AI Name";
                  })
                  .catch((error) => {
                    console.error("Error sending OpenAI request:", error);
                  });
              }
            pdfAIcall();
        }
        // Jpeg or png
        else if (mimeType.startsWith("image/")) {
          try {
            const base64Image = window.file.getBase64(filename);
            popupContentElement.textContent = "Thinking...";
    
            window.openai
              .openaiRequest([
                {
                  role: "system",
                  content:
                    "You will review the following image and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension. Do not include explanation. File name only as the output."
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "You will review the following image and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension. Do not include explanation. File name only as the output.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${base64Image}`,
                        detail: "low",
                      },
                    },
                  ],
                },
              ])
              .then((response) => {
                const suggestion = response.choices[0].message;
                console.log("Renaming Suggestion:", suggestion.content);                               

                // Add a click event listener to the popup. Populates the input field wih the suggestion.
                if (renameInputElement) {
                    renameInputElement.value = suggestion.content;
                    renameInputElement.classList.remove("glowing", "wiggle");
                    void renameInputElement.offsetWidth;
                    renameInputElement.classList.add("glowing", "wiggle");
                    setTimeout(() => { 
                        renameInputElement.classList.remove("glowing", "wiggle"); 
                    }, 500);
                }
                popupContentElement.textContent = "Get new AI Name";
              })
              .catch((error) => {
                console.error("Error sending OpenAI request:", error);
                popupContentElement.textContent = "This image goes against my requirements.";
              });
          } catch (error) {
            console.error("Error reading image file:", error);
          }
        } else {
            // Handle unsupported file types
            console.log("Unsupported file type:", mimeType);
            popupContentElement.textContent = 'File type not supported.';
            setTimeout(() => {
                popupContentElement.textContent = "Try another file buddy 😭";
              }, 4000);
            return; 
        }
      }    

    
    function showTooltip(){
        // Checks to see if user is a test agent
        const isTesting = navigator.userAgent.includes("Playwright");
    
        // Only runs if user is real
        if (!isTesting && !hasShownTooltip) {
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
        return fileObjects.slice(currentIndex).some(f => f.status === null);
    }

    settingsButton.addEventListener("click", () => {
        window.location.href = "../settings.html";
    });
};
