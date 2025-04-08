import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as ui from "./ui.js"
import * as llm from "./llm.js"


const renameContainer = document.getElementById("renameContainer");
const renameButton = document.getElementById('renameButton');
const popupContentElement = document.getElementById('AIButton');
const renameModal = document.getElementById("renameModal");
const closeModal = document.getElementById("closeModal");
const confirmRenameButton = document.getElementById("confirmRename");
const finalNotification = document.getElementById('finalizeNotification');
const notification = document.getElementById('notification');
let renameInputElement = document.getElementById('renameInput');

function showNotification(message, type = 'info') {
   // Create a popup div
   const popup = document.createElement('div');
   popup.innerText = message;
   popup.classList.add('popup-notification', type);

   popup.style.position = 'fixed';
   popup.style.top = '20px';
   popup.style.right = '20px';
   popup.style.padding = '10px 20px';
   popup.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
   popup.style.color = '#fff';
   popup.style.borderRadius = '5px';
   popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
   popup.style.zIndex = '99999';
   const dialog = document.querySelector('dialog[open]');
   if (dialog && dialog.open) {
      dialog.appendChild(popup);
      // Remove the popup after 3 seconds
      setTimeout(() => {
         dialog.removeChild(popup);
      }, 3000);
   } else {
      document.body.appendChild(popup);
      // Remove the popup after 3 seconds
      setTimeout(() => {
         document.body.removeChild(popup);
      }, 3000);
   }


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

export async function handleRename(optionalInputElement, optionalFile) {
   const inputElement = optionalInputElement || renameInputElement;
   const newName = inputElement.value.trim();

   if (!newName) {
      showNotification('Please enter a new file name.', 'error');
      if (!optionalInputElement) resetRenameInput(renameContainer);
      return;
   }

   // Check for illegal characters and warn the user
   if (containsIllegalCharacters(newName)) {
      showNotification('⚠️ File name contains illegal characters.', 'error');
      if (!optionalInputElement) resetRenameInput(renameContainer);
      return;  // Prevent further action if invalid
   }

   const currentFile = optionalFile || fileObject.get(currentIndex.get());
   const currentFilePath = currentFile.path;
   // Ensure the new name has the correct file extension
   const originalExtension = currentFilePath.substring(currentFilePath.lastIndexOf('.'));
   const finalName = newName.includes('.') ? newName : `${newName}${originalExtension}`;
   const currentFileName = window.file.pathBasename(currentFilePath);
   if (finalName === currentFileName) {
      return;
   }
   const directoryPath = window.file.pathDirname(currentFilePath);
   const newFilePath = window.file.pathJoin(directoryPath, finalName);

   try {
      // Step 1: Get all file paths in the directory
      const allFilePaths = await window.file.getFilesInDirectory();

      // Step 2: Extract file names using path.basename
      const allFileNames = allFilePaths.map(filePath => window.file.pathBasename(filePath));

      // Step 3: Check if the new name already exists (excluding the current file)
      if (allFileNames.includes(finalName) && currentFilePath !== newFilePath) {
         showNotification(`A file named "${finalName}" already exists.`, 'error');
         if (!optionalInputElement) resetRenameInput(renameContainer);
         return;  // **This return ensures we don't continue to the renaming operation**
      }

      console.log('Renaming:', currentFile, 'to', newFilePath);

      // Step 4: Perform the rename
      const response = await window.file.renameFile(currentFilePath, newFilePath);
      if (response.success) {
         if (!optionalInputElement) renameModal.close();
         showNotification(`File renamed successfully to ${finalName}`, 'success');
         currentFile.name = window.file.pathBasename(newFilePath);
         currentFile.path = newFilePath;
         ui.displayCurrentFile();
         if (!optionalInputElement) resetRenameInput(renameContainer);
      } else {
         showNotification(response.message || 'Failed to rename the file.', 'error');
         if (!optionalInputElement) resetRenameInput(renameContainer);
      }
   } catch (error) {
      console.error('Error renaming file:', error);
      showNotification(`An error occurred: ${error.message}`, 'error');
      if (!optionalInputElement) resetRenameInput(renameContainer);
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

renameButton.addEventListener('click', async (_event) => {
   if (fileObject.isEmpty()) return;

   renameModal.showModal();

   const filename = fileObject.get(currentIndex.get()).name;
   // If file is an image, show time left automatically
   const mimeType = window.file.getMimeType(filename);
   if (mimeType.startsWith("image/")) {
      if (LimitDisplay()) {
         const loggedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);
         const timeLeft = window.file.convertMillisecondsToTimeLeft(14400000 - (Date.now() - loggedTime));
         popupContentElement.textContent = timeLeft.hours + "h " + timeLeft.minutes + "m " + timeLeft.seconds + "s" + " left until I can suggest a name for images.";
      }
      else {
         popupContentElement.innerText = "AI Suggested Name"
      }
   }
   else {
      popupContentElement.innerText = "AI Suggested Name"
   }
});

function LimitDisplay() {

   const currentTime = Date.now();
   // Get the image limit and logged time from local storage
   let imageLimit = parseInt(localStorage.getItem("imageLimit") || "0", 10);
   let loggedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);

   // Check if the limit has been reached
   if ((currentTime - loggedTime) <= 14400000 && imageLimit >= 2) {
      return true;
   }
   return false;
}

closeModal.addEventListener("click", () => {
   renameModal.close();
   resetRenameInput(renameContainer);
});

confirmRenameButton.addEventListener('click', async (event) => {
   if (fileObject.isEmpty()) return;
   event.preventDefault();
   event.stopPropagation();
   await handleRename();
});

popupContentElement.addEventListener("click", () => {
   if (fileObject.isEmpty()) return;
   llm.LLM();
})

// Add event listener for Enter key
renameInputElement.addEventListener('keypress', async (event) => {
   if (fileObject.isEmpty()) return;

   if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      await handleRename();
   }
});
