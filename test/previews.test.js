const { _electron: electron, test, expect } = require("@playwright/test");
const path = require("path");
const crypto = require("crypto");
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

   fs.mkdirSync(testDirPath, { recursive: true }, (err) => {
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

   // Write the input file to the temporary directory. Has two modes, dependent on the input:
   // (1) TestFile instance. Write it to the test directory.
   // (2) Path to an existing file. Copy it to the test directory.
   if (testFile instanceof TestFile) {
      fs.writeFileSync(testFile.path, testFile.contents)
   } else {
      await fs.copyFile(testFile, path.join(testDirPath, path.basename(testFile)), (err) => {
         if (err) throw err;
      })
   }

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

test("Preview `.pdf`", async () => {
   const srcPath = path.join("test", "res", "small.pdf");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   const preview = await window.locator("#previewContainer").innerText();

   let previewPdfPath = await window.getByTestId("pdf-iframe").getAttribute("src");
   // Remove iframe configuration attribute(s) from the path.
   previewPdfPath = previewPdfPath.replace("#toolbar=0", "");

   const previewPdfContents = fs.readFileSync(previewPdfPath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewPdfContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
})

test("Preview `.png`", async () => {
   const srcPath = path.join("test", "res", "small.png");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   const preview = await window.locator("#previewContainer").innerText();

   let previewPath = await window.getByTestId("img-element").getAttribute("src");

   const previewFileContents = fs.readFileSync(previewPath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewFileContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
})

test("Preview `.jpg`", async () => {
   const srcPath = path.join("test", "res", "small.jpg");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   const preview = await window.locator("#previewContainer").innerText();

   let previewPath = await window.getByTestId("img-element").getAttribute("src");

   const previewFileContents = fs.readFileSync(previewPath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewFileContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
})

test("Preview `.docx`", async () => {
   const srcPath = path.join("test", "res", "small.docx");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const preview = await window.locator("#previewContainer").innerText();

   let previewPdfPath = await window.getByTestId("pdf-iframe").getAttribute("src");
   // Remove iframe configuration attribute(s) from the path.
   previewPdfPath = previewPdfPath.replace("#toolbar=0", "");

   // Word docs are currently converted to pdf for preview purposes.
   // The pdf is generated asynchronously, so wait for a little bit.
   await window.waitForTimeout(850)

   const previewFileExists = fs.existsSync(previewPdfPath);

   expect(previewFileExists).toBe(true);
})

test("Preview `.frog` (unsupported)", async () => {
   const f = new TestFile("tree.frog", "Frog file contents ribbit", "utf8");
   await setupWithTestFile(f);

   const preview = await window.locator("#previewContainer").innerText();

   expect(preview).toMatch(noPreviewMsg);
})
