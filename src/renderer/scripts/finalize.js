import * as fileObject from "./fileObjects.js"
import * as rename from "./rename.js"
import * as progressBar from "./progressBar.js"

const finalizeModal = document.getElementById("finalizeModal");
const finalPageButton = document.getElementById("finalPageButton");
const closeFinalizeModal = document.getElementById("closeFinalizeModal");

finalPageButton.addEventListener("click", () => {
   finalizeModal.showModal();

   const tabButtons = document.querySelectorAll('.tab');
   const tabContents = {
      kept: document.getElementById('keptTab'),
      deleted: document.getElementById('deletedTab'),
   };

   tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
         const target = btn.dataset.tab;

         // Toggle active tab button
         tabButtons.forEach(b => b.classList.remove('active'));
         btn.classList.add('active');

         // Toggle content
         for (const [key, el] of Object.entries(tabContents)) {
            el.classList.toggle('hidden', key !== target);
         }
      });
   });
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
      const listItem = document.createElement("li");
      const renameInput = document.createElement("input");

      renameInput.type = "text";
      renameInput.value = file.name;
      renameInput.title = "Rename file"
      renameInput.classList.add("rename-input");
      renameInput.dataset.oldname = file.path;

      listItem.appendChild(renameInput);
      keptFilesList.appendChild(listItem);

      renameInput.addEventListener("keypress", async function (event) {
         if (event.key === "Enter") {
            await rename.handleRename(renameInput, file);
            renderFileLists();
         }
      });

      renameInput.addEventListener("blur", async function () {
         await rename.handleRename(renameInput, file);
         renderFileLists();
      });
   }

   // Display the deleted files 
   function renderDeletedFile(file) {
      const listItem = document.createElement("li");
      const nameSpan = document.createElement("span");
      nameSpan.className = "file-name";
      nameSpan.textContent = file.name;

      const undoButton = document.createElement("button");
      undoButton.textContent = "Restore";
      undoButton.title = "Undo deletion"
      undoButton.dataset.path = file.path;

      listItem.appendChild(nameSpan);
      listItem.appendChild(undoButton);
      deletedFilesList.appendChild(listItem);

      undoButton.addEventListener("click", () => {
         // Update file status to keep
         file.status = "keep";
         progressBar.update();
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

      window.file.setFilePath("");

      window.location.reload();
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

export function modalIsOpen() {
   return finalizeModal.open;
}

closeFinalizeModal.addEventListener("click", () => {
   finalizeModal.close();
});
