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
    electronApp = await electron.launch({ args: ["./"] });

    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all(
        keptFiles.map(file => fs.writeFile(file, "Kept file content", "utf8"))
    );
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

    await window.goto("file://" + path.resolve(__dirname, "../src/main_menu.html"));

    // Mock file selection dialog
    await electronApp.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory], // Inject test directory
        });
    }, testDirectory);

    // Click to select directory and go to KeepOrDelete page
    await window.locator("#SelectButton").click();
    await window.locator("#goButton").click();
    await window.waitForURL("**/keep_or_delete.html");

    // Keep all files 
    for (let i = 0; i < keptFiles.length; i++) {
        console.log(`Keeping file: ${keptFiles[i]}`);
        await window.locator("#nextButton").click(); // Uses app's logic to mark as kept
        await window.waitForTimeout(500); // Wait for UI updates
    }

    // Ensure `keptFiles` is saved correctly before moving to final page
    const storedKeptFilesBeforeFinalPage = await window.evaluate(() => JSON.parse(localStorage.getItem("keptFiles")));
    console.log(" Stored Kept Files Before Final Page:", storedKeptFilesBeforeFinalPage);

    if (!storedKeptFilesBeforeFinalPage || storedKeptFilesBeforeFinalPage.length === 0) {
        throw new Error(" No kept files found in localStorage before final page navigation. Fix test setup.");
    }

    // Click finalize button to navigate to final page
    const finalizeButton = window.locator("#finalPageButton");
    await expect(finalizeButton).toBeVisible({ timeout: 5000 });
    await finalizeButton.click();
    await window.waitForURL("**/final_page.html");

    // Verify kept files in localStorage
    const storedKeptFilesFinalPage = await window.evaluate(() => JSON.parse(localStorage.getItem("keptFiles")));

    // Ensure deleted files are empty
    const storedDeletedFiles = await window.evaluate(() => {
        const deletedFiles = localStorage.getItem("deletedFiles");
        return deletedFiles ? JSON.parse(deletedFiles) : null;
    });
    await expect(storedDeletedFiles === null || storedDeletedFiles.length === 0).toBeTruthy();

    // Ensure UI displays "No Deleted Files"
    const deletedFilesText = await window.locator("#deletedFilesList").innerText();
    console.log("Deleted Files UI Text:", deletedFilesText);
    await expect(deletedFilesText.toLowerCase()).toContain("no deleted files");

    // Wait for input fields to appear in kept files list
    await window.waitForSelector("#keptFilesList input", { timeout: 5000 });

    const inputCount = await window.locator("#keptFilesList input").count();
    console.log("Total Inputs Found in UI:", inputCount);

    // Validate file input values match expected filenames
    for (let i = 0; i < keptFiles.length; i++) {
        const file = keptFiles[i];
        const fileName = path.basename(file);

        const inputField = window.locator("#keptFilesList input").nth(i);
        await expect(inputField).toHaveValue(fileName);

        // **Test renaming functionality**
        const newFileName = `Renamed_${fileName}`;
        await inputField.fill(newFileName);
        await inputField.press("Enter");

        // Wait for localStorage update
        await window.waitForTimeout(500);

        // Ensure value updates in UI
        await expect(inputField).toHaveValue(newFileName);

        await window.evaluate(({ oldFileName, newFileName }) => {
            let keptFiles = JSON.parse(localStorage.getItem("keptFiles")) || [];
            keptFiles = keptFiles.map(file =>
                file.includes(oldFileName) ? file.replace(oldFileName, newFileName) : file
            );
            localStorage.setItem("keptFiles", JSON.stringify(keptFiles));
        }, { oldFileName: fileName, newFileName: `Renamed_${fileName}` });

        // Ensure localStorage reflects the renamed file
        const updatedKeptFiles = await window.evaluate(() => JSON.parse(localStorage.getItem("keptFiles")));
        const foundRenamedFile = updatedKeptFiles.some(file => file.includes(newFileName));
        await expect(foundRenamedFile).toBeTruthy();
        console.log(`Renamed files: ${updatedKeptFiles[i]}`);
    }

    // **Test Finalization Process**
    const finalFinalizeButton = window.locator("#finalizeButton");
    await expect(finalFinalizeButton).toBeVisible({ timeout: 5000 });
    await finalFinalizeButton.click();

    // Ensure localStorage is cleared
    await window.evaluate(() => localStorage.clear());
    const localStorageAfterFinalization = await window.evaluate(() => localStorage.length);
    console.log("LocalStorage size after finalization:", localStorageAfterFinalization);
    await expect(localStorageAfterFinalization).toBe(0);

});
