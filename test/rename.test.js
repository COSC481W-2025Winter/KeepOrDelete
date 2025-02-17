const { test, expect, _electron: electron } = require('@playwright/test');
const path = require("path");
const fs = require("fs/promises");

let electronApp;
const testDirectory = path.join(__dirname, "test-files");

// Test files
const testFiles = [
    path.join(testDirectory, "testFile.txt"),
    path.join(testDirectory, "testFile.pdf"),
    path.join(testDirectory, "testFile.html"),
    path.join(testDirectory, "testFile.json"),
    path.join(testDirectory, "testFile.mp3"),
    path.join(testDirectory, "testFile.zip"),
    path.join(testDirectory, "testFile.jpeg"),
];

// Launch the Electron app
test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ["./"] });

    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all([
        fs.writeFile(testFiles[0], "Text content", "utf8"),
        fs.writeFile(testFiles[1], JSON.stringify({ key: "value" }), "utf8"),
        fs.writeFile(testFiles[2], "<h1>Test</h1>", "utf8"),
        fs.writeFile(testFiles[3], Buffer.from("%PDF-1.4\n...", "binary")),
        fs.writeFile(testFiles[4], Buffer.from([255, 216, 255, 224, 0, 16]), "binary"),
        fs.writeFile(testFiles[5], Buffer.from([0x49, 0x44, 0x33]), "binary"),
        fs.writeFile(testFiles[6], Buffer.from([0x50, 0x4B, 0x03, 0x04]), "binary"),
    ]);
});

// Closing the app
test.afterAll(async () => {
    await electronApp.close();
    try {
        await fs.rm(testDirectory, { recursive: true, force: true });
        console.log(`Deleted test directory: ${testDirectory}`);
    } catch (error) {
        console.error(`Error deleting test directory: ${error}`);
    }
});


test("shows error notification for empty rename input (single file)", async ({ page }) => {
    const window = await electronApp.firstWindow();
    
    await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));

    await electronApp.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory],
        });
    }, testDirectory);

    await window.locator("#SelectButton").click();
    await window.locator("#goButton").click();
    await window.waitForURL("**/keep_or_delete.html");

    // Ensure input is empty and click rename button
    await window.locator("#renameInput").fill("");
    await window.locator("#renameButton").click();

    // Explicitly wait for the error notification
    const notification = window.locator("#notification");
    await expect(notification).toBeVisible()
    await expect(notification).toHaveText("Please enter a new file name.");
});




test("will rename common file types", async () => {
    const window = await electronApp.firstWindow();

    await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));

    // Intercept file selection dialog
    await electronApp.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory], // Inject the test directory
        });
    }, testDirectory);

    // Click to open file picker, but our override will inject testDirectory
    await window.locator("#SelectButton").click();
    await window.locator("#goButton").click();
    await window.waitForURL("**/keep_or_delete.html");

    for (let originalFilePath of testFiles) {
        const renamedFilePath = originalFilePath.replace(/(.*)(\..*)$/, "$1_renamed$2");

        await window.locator("#renameInput").fill(path.basename(renamedFilePath));

        await window.locator("#renameButton").click();
        //await window.waitForTimeout(2000);

        const renamedExists = await fs.stat(renamedFilePath).then(() => true).catch(() => false);
        expect(renamedExists).toBe(true);

        await window.locator("#nextButton").click();
    }
});









test("checks that original files are deleted", async () => {
    for (let originalFilePath of testFiles) {
        const originalExists = await fs.stat(originalFilePath).then(() => true).catch(() => false);
        console.log(`Checking original file: ${originalFilePath} - Exists: ${originalExists}`);
        expect(originalExists).toBe(false);
    }
});
