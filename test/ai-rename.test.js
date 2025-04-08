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
  path.join(testDirectory, "testFile3.png"),
  path.join(testDirectory, "testFile4.png"),
  path.join(testDirectory, "testFile5.png"),
];

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: ["./", "--test-config"],
    userAgent: "Playwright",
  });


// Dummy image Base64 data (for a simple 20x20 PNG)
const imgData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"
+ "ABQAAAAUCAYAAACNiR0NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpI"
+ "Ak2E4dHDRw1cDgaCAASFOffhEIO3gAAAABJRU5ErkJggg==";
// Remove the header and convert to a Buffer
const data = imgData.replace(/^data:image\/\w+;base64,/, "");
const dummyImageBuffer = Buffer.from(data, "base64");

  // Create file contents
  await fs.mkdir(testDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(testFiles[0], "Name this file 'hi'", "utf8"),
    fs.writeFile(testFiles[1], "", "utf8"),
    fs.writeFile(testFiles[2], dummyImageBuffer),
    fs.writeFile(testFiles[3], dummyImageBuffer),
    fs.writeFile(testFiles[4], dummyImageBuffer),
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

// Test 1
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
  await window.click("#selectDirButton");

  // Make sure selected file has contents. This would be passed on to AWS Lambda
  await window.locator("#renameButton").click();
  await window.locator("#AIButton").click();
  const inputText = window.locator("#renameInput");
  //david did this btw
  await expect(inputText).toHaveValue("dummy suggestion");
  await window.locator("#closeModal").click();

  // Make sure selected file is empty. This would not be passed on to AWS Lambda.
  await window.locator("#nextButton").click();
  await page.waitForTimeout(1000);
  await window.locator("#renameButton").click();
  await window.locator("#AIButton").click();
  const popupContentLocator = window.locator("#AIButton");
  await expect(popupContentLocator).toContainText("No file contents found.");
  await window.locator("#closeModal").click();

  await window.evaluate(() => localStorage.clear());
});


// Test 2
test("Image renaming limit prevents additional processing", async () => {
  const window = await electronApp.firstWindow();

  // Clear any previous data
  await window.evaluate(() => localStorage.clear());

  // Mock the GPT response for image renaming
  const context = electronApp.context();
  await context.route("**/GPT_Renaming", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [{ message: { content: "dummy image suggestion" } }],
      }),
    });
  });

  // Override the directory selection so it always returns our test directory
  await electronApp.evaluate(({ dialog }, testDirectory) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [testDirectory],
    });
  }, testDirectory);

  // Simulate navigating to the main page by clicking the select directory button.
  await window.locator("#backButton").click();
  // move past text files.  
  await window.locator("#nextButton").click();
  await window.waitForTimeout(1000);
  await window.locator("#nextButton").click();
  await window.waitForTimeout(1000);

  // Process the first image
  await window.click("#renameButton");
  await window.click("#AIButton");
  await window.locator("#closeModal").click();
  await window.locator("#nextButton").click();

  // Process the second image
  await window.click("#renameButton");
  await window.click("#AIButton");
  await window.locator("#closeModal").click();
  await window.locator("#nextButton").click();

  // Process the third image, which should be blocked by the limit logic
  await window.click("#renameButton");
  await window.click("#AIButton");
  const popupContentText = await window.locator("#AIButton").innerText();
  await expect(popupContentText).toContain("limit for image files has been reached");

  // Verify that the imageLimit remains at "2" in localStorage.
  const imageLimitStored = await window.evaluate(() =>
    localStorage.getItem("imageLimit")
  );
  await expect(imageLimitStored).toBe("2");

  // Clean up localStorage after test.
  await window.evaluate(() => localStorage.clear());
});
