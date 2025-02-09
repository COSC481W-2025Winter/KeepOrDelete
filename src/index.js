const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { promises: fsPromises } = require('fs');

let selectedFilePath = ""; // Ensure this updates dynamically

const createWindow = () => {
   const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         preload: path.join(__dirname, "preload.js"),
         sandbox: false
      }
   });

   mainWindow.loadFile("src/main_menu.html");
};

// Handle file path retrieval and updates
ipcMain.handle('getFilePath', () => selectedFilePath);
ipcMain.on('setFilePath', (event, filePath) => {
   selectedFilePath = filePath; // Ensure it updates
});

ipcMain.handle('selectDirectory', async () => {
   const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
   });

   if (!result.canceled && result.filePaths.length > 0) {
      selectedFilePath = result.filePaths[0]; // Update dynamically
      return selectedFilePath;
   }
   return null; // Ensure null is returned if canceled
});


ipcMain.handle("getFilesInDirectory", async () => {
   if (!selectedFilePath) return []; // Return an empty array if no directory is selected

   try {
      const files = fs.readdirSync(selectedFilePath);
      return files.map(file => path.join(selectedFilePath, file)); // Return full file paths
   } catch (error) {
      console.error("Error reading directory:", error);
      return [];
   }
});

ipcMain.handle('renameFile', async (event, { oldPath, newPath }) => {
   console.log(`Renaming: ${oldPath} -> ${newPath}`);  // Debugging

   if (!oldPath || !newPath) {
       console.error('Invalid paths:', { oldPath, newPath });
       return { success: false, message: 'Invalid file paths provided.' };
   }

   try {
       await fsPromises.rename(oldPath, newPath);  // Correctly use fs.promises.rename
       return { success: true };
   } catch (error) {
       console.error('Error renaming file:', error);
       return { success: false, message: error.message };
   }
});


app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
   if (process.platform !== "darwin") app.quit();
});
