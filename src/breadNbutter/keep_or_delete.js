// keep_or_delete.js

window.onload = async function () {
   try {
       // Fetch the directory path from Electron's main process
       const dirPath = await window.file.getFilePath();

       // Ensure a valid directory path is displayed
       document.getElementById("dirPath").innerText = 
           dirPath ? `Selected Directory: ${dirPath}` : "No directory selected";

   } catch (error) {
       console.error("Failed to fetch directory path:", error);
   }

   // Event listener for the "Back" button to return to the main menu.
   document.getElementById("backButton").addEventListener("click", () => {
       window.location.href = "../main_menu.html";
   });
};

 