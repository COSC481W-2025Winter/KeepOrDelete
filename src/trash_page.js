window.onload = async function () {
    const keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || []; //getting the sub arrays for files
    const deletedFiles = JSON.parse(localStorage.getItem("deletedFiles")) || [];
    const deletedFilesList = document.getElementById("deletedFilesList"); //container for deleted files

    if (deletedFiles.length === 0) {
        deletedFilesList.innerHTML = "<p>No deleted files.</p>";
    } else {
        deletedFiles.forEach(file => {
            //creating li's to show file path, and undo button
            const fileName = window.file.pathBasename(file);
            const listItem = document.createElement("li");
            listItem.innerText = fileName;
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Move to keep";
            deleteButton.classList.add("deleteUndo");
            deleteButton.dataset.file = file;
            listItem.appendChild(deleteButton);
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

                const noKeptFilesMsg = document.querySelector("#keptFilesList p");
                if (noKeptFilesMsg && noKeptFilesMsg.innerText === "No kept files.") {
                    noKeptFilesMsg.remove();
                }

                // Add file back to kept files list
                const fileName = window.file.pathBasename(filePath);
                const renameInput = document.createElement("input");
                renameInput.type = "text";
                renameInput.value = fileName; // Display full name, including extension
                renameInput.classList.add("rename-input");
                renameInput.dataset.oldname = filePath;

                const newListItem = document.createElement("li");
                newListItem.appendChild(renameInput);
                keptFilesList.appendChild(newListItem); // Append to kept list

                if (deletedFiles.length === 0) {
                    deletedFilesList.innerHTML = "<p>No deleted files.</p>";
                }
                console.log(keptFiles[keptFiles.length - 1]); //debugging, checks that it got added to array
            });
        });
    }
    document.getElementById("navMainMenu").onclick = function () {
        console.log(localStorage.getItem("deletedFiles"));
        window.location.href = "./breadNbutter/keep_or_delete.html"
    }
};
