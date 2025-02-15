const { _electron: electron } = require("playwright");
const path = require("path");
const { test, expect } = require("@playwright/test");

let app;
//init path
const filePath = path.resolve(__dirname, "../src/main_menu.html");
const fileUrl = `file://${filePath}`;

//setting up app
test.beforeAll(async () => {
  app = await electron.launch({ args: ["./"] });
});

//closing app
test.afterAll(async () => {
  await app.close();
});

//settings page button test
test("navigate to settings page", async ({ page }) => {
  //navigate to main menu
  await page.goto(fileUrl);

  //wait for settings button and then click
  await page.waitForSelector("#settings");
  await page.click("#settings");

  //wait for element from settings page to confirm page loaded
  const element = await page.waitForSelector("#text_file");

  //assert element is present
  expect(element).not.toBeNull();
});

//select directory button test
test("select directory functionality", async ({ page }) => {
  //navigate to main menu
  await page.goto(fileUrl);

  //wait for select button and click
  await page.waitForSelector("#SelectButton");
  await page.click("#SelectButton");

  // mock a selected file path in the filepath element
  const mockedFilePath = "/mock/selected/directory";
  await page.evaluate((mockedFilePath) => {
    document.getElementById("filepath").innerText = mockedFilePath;
  }, mockedFilePath);

  //wait for the file path and check if file path was updated correctly
  const filePathElement = await page.waitForSelector("#filepath", {
    state: "visible",
  });
  const updatedFilePath = await filePathElement.innerText();
  expect(updatedFilePath).toBe(mockedFilePath);
});

//test go button when user doesn't select file
test("go button with no file path", async ({ page }) => {
  //navigate to main menu
  await page.goto(fileUrl); // Navigate to the main menu page

  //wait and click go button
  await page.waitForSelector("#goButton");
  await page.click("#goButton");

  // listen for alert dialog (page.on is required for dialog box handling afik)
  page.on("dialog", async (dialog) => {
    //check if alert box pops up and is correct
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toContain("Please select a directory first.");
    //accept alert
    await dialog.accept();
  });
});

//test go button with selected file
test("go button with valid file path", async ({ page }) => {
  //navigate to main menu
  await page.goto(fileUrl);

  //mock file path and put in the filepath element
  const mockedFilePath = "/mock/selected/directory";
  await page.evaluate((mockedFilePath) => {
    document.getElementById("filepath").innerText = mockedFilePath;
  }, mockedFilePath);

  //wait for go button and click
  await page.waitForSelector("#goButton");
  await page.click("#goButton");

  //wait for a selector from keep_or_delete page
  await page.waitForSelector("h1");
  const pageTitle = await page.innerText("h1");
  //compare the text of the selector to confirm page
  expect(pageTitle).toBe("KeepOrDelete");
});
