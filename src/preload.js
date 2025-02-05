const { contextBridge } = require('electron/renderer');
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let filePath = path.join(os.tmpdir(), "electronfile");

contextBridge.exposeInMainWorld('file', {
   getFilePath: () => filePath,
   fileExists: () => {
      return fs.existsSync(filePath);
   },
   setFilePath: (x)  => {
      filePath = x; // Ensure it's an absolute path
   },
   getTimeStamp: () => {
      const date = new Date();
      return date.toTimeString();
   }
});
