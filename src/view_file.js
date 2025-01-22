window.onload = function() {
   const setText = function(string) {
      const timestamp = window.file.getTimeStamp().substring(0, 8);
      document.getElementById("contents").innerHTML = `${timestamp} : ${string}`
   }

   if (!window.file.fileExists()) {
      setText(`File does not exist.`)
      return;
   }

   const contents = window.file.getFileContents();

   const fileContents = window.file.getFileContents();

   setText(`File exists. Displaying contents:<br><br><code>${fileContents}</code>`)
}

document.getElementById("navMainMenu").onclick = function() {
   window.location.href = "./main_menu.html"
}
