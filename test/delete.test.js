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
    await fs.rm(testDirectory, { recursive: true }); //remove test directory and remaining test file
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

test("will delete common file types with next button", async ({ page }) => {
    //this to line 56 is getting us to keep_or_delete.html
    const window = await app.firstWindow();
    await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));
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
    await window.waitForTimeout(100);
    await window.locator("#deleteButton").click();
    await window.waitForTimeout(300); //wait to ensure it completes after actions
    await window.locator("#deleteButton").click();
    await window.waitForTimeout(300);
    await window.locator("#trash_button").click(); //nav to file page
    let ul = await window.locator("ul");
    let ulText = await ul.innerHTML();
    expect(ulText).not.toContain("No deleted files."); //check there is a file in deleted
    const undoButtonLocator = window.locator(".deleteUndo");
    await undoButtonLocator.first().waitFor();
    await undoButtonLocator.first().click();
    await window.waitForTimeout(300);
    await undoButtonLocator.first().click();
    await window.waitForTimeout(300);
    const deletedFilesList = await window.locator("#deletedFilesList");
    await deletedFilesList.waitFor();
    ulText = await deletedFilesList.innerHTML();
    expect(ulText).toContain("No deleted files."); //check there is not a file in deleted now
    await window.locator("#navMainMenu").click();
    await window.waitForTimeout(300);
    await window.locator("#nextButton").click();
    await window.waitForTimeout(200);
    await window.locator("#deleteButton").click();
    await window.waitForTimeout(300);
    await window.locator("#finalPageButton").click();
    ul = await window.locator("#keptFilesList");
    ulText = await ul.innerHTML();
    expect(ulText).not.toContain("No kept files."); //check there is a file being kept
    ul = await window.locator("#deletedFilesList");
    ulText = await ul.innerHTML();
    expect(ulText).not.toContain("No deleted files."); //check there is a file being deleted
    await window.locator("#finalizeButton").click();
    //this is tricky because of playwright -- have to loop and wait twice for os time to remove from dir
    const testFilePath = path.resolve(testDirectory, "test1.txt");
    let fileDeleted = false;
    const maxRetries = 2;
    let attempts = 0;
    while (attempts < maxRetries) {
        const fileExists = await fs.stat(testFilePath).then(() => true).catch(() => false);
        if (!fileExists) {
            fileDeleted = true;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 500)); //adds a timeout to ensure has time for deletion
        attempts++;
    }
    expect(fileDeleted).toBe(true); //now checks file is gone
});
test("will delete common file types with swiping", async ({ page }) => {
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
    for (let index of testFiles) {
        await window.waitForTimeout(100);
        const previewContainer = await window.locator("#previewContainer");
        await previewContainer.hover();
        await previewContainer.dragTo(await window.locator("#deleteButton"));
        // Need timeout to account for animation!!
        await window.waitForTimeout(500);
        const fileExists = await fs.stat(testFiles[testFiles.indexOf(index)]).then(() => true).catch(() => false);
        expect(fileExists).toBe(false); //same thing as last test, but ensure it is FALSE now
        await window.locator("#nextButton").click(); //next file
        //await window.waitForTimeout(100);
    }
});

