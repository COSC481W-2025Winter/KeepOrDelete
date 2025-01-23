const { app, BrowserWindow } = require("electron")
const path = require("node:path")
const started = require('electron-squirrel-startup');

// Handles creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
   app.quit();
}

const createWindow = () => {
   const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         preload: path.join(__dirname, "preload.js"),
         sandbox: false // Grants preload access to node:fs.
      }
   })

   mainWindow.loadFile("src/main_menu.html")
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
   createWindow()

   // On OS X it's common to re-create a window in the app when the
   // dock icon is clicked and there are no other windows open.
   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
         createWindow()
      }
   })
})

app.on("window-all-closed", () => {
   if (process.platform !== "darwin") app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
