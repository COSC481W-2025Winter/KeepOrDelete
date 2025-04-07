import * as fileObject from "./fileObjects.js"
import * as ui from "./ui.js"
const trashModal = document.getElementById("trash_dialog");
const openTrashModal = document.getElementById("trash_button");
const closeTrashModal = document.getElementById("closeTrashModal");
const deletedFilesList = document.getElementById("deletedFilesList");
const deletedHeader = document.getElementById("deletedHeader");

let filesToBeDeleted = 0;

openTrashModal.addEventListener("click", function () {
   loadDeletedFiles();
   document.getElementById("trash_dialog").style.display = "block";
   trashModal.showModal(); //load modal 
});

closeTrashModal.addEventListener("click", function () {
   document.getElementById("trash_dialog").style.display = "none";
   ui.updateTrashBadge();
   trashModal.close();
});

function loadDeletedFiles() {
   let deletedFiles = fileObject.getAll().filter(f => f.status === "delete");
   filesToBeDeleted = deletedFiles.length;

   // Delete existing HTML deletion list elements.
   deletedFilesList.innerHTML = "";

   if (filesToBeDeleted === 0) {
      deletedHeader.innerHTML = `<h3 id="deletedHeader">No files to be deleted</h3>`
      return;
   }

   deletedHeader.innerHTML = `<h3 id="deletedHeader">Files to be deleted: ${filesToBeDeleted}</h3>`;

   deletedFiles.forEach(file => {
      const fileName = file.name;
      const listItem = document.createElement("li");
      const fileNameSpan = document.createElement("span");
      fileNameSpan.classList.add("file-name");
      fileNameSpan.textContent = fileName;
      listItem.appendChild(fileNameSpan);
      const deleteButton = document.createElement("button");
      deleteButton.innerText = "Undo";
      deleteButton.title = "Undo deletion"
      deleteButton.classList.add("deleteUndo");
      deleteButton.dataset.file = file.path;
      listItem.appendChild(deleteButton);
      deletedFilesList.appendChild(listItem);
      //listener for keep button for each li
      deleteButton.addEventListener("click", function () {
         const filePath = deleteButton.dataset.file;
         //get fileObjects in local storage and get index of file we are interested in
         let targetIndex = fileObject.getAll().findIndex(f => f.path === filePath);
         if (targetIndex !== -1) { //if its -1, wasn't found
            filesToBeDeleted--;
            fileObject.setStatus(targetIndex, "keep"); //set to keep
            listItem.remove(); //built in remove method
            deletedHeader.innerHTML = `<h3 id="deletedHeader">${filesToBeDeleted} files to be deleted</h3>`
         }
      });

   });
}
