import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as swipe from "./swipe.js"
import * as tooltip from "./tooltip.js"
import * as userAction from "./userAction.js"
import * as ui from "./ui.js"
import * as progress from "./progress.js"

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
      ui.displayCurrentFile();
   } else {
      currentItemElement.innerText = "No files found.";
   }
}

/// Mark current file for keeping.
export async function markForKeep() {
   if (fileObject.isEmpty()) return;

   fileObject.setStatus(currentIndex.get(), "keep");
   currentIndex.increment();
   await ui.displayCurrentFile();
   await progress.updateProgress();
   swipe.resetPreviewPosition();
}

/// Mark current file for deletion.
export async function markForDelete() {
   if (fileObject.isEmpty()) {
      await window.file.showMessageBox({
         type: "error",
         title: "Error",
         message: "No file(s) to delete."
      });
      return;
   }

   const index = currentIndex.get();

   console.log("Before update:", JSON.stringify(fileObject.get(index)));

   fileObject.setStatus(index, "delete");

   console.log("After update:", JSON.stringify(fileObject.get(index)));

   currentIndex.increment();
   await ui.displayCurrentFile();
   progress.updateProgress();
   swipe.resetPreviewPosition();
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

   if (e.key === "ArrowRight") {
      swipe.animateSwipe("right");
   } else if (e.key === "ArrowLeft") {
      swipe.animateSwipe("left");
   }
});
