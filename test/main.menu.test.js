const { test, expect, _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs/promises");

let app;
//init path
const filePath = path.resolve(__dirname, "../src/main_menu.html");
const fileUrl = `file://${filePath}`;

//test directory
const testDirectory = path.join(__dirname, "test-files");

//setting up app
test.beforeAll(async () => {
  app = await electron.launch({ args: ["./"] });
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
  await window.waitForSelector("#settings");
  await window.click("#settings");

  //wait for element from settings window to confirm window loaded
  const element = await window.waitForSelector("#txt");

  //assert element is present
  expect(element).not.toBeNull();
  await window.evaluate(() => localStorage.clear());
});

//test go button when user doesn't select file
test("go button with no file path", async () => {
  const window = await app.firstWindow();
  await window.evaluate(() => localStorage.clear());
  //navigate to main menu
  await window.goto(fileUrl); // Navigate to the main menu window

  // listen for alert dialog (window.on is required for dialog box handling afik)
  window.on("dialog", async (dialog) => {
    //check if alert box pops up and is correct
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toContain("Please select a directory first.");
    //accept alert
    await dialog.accept();
  });

  //wait and click go button
  await window.waitForSelector("#goButton");
  await window.click("#goButton");
  await window.evaluate(() => localStorage.clear());
});

//test go button with selected file
test("go button with valid file path", async () => {
  const window = await app.firstWindow();
  await window.evaluate(() => localStorage.clear());
  //navigate to main menu
  await window.goto(fileUrl);

  // Intercept file selection dialog
  await app.evaluate(({ dialog }, testDirectory) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [testDirectory], // Inject the test directory
    });
  }, testDirectory);

  await window.locator("#SelectButton").click();

  //wait for go button and click
  await window.waitForSelector("#goButton");
  await window.click("#goButton");

  //wait for a selector from keep_or_delete window
  await window.waitForSelector("h1");

  // Get the title of the window
  const windowTitle = await window.innerText("h1");

  // compare the text of the selector to confirm window
  expect(windowTitle).toBe("KeepOrDelete");
  await window.evaluate(() => localStorage.clear());
});
