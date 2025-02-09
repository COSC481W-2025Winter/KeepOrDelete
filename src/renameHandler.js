async function renameFileHandler(newName, directoryPath, windowFile, showNotification) {
    if (!newName) {
        showNotification('Please enter a new file name.', 'error');
        return 'error';
    }

    const allFiles = await windowFile.getFilesInDirectory();
    const finalName = newName.includes('.') ? newName : `${newName}.txt`;

    if (allFiles.includes(finalName)) {
        showNotification(`A file named "${finalName}" already exists. Please choose a different name.`, 'error');
        return 'error';
    }

    const newFilePath = windowFile.pathJoin(directoryPath, finalName);
    await windowFile.renameFile('mockCurrentFile.txt', newFilePath);
    showNotification(`File renamed successfully to ${finalName}`, 'success');
    return 'success';
}

module.exports = { renameFileHandler };
