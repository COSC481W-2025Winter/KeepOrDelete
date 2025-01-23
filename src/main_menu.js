const report = function(string) {
   const timestamp = window.file.getTimeStamp().substring(0, 8);
   document.getElementById("report").innerHTML = `${timestamp} : ${string}`
}

// Backend functionality for main menu.
document.getElementById("createButton").onclick = function() {
   window.file.createFile();
   report("File created.");
}

document.getElementById("removeButton").onclick = function() {
   window.file.removeFile();
   report("File removed.");
}

document.getElementById("viewButton").onclick = function() {
   window.location.href = "./view_file.html";
}
