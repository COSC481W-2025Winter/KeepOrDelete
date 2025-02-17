const { _electron: electron, test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("node:fs");
const fsp = require("fs/promises");
const os = require("node:os");
const mime = require("mime");

let electronApp;

/** Generate temporary directory path. */
const testDirPath = path.join(os.tmpdir(), "keepordelete-preview-tests");

const newTestFilePath = function(filename) {
   return path.join(testDirPath, filename);
};

/** Forcefully delete test directory if it exists. */
const cleanTestDir = function() {
   // Clean temporary directory if it exists.
   if (fs.existsSync(testDirPath)) {
      fs.rmSync(testDirPath, { recursive: true, force: true }, (err) => {
         if (err) throw err;
      })
   }

}

test.beforeAll(async () => {
   electronApp = await electron.launch({ args: ["./"] });

   cleanTestDir();

   // Create temporary directory.
   fs.mkdir(testDirPath, { recursive: true }, (err) => {
      if (err) throw err;
   });

   // Verify that temporary directory exists.
   expect(fs.existsSync(testDirPath));

   // Create various files inside the temporary directory.
   await Promise.all([
      fsp.writeFile(newTestFilePath("test.txt"), "Standard text file", "utf8"),
      fsp.writeFile(newTestFilePath("test.csv"), "Comma-separated values file", "utf8"),
      fsp.writeFile(newTestFilePath("test.jpeg"), Buffer.from([0x50, 0x4B, 0x03, 0x04]), "binary"),
   ]);

   console.log(fs.readdir)
});

//closing app
test.afterAll(async () => {
   await electronApp.close();

   cleanTestDir();
});

test("Navigate to KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();

   await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));

   // Intercept file selection dialog
   await electronApp.evaluate(({ dialog }, testDirPath) => {
      dialog.showOpenDialog = async () => ({
         canceled: false,
         filePaths: [testDirPath], // Inject test dir path
      });
   }, testDirPath);

   // Navigate to next page using the override
   await window.locator("#SelectButton").click();
   await window.locator("#goButton").click();
   await window.waitForURL("**/keep_or_delete.html");

   for (let i = 0; i < 3; i++) {
      const path = await window.locator("#currentItem").innerText();

      // Mime library doesn't like some paths. Just serve it the basename
      const basename = require("node:path").basename(path);

      const mimeType = mime.getType(basename);

      console.log(`path=${path}`);
      console.log(`mimeType=${mimeType}`);

      const preview = await window.locator("#previewContainer").innerText();

      console.log(`preview=${preview}`);

      // Cycle to next file.
      await window.click("#nextButton");
   }
});
