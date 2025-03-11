//FOR THIS TEST, ONLY ONE WORKER AT A TIME WORKS, OTHERWISE PROCESSES GET JUMBLED
const { _electron: electron } = require("playwright");
const path = require("path");
const { test, expect } = require("@playwright/test");
const fs = require("fs/promises");

let app;
//entry point in our file tree
const filePath = path.resolve(__dirname, "../src/main_menu.html");
const fileUrl = `file://${filePath}`;

const testDirectory = path.join(__dirname, "test-files"); //test directory and files
const testFiles = [ //array of common file types
    path.join(testDirectory, "test.html"),
    path.join(testDirectory, "test1.txt"),
];

test.afterAll(async () => {
    await app.close();
    try { //deleting test file dir and files REMOVED TO SHOW THAT THEY ARE NO LONGER
        //await fs.rm(testDirectory, { recursive: true, force: true });
        //console.log(`Deleted test directory: ${testDirectory}`);
    } catch (error) {
        //console.error(`Error deleting test directory: ${error}`);
    }
});

test.beforeEach(async () => {
    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all([ //populating test files with their data types
        fs.writeFile(testFiles[0], "<h1>Test</h1>", "utf8"),
        fs.writeFile(testFiles[1], "Text content", "utf8"),
    ]);
    app = await electron.launch({
        args: ["./"],
    });
});

test("will delete common file types", async ({ page }) => {
    //this to line 56 is getting us to keep_or_delete.html
    const window = await app.firstWindow();
    await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));
    // Intercept file selection dialog
    await app.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory], // Inject the test directory
        });
    }, testDirectory);

    // Click to open file picker, but our override will inject testDirectory
    await window.locator("#SelectButton").click();
    await window.locator("#goButton").click();
    await window.waitForURL("**/keep_or_delete.html");

    for (let index in testFiles) {
        const fileExists = await fs.stat(testFiles[index]).then(() => true).catch(() => false);
        expect(fileExists).toBe(true); //iterate through array, stat sees if they exist
    }
    //loop for going through files and deleting each

    await window.waitForTimeout(100);
    await window.locator("#deleteButton").click(); //click delete
    await window.waitForTimeout(300); //wait to ensure it completes
    await window.locator("#deleteButton").click();
    await window.waitForTimeout(300);
    await window.locator("#trash_button").click();

    let ul = await window.locator("ul"); // Adjust the locator if necessary to target the right <ul>
    let ulText = await ul.innerHTML();
    expect(ulText).not.toContain("No deleted files.");
    const undoButtonLocator = window.locator(".deleteUndo"); // Use class to target multiple undo buttons
    await undoButtonLocator.first().waitFor();
    await undoButtonLocator.first().click(); // Click the first undo button
    await window.waitForTimeout(300);
    await undoButtonLocator.first().click(); // Click the first undo button
    await window.waitForTimeout(300);
    const deletedFilesList = await window.locator("#deletedFilesList");
    await deletedFilesList.waitFor(); // Ensure the deleted files list is available
    ulText = await deletedFilesList.innerHTML();
    expect(ulText).toContain("No deleted files.");
    await window.locator("#navMainMenu").click();
    await window.waitForTimeout(300);
    await window.locator("#nextButton").click();
    await window.waitForTimeout(200);
    await window.locator("#deleteButton").click(); //click delete
    await window.waitForTimeout(300);
    await window.locator("#finalPageButton").click();
    ul = await window.locator("#keptFilesList");
    ulText = await ul.innerHTML();
    expect(ulText).not.toContain("No kept files.");
    ul = await window.locator("#deletedFilesList");
    ulText = await ul.innerHTML();
    expect(ulText).not.toContain("No deleted files.")
    //const fileExists = await fs.stat(testFiles[testFiles.indexOf(index)]).then(() => true).catch(() => false);
    //expect(fileExists).toBe(false); //same thing as last test, but ensure it is FALSE now
    //await window.waitForTimeout(100);

});


