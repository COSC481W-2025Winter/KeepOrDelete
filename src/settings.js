import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as swipe from "./swipe.js"
import * as progress from "./progress.js"

const settingsButton = document.getElementById("settingsButton");
const settingsModal = document.getElementById("settingsModal");
const backButtonSettings = document.getElementById("backButtonSettings");

export async function removedFileTypes() {
   return await window.file.getRemovedFileTypes();
}

settingsButton.addEventListener("click", () => {
   settingsModal.showModal();
});

// Back button functionality
backButtonSettings.addEventListener("click", async () => {

   if (fileObject.isEmpty()) {
      localStorage.setItem("returnFromSettings", "true"); // Trigger welcome screen
   }
   const removedFileTypes = await window.file.getRemovedFileTypes();
   currentIndex.reset();
   swipe.displayCurrentFile();
   progress.updateProgress();
   console.log(removedFileTypes)
   settingsModal.close();
});
