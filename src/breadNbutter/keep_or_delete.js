window.onload = async function () {
    let files = [];
    let currentIndex = 0;

    try {
        // Fetch the selected directory path
        const dirPath = await window.file.getFilePath();

        document.getElementById("dirPath").innerText =
            dirPath ? `Selected Directory: \n${dirPath}` : "No directory selected";

        if (dirPath) {
            // Fetch files in the directory
            files = await window.file.getFilesInDirectory();
        }

        if (files.length > 0) {
            displayFile(files[currentIndex]);
        } else {
            document.getElementById("currentItem").innerText = "No files found.";
        }

    } catch (error) {
        console.error("Failed to fetch directory path or files:", error);
    }

    // Change Directory Button
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "../main_menu.html";
    });

    // Go through files in directory +1
    document.getElementById("nextButton").addEventListener("click", () => {
        if (files.length > 0) {
            if(currentIndex < files.length - 1){
                currentIndex = (currentIndex + 1);
                displayFile(files[currentIndex]);
            }
            else {
                alert("No more files in selected Directory")
            }
        }
    });
    // Go through files in directory - 1
    document.getElementById("prevButton").addEventListener("click", () => {
        if (files.length > 0) {
            if(currentIndex > 0) {
                currentIndex = (currentIndex - 1);
                displayFile(files[currentIndex]);
            }
            else {
                alert("No previous files selected Directory")
            }
        }
        
    });

    function displayFile(filename) {
        document.getElementById("currentItem").innerText = `Current File: \n${filename}`;
        refreshPreview(filename)
    }

   function refreshPreview(filename) {
      var container = document.getElementById("previewContainer");

      // Parse incoming file's extension, excluding the dot.
      const extension = filename.split('.').pop();

      if (extension == "txt") {
         const fileContents = window.file.getFileContents(filename);
         container.innerHTML = `<div class="txtPreview"><p>${fileContents}</p></div>`;
      } else {
         container.innerHTML = `<div class="unsupportedPreview"><p>No preview available for this filetype.</p></div>`;
      }
   }     
};
