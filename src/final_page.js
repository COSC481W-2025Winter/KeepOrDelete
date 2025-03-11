window.onload = async function () {
    const keptFilesList = document.getElementById("keptFilesList");
    const deletedFilesList = document.getElementById("deletedFilesList");
    const keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || [];
    const deletedFiles = JSON.parse(localStorage.getItem("deletedFiles")) || [];

    if (keptFiles.length === 0) {
        keptFilesList.innerHTML = "<p>No kept files.</p>";
    } else {
        keptFiles.forEach(file => {
            //this block ensures we dont get duplicates and we only display files, if they don't exist in the other array
            let filecheck = false;
            for (let i = 0; i < deletedFiles.length; i++) { //since deletedFiles IS correct, we base our keptFiles off them not existing in deleted
                if (deletedFiles[i] === file) {
                    filecheck = true;
                }
            }
            //only display if file doesn't exist in both arrays
            if (!filecheck) {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    ${file} 
                    <input type="text" placeholder="Rename file" data-oldname="${file}">
                    <button class="renameBtn">Rename</button>
                `;
                keptFilesList.appendChild(listItem);
            }
            //filecheck = false;
        });
    }

    if (deletedFiles.length === 0) {
        deletedFilesList.innerHTML = "<p>No deleted files.</p>";
    } else {
        deletedFiles.forEach(file => {
            let filecheck = false;
            for (let i = 0; i < keptFiles.length; i++) {
                if (keptFiles[i] === file) {
                    filecheck = true;
                }
            }
            //only display files that dont exist in both arrays
            if (!filecheck) {
                const listItem = document.createElement("li");
                listItem.innerText = file;
                const deleteButton = document.createElement("button");
                deleteButton.innerText = "Undo";
                deleteButton.id = "deleteUndo";
                deleteButton.dataset.file = file;
                listItem.appendChild(deleteButton); // Attach button to the list item
                deletedFilesList.appendChild(listItem);
                deleteButton.addEventListener("click", async () => {
                    const filePath = deleteButton.dataset.file; //get file in dataset
                    keptFiles.push(filePath); //push to array and localstorage
                    localStorage.setItem("keptFiles", JSON.stringify(keptFiles));
                    const index = deletedFiles.indexOf(filePath);
                    if (index > -1) { //remove from deletedfiles
                        deletedFiles.splice(index, 1);
                        localStorage.setItem("deletedFiles", JSON.stringify(deletedFiles));
                    }
                    listItem.remove();//remove from li's
                    const newListItem = document.createElement("li"); //create new li in kept files part
                    newListItem.innerHTML = `
                    ${filePath} 
                    <input type="text" placeholder="Rename file" data-oldname="${filePath}">
                    <button class="renameBtn">Rename</button>
                `;
                    keptFilesList.appendChild(newListItem);
                    //console.log(keptFiles[keptFiles.length - 1]); debugging, checks that it got added to array
                });
            }

        });
    }

    /*
    document.querySelectorAll(".renameBtn").forEach(button => {
        button.addEventListener("click", async () => {
            const inputField = button.previousElementSibling;
            const oldName = inputField.getAttribute("data-oldname");
            const newName = inputField.value.trim();

            if (newName) {
                const response = await window.file.renameFile(oldName, newName);
                if (response.success) {
                    alert(`Renamed to ${newName}`);
                } else {
                    alert("Rename failed.");
                }
            } else {
                alert("Invalid name.");
            }
        });
    });
    */

    document.getElementById("finalizeButton").addEventListener("click", async () => {
        //iterate through deleted files array and send to trash
        for (let i = 0; i < deletedFiles.length; i++) {
            const result = await window.file.deleteFile(deletedFiles[i]);
            if (!result.success) {
                await window.file.showMessageBox({
                    type: "error",
                    title: "Error deleting file",
                    message: result.message
                });
                console.log(`error deleting "${deletedFiles[i]}"`);
                break;
            }
        }
        localStorage.clear(); //clears stored session data
        window.file.quitApp(); //calls the function to quit the app
    });

};

