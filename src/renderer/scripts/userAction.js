import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as swipe from "./swipe.js"
import * as tooltip from "./tooltip.js"
import * as userAction from "./userAction.js"
import * as ui from "./ui.js"
import * as progressBar from "./progressBar.js"
import * as finalize from "./finalize.js"
import * as sort from "./sort.js"

const dirPathElement = document.getElementById("dirPath");
const saved = document.getElementById("dataSaved");
const backButton = document.getElementById("backButton");
const deleteButton = document.getElementById("deleteButton");
const currentItemElement = document.getElementById("currentItem");
const nextButton = document.getElementById("nextButton");
let deleteInProgress = false;

// Select directory and load new files
export async function selectNewDirectory() {
   const dirPath = await window.file.selectDirectory();

   if (!dirPath) {
      alert("Directory selection was canceled.");
      return;
   }

   tooltip.show();

   dirPathElement.innerText = `Current Directory: ${dirPath}`;

   saved.innerText = '';

   ui.setWelcomeVisibility(false);

   let files = await window.file.getFileData(dirPath);

   // Filter out DS_Store
   files = files.filter(file => {
      const fileName = file.name.split("/").pop();
      return fileName !== ".DS_Store";
   });

   fileObject.reset();
   currentIndex.reset();

   // Convert raw data into FileObject instances
   fileObject.setFromFiles(files);

   if (fileObject.isEmpty()) {
      currentItemElement.innerText = "No files found.";
   } else {
      backButton.innerText = "Change Directory"
      sort.restoreSort();
      ui.displayCurrentFile();
   }
}

/// Mark current file for keeping.
export async function markForKeep() {
   if (fileObject.isEmpty()) return;

   fileObject.setStatus(currentIndex.get(), "keep");
   currentIndex.increment();
   await ui.displayCurrentFile();
   await progressBar.update();
   swipe.resetPreviewPosition();
}

/// Mark current file for deletion.
export async function markForDelete() {
   if (deleteInProgress) return;
   deleteInProgress = true;
   if (fileObject.isEmpty()) {
      await window.file.showMessageBox({
         type: "error",
         title: "Error",
         message: "No file(s) to delete."
      });
      deleteInProgress = false;
      return;
   }

   const index = currentIndex.get();

   console.log("Before update:", JSON.stringify(fileObject.get(index)));

   fileObject.setStatus(index, "delete");

   console.log("After update:", JSON.stringify(fileObject.get(index)));

   currentIndex.increment();
   await ui.displayCurrentFile();
   progressBar.update();
   swipe.resetPreviewPosition();
   deleteInProgress = false;
}

// Change Directory Button
backButton.addEventListener("click", async () => {
   await userAction.selectNewDirectory();
});

// Delete button press
deleteButton.addEventListener("click", async () => {
   if (fileObject.isEmpty()) return;

   swipe.animateSwipe("left");
});

// Go through files in directory +1
nextButton.addEventListener("click", async () => {
   if (fileObject.isEmpty()) return;

   swipe.animateSwipe("right");
});

// Handle directory selection from the welcome screen
document.getElementById("selectDirButton").addEventListener("click", async () => {
   await selectNewDirectory();
});

// Arrow key file swiping
document.addEventListener("keydown", async (e) => {
   if (fileObject.isEmpty()) return;
      // Prevent swiping if any dialog is open
      const modalOpen = Array.from(document.querySelectorAll('dialog')).some(dialog => dialog.open);
      if (modalOpen) return;

   if (e.key === "ArrowRight") {
      swipe.animateSwipe("right");
   } else if (e.key === "ArrowLeft") {
      swipe.animateSwipe("left");
   }
});
