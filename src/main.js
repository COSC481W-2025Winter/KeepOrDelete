const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { promises: fsPromises } = require('fs');
const PDFParser = require('pdf2json');
var configPath = path.join(app.getPath('userData'), 'config.json');

let selectedFilePath = ""; // Ensure this updates dynamically
let mainWindow;

const createWindow = () => {
   mainWindow = new BrowserWindow({
      width: 1600,
      height: 900,
      minWidth: 700,
      minHeight: 800,
      // Lock window rezing until we do our UI overhaul to prevent hidden items
      resizable: true,
      // Hide the top menu bar for release
      autoHideMenuBar: true,
      icon: path.resolve(__dirname, 'assets', 'icon.ico'),
      webPreferences: {
         preload: path.join(__dirname, "preload", "preload.js"),
         sandbox: false,
         nodeIntegration: false,
         contextIsolation: true,
         enableRemoteModule: false
      }
   });

   mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
};
/* Having the parsing logic in the main process avoids conflicts
 or errors related to worker configuration in preload.js */

 /* pdf2json library converts a PDF into a JSON structure, 
 This custom function is created to process the JSON structure 
 and extract all text into one continuous string.*/
 function extractPDFText(pdfData) {
   let fullText = "";
   if (pdfData && Array.isArray(pdfData.Pages)) {
     // Only process the first two pages
     const pagesToProcess = pdfData.Pages.slice(0, 2);
     pagesToProcess.forEach((page) => {
       if (Array.isArray(page.Texts)) {
         page.Texts.forEach((textItem) => {
           if (Array.isArray(textItem.R)) {
             textItem.R.forEach((fragment) => {
               if (fragment.T) {
                 // Decode the URL-encoded text fragment and append it
                 fullText += decodeURIComponent(fragment.T) + " ";
               }
             });
           }
         });
         fullText += "\n"; // Newline between pages
       }
     });
   }
   return fullText;
 }

 // Handle PDF text extraction (Copy and Paste from pdf2json docs)
ipcMain.handle('get-pdf-text', (event, filePath) => {
   return new Promise((resolve, reject) => {
     const pdfParser = new PDFParser();
 
     pdfParser.on("pdfParser_dataError", (errData) => {
       console.error("PDF parsing error:", errData.parserError);
       reject(errData.parserError);
     });
 
     pdfParser.on("pdfParser_dataReady", (pdfData) => {
      console.log("Full PDF Data:", pdfData);
       // Use getRawTextContent() to extract the text
       const textContent = extractPDFText(pdfData);
       console.log("Extracted Text:", textContent);
       resolve(textContent);
     });
 
     pdfParser.loadPDF(filePath);
   });
 });

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

// Overrides config file for the duration of the process.
// Intended for test cases.
if (process.argv.includes("--test-config")) {
   const tmp = require("tmp");

   // Auto clean up config when the process exits.
   tmp.setGracefulCleanup()

   // Generate a randomized tmp directory.
   // Clean it up even if it contains files.
   const configDir = tmp.dirSync({ unsafeCleanup: true }).name

   // Overwrite global config path.
   configPath = path.join(configDir, "config.json")

   // Create the config file.
   fs.writeFileSync(configPath, JSON.stringify([], null, 2));
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

ipcMain.handle("getRemovedFileTypes", async (_event) => {
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


app.commandLine.appendSwitch("disable-blink-features", "AutofillServerCommunication"); //suppresses error message 



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
