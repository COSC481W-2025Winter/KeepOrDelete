const { test, expect, _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs/promises");

let app;
//init path
const filePath = path.resolve(__dirname, "../src/renderer/index.html");
const fileUrl = `file://${filePath}`;

//test directory
const testDirectory = path.join(__dirname, "test-files");

//setting up app
test.beforeAll(async () => {
  app = await electron.launch({ args: ["./", "--test-config"], userAgent: "Playwright" });
  await fs.mkdir(testDirectory, { recursive: true });
});

//closing app
test.afterAll(async () => {
  await app.close();
  try {
    await fs.rm(testDirectory, { recursive: true, force: true });
    console.log(`Deleted test directory: ${testDirectory}`);
  } catch (error) {
    console.error(`Error deleting test directory: ${error}`);
  }
});

//settings window button test
test("navigate to settings window", async () => {
  const window = await app.firstWindow();
  await window.evaluate(() => localStorage.clear());
  //navigate to main menu
  await window.goto(fileUrl);

  //wait for settings button and then click
  await window.waitForSelector("#settingsButton");
  await window.click("#settingsButton");

  //wait for element from settings window to confirm window loaded
  const element = await window.waitForSelector("#txt");

  //assert element is present
  expect(element).not.toBeNull();
  await window.evaluate(() => localStorage.clear());
});

test("Select new directory successfully", async () => {
  const window = await app.firstWindow(); // Use const here
  await window.evaluate(() => localStorage.clear());
  await window.goto(fileUrl);

  // Intercept file selection dialog
  await app.evaluate(({ dialog }, testDirectory) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [testDirectory],
    });
  }, testDirectory);

  // Click Select Directory Button
  await window.locator("#selectDirButton").click();
  const dirPathText = await window.locator("#dirPath").innerText();

  // Check that directory was selected
  expect(dirPathText).toMatch(/Current Directory:/);
  await window.evaluate(() => localStorage.clear());
});

test("Cancel directory selection", async () => {
  const window = await app.firstWindow(); // Use const here
  await window.evaluate(() => localStorage.clear());
  await window.goto(fileUrl);

  // Simulate cancellation by setting canceled to true
  await app.evaluate(({ dialog }) => {
    dialog.showOpenDialog = async () => ({
      canceled: true,
      filePaths: [],
    });
  });

  // Click Select Directory Button
  await window.locator("#backButton").click();

  // Listen for alert dialog
  let alertTriggered = false;
  window.on("dialog", async (dialog) => {
    console.log(`Dialog detected: ${dialog.message()}`);
    expect(dialog.type()).toBe("alert"); // Check if it's an alert
    expect(dialog.message()).toContain("Directory selection was canceled.");
    await dialog.accept(); // Accept the alert
    alertTriggered = true;
  });

});