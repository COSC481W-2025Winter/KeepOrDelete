const settingsButton = document.getElementById("settingsButton");
const settingsModal = document.getElementById("settingsModal");
const backButtonSettings = document.getElementById("backButtonSettings");

settingsButton.addEventListener("click", () => {
   settingsModal.showModal();
});

// Back button functionality
backButtonSettings.addEventListener("click", async () => {

   if (fileObjects.length === 0) {
      localStorage.setItem("returnFromSettings", "true"); // Trigger welcome screen
   }
   removedFileTypes = await window.file.getRemovedFileTypes();
   currentIndex = 0;
   displayCurrentFile();
   updateProgress();
   console.log(removedFileTypes)
   settingsModal.close();
});
