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
    path.join(testDirectory, "testFile.txt"),
    path.join(testDirectory, "testFile.pdf"),
    path.join(testDirectory, "testFile.html"),
    path.join(testDirectory, "testFile.json"),
    path.join(testDirectory, "testFile.mp3"),
    path.join(testDirectory, "testFile.zip"),
    path.join(testDirectory, "testFile.jpeg"),
];


test.afterAll(async () => {
    await app.close();
    try { //deleting test file dir and files
        await fs.rm(testDirectory, { recursive: true, force: true });
        console.log(`Deleted test directory: ${testDirectory}`);
    } catch (error) {
        console.error(`Error deleting test directory: ${error}`);
    }
});

test.beforeEach(async () => {
    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all([ //populating test files with their data types
        fs.writeFile(testFiles[0], "Text content", "utf8"),
        fs.writeFile(testFiles[1], JSON.stringify({ key: "value" }), "utf8"),
        fs.writeFile(testFiles[2], "<h1>Test</h1>", "utf8"),
        fs.writeFile(testFiles[3], Buffer.from("%PDF-1.4\n...", "binary")),
        fs.writeFile(testFiles[4], Buffer.from([255, 216, 255, 224, 0, 16]), "binary"),
        fs.writeFile(testFiles[5], Buffer.from([0x49, 0x44, 0x33]), "binary"),
        fs.writeFile(testFiles[6], Buffer.from([0x50, 0x4B, 0x03, 0x04]), "binary"),
    ]);
    app = await electron.launch({
        args: ["./"],
    });
});

test("will rename common file types", async ({ page }) => {
    await page.goto(fileUrl); //goto home page
    await page.locator("#SelectButton").click();
    await page.evaluate((testDirectory) => {
        document.getElementById("filepath").innerText = testDirectory;
    }, testDirectory); //select our test directory initialized at top of file

    await page.locator("#goButton").click();
    await page.waitForURL("**/keep_or_delete.html"); //goto keep_or_delete.html


    for (let index in testFiles) {
        const fileExists = await fs.stat(testFiles[index]).then(() => true).catch(() => false);
        expect(fileExists).toBe(true); //iterate through array, stat sees if they exist
    }
    for (let originalFilePath of testFiles) {
        const renamedFilePath = originalFilePath.replace(/(.*)(\..*)$/, "$1_renamed$2");

        // Click rename button and wait
        const renameInput = page.locator("#renameInput");
        expect(renameInput).toBeVisible();
        console.log("path basename: " + path.basename(renamedFilePath))
        await page.locator("#renameInput").fill(path.basename(renamedFilePath));
        await page.waitForTimeout(2000);
        console.log("inner html:  '" + await page.locator("#renameInput").inputValue());
        
        await page.locator("#renameButton").click();
        await page.waitForTimeout(2000); // Simulate renaming process delay

        // Verify the original file is gone and the renamed file exists
        
        const originalExists = await fs.stat(originalFilePath).then(() => true).catch(() => false);
        const renamedExists = await fs.stat(renamedFilePath).then(() => true).catch(() => false);
        console.log(`Checking original: ${originalFilePath}`);
        console.log(`Checking renamed: ${renamedFilePath}`);
        console.log(`Original Exists: ${originalExists}, Renamed Exists: ${renamedExists}`);

        expect(originalExists).toBe(false);
        expect(renamedExists).toBe(true);
        
    }


});


