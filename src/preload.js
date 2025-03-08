const { contextBridge, ipcRenderer } = require('electron');
const fs = require("node:fs");
const mime = require("mime");
const path = require('path');
const os = require('node:os');
const docx = require('docx-preview');
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
   convertDocxToPdf: async (filepath) => {
      /// Converts from DOCX to PDF for previewing purposes.
      var html;

      await mammoth.convertToHtml({ path: filepath })
         .then(function(result) {
            html = result.value;
            // Any messages, such as warnings during conversion
            var _messages = result.messages;
         })
         .catch(function(error) {
            console.error(error);
            return;
         });

      // Preliminary pdfMake configuration.
      pdfMake.vfs = pdfFonts;

      // Create new DOM window object.
      const { window } = new JSDOM('');

      const converted = htmlToPdfmake(html, { window });
      const docDefinition = { content: converted };

      pdfPath = path.join(os.tmpdir(), "docxToPdf.pdf");

      pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
         require('fs').writeFileSync(pdfPath, buffer);
      });

      return pdfPath;
   },
});
