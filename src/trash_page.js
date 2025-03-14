window.onload = async function () {
    const keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || []; //getting the sub arrays for files
    const deletedFiles = JSON.parse(localStorage.getItem("deletedFiles")) || [];
    const deletedFilesList = document.getElementById("deletedFilesList"); //container for deleted files

    if (deletedFiles.length === 0) {
        deletedFilesList.innerHTML = "<p>No deleted files.</p>";
    } else {
        deletedFiles.forEach(file => {
            //creating li's to show file path, and undo button

            const listItem = document.createElement("li");
            listItem.innerText = file;
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Keep";
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
                const newListItem = document.createElement("li"); //create new li in kept files part
                newListItem.innerHTML = `
                    ${filePath} 
                    <input type="text" placeholder="Rename file" data-oldname="${filePath}">
                    <button class="renameBtn">Rename</button>
                `;
                //keptFilesList.appendChild(newListItem);
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
