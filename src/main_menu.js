document.getElementById("filepath").innerText = window.file.getFilePath();

const report = function(string) {
   const timestamp = window.file.getTimeStamp().substring(0, 8);
   document.getElementById("report").innerHTML = `${timestamp} : ${string}`
}

// Backend functionality for main menu.


document.getElementById("SelectButton").addEventListener("click", async () => {
   try {
       // Open the directory picker
       const dirHandle = await window.showDirectoryPicker();
       const dirPath = dirHandle.kind === "directory" ? dirHandle.name : dirHandle;
       //Selected path
       window.file.setFilePath(dirPath);

       /*Saving selected path to session storage to use across all pages. 
       window.file.setFilePath(dirPath); is being re-witten in the preload page with
       let filePath = path.join(os.tmpdir(), "electronfile"); when ever user navigates to another page
       Chat GPT provided a fix using Electron's IPC. Needs to be discussed with team before implementation.
       I'd be making some changes to the preload and index file.
       */
      sessionStorage.setItem("SelectedDir", dirPath);

       

       // Update the UI with the selected absolute directory path
       document.getElementById("filepath").textContent = ` ${window.file.getFilePath()}`;
   } catch (error) {
       console.error("Directory selection cancelled or failed:", error);
   }
});

// Checks to make sure path has been selected. 
document.getElementById("goButton").addEventListener("click", () => {
    const currentDir = sessionStorage.getItem("SelectedDir");
    if (!currentDir || currentDir.trim() === "") {
       alert("Please select a directory first.");
       return;
    }
    // Navigate to the keep or delete page.
    window.location.href = "./breadNbutter/keep_or_delete.html";
 });


