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
let spaceSaved = 0;


window.onload = async function () {
    // Cache DOM references
    const previewContainer = document.getElementById("previewContainer");
    const dirPathElement = document.getElementById("dirPath");
    const currentItemElement = document.getElementById("currentItem");
    const currentItemSizeElement = document.getElementById("currentItemSize");
    const notificationElement = document.getElementById("notification");
    const popupContentElement = document.getElementById('popupContent');
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
    const saved = document.getElementById("dataSaved");
    let inspectMode = false;
    const hasShownTooltip = sessionStorage.getItem("tooltipShown");
    const dirPath = await window.file.getFilePath();
    const sortOrderDropdown = document.getElementById("sortOrder");
    const welcome = document.getElementById("welcomeScreen");

    if (!dirPath) {
        // Hide all UI elements except welcomeScreen
        toggleUIElements(false);
    } else {
        // Show main UI and hide welcome screen
        toggleUIElements(true);
        document.getElementById("dirPath").innerText = `Selected Directory: \n${dirPath}`;
        if (hasFiles()) {
            displayCurrentFile();
        } else {
            document.getElementById("currentItem").innerText = "No files found.";
        }
    }

    // Handle directory selection from the welcome screen
    document.getElementById("selectDirButton").addEventListener("click", async () => {
        await selectNewDirectory();
    });

    function toggleUIElements(visible) {
        const ids = [
            "trash_button",
            "dirDisplay",
            "previewContainer",
            "notification",
            "progress-bar",
            "tooltip",
            "fileinfo",
            "backButton",
        ];

        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.toggle("hidden", !visible);
            }

            if (welcome) {
                welcome.classList.toggle("hidden", visible);
            }
        
            if (visible) resetTooltip();
        });
    }
    // Get stored file objects
    const storedObjects = JSON.parse(localStorage.getItem("fileObjects")) || [];
    //this stretch of code checks if we are navigating to this page from the final page from
    //final page after finalize and select new directory, if yes, no directory shown, if no, get dir
    let finalPage = localStorage.getItem("finalPage") === "true"; //boolean
    let returnFromSettings = localStorage.getItem("returnFromSettings") === "true";
    if (finalPage) {
        backButton.innerText = "Select a Directory"
        localStorage.removeItem("fileObjects"); // Clear old file data
        dirPathElement.innerText = "No directory selected";
        localStorage.setItem("finalPage", "false");
        fileObjects = []; //files is now empty because files shouldnt carry over from final page
        toggleUIElements(false);
    } else if (returnFromSettings) {
        localStorage.setItem("returnFromSettings", "false");
        toggleUIElements(false);
    } else {
        // Convert stored file objects to actual FileObject instances
        fileObjects = storedObjects.map(f => new FileObject(f));
        const dirPath = await window.file.getFilePath(); //else, keep the directory
        if (dirPath) {
            dirPathElement.innerText = `Selected Directory: \n${dirPath}`;
        }
        if (fileObjects.length === 0) {
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
        toggleUIElements(true);
        document.getElementById("dirPath").innerText = `Selected Directory: \n${dirPath}`;    
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


    sortOrderDropdown.addEventListener("change", () => {
        sortFiles();
        currentIndex = 0;
        displayCurrentFile();
        sortOrderDropdown.blur()
    });


    function sortFiles() {
        const sortOrder = sortOrderDropdown.value;
        fileObjects.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
            if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
            return 0; // Stable sort
        });
        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
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
        deleteFile();

        animateSwipe("left");
    });

    // Delete function
    async function deleteFile() {
        if (!hasFiles()) {
            await window.file.showMessageBox({
                type: "error",
                title: "Error",
                message: "No file(s) to delete."
            });
            return;
        }
        console.log("Before update:", JSON.stringify(fileObjects[currentIndex]));

        fileObjects[currentIndex].status = "delete";

        console.log("After update:", JSON.stringify(fileObjects[currentIndex]));

        localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
        console.log("Updated localStorage:", localStorage.getItem("fileObjects"));

        currentIndex++;
        displayCurrentFile();
        updateProgress();
        resetPreviewPosition();
    }


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
        updateProgress();
    }

    renameButton.addEventListener('click', async (event) => {
        if (!hasFiles()) return;
        renameModal.showModal();
        const filename = fileObjects[currentIndex].name;
        // If file is an image, show time left automatically
        const mimeType = window.file.getMimeType(filename);
        if(mimeType.startsWith("image/")){
            if(LimitDisplay()){
                const loggedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);
                const timeLeft = convertMillisecondsToTimeLeft(14400000 - (Date.now() - loggedTime));
                popupContentElement.textContent = timeLeft.hours + "h " + timeLeft.minutes + "m " + timeLeft.seconds + "s" + " left until I can suggest a name for images.";
            }
        }
        else{
            popupContentElement.innerText = "AI: Try me!"
        } 
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
        updateProgress();
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
        const filename = fileObjects[currentIndex].path;
        // Check for file types using mime 
        //--------------------------------------------------------------------
        const mimeType = window.file.getMimeType(filename);
        if (mimeType.startsWith("text/")) {
            // Text
            const fileContents = window.file.getFileContents(filename);
            if (!fileContents || fileContents.length === 0) {
                popupContentElement.textContent = "No file contents found.";
                setTimeout(() => {
                    popupContentElement.textContent = "Please choose a file with contents.";
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
                    popupContentElement.textContent = "Try Again!";
                })
                .catch((error) => {
                    console.error("Error sending OpenAI request:", error);
                    popupContentElement.textContent = "There was an error reading the contents. Please try again.";
                });
        }
        // PDF & DOCX files
        else if (mimeType == "application/pdf" || filename.includes("docx")) {
            // Creating a Async function to process all PDF contents before using data.
            async function pdfAIcall() {
                let pdfPath = filename;
                if (filename.includes("docx")) {
                    pdfPath = await window.file.convertDocxToPdf(filename);
                } else {
                    // For actual PDF files, extract text directly.
                    pdfPath = filename;
                }

                const pdfContent = await window.file.getPDFtext(pdfPath);
                console.log("PDF Content:", pdfContent);
                popupContentElement.textContent = "Thinking...";
                window.openai
                    .openaiRequest([
                        {
                            role: "system",
                            content:
                                "You will review the following text and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension.",
                        },
                        { role: "user", content: pdfContent },
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
                        popupContentElement.textContent = "Try Again!";
                    })
                    .catch((error) => {
                        console.error("Error sending OpenAI request:", error);
                    });
            }
            pdfAIcall();
        }
        // Jpeg or png
        else if (mimeType.startsWith("image/")) {

            const currentTime = Date.now();
            // Get the image limit and logged time from local storage
            let imageLimit = parseInt(localStorage.getItem("imageLimit") || "0", 10);
            let loggedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);

            //reset the counter if 24 hours have passed
            if (currentTime - loggedTime > 14400000) {
                imageLimit = 0;
                loggedTime = currentTime;
                localStorage.setItem("imageLimit", imageLimit);
                localStorage.setItem("loggedTime", loggedTime);
            }

            // 60000 minute
            // 86400000 24 hours
            // 14400000 4 hours
            // If 4 hours haven't passed and the image limit is reached, they cooked 
            if ((currentTime - loggedTime) <= 14400000 && imageLimit >= 2) {
                const timeLeft = convertMillisecondsToTimeLeft(14400000 - (currentTime - loggedTime));
                console.log(timeLeft);
                popupContentElement.textContent = "Your renaming limit for image files has been reached.";
                setTimeout(() => {
                    popupContentElement.textContent = "You have " + timeLeft.hours + "h " + timeLeft.minutes + "m " + timeLeft.seconds + "s" + " left.";
                }, 4000);
                return;
            }
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
                        imageLimit++;
                        localStorage.setItem("imageLimit", imageLimit);
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
                        popupContentElement.textContent = "Try Again!";
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
                popupContentElement.textContent = "I only support pdf, docx, jpeg, png, and txt files.";
            }, 4000);
            return;
        }
    }


    function showTooltip() {
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
        const tooltip = document.getElementById("tooltip");

        if (tooltip) {
            tooltip.classList.remove("show");
            tooltip.classList.add("hide");

            // Optionally remove after a timeout
            setTimeout(() => {
                tooltip.style.display = "none"; // Completely hide
            }, 400);
        }
    }

    function resetTooltip() {
        const tooltip = document.getElementById("tooltip");

        // Check if the tooltip has already been reset in this session
        if (sessionStorage.getItem("tooltipReset") === "true") {
            return; // Skip if already reset
        }

        if (tooltip) {
            tooltip.style.display = "block";  // Show the tooltip
            tooltip.classList.remove("hide");
            tooltip.classList.add("show");

            // Mark that the tooltip reset has been done in this session
            sessionStorage.setItem("tooltipReset", "true");
        } else {
            console.error("Tooltip element not found.");
        }
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

    const trashModal = document.getElementById("trash_dialog"); //these vars have to do with trash page subwindow
    const openTrashModal = document.getElementById("trash_button");
    const closeTrashModal = document.getElementById("closeTrashModal");
    const deletedFilesList = document.getElementById("deletedFilesList");
    const deletedHeader = document.getElementById("deletedHeader");
    let filesToBeDeleted = 0;
    //ensuring all vars exist before entering this block
    if (openTrashModal && closeTrashModal && trashModal && deletedFilesList) {
        openTrashModal.addEventListener("click", function () {
            loadDeletedFiles();
            trashModal.showModal(); //load modal 
        });
        closeTrashModal.addEventListener("click", function () {
            trashModal.close();
        });
        //master function for this subwindow, this is all logic from trash_page.js
        function loadDeletedFiles() {
            let deletedFiles = fileObjects.filter(f => f.status === "delete");
            filesToBeDeleted = deletedFiles.length;
            if (filesToBeDeleted > 0) {
                deletedHeader.innerHTML = `<h3 id="deletedHeader">${filesToBeDeleted} files to be deleted</h3>`;
            }
            console.log(deletedFiles);
            if (deletedFiles.length > 0) { //if there is something in deleted files, update
                deletedFilesList.innerHTML = ""; //empty
                deletedFiles.forEach(file => {
                    const fileName = file.name;
                    const listItem = document.createElement("li");
                    listItem.innerText = fileName;
                    const deleteButton = document.createElement("button");
                    deleteButton.innerText = "Move to keep";
                    deleteButton.classList.add("deleteUndo");
                    deleteButton.dataset.file = file.path;
                    listItem.appendChild(deleteButton);
                    deletedFilesList.appendChild(listItem);
                    //listener for keep button for each li
                    deleteButton.addEventListener("click", function () {
                        const filePath = deleteButton.dataset.file;
                        //get fileObjects in local storage and get index of file we are interested in
                        let targetIndex = fileObjects.findIndex(f => f.path === filePath);
                        if (targetIndex !== -1) { //if its -1, wasn't found
                            //console.log("Before update:", fileObjects[targetIndex]); //debugging
                            filesToBeDeleted--;
                            fileObjects[targetIndex].status = "keep"; //set to keep
                            //console.log("After update:", fileObjects[targetIndex]);
                            //console.log("Updated localStorage:", localStorage.getItem("fileObjects"));
                            listItem.remove(); //built in remove method
                            deletedHeader.innerHTML = `<h3 id="deletedHeader">${filesToBeDeleted} files to be deleted</h3>`
                            if (filesToBeDeleted === 0) {
                                deletedHeader.innerHTML = `<h3 id="deletedHeader">No files to be deleted</h3>`

                            }
                        }
                    });

                });
            }
        }
    } else {
        console.error("One or more elements not found. Check your HTML IDs.");
    }



    // Progress Bar based on files left
    function updateProgress() {
        const totalFiles = fileObjects.length;
        const keptFiles = fileObjects.filter(f => f.status === "keep");
        const filesToBeDeleted = fileObjects.filter(f => f.status === "delete");
        const completedFiles = keptFiles.length + filesToBeDeleted.length;
        const percent = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
        progress.style.width = `${percent}%`;
        progress.textContent = percent + "%";

        // Calculate total space saved
        const totalSpaceSaved = filesToBeDeleted.reduce((sum, file) => sum + file.size, 0);

        // Adding some glowing and scaling animation cause vibes.
        if (percent === 100) {
            progress.classList.add("complete");
            saved.textContent = "You've saved: " + formatFileSize(totalSpaceSaved) + "!";
            setTimeout(() => {
                progress.classList.remove("complete");
            }, 1000);
        }
        // Re-trigger the glowing animation
        progress.classList.remove("glowing");
        void progress.offsetWidth;
        progress.classList.add("glowing");
    }
    // Reveal body after all elements are ready only for keep_or_delete.html
    if (document.body.classList.contains("keep-or-delete")) {
        document.body.classList.add("show");
    }
    function convertMillisecondsToTimeLeft(milliseconds) {
        var seconds = Math.floor(milliseconds / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
    
        hours %= 24;
        minutes %= 60;
        seconds %= 60;
    
        return {
            hours: hours,
            minutes: minutes,
            seconds: seconds
        };
    }
        function LimitDisplay() {
            
            const currentTime = Date.now();
            // Get the image limit and logged time from local storage
            let imageLimit = parseInt(localStorage.getItem("imageLimit") || "0", 10);
            let loggedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);
            
            // Check if the limit has been reached
            if ((currentTime - loggedTime) <= 14400000 && imageLimit >= 2) {
                return true;
            }
            return false;  
        }

};
