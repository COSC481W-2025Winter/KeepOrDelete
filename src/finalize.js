import * as fileObject from "./fileObjects.js"
import * as rename from "./rename.js"

const finalizeModal = document.getElementById("finalizeModal");
const finalPageButton = document.getElementById("finalPageButton");
const closeFinalizeModal = document.getElementById("closeFinalizeModal");

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
