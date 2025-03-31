const { _electron: electron, test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("node:fs");
const os = require("node:os");

let electronApp;
let swapper;
/** Generate temporary directory path. */
const testDirPath = path.join(os.tmpdir(), "keepordelete-preview-tests");

/** Forcefully delete test directory if it exists. */
const cleanTestDir = function () {
   // Clean temporary directory if it exists.
   if (fs.existsSync(testDirPath)) {
      fs.rmSync(testDirPath, { recursive: true, force: true });
   }
}

test.beforeAll(async () => {
   electronApp = await electron.launch({ args: ["./", "--test-config"], userAgent: "Playwright"});
});

test.beforeEach(async () => {
   swapper = 0;
   cleanTestDir();

   // Create temporary directory.
   fs.mkdirSync(testDirPath, { recursive: true });

   // Create various files inside the temporary directory.
   for (let i = 0; i < 3; i++) {
      fs.writeFileSync(path.join(testDirPath, `file${i}`), "contents")
   }
});

//closing app
test.afterEach(async () => {
   await new Promise(resolve => setTimeout(resolve, 500));
   cleanTestDir();
});

test.afterAll(async () => {
   await electronApp.close();
});

// handle file traversale for each input type
const testFileProcessing = async (window, swipeAction) => {
   let previousPath = null;
   for (let i = 0; i < 3; i++) {
      await expect(window.locator("#currentItem")).toBeVisible({ timeout: 5000 });
      const path = await window.locator("#currentItem").innerText();
      expect(previousPath !== path).toBe(true);
      previousPath = path;

      if (swapper === 0) {
         await swipeAction("left");
         swapper++;
      } else {
         await swipeAction("right");
      }
      await expect(window.locator("#currentItem")).not.toHaveText(path, { timeout: 5000 })
   }
};

test("Button press to keep on KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();
   await window.goto("file://" + path.resolve(__dirname, "../src/main_page/keep_or_delete.html"));

   // Intercept file selection dialog
   await electronApp.evaluate(({ dialog }, testDirPath) => {
      dialog.showOpenDialog = async () => ({
         canceled: false,
         filePaths: [testDirPath], // Inject test dir path
      });
   }, testDirPath);

   // Navigate to next page using the override
   await window.locator("#selectDirButton").click();
   //await window.locator("#goButton").click();
   //await window.waitForURL("**/keep_or_delete.html");

   await testFileProcessing(window, async (direction) => {
      await window.locator(direction === "left" ? "#deleteButton" : "#nextButton").click();
   });
   await window.evaluate(() => localStorage.clear());
});

test("Touch swipe to keep on KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();
   await window.goto("file://" + path.resolve(__dirname, "../src/main_page/keep_or_delete.html"));

   // Intercept file selection dialog
   await electronApp.evaluate(({ dialog }, testDirPath) => {
      dialog.showOpenDialog = async () => ({
         canceled: false,
         filePaths: [testDirPath], // Inject test dir path
      });
   }, testDirPath);

   // Navigate to next page using the override
   await window.locator("#backButton").click();
   //await window.locator("#goButton").click();
   //await window.waitForURL("**/keep_or_delete.html");

   await testFileProcessing(window, async (direction) => {
      const previewContainer = window.locator("#previewContainer");
      await expect(previewContainer).toBeVisible({ timeout: 5000 });
      let box = await previewContainer.boundingBox();
      await previewContainer.hover();
      await window.mouse.down();
      await window.mouse.move(box.x + (swapper === 0 ? box.width * 0.75 : -box.width * 0.75), box.y);
      await window.mouse.up();
   });
   await window.evaluate(() => localStorage.clear());
});
test("Arrow key Swipe to keep on KeepOrDelete page", async () => {
   const window = await electronApp.firstWindow();
   await window.evaluate(() => localStorage.clear());
   await window.goto("file://" + path.resolve(__dirname, "../src/main_page/keep_or_delete.html"));

   // Intercept file selection dialog
   await electronApp.evaluate(({ dialog }, testDirPath) => {
      dialog.showOpenDialog = async () => ({
         canceled: false,
         filePaths: [testDirPath], // Inject test dir path
      });
   }, testDirPath);

   // Navigate to next page using the override
   await window.locator("#backButton").click();
   //await window.locator("#goButton").click();
   //await window.waitForURL("**/keep_or_delete.html");

   await testFileProcessing(window, async (direction) => {
      await window.keyboard.press(direction === "left" ? "ArrowLeft" : "ArrowRight");
   });

   await window.evaluate(() => localStorage.clear());
});
