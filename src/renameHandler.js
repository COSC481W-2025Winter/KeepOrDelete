async function renameFileHandler(newName, currentFilePath, windowFile, showNotification) {
    if (!newName) {
        showNotification('Please enter a new file name.', 'error');
        return 'error';
    }

    const directoryPath = windowFile.pathDirname(currentFilePath);
    //const allFiles = await windowFile.getFilesInDirectory();
    const originalExtension = currentFilePath.substring(currentFilePath.lastIndexOf('.'));
    const finalName = newName.includes('.') ? newName : `${newName}${originalExtension}`;

    const newFilePath = windowFile.pathJoin(directoryPath, finalName);

    const allFilePaths = await windowFile.getFilesInDirectory();
    const allFileNames = allFilePaths.map(filePath => windowFile.pathBasename(filePath));

    //check for duplicate files and return 'error' if found
    if (allFileNames.includes(finalName)) {
        showNotification(`A file named "${finalName}" already exists. Please choose a different name.`, 'error');
        return 'error';
    }

    try {
        console.log(`Renaming file from ${currentFilePath} to ${newFilePath}`); //log renaming attempt
        await windowFile.renameFile(currentFilePath, newFilePath);
        showNotification(`File renamed successfully to ${finalName}`, 'success');
        return newFilePath; //return new file path for update
    } catch (error) {
        console.error(`Rename failed with error: ${error.message}`); //log error
        showNotification(`Failed to rename file: ${error.message}`, 'error');
        return 'error';
    }
}

function resetRenameInput(container) {
    container.innerHTML = '';  //clear the old input field

    const newRenameInput = document.createElement('input');
    newRenameInput.type = 'text';
    newRenameInput.id = 'renameInput';
    newRenameInput.placeholder = 'Enter new file name';

    container.appendChild(newRenameInput);

    setTimeout(() => {
        newRenameInput.focus();  //focus input immediately
    }, 100);
}

module.exports = { renameFileHandler, resetRenameInput };
