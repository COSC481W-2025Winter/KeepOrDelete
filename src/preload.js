const { contextBridge } = require('electron/renderer')
const fs = require("node:fs")

const path = '/tmp/electronfile'
const contents = `👋 Hello from ${path}!`

contextBridge.exposeInMainWorld('file', {
   fileExists : () => {
      return fs.existsSync(path);
   },
   createFile: () => {
      fs.writeFile(path, contents, function(err) {
         if (err) throw err;
         console.log(`Wrote file ${path}.`);
      });
   },
   removeFile: () => {
      fs.rm(path, function() { }) // is a dummy function a valid callback?
      console.log(`Removed file ${path}.`)
   },
   getFileContents: () => {
      return fs.readFileSync(path).toString();
   },
   getTimeStamp: () => {
      const date = new Date();
      return date.toTimeString();
   }
})
