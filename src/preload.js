const { contextBridge, ipcRenderer } = require('electron');
const { generatePreviewHTML } = require("./preview.js");
const fs = require("node:fs");
const mime = require("mime");
const path = require('path');
const os = require('node:os');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const mammoth = require('mammoth');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const htmlToPdfmake = require('html-to-pdfmake');

contextBridge.exposeInMainWorld('file', {
   getFilePath: () => ipcRenderer.invoke('getFilePath'),
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
   quitApp: () => ipcRenderer.send('quit-app') //allow quitting the app
});

contextBridge.exposeInMainWorld('fileFinal', {
   getKeptFiles: () => JSON.parse(localStorage.getItem("keptFiles")) || [],
   getDeletedFiles: () => JSON.parse(localStorage.getItem("deletedFiles")) || [],
   renameFile: (oldPath, newPath) => ipcRenderer.invoke('renameFile', { oldPath, newPath }),
});
