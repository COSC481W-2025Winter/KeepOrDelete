const { contextBridge } = require('electron/renderer')
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const filePath = path.join(os.tmpdir(), "electronfile")
const contents = `👋 Hello from ${filePath}!\n`

contextBridge.exposeInMainWorld('file', {
   getFilePath: () => filePath,
   fileExists: () => {
      return fs.existsSync(filePath);
   },
   createFile: () => {
      fs.writeFile(filePath, contents, function(err) {
         if (err) throw err;
         console.log(`Wrote file ${filePath}.`);
      });
   },
   removeFile: () => {
      fs.rm(filePath, function() { }) // is a dummy function a valid callback?
      console.log(`Removed file ${filePath}.`)
   },
   getFileContents: () => {
      return fs.readFileSync(filePath).toString();
   },
   getTimeStamp: () => {
      const date = new Date();
      return date.toTimeString();
   }
})
