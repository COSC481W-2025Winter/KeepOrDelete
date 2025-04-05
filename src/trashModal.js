import * as fileObject from "./fileObjects.js"

const trashModal = document.getElementById("trash_dialog");
const openTrashModal = document.getElementById("trash_button");
const closeTrashModal = document.getElementById("closeTrashModal");
const deletedFilesList = document.getElementById("deletedFilesList");
const deletedHeader = document.getElementById("deletedHeader");

let filesToBeDeleted = 0;

if (openTrashModal && closeTrashModal && trashModal && deletedFilesList) {
   openTrashModal.addEventListener("click", function() {
      loadDeletedFiles();
      trashModal.showModal(); //load modal 
   });
   closeTrashModal.addEventListener("click", function() {
      trashModal.close();
   });
} else {
   console.error("One or more elements not found. Check your HTML IDs.");
}

function loadDeletedFiles() {
   let deletedFiles = fileObject.getAll().filter(f => f.status === "delete");
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
         deleteButton.addEventListener("click", function() {
            const filePath = deleteButton.dataset.file;
            //get fileObjects in local storage and get index of file we are interested in
            let targetIndex = fileObject.getAll().findIndex(f => f.path === filePath);
            if (targetIndex !== -1) { //if its -1, wasn't found
               filesToBeDeleted--;
               fileObject.setStatus(targetIndex, "keep"); //set to keep
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
