// keep_or_delete.js

window.onload = function() {
    // Retrieve the directory path from the session stroage.
    const dirPath = sessionStorage.getItem("SelectedDir");
 
    // Display the selected directory path.
    document.getElementById("dirPath").innerText = `Selected Directory: ${dirPath}`;
 
    // Optionally, you could add code here to dynamically load an icon, style it, or perform other operations.
    
    // Event listener for the "Back" button to return to the main menu.
    document.getElementById("backButton").addEventListener("click", () => {
       window.location.href = "../main_menu.html";
    });
 }
 