const { contextBridge, ipcRenderer } = require('electron');
const { generatePreviewHTML } = require("./preview.js");
const fs = require("node:fs");
const mime = require("mime");
const path = require('path');
const os = require('node:os');

contextBridge.exposeInMainWorld('file', {
   getFilePath: () => ipcRenderer.invoke('getFilePath'),
   getFileSize: (path) => fs.statSync(path),
   getFileContents: (path) => fs.readFileSync(path).toString(),
   getMimeType: (path) => mime.getType(path),
   setFilePath: (filePath) => ipcRenderer.send('setFilePath', filePath),
   getTimeStamp: () => new Date().toTimeString(),
   selectDirectory: async () => await ipcRenderer.invoke('selectDirectory'), // Always fetch latest value
   getFilesInDirectory: () => ipcRenderer.invoke('getFilesInDirectory'), // Fetch file list
   renameFile: (oldPath, newPath) => ipcRenderer.invoke('renameFile', { oldPath, newPath }),
   pathJoin: (dir, file) => path.join(dir, file),
   pathDirname: (file) => path.dirname(file),
   pathBasename: (filePath) => path.basename(filePath),
   deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath), //delete file
   showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options), //message box to replace alerts
   generatePreviewHTML: async (filepath) => await generatePreviewHTML(filepath),
   removeFileType: (fileType) => ipcRenderer.invoke('removeFileType', fileType),
   addFileType: (fileType) => ipcRenderer.invoke('addFileType', fileType),
   getRemovedFileTypes: () => ipcRenderer.invoke("getRemovedFileTypes"),
   quitApp: () => ipcRenderer.send('quit-app'), //allow quitting the app
   platform: process.platform, 
   getBase64: (filePath) => fs.readFileSync(filePath, "base64"), // convert to base64
   getPDFtext: (filePath) => ipcRenderer.invoke('get-pdf-text', filePath),
   getFileData: async (directoryPath) => {
    const files = await fs.promises.readdir(directoryPath);
    const fileDataPromises = files.map(async filename => {
      const fullPath = path.join(directoryPath, filename);
      const stats = await fs.promises.stat(fullPath);
      if (!stats.isFile()) return null;
      return {
        name: filename,
        path: fullPath,
        modifiedDate: stats.mtime,
        createdDate: stats.ctime,
        size: stats.size,
        status: null,
      };
    });
    const fileData = await Promise.all(fileDataPromises);
    return fileData.filter(Boolean);
  },
});

contextBridge.exposeInMainWorld('fileFinal', {
   getKeptFiles: () => JSON.parse(localStorage.getItem("keptFiles") || []).filter(f => f.status === "keep"),
   getDeletedFiles: () => JSON.parse(localStorage.getItem("deletedFiles") || []).filter(f => f.status === "delete"),
   renameFile: (oldPath, newPath) => ipcRenderer.invoke('renameFile', { oldPath, newPath }),
});
// Create bridge for OpenAI API call through Lambda via HTTPS
contextBridge.exposeInMainWorld('openai', {
   openaiRequest: async (messages = {}) => {
      // API Gateway URL
     const response = await fetch('https://610op4g6ei.execute-api.us-east-1.amazonaws.com/default/GPT_Renaming', {
       method: 'POST',
       headers: {
          'Content-Type': 'application/json'
       },
       body: JSON.stringify({ messages })
     });
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
     return await response.json();
   }
 });
