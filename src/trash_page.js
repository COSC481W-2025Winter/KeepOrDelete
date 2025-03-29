window.onload = async function () {
    const fileObjects = JSON.parse(localStorage.getItem("fileObjects")) || [];
    const deletedFiles = fileObjects.filter(f => f.status === "delete");

    const deletedFilesList = document.getElementById("deletedFilesList"); //container for deleted files

    if (deletedFiles.length === 0) {
        deletedFilesList.innerHTML = "<p>No deleted files.</p>";
    } else {
        deletedFiles.forEach(file => {
            //creating li's to show file path, and undo button
            const fileName = file.name;
            const listItem = document.createElement("li");
            listItem.innerText = fileName;
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Move to keep";
            deleteButton.classList.add("deleteUndo");
            deleteButton.dataset.file = file.path;
            listItem.appendChild(deleteButton);
            deletedFilesList.appendChild(listItem);
            deleteButton.addEventListener("click", async () => {
                const filePath = deleteButton.dataset.file; //get file in dataset
                const targetFile = fileObjects.find(f => f.path === filePath);
                targetFile.status = "keep";
                localStorage.setItem("fileObjects", JSON.stringify(fileObjects));
                listItem.remove();//remove from li's

                if (deletedFiles.length === 0) {
                    deletedFilesList.innerHTML = "<p>No deleted files.</p>";
                }
            });
        });
    }
    document.getElementById("navMainMenu").onclick = function () {
        console.log(localStorage.getItem("deletedFiles"));
        window.location.href = "./main_page/keep_or_delete.html"
    }
};
