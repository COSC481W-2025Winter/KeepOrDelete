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
test("Navigate to KeepOrDelete page", async ({ page }) => {
   //navigate to main menu
   await page.goto(fileUrl);

   //wait for select button and click
   await page.waitForSelector("#SelectButton");
   await page.click("#SelectButton");

   // mock a selected file path in the filepath element
   const mockedFilePath = "/tmp/kod";
   await page.evaluate((mockedFilePath) => {
      document.getElementById("filepath").innerText = mockedFilePath;
   }, mockedFilePath);

   //wait for the file path and check if file path was updated correctly
   const filePathElement = await page.waitForSelector("#filepath", {
      state: "visible",
   });
   const updatedFilePath = await filePathElement.innerText();
   expect(updatedFilePath).toBe(mockedFilePath);

   await page.click("#goButton");

   await page.waitForSelector("#backButton")
});
