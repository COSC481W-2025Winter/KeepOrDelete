import * as fileObject from "../fileObjects.js"
import * as currentIndex from "../currentIndex.js"
import * as swipe from "../swipe.js"
import * as progress from "../progress.js"
import * as rename from "../rename.js"
import * as ui from "../ui.js"
import * as userAction from "../userAction.js"

window.onload = async function() {
   // Cache DOM references
   const dirPathElement = document.getElementById("dirPath");
   const currentItemElement = document.getElementById("currentItem");
   const popupContentElement = document.getElementById('popupContent');
   const popupElement = document.getElementById('popup')
   const closeModal = document.getElementById("closeModal");
   const renameModal = document.getElementById("renameModal");
   const renameContainer = document.getElementById("renameContainer");
   let renameInputElement = document.getElementById('renameInput');
   const confirmRenameButton = document.getElementById("confirmRename");
   const backButton = document.getElementById("backButton");
   const finalizeModal = document.getElementById("finalizeModal");
   const finalPageButton = document.getElementById("finalPageButton");
   const closeFinalizeModal = document.getElementById("closeFinalizeModal");
   const inspectButton = document.getElementById("inspectButton");
   const trashButton = document.getElementById("trash_button");
   const dirPath = await window.file.getFilePath();

   if (!dirPath) {
      // Hide all UI elements except welcomeScreen
      ui.toggleUIElements(false);
   } else {
      // Show main UI and hide welcome screen
      ui.toggleUIElements(true);
      document.getElementById("dirPath").innerText = `Selected Directory: \n${dirPath}`;
      if (!fileObject.isEmpty()) {
         swipe.displayCurrentFile();
      } else {
         progress.updateProgress();
         document.getElementById("currentItem").innerText = "No files found.";
      }
   }

   // Handle directory selection from the welcome screen
   document.getElementById("selectDirButton").addEventListener("click", async () => {
      await userAction.selectNewDirectory();
   });

   //this stretch of code checks if we are navigating to this page from the final page from
   //final page after finalize and select new directory, if yes, no directory shown, if no, get dir
   let finalPage = localStorage.getItem("finalPage") === "true"; //boolean
   let returnFromSettings = localStorage.getItem("returnFromSettings") === "true";
   if (finalPage) {
      backButton.innerText = "Select a Directory"
      dirPathElement.innerText = "No directory selected";
      localStorage.setItem("finalPage", "false");
      fileObject.reset(); //files is now empty because files shouldnt carry over from final page
      ui.toggleUIElements(false);
   } else if (returnFromSettings) {
      localStorage.setItem("returnFromSettings", "false");
      ui.toggleUIElements(false);
   } else {
      const dirPath = await window.file.getFilePath(); //else, keep the directory
      if (dirPath) {
         dirPathElement.innerText = `Selected Directory: \n${dirPath}`;
      }
      if (fileObject.isEmpty()) {
         backButton.innerText = "Select Directory"
         swipe.displayCurrentFile();
         setTimeout(() => {
            rename.resetRenameInput(renameContainer);
         }, 10);
      } else {
         currentItemElement.innerText = "No files found.";
      }
   }

   closeModal.addEventListener("click", () => {
      renameModal.close();
      rename.resetRenameInput(renameContainer);
   });

   confirmRenameButton.addEventListener('click', async (event) => {
      if (fileObject.isEmpty()) return;
      event.preventDefault();
      event.stopPropagation();
      await rename.handleRename();
   });

   // Add event listener for Enter key
   renameInputElement.addEventListener('keypress', async (event) => {
      if (fileObject.isEmpty()) return;

      if (event.key === "Enter") {
         event.preventDefault();
         event.stopPropagation();
         await rename.handleRename();
      }
   });

   finalPageButton.addEventListener("click", () => {
      finalizeModal.showModal();

      // Get references to the kept and deleted files 
      const keptFilesList = document.getElementById("keptFilesList");
      const deletedFilesList = document.getElementById("finalizedDeletedFilesList");

      // Get references to the image limit and logged time to preserve after refresh
      const Limitkey = "imageLimit";
      const Timekey = "loggedTime";
      const preservedLimit = parseInt(localStorage.getItem("imageLimit") || "0", 10);
      const preservedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);

      // Render the file lists based on the stored file objects
      function renderFileLists() {
         keptFilesList.innerHTML = "";
         deletedFilesList.innerHTML = "";

         const keptFiles = fileObject.getAll().filter(f => f.status === "keep");
         const deletedFiles = fileObject.getAll().filter(f => f.status === "delete");

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

         renameInput.addEventListener("keypress", async function(event) {
            if (event.key === "Enter") {
               await rename.handleRename(renameInput, file);
               renderFileLists();
            }
         });

         renameInput.addEventListener("blur", async function() {
            await rename.handleRename(renameInput, file);
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
            // Re-render lists
            renderFileLists();
         });
      }

      document.getElementById("finalizeButton").addEventListener("click", async () => {
         // Recheck for deleted files in case any were changed to keet
         const deletedFiles = fileObject.getAll().filter(f => f.status === "delete");
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
         localStorage.setItem(Limitkey, preservedLimit);
         localStorage.setItem(Timekey, preservedTime);
         window.location.href = "keep_or_delete.html";
      });

      document.getElementById("exitButton").addEventListener("click", async () => {
         // Recheck for deleted files in case any were changed to keet
         const deletedFiles = fileObject.getAll().filter(f => f.status === "delete");
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
         localStorage.clear(); // Clears stored session data
         localStorage.setItem(Limitkey, preservedLimit);
         localStorage.setItem(Timekey, preservedTime);
         window.file.quitApp(); // Calls the function to quit the app
      });
      renderFileLists();
   });

   closeFinalizeModal.addEventListener("click", () => {
      finalizeModal.close();
   });

   inspectButton.addEventListener("click", () => {
      const iframe = document.querySelector("#previewContainer iframe");
      const textPreview = document.querySelector("#previewContainer pre");
      // Toggle inspect mode state
      swipe.toggleInspectMode();

      const inspectMode = swipe.getInspectMode();

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

   trashButton.addEventListener("click", () => {
      localStorage.setItem("fileObjects", JSON.stringify(fileObject.getAll()));
   });

   // Arrow key file swiping
   document.addEventListener("keydown", async (e) => {
      if (fileObject.isEmpty()) return;

      if (e.key === "ArrowRight") {
         swipe.animateSwipe("right");
      } else if (e.key === "ArrowLeft") {
         swipe.animateSwipe("left");
      }
   });

   popupElement.addEventListener("click", () => {
      if (fileObject.isEmpty()) return;
      LLM();
   });
   function LLM() {
      const filename = fileObject.get(currentIndex.get()).path;
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
               popupContentElement.textContent = "Another suggestion?";
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
                  popupContentElement.textContent = "Another suggestion?";
               })
               .catch((error) => {
                  console.error("Error sending OpenAI request:", error);
                  popupContentElement.textContent = "There was an error reading the contents. Please try again.";
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
            const timeLeft = window.file.convertMillisecondsToTimeLeft(14400000 - (currentTime - loggedTime));
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
                  popupContentElement.textContent = "Another suggestion?";
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


   // Reveal body after all elements are ready only for keep_or_delete.html
   if (document.body.classList.contains("keep-or-delete")) {
      document.body.classList.add("show");
   }
};
