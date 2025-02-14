const { _electron: electron } = require("playwright");
const path = require("path");
const { test, expect } = require("@playwright/test");
const fs = require("fs/promises");

let app; //used for entry

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
    try {
        await fs.rm(testDirectory, { recursive: true, force: true }); // Delete directory and all files inside
        console.log(`Deleted test directory: ${testDirectory}`);
    } catch (error) {
        console.error(`Error deleting test directory: ${error}`);
    }
});

test.beforeEach(async () => {
    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all([
        fs.writeFile(testFiles[0], "Text content", "utf8"),
        fs.writeFile(testFiles[1], JSON.stringify({ key: "value" }), "utf8"),
        fs.writeFile(testFiles[2], "<h1>Test</h1>", "utf8"),
        fs.writeFile(testFiles[3], Buffer.from("%PDF-1.4\n...", "binary")),
        fs.writeFile(testFiles[4], Buffer.from([255, 216, 255, 224, 0, 16]), "binary"),
        fs.writeFile(testFiles[5], Buffer.from([0x49, 0x44, 0x33]), "binary"), // MP3 header
        fs.writeFile(testFiles[6], Buffer.from([0x50, 0x4B, 0x03, 0x04]), "binary"), // ZIP header
    ]);
    app = await electron.launch({
        args: ["./"],
    });
});

test("will delete common file types", async ({ page }) => {
    await page.goto(fileUrl);

    await page.locator("#SelectButton").click();
    await page.evaluate((testDirectory) => {
        document.getElementById("filepath").innerText = testDirectory;
    }, testDirectory);

    await page.locator("#goButton").click();
    await page.waitForURL("**/keep_or_delete.html");


    for (let index in testFiles) {
        const fileExists = await fs.stat(testFiles[index]).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
    }
    for (let index of testFiles) {
        await page.locator("#deleteButton").click();
        await page.waitForTimeout(500); // Wait for deletion
        const fileExists = await fs.stat(testFiles[index]).then(() => true).catch(() => false);
        expect(fileExists).toBe(false); // Assert after each delete
        await page.locator("#nextButton").click();
    }


});

