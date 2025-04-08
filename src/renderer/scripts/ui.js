import * as tooltip from "./tooltip.js"
import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as rename from "./rename.js"
import * as settings from "./settings.js"
import * as swipe from "./swipe.js"
import * as inspect from "./inspect.js"
import * as progressBar from "./progressBar.js"

const currentItemElement = document.getElementById("currentItem");
const currentItemSizeElement = document.getElementById("currentItemSize");
const renameContainer = document.getElementById("renameContainer");
const renameButton = document.getElementById("renameButton");
const inspectButton = document.getElementById("inspectButton");
const welcome = document.getElementById("welcomeScreen");
const previewContainer = document.getElementById("previewContainer");


export function setWelcomeVisibility(visible) {
   welcome.classList.toggle("hidden", !visible);

   const ids = [
      "trash_button",
      "previewWrapper",
      "previewContainer",
      "notification",
      "progress-bar",
      "tooltip",
      "fileinfo",
      "backButton",
      "trashBadge",
      "finalPageButton"
   ];

   ids.forEach(id => {
      const element = document.getElementById(id);

      element.hidden = visible;
   });

   if (!visible) tooltip.reset();
}

export async function displayCurrentFile() {
   const fileObjects = fileObject.getAll();
   const removedFileTypes = await settings.removedFileTypes();
   let index = currentIndex.get();
   updateTrashBadge()
   while (index < fileObjects.length && (fileObjects[index].status !== null || removedFileTypes.includes(fileObjects[index].ext))) {
      currentIndex.increment();
      index = currentIndex.get();
   }

   if (index >= fileObjects.length) {
      currentItemElement.innerText = "No files in queue.";
      currentItemSizeElement.innerText = "";
      previewContainer.innerHTML = "You've reached the end! Press the 'Review' button to wrap up.";
      return
   }

   console.log(fileObjects[index].ext)
   const file = fileObjects[index];
   currentItemElement.innerText = file.name;
   let formattedSize = window.file.formatFileSize(file.size);
   currentItemSizeElement.innerText = "File size: " + formattedSize;
   refreshPreview(file.path);
   // Reset rename input field
   rename.resetRenameInput(renameContainer);
   //reset inspect mode upon file change
   inspect.setInspectMode(false);
   inspectButton.innerText = "🔎";
   // Attach Enter event listener for renaming
   //attachRenameListeners();
}

async function refreshPreview(filePath) {
   const previewHTML = await window.file.generatePreviewHTML(filePath);
   previewContainer.innerHTML = previewHTML || "<p>Preview not available</p>";
   swipe.resetPreviewPosition();
   progressBar.update();
}

export function updateTrashBadge() {
   let badge = document.getElementById("trashBadge");
   let deletedFiles = fileObject.getAll().filter(f => f.status === "delete");
   console.log(deletedFiles.length)
   if (deletedFiles.length > 0) {
      badge.textContent = deletedFiles.length > 99 ? "99+" : deletedFiles.length;
      badge.hidden = false;

   } else {
      badge.hidden = true;
   }
}
