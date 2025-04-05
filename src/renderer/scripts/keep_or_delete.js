import * as fileObjects from "./fileObjects.js"
import * as progressBar from "./progressBar.js"
import * as ui from "./ui.js"

// Cache DOM references
const dirPath = await window.file.getFilePath();

if (!dirPath) {
   // Hide all UI elements except welcomeScreen
   ui.toggleUIElements(false);
} else {
   // Show main UI and hide welcome screen
   ui.toggleUIElements(true);

   document.getElementById("dirPath").innerText = `Selected Directory: \n${dirPath}`;

   if (!fileObjects.isEmpty()) {
      ui.displayCurrentFile();
   } else {
      progressBar.update();
      document.getElementById("currentItem").innerText = "No files found.";
   }
}

// Reveal body after all elements are ready only for keep_or_delete.html
if (document.body.classList.contains("keep-or-delete")) {
   document.body.classList.add("show");
}
