const { _electron: electron, test, expect } = require("@playwright/test");
const path = require("path");
const crypto = require("crypto");
const fs = require("node:fs");
const tmp = require('tmp');

// Run tests in parallel when possible.
test.describe.configure({ mode: 'parallel' });

// Remove all generated tmp dirs when the process exits.
tmp.setGracefulCleanup();

let electronApp;

/** Bundles filenames with contents. */
class TestFile {
   constructor(basename, contents) {
      this.basename = basename;
      this.contents = contents;
   }
}

// Create the empty test directory before running the tests.
test.beforeAll(async () => {
   electronApp = await electron.launch({ args: ["./", "--test-config"] });
});

test.afterAll(async () => {
   await electronApp.close();
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
   // Create a new tmp directory with a random name.
   const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;

   window = await electronApp.firstWindow();

   await window.evaluate(() => localStorage.clear());

   // Write the input file to the temporary directory. Has two modes, dependent on the input:
   // (1) TestFile instance. Write it to the test directory.
   // (2) Path to an existing file. Copy it to the test directory.
   if (testFile instanceof TestFile) {
      const testFilePath = path.join(tmpDir, testFile.basename)
      fs.writeFileSync(testFilePath, testFile.contents)
   } else {
      fs.copyFile(testFile, path.join(tmpDir, path.basename(testFile)), (err) => {
         if (err) throw err;
      })
   }

   await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));

   // Intercept file selection dialog
   await electronApp.evaluate(({ dialog }, tmpDir) => {
      dialog.showOpenDialog = async () => ({
         canceled: false,
         filePaths: [tmpDir], // Inject path
      });
   }, tmpDir);

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
   await window.evaluate(() => localStorage.clear());
})

test("Preview `.csv`", async () => {
   const f = new TestFile("test.csv", "Standard csv file", "utf8");
   await setupWithTestFile(f);

   const preview = await window.locator("#previewContainer").innerText();

   expect(preview).toEqual(f.contents);
   await window.evaluate(() => localStorage.clear());
})

test("Preview `.pdf`", async () => {
   const srcPath = path.join("test", "res", "small.pdf");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   let previewPdfPath = await window.getByTestId("pdf-iframe").getAttribute("src");
   // Remove iframe configuration attribute(s) from the path.
   previewPdfPath = previewPdfPath.replace("#toolbar=0", "");

   const previewPdfContents = fs.readFileSync(previewPdfPath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewPdfContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
   await window.evaluate(() => localStorage.clear());
})

test("Preview `.png`", async () => {
   const srcPath = path.join("test", "res", "small.png");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   let previewPath = await window.getByTestId("img-element").getAttribute("src");

   const previewFileContents = fs.readFileSync(previewPath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewFileContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
   await window.evaluate(() => localStorage.clear());
})

test("Preview `.jpg`", async () => {
   const srcPath = path.join("test", "res", "small.jpg");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   let previewPath = await window.getByTestId("img-element").getAttribute("src");

   const previewFileContents = fs.readFileSync(previewPath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewFileContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
   await window.evaluate(() => localStorage.clear());
})

test("Preview `.docx`", async () => {
   const srcPath = path.join("test", "res", "small.docx");
   await setupWithTestFile(srcPath);

   let previewPath = await window.getByTestId("pdf-iframe").getAttribute("src");
   // Remove iframe configuration attribute(s) from the path.
   previewPath = previewPath.replace("#toolbar=0", "");

   // Word docs are currently asynchronously converted to pdf for preview
   // purposes. Give this conversion a time limit.
   expect(fs.existsSync(previewPath), { timeout: 2_000 });

   await window.evaluate(() => localStorage.clear());
})

test("Preview `.mp4`", async () => {
   const srcPath = path.join("test", "res", "small.mp4");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   const previewFilePath = await window.getByTestId("video-src").getAttribute("src");

   const previewFileContents = fs.readFileSync(previewFilePath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewFileContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
})

test("Preview `.mov`", async () => {
   const srcPath = path.join("test", "res", "small.mov");
   await setupWithTestFile(srcPath);

   const srcContents = fs.readFileSync(srcPath, (err) => {
      if (err) throw err;
   })

   const srcHash = crypto.createHash("md5").update(srcContents).digest("hex");

   const previewFilePath = await window.getByTestId("video-src").getAttribute("src");

   const previewFileContents = fs.readFileSync(previewFilePath, (err) => {
      if (err) throw err;
   })

   const previewHash = crypto.createHash("md5").update(previewFileContents).digest("hex");

   expect(srcHash).toEqual(previewHash);
})
test("Preview `.frog` (unsupported)", async () => {
   const f = new TestFile("tree.frog", "Frog file contents ribbit", "utf8");
   await setupWithTestFile(f);

   const preview = await window.locator("#previewContainer").innerText();

   expect(preview).toMatch(noPreviewMsg);
   await window.evaluate(() => localStorage.clear());
})
