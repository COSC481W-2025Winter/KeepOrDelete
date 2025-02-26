const dotenv = require('dotenv');
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { promises: fsPromises } = require('fs');
const OpenAI = require("openai");

let selectedFilePath = ""; // Ensure this updates dynamically
let mainWindow;

const createWindow = () => {
   mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         preload: path.join(__dirname, "preload.js"),
         sandbox: false,
         nodeIntegration: false, 
         contextIsolation: true,
         enableRemoteModule: false,
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

ipcMain.handle("delete-file", async (event, filePath) => { //filePath gets sent over from preload
   try {
      await fs.promises.rm(filePath, { force: true }); //fs.promises.rm(), this currently will remove 
      // directories as well as files, do we want this? if not we can change it to fs.unlink(), which
      //only does files
      return { success: true, message: "File deleted successfully" }; //success is built in boolean feedback
   } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, message: error.message };
   }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
   if (process.platform !== "darwin") app.quit();
});

//handles message box to replace alerts
ipcMain.handle('show-message-box', async (event, options) => {
   return dialog.showMessageBox(mainWindow, options);
});

// Grabs the API key
dotenv.config();

// Module for OpenAI
const openai = new OpenAI({
   // Securly accesing the API
 apiKey: process.env.OPENAI_API_KEY 
});
// Handles OpenAI requests securely
// We set event as first parameter because in an Electron IPC handler, the first parameter is the event.
ipcMain.handle('openai-request', async (event, messages = {}) => {
   try {
      const result = await openai.chat.completions.create({
         model: "gpt-4o-mini",
         messages
       });
       return result;

   } catch (error) {
      console.error('Error sending OpenAI request:', error);
   }
});