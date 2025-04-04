import * as tooltip from "./tooltip.js"
import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as rename from "./rename.js"
import * as settings from "./settings.js"
import * as swipe from "./swipe.js"
import * as progress from "./progress.js"

const currentItemElement = document.getElementById("currentItem");
const currentItemSizeElement = document.getElementById("currentItemSize");
const renameContainer = document.getElementById("renameContainer");
const inspectButton = document.getElementById("inspectButton");
const welcome = document.getElementById("welcomeScreen");
const previewContainer = document.getElementById("previewContainer");

export function toggleUIElements(visible) {
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

      if (visible) tooltip.reset();
   });
}

export async function displayCurrentFile() {
   const fileObjects = fileObject.getAll();
   const removedFileTypes = await settings.removedFileTypes();
   let index = currentIndex.get();

   while (index < fileObjects.length && (fileObjects[index].status !== null || removedFileTypes.includes(fileObjects[index].ext))) {
      currentIndex.increment();
      index = currentIndex.get();
   }

   if (index >= fileObjects.length) {
      currentItemElement.innerText = "No files in queue.";
      currentItemSizeElement.innerText = "";
      previewContainer.innerHTML = "You've reached the end! Press the 'Review and Finalize' button to wrap up.";
      return
   }

   console.log(fileObjects[index].ext)
   const file = fileObjects[index];
   currentItemElement.innerText = "Current File: " + file.name;
   let formattedSize = window.file.formatFileSize(file.size);
   currentItemSizeElement.innerText = "| File Size: " + formattedSize;
   refreshPreview(file.path);
   // Reset rename input field
   rename.resetRenameInput(renameContainer);
   //reset inspect mode upon file change
   swipe.setInspectMode(false);
   inspectButton.innerText = "Inspect Document";
   // Attach Enter event listener for renaming
   //attachRenameListeners();
}

async function refreshPreview(filePath) {
   const previewHTML = await window.file.generatePreviewHTML(filePath);
   previewContainer.innerHTML = previewHTML || "<p>Preview not available</p>";
   swipe.resetPreviewPosition();
   progress.updateProgress();
}
