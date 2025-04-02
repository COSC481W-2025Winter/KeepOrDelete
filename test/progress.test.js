const { test, expect, _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs/promises");

// Create test directory variable
const testDirectory = path.join(__dirname, "test-files");

let electronApp;
// Creating test files
const testFiles = [
  path.join(testDirectory, "testFile.txt"),
  path.join(testDirectory, "testFile2.txt"),
  path.join(testDirectory, "testFile3.txt"),
  path.join(testDirectory, "testFile4.txt"),
];

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["./", "--test-config"] });

  // Create file contents
  await fs.mkdir(testDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(testFiles[0], "Name this file 'hi'", "utf8"),
    fs.writeFile(testFiles[1], "", "utf8"),
    fs.writeFile(testFiles[2], "blah blah", "utf8"),
    fs.writeFile(testFiles[3], "", "utf8"),
  ]);
});

// Closing the app
test.afterAll(async () => {
  await electronApp.close();
  // Delete test directory
  try {
    await fs.rm(testDirectory, { recursive: true, force: true });
    console.log(`Deleted test directory: ${testDirectory}`);
  } catch (error) {
    console.error(`Error deleting test directory: ${error}`);
  }
});

test("Progress bar updates correctly based on file statuses", async () => {
  const window = await electronApp.firstWindow();
  await window.evaluate(() => localStorage.clear());

  await electronApp.evaluate(({ dialog }, testDirectory) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [testDirectory],
    });
  }, testDirectory);

  await window.locator("#selectDirButton").click();

  await window.locator("#nextButton").click();
  await window.waitForTimeout(1000);
  await window.locator("#deleteButton").click();
  await window.waitForTimeout(1000);
    // Go through half the files
  const progressLocator = window.locator("#progress");
  const dataSavedLocator = window.locator("#dataSaved");
  await expect(progressLocator).toContainText("50%");
  await expect(dataSavedLocator).not.toContainText("You've saved:");

  await window.locator("#nextButton").click();
  await window.waitForTimeout(1000);
  await window.locator("#deleteButton").click();

  // since all files are processed, the progress should be 100%.
  await expect(progressLocator).toContainText("100%");
  await expect(dataSavedLocator).toContainText("You've saved:");
  await window.evaluate(() => localStorage.clear());
});
