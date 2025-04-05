import * as fileObject from "../fileObjects.js"
import * as swipe from "../swipe.js"
import * as progress from "../progress.js"
import * as ui from "../ui.js"

window.onload = async function() {
   // Cache DOM references
   const dirPath = await window.file.getFilePath();

   if (!dirPath) {
      // Hide all UI elements except welcomeScreen
      ui.toggleUIElements(false);
   } else {
      // Show main UI and hide welcome screen
      ui.toggleUIElements(true);
      document.getElementById("dirPath").innerText = `Selected Directory: \n${dirPath}`;
      if (!fileObject.isEmpty()) {
         swipe.displayCurrentFile();
      } else {
         progress.updateProgress();
         document.getElementById("currentItem").innerText = "No files found.";
      }
   }

   // Reveal body after all elements are ready only for keep_or_delete.html
   if (document.body.classList.contains("keep-or-delete")) {
      document.body.classList.add("show");
   }
};
