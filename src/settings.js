import * as fileObject from "./fileObjects.js"

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
   currentIndex = 0;
   displayCurrentFile();
   updateProgress();
   console.log(removedFileTypes)
   settingsModal.close();
});
