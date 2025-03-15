const { session } = require("electron");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { promises: fsPromises } = require('fs');
const configPath = path.join(app.getPath('userData'), 'config.json');


let selectedFilePath = ""; // Ensure this updates dynamically
let mainWindow;


const createWindow = () => {
   mainWindow = new BrowserWindow({
      width: 800,
      height: 800,
      webPreferences: {
         preload: path.join(__dirname, "preload.js"),
         sandbox: false,
         nodeIntegration: false,
         contextIsolation: true,
         enableRemoteModule: false,
      }
   });

   // Modify CORS headers for all responses
     // Set CSP using session.defaultSession

   session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
         responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
               "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
               //Allows us to make API calls to Lambda via https trigger
               "connect-src 'self' https://610op4g6ei.execute-api.us-east-1.amazonaws.com; object-src 'none'; frame-src 'none';"
            ],
         },
      });
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
      const trash = (await import("trash")).default; //dynamically import trash, some weird error, it has to be added inside this function
      await trash(filePath); //updated to use recycling bin instead of hard removing the files!
      return { success: true, message: "File deleted successfully" }; //success is built in boolean feedback
   } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, message: error.message };
   }
});

//helper method to get config data 
const getConfig = () => {
   let config = {};
   if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(fileContent);
   }
   return config;
};



//method to add a file type to the removeFileType
ipcMain.handle("removeFileType", async (event, fileType) => {
   try {
      // Read the existing config file
      let config = getConfig();

      // Add the fileType to the removedFileTypes array (avoid duplicates)
      config.removedFileTypes = Array.from(new Set([...config.removedFileTypes || [], fileType]));

      // Write the updated config back to the JSON file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      console.log(`Removed file type: ${fileType}`);
      return { success: true, message: `File type ${fileType} removed.` };
   } catch (error) {
      console.error("Error removing file type:", error);
      return { success: false, message: "Error removing file type." };
   }
});

ipcMain.handle("addFileType", async (event, fileType) => {
   try {
      // Read the existing config file
      let config = getConfig();

      // Remove the fileType from the removedFileTypes array
      if (config.removedFileTypes) {
         config.removedFileTypes = config.removedFileTypes.filter(type => type !== fileType);
      } else {
         config.removedFileTypes = [];
      }

      // Write the updated config back to the JSON file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      console.log(`Added file type: ${fileType}`);
      return { success: true, message: `File type ${fileType} added.` };
   } catch (error) {
      console.error("Error adding file type:", error);
      return { success: false, message: "Error adding file type." };
   }
});

ipcMain.handle("getRemovedFileTypes", async (event) => {
   try {
      // Read the existing config file
      let config = getConfig();

      // Return the removedFileTypes array, default to an empty array if not found
      return config.removedFileTypes || [];
   } catch (error) {
      console.error("Error getting removed file types:", error);
      return [];
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

ipcMain.on('quit-app', () => {
   app.quit(); //this will close the entire Electron app
});
