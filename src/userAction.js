import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as swipe from "./swipe.js"
import * as tooltip from "./tooltip.js"
import * as userAction from "./userAction.js"
import * as ui from "./ui.js"

const dirPathElement = document.getElementById("dirPath");
const saved = document.getElementById("dataSaved");
const backButton = document.getElementById("backButton");
const deleteButton = document.getElementById("deleteButton");
const currentItemElement = document.getElementById("currentItem");
const nextButton = document.getElementById("nextButton");

// Select directory and load new files
export async function selectNewDirectory() {
   const dirPath = await window.file.selectDirectory();
   if (!dirPath) {
      alert("Directory selection was canceled.");
      return;
   }
   tooltip.show();
   dirPathElement.innerText = `Selected Directory: \n${dirPath}`;
   saved.innerText = '';
   ui.toggleUIElements(true);
   let files = await window.file.getFileData(dirPath);
   // Filter out DS_Store
   files = files.filter(file => {
      const fileName = file.name.split("/").pop();
      return fileName !== ".DS_Store";
   });

   // Convert raw data into FileObject instances
   fileObject.setFromFiles(files);
   currentIndex.reset();

   if (!fileObject.isEmpty()) {
      backButton.innerText = "Change Directory"
      swipe.displayCurrentFile();
   } else {
      currentItemElement.innerText = "No files found.";
   }
}

// Change Directory Button
backButton.addEventListener("click", async () => {
   await userAction.selectNewDirectory();
});

// Delete button press
deleteButton.addEventListener("click", async () => {
   if (fileObject.isEmpty()) return;

   await swipe.markForDeletion();

   swipe.animateSwipe("left");
});

// Go through files in directory +1
nextButton.addEventListener("click", async () => {
   if (fileObject.isEmpty()) return;

   swipe.animateSwipe("right");
});
