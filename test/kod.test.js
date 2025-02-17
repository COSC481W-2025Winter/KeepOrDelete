const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("node:fs");
const fsp = require("fs/promises");
const os = require("node:os");
const mime = require("mime");
const { test, expect } = require("@playwright/test");

let app;
//init path
const filePath = path.resolve(__dirname, "../src/main_menu.html");
const fileUrl = `file://${filePath}`;

/** Generate temporary directory path. */
const testDirPath = path.join(os.tmpdir(), "keepordelete-preview-tests");

const newTestFilePath = function(filename) {
   return path.join(testDirPath, filename);
};

/** Forcefully delete test directory if it exists. */
const cleanTestDir = function() {
   // Clean temporary directory if it exists.
   if (fs.existsSync(testDirPath)) {
      fs.rm(testDirPath, { recursive: true, force: true }, (err) => {
         if (err) throw err;
      })
   }

}

test.beforeAll(async () => {
   app = await electron.launch({ args: ["./"] });

   // Clean temporary directory if it exists.
   if (fs.existsSync(testDirPath)) {
      fs.rm(testDirPath, { recursive: true, force: true }, (err) => {
         if (err) throw err;
      })
   }

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
});

//closing app
test.afterAll(async () => {
   await app.close();

   cleanTestDir();
});

test("Navigate to KeepOrDelete page", async ({ page }) => {
   //navigate to main menu
   await page.goto(fileUrl);

   //wait for select button and click
   await page.waitForSelector("#SelectButton");
   await page.click("#SelectButton");

   await page.evaluate((testDirPath) => {
      document.getElementById("filepath").innerText = testDirPath;
   }, testDirPath);

   //wait for the file path and check if file path was updated correctly
   const filePathElement = await page.waitForSelector("#filepath", {
      state: "visible",
   });
   const updatedFilePath = await filePathElement.innerText();
   expect(updatedFilePath).toBe(testDirPath);

   await page.click("#goButton");

   // Await for KeepOrDelete page to load.
   await page.waitForSelector("#backButton")

   for (let i = 0; i < 3; i++) {
      const filepath = "";

      await page.evaluate(() => {
         filepath = document.getElementById("currentItem").innerText;
      })

      const mimeType = mime.getType(filepath);

      // Cycle to next file with a minor temporal buffer.
      await page.click("#nextButton");
      await page.waitForTimeout(300);
   }
});
