window.onload = async function () {
    const keptFilesList = document.getElementById("keptFilesList");
    const deletedFilesList = document.getElementById("deletedFilesList");

    const keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || [];
    const deletedFiles = JSON.parse(localStorage.getItem("deletedFiles")) || [];

    if (keptFiles.length === 0) {
        keptFilesList.innerHTML = "<p>No kept files.</p>";
    } else {
        keptFiles.forEach(file => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                ${file} 
                <input type="text" placeholder="Rename file" data-oldname="${file}">
                <button class="renameBtn">Rename</button>
            `;
            keptFilesList.appendChild(listItem);
        });
    }

    if (deletedFiles.length === 0) {
        deletedFilesList.innerHTML = "<p>No deleted files.</p>";
    } else {
        deletedFiles.forEach(file => {
            const listItem = document.createElement("li");
            listItem.innerText = file;
            deletedFilesList.appendChild(listItem);
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
        localStorage.clear(); //clears stored session data
        window.file.quitApp(); //calls the function to quit the app
    });
    
};

