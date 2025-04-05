import * as fileObject from "../fileObjects.js"
import * as swipe from "../swipe.js"
import * as progress from "../progress.js"
import * as ui from "../ui.js"
import * as llm from "../llm.js"

window.onload = async function() {
   // Cache DOM references
   const inspectButton = document.getElementById("inspectButton");
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

   inspectButton.addEventListener("click", () => {
      const iframe = document.querySelector("#previewContainer iframe");
      const textPreview = document.querySelector("#previewContainer pre");
      // Toggle inspect mode state
      swipe.toggleInspectMode();

      const inspectMode = swipe.getInspectMode();

      if (iframe) {
         // Toggle pointer-events for PDF(allows pdf interaction)
         iframe.style.pointerEvents = inspectMode ? "auto" : "none";
      }

      if (textPreview) {
         // Toggle user-select for text files (allows highlighting)
         textPreview.style.userSelect = inspectMode ? "text" : "none";
      }

      // Update button text
      inspectButton.innerText = inspectMode ? "Exit Inspect" : "Inspect Document";
   });

   // Reveal body after all elements are ready only for keep_or_delete.html
   if (document.body.classList.contains("keep-or-delete")) {
      document.body.classList.add("show");
   }
};
