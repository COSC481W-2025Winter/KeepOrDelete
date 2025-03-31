const { test, expect, _electron: electron } = require('@playwright/test');
const path = require("path");
const fs = require("fs/promises");

let electronApp;
const testDirectory = path.join(__dirname, "test-files");

// Test files to be "kept"
const keptFiles = [
    path.join(testDirectory, "keptFile1.txt"),
    path.join(testDirectory, "keptFile2.txt"),
    path.join(testDirectory, "keptFile3.txt"),
];

test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ["./", "--test-config"], userAgent: "Playwright"  });

    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all(
        keptFiles.map(file => fs.writeFile(file, "Kept file content", "utf8"))
    );

    // Ensure LocalStorage is cleared before each test
    const window = await electronApp.firstWindow();
    await window.evaluate(() => localStorage.clear());
});

test.afterAll(async () => {
    await electronApp.close();
    try {
        await fs.rm(testDirectory, { recursive: true, force: true });
    } catch (error) {
        console.error(`Error deleting test directory: ${error}`);
    }
});

test("Kept files should appear in the final kept files list and allow renaming", async () => {
    const window = await electronApp.firstWindow();
    await window.evaluate(() => localStorage.clear());
    await window.goto("file://" + path.resolve(__dirname, "../src/main_page/keep_or_delete.html"));

    // Mock file selection dialog
    await electronApp.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory], // Inject test directory
        });
    }, testDirectory);

    // Click to select directory and go to KeepOrDelete page
    await window.locator("#selectDirButton").click();
    //await window.locator("#goButton").click();
    //await window.waitForURL("**/keep_or_delete.html");

    // Keep all files 
    for (let i = 0; i < keptFiles.length; i++) {
        console.log(`Keeping file: ${keptFiles[i]}`);
        await window.locator("#nextButton").click(); // Uses app's logic to mark as kept
        await window.waitForTimeout(500); // Wait for UI updates
    }

    // Ensure keptFiles is saved correctly before moving to final page
    const fileObjectsBeforeFinalPage = await window.evaluate(() => {
        return JSON.parse(localStorage.getItem("fileObjects")) || [];
    });   
    const keptBeforeFinalPage = fileObjectsBeforeFinalPage.filter(f => f.status === "keep");
    expect(keptBeforeFinalPage.length).toBe(keptFiles.length);

    // Click finalize button to navigate to final page
    await window.locator("#finalPageButton").click();
    await window.waitForURL("**/final_page.html");

    const fileObjectsFinalPage = await window.evaluate(() => {
        return JSON.parse(localStorage.getItem("fileObjects")) || [];
    });
    const keptFinal = fileObjectsFinalPage.filter(f => f.status === "keep");
    const deletedFinal = fileObjectsFinalPage.filter(f => f.status === "delete");

    // Check if the amount of kept files and deleted files are correct
    expect(keptFinal.length).toBe(keptFiles.length);
    expect(deletedFinal.length).toBe(0);

    // Ensure UI displays "No Deleted Files"
    const deletedText = await window.locator("#deletedFilesList").innerText();
    //console.log("Deleted Files UI Text:", deletedFilesText);
    expect(deletedText.toLowerCase()).toContain("no deleted files");

    // Wait for input fields to appear in kept files list
    await window.waitForSelector("#keptFilesList input", { timeout: 5000 });

    const inputCount = await window.locator("#keptFilesList input").count();
    expect(inputCount).toBe(keptFiles.length);
    //console.log("Total Inputs Found in UI:", inputCount);

    // Validate file input values match expected filenames
    for (let i = 0; i < keptFiles.length; i++) {
        const file = keptFiles[i];
        const fileName = path.basename(file);

        const inputField = window.locator("#keptFilesList input").nth(i);
        await expect(inputField).toHaveValue(fileName);

        // Test renaming functionality
        const newFileName = `Renamed_${fileName}`;
        await inputField.fill(newFileName);
        await inputField.press("Enter");

        // Wait for localStorage update
        await window.waitForTimeout(500);

        // Ensure value updates in UI
        await expect(inputField).toHaveValue(newFileName);

        const updatedFileObjects = await window.evaluate(() => {
            return JSON.parse(localStorage.getItem("fileObjects")) || [];
        });

        // Check if the old file is there
        const oldFileName = updatedFileObjects.some(
            f => f.status === "keep" && f.name === fileName
        );
        expect(oldFileName).toBeFalsy();

        // Check if the renamed file is here
        const updatedFileName = updatedFileObjects.some(
            f => f.status === "keep" && f.name === newFileName
        );
        expect(updatedFileName).toBeTruthy();
    }

    // Test Finalization Process
    await window.locator("#finalizeButton").click();
    await window.waitForTimeout(300);

    // Ensure that fileObjects is now emptied
    const hasFileObjects = await window.evaluate(() => localStorage.getItem("fileObjects") !== null);
    expect(hasFileObjects).toBe(false);
});
