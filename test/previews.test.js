const { _electron: electron, test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("node:fs");
const os = require("node:os");
const mime = require("mime");

let electronApp;

/** Bundles filenames with contents. */
class TestFile {
   constructor(basename, contents) {
      this.basename = basename;
      this.path = path.join(testDirPath, basename);
      this.contents = contents;
   }
}

// Generate the temporary directory path.
// This directory will contain each test's files, then be removed
// after all tests are completed.
const testDirPath = path.join(os.tmpdir(), "keepordelete-preview-tests");

/**
 * Forcefully delete test directory if it exists.
 *
 * I wrote this as an anonymous function so it can read the temporary directory's
 * path without requiring it as a parameter.
 */
const rmTestDir = function() {
   // Clean temporary directory if it exists.
   if (fs.existsSync(testDirPath)) {
      fs.rmSync(testDirPath, { recursive: true, force: true }, (err) => {
         if (err) throw err;
      })
   }
}

// Create the empty test directory before running the tests.
test.beforeAll(async () => {
   electronApp = await electron.launch({ args: ["./"] });

   // Remove test directory if it exists.
   rmTestDir();

   fs.mkdir(testDirPath, { recursive: true }, (err) => {
      if (err) throw err;
   });

   // Verify that temporary directory exists.
   expect(fs.existsSync(testDirPath));
});

// Remove test directory contents between tests.
test.afterEach(async () => {
   for (const filename of fs.readdirSync(testDirPath)) {
      const filepath = path.join(testDirPath, filename)

      fs.rmSync(filepath, { recursive: true, force: true }, (err) => {
         if (err) throw err;
      })
   }
});

test.afterAll(async () => {
   await electronApp.close();

   rmTestDir();
});

// Will contain an interactive Electron window instance.
var window;
// Regular expression matching a generic "No preview available" message.
const noPreviewMsg = /no.*available/i

/**
 * Writes a test file to the test directory, then navigates to the
 * "Keep or Delete" screen.
 *
 * Intended to be called from each test case.
 */
async function setupWithTestFile(testFile) {
   window = await electronApp.firstWindow();

   // Write the TestFile to the temporary directory.
   fs.writeFileSync(testFile.path, testFile.contents)

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
}

test("Preview `.txt`", async () => {
   const f = new TestFile("test.txt", "Standard text file", "utf8");
   await setupWithTestFile(f);

   const preview = await window.locator("#previewContainer").innerText();

   expect(preview).toEqual(f.contents);
})

test("Preview `.csv`", async () => {
   const f = new TestFile("test.csv", "Standard csv file", "utf8");
   await setupWithTestFile(f);

   const preview = await window.locator("#previewContainer").innerText();

   expect(preview).toEqual(f.contents);
})

test("Preview `.frog` (unsupported)", async () => {
   const f = new TestFile("tree.frog", "Frog file contents ribbit", "utf8");
   await setupWithTestFile(f);

   const preview = await window.locator("#previewContainer").innerText();

   expect(preview).toMatch(noPreviewMsg);
})

/**
test("Navigate to KeepOrDelete page", async () => {
   let previousPath = null;

   for (let i = 0; i < 3; i++) {
      const path = await window.locator("#currentItem").innerText();

      // Mime library doesn't like some paths. Just serve it the basename
      const basename = require("node:path").basename(path);

      const mimeType = mime.getType(basename);

      console.log(`path=${path}`);
      console.log(`mimeType=${mimeType}`);

      const preview = await window.locator("#previewContainer").innerText();

      console.log(`preview=${preview}`);

      // Freak out if the file path didn't change.
      if (previousPath != null && path == previousPath) {
         expect(false).toBe(true);
      }

      previousPath = path;

      if (mimeType.startsWith("text")) {
         // Fetch this file's contents from the array.
         const expectedPreview = testFiles.find((tf) => tf.basename == basename).contents

         console.log(`Expected preview: ${expectedPreview}`)

         // Expect this file's contents to be visible on screen.
         expect(preview).toEqual(expectedPreview)
      } else {
         // Some text like "no preview available for this filetype".
         expect(preview).toMatch()
      }

      // Cycle to next file.
      await window.click("#nextButton");
   }
});
*/
