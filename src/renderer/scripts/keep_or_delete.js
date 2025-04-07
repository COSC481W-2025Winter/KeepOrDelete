import * as fileObjects from "./fileObjects.js"
import * as ui from "./ui.js"

// Cache DOM references
const dirPath = await window.file.getFilePath();

if (!dirPath) {
   // Hide all UI elements except welcomeScreen
   ui.setWelcomeVisibility(true);
} else {
   // Show main UI and hide welcome screen
   ui.setWelcomeVisibility(false);

   document.getElementById("dirPath").innerText = `Current Directory: ${dirPath}`;

   ui.displayCurrentFile();
}

// Reveal body after all elements are ready only for index.html
if (document.body.classList.contains("keep-or-delete")) {
   document.body.classList.add("show");
}
