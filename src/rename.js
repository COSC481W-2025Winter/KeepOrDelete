import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"

let renameInputElement = document.getElementById('renameInput');

function showNotification(message) {
   const notification = document.getElementById('finalizeNotification');
   notification.innerText = message;
   notification.style.display = 'block';

   // Hide the message after 3 seconds
   setTimeout(() => {
      notification.style.display = 'none';
   }, 3000);
}

async function renameOnEnter(event) {
   if (event.key === "Enter") {
      event.preventDefault();
      const newName = renameInputElement.value.trim();

      if (!newName) {
         showNotification('Please enter a new file name.', 'error');
         return;
      }

      if (containsIllegalCharacters(newName)) {
         showNotification('⚠️ File name contains illegal characters.', 'error');
         return;
      }

      await handleRename();
   }
}

export async function handleRename() {
   const newName = renameInputElement.value.trim();
   let currentFile = fileObject.get(currentIndex.get()).path;

   if (!newName) {
      showNotification('Please enter a new file name.', 'error');
      resetRenameInput(renameContainer);
      return;
   }

   // Check for illegal characters and warn the user
   if (containsIllegalCharacters(newName)) {
      showNotification('⚠️ File name contains illegal characters.', 'error');
      resetRenameInput(renameContainer);
      return;  // Prevent further action if invalid
   }

   // Ensure the new name has the correct file extension
   const originalExtension = currentFile.substring(currentFile.lastIndexOf('.'));
   const finalName = newName.includes('.') ? newName : `${newName}${originalExtension}`;

   const directoryPath = window.file.pathDirname(currentFile);
   const newFilePath = window.file.pathJoin(directoryPath, finalName);

   try {
      // Step 1: Get all file paths in the directory
      const allFilePaths = await window.file.getFilesInDirectory();

      // Step 2: Extract file names using path.basename
      const allFileNames = allFilePaths.map(filePath => window.file.pathBasename(filePath));

      // Step 3: Check if the new name already exists (excluding the current file)
      if (allFileNames.includes(finalName) && currentFile !== newFilePath) {
         showNotification(`A file named "${finalName}" already exists.`, 'error');
         resetRenameInput(renameContainer);
         return;  // **This return ensures we don't continue to the renaming operation**
      }

      console.log('Renaming:', currentFile, 'to', newFilePath);

      // Step 4: Perform the rename
      const response = await window.file.renameFile(currentFile, newFilePath);
      if (response.success) {
         renameModal.close();
         showNotification(`File renamed successfully to ${finalName}`, 'success');
         fileObject.get(currentIndex.get()).name = window.file.pathBasename(newFilePath);
         fileObject.get(currentIndex.get()).path = newFilePath;
         swipe.displayCurrentFile();
         resetRenameInput(renameContainer);
      } else {
         showNotification(response.message || 'Failed to rename the file.', 'error');
         resetRenameInput(renameContainer);
      }
   } catch (error) {
      console.error('Error renaming file:', error);
      showNotification(`An error occurred: ${error.message}`, 'error');
      resetRenameInput(renameContainer);
   }
}

export function containsIllegalCharacters(name) {
   const illegalWindows = /[/\\:*?"<>|]/;
   const illegalMacLinux = /\//;
   const illegalMac = /:/;

   const platform = window.file.platform; // Get platform from preload.js

   const isWindows = platform === 'win32';
   const isMac = platform === 'darwin';

   if (isWindows && illegalWindows.test(name)) return true;
   if (isMac && (illegalMacLinux.test(name) || illegalMac.test(name))) return true;
   if (!isWindows && !isMac && illegalMacLinux.test(name)) return true;

   return false;
}

export function resetRenameInput(container) {
   container.innerHTML = '';  // Clear the old input field

   renameInputElement = document.createElement('input');
   renameInputElement.type = 'text';
   renameInputElement.id = 'renameInput';
   renameInputElement.placeholder = 'Enter new file name';

   container.appendChild(renameInputElement);

   // Add event listener
   renameInputElement.addEventListener("keypress", renameOnEnter);

   // Temporary blur to prevent highlighting the input immediately
   setTimeout(() => {
      renameInputElement.blur();  // Remove highlight after creation
   }, 100);
}
