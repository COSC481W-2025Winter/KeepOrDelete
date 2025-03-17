// Ensure filepath is displayed correctly on load
(async () => {
    const filePath = await window.file.getFilePath(); // Wait for the value
    document.getElementById("filepath").innerText = filePath || "No directory selected";
 })();
 
 const report = function (string) {
    const timestamp = window.file.getTimeStamp().substring(0, 8);
    document.getElementById("report").innerHTML = `${timestamp} : ${string}`;
 };
 
 // Backend functionality for main menu
 document.getElementById("SelectButton").addEventListener("click", async () => {
    try {
        const dirPath = await window.file.selectDirectory();
        localStorage.clear();
        if (dirPath) {
            window.file.setFilePath(dirPath);
            document.getElementById("filepath").innerText = dirPath;
        } else {
            console.log("Directory selection was canceled.");
        }
    } catch (error) {
        console.error("Error selecting directory:", error);
    }
 });
 
 // Checks to make sure path has been selected
 document.getElementById("goButton").addEventListener("click", () => {
    const currentDir = document.getElementById("filepath").innerText.trim();
    if (!currentDir || currentDir === "No directory selected") {
        alert("Please select a directory first.");
        return;
    }
    // Navigate to the keep or delete page
    window.location.href = "./breadNbutter/keep_or_delete.html";
 });
 
 // Event listener for the "Settings" button
document.getElementById("settings").addEventListener("click", () => {
    window.location.href = "./settings.html";
  });