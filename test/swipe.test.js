const { _electron: electron, test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("node:fs");
const os = require("node:os");

let electronApp;
let swapper;
/** Generate temporary directory path. */
const testDirPath = path.join(os.tmpdir(), "keepordelete-preview-tests");

/** Forcefully delete test directory if it exists. */
const cleanTestDir = function() {
   // Clean temporary directory if it exists.
   if (fs.existsSync(testDirPath)) {
      fs.rmSync(testDirPath, { recursive: true, force: true }, (err) => {
         if (err) throw err;
      })
   }
}

test.beforeEach(async () => {
   electronApp = await electron.launch({ args: ["./"] });
   swapper = 0;
   cleanTestDir();

   // Create temporary directory.
   fs.mkdirSync(testDirPath, { recursive: true }, (err) => {
      if (err) throw err;
   });

   // Verify that temporary directory exists.
   expect(fs.existsSync(testDirPath));

   // Create various files inside the temporary directory.
   for (let i = 0; i < 3; i++) {
      fs.writeFileSync(path.join(testDirPath, `file${i}`), "contents")
   }

   console.log(fs.readdir)
});

//closing app
test.afterEach(async () => {
   await electronApp.close();

   cleanTestDir();
});

test("Button press to keep on KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();
   await window.evaluate(() => localStorage.clear());
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

   let previousPath = null;
   for (let i = 0; i < 3; i++) {
      const path = await window.locator("#currentItem").innerText();

      console.log(`path=${path}`);

      let preview = await window.locator("#previewContainer").innerText();
      // Remove emojis using regex
      preview = preview.replace(/✅|🗑️/g, "").trim(); 
      // Freak out if the file path didn't change.
      if (previousPath != null && path == previousPath) {
         expect(false).toBe(true);
      }
      previousPath = path;
      if (swapper == 0) {
         // Cycle to next file.
         await window.locator("#deleteButton").click();
         // Need timeout to account for animation!!
         await window.waitForTimeout(500);
         swapper++;
      }
      else{
         // Cycle to next file.
         await window.locator("#nextButton").click();
         // Need timeout to account for animation!!
         await window.waitForTimeout(500);
      }
   }
   await window.evaluate(() => localStorage.clear());
});

test("Touch swipe to keep on KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();
   await window.evaluate(() => localStorage.clear());

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

   let previousPath = null;

   for (let i = 0; i < 3; i++) {
      const path = await window.locator("#currentItem").innerText();

      console.log(`path=${path}`);

      let preview = await window.locator("#previewContainer").innerText();
      // Remove emojis using regex
      preview = preview.replace(/✅|🗑️/g, "").trim(); 

      // Freak out if the file path didn't change.
      if (previousPath != null && path == previousPath) {
         expect(false).toBe(true);
      }

      previousPath = path;
      if (swapper == 0) {
         const previewContainer = await window.locator("#previewContainer");
         const box = await previewContainer.boundingBox();
         await previewContainer.hover();
         await window.mouse.down();
         await window.mouse.move(box.x + 500, box.y);
         await window.mouse.up();
         // Need timeout to account for animation!!
         await window.waitForTimeout(500);
         swapper++;
      }
      else{
         const previewContainer = await window.locator("#previewContainer");
         const box = await previewContainer.boundingBox();
         await previewContainer.hover();
         await window.mouse.down();
         await window.mouse.move(box.x - 500, box.y);   
         await window.mouse.up();
         // Need timeout to account for animation!!
         await window.waitForTimeout(500);
      }
   }
   await window.evaluate(() => localStorage.clear());
});
test("Arrow key Swipe to keep on KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();
   await window.evaluate(() => localStorage.clear());
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

   let previousPath = null;

   for (let i = 0; i < 3; i++) {
      const path = await window.locator("#currentItem").innerText();

      console.log(`path=${path}`);

      let preview = await window.locator("#previewContainer").innerText();
      // Remove emojis using regex
      preview = preview.replace(/✅|🗑️/g, "").trim(); 

      // Freak out if the file path didn't change.
      if (previousPath != null && path == previousPath) {
         expect(false).toBe(true);
      }

      previousPath = path;

      if (swapper == 0) {
         // Cycle to next file.
         await window.keyboard.press("ArrowLeft");
         // Need timeout to account for animation!!
         await window.waitForTimeout(500);
         swapper++;
      }
      else{
         // Cycle to next file.
         await window.keyboard.press("ArrowRight");
         // Need timeout to account for animation!!
         await window.waitForTimeout(500);
      }
   }
   await window.evaluate(() => localStorage.clear());
});
