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
];

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["./", "--test-config"] });

  // Create file contents
  await fs.mkdir(testDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(testFiles[0], "Name this file 'hi'", "utf8"),
    fs.writeFile(testFiles[1], "", "utf8"),
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

test("Clicking on AI button returns expected message", async ({ page }) => {
  const window = await electronApp.firstWindow();
  await window.evaluate(() => localStorage.clear());
  // Mock GPT response
  const context = electronApp.context();
  await context.route("**/GPT_Renaming", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [{ message: { content: "dummy suggestion" } }],
      }),
    });
  });
  // Load mock directory
  await electronApp.evaluate(({ dialog }, testDirectory) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [testDirectory],
    });
  }, testDirectory);

  // Navigate to keep or delete page with mock directory
  await window.click("#backButton");
  //await window.click("#goButton");
  //await expect(window.url()).toContain("keep_or_delete.html");

  // Make sure selected file has contents. This would be passed on to AWS Lambda
  await window.locator("#renameButton").click();
  await window.locator("#popupContent").click();
  const inputText = window.locator("#renameInput");
  //david did this btw
  await expect(inputText).toHaveValue("dummy suggestion");
  await window.locator("#closeModal").click();

  // Make sure selected file is empty. This would not be passed on to AWS Lambda.
  await window.locator("#nextButton").click();
  await page.waitForTimeout(1000);
  await window.locator("#renameButton").click();
  await window.locator("#popupContent").click();
  const popupContentLocator = window.locator("#popupContent");
  await expect(popupContentLocator).toContainText("No file contents found.");

  await window.evaluate(() => localStorage.clear());
});
