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
       window.file.setFilePath(dirPath);

       // Update the UI with the selected absolute directory path
       document.getElementById("filepath").textContent = ` ${window.file.getFilePath()}`;
   } catch (error) {
       console.error("Directory selection cancelled or failed:", error);
   }
});


