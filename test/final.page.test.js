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
        console.log(`Deleted test directory: ${testDirectory}`);
    } catch (error) {
        console.error(`Error deleting test directory: ${error}`);
    }
});

test("kept files should appear in the final kept files list", async () => {
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

    // Keep all files by navigating through them
    for (let i = 0; i < keptFiles.length + 1; i++) {
        await window.evaluate(() => {
            let keptFilesList = JSON.parse(localStorage.getItem("keptFiles")) || [];
            let currentFile = document.getElementById("currentItem").innerText.replace("Current File: \n", "").trim();

            // Only add if it's not already in the list
            if (!keptFilesList.includes(currentFile) && currentFile.startsWith("C:\\")) {
                keptFilesList.push(currentFile);
            }

            // Save updated list
            localStorage.setItem("keptFiles", JSON.stringify(keptFilesList));

            // Debugging: Print stored kept files after every update
            console.log("Updated Kept Files in Storage:", keptFilesList);
        });

        // Navigate to next file if it's not the last one
        if (i < keptFiles.length) {
            await window.locator("#nextButton").click();
        }
    }

    // **Ensure finalize button exists before clicking**
    const finalizeButton = window.locator("#finalPageButton");
    await expect(finalizeButton).toBeVisible({ timeout: 5000 });

    // **Click finalize button to navigate to the final page**
    await finalizeButton.click();

    // **Ensure we wait for the final page to load**
    await window.waitForURL("**/final_page.html");

    // **Check localStorage again after arriving at final page**
    const storedKeptFilesFinalPage = await window.evaluate(() => localStorage.getItem("keptFiles"));
    console.log("Kept Files on Final Page (localStorage):", storedKeptFilesFinalPage);

    // **Wait for all input fields to appear**
    await window.waitForSelector("#keptFilesList input", { timeout: 5000 });

    // Debugging: Print the number of input fields detected
    const inputCount = await window.locator("#keptFilesList input").count();
    console.log("Total Inputs Found in UI:", inputCount);

    // **Print all input values before testing them**
    const inputValues = await window.locator("#keptFilesList input").evaluateAll(inputs =>
        inputs.map(input => input.value)
    );
    console.log("Input Field Values in UI:", inputValues);

    // Verify each kept file appears as an input field
    for (let file of keptFiles) {
        const fileName = path.basename(file);

        // Debugging: Log expected file name
        console.log("Checking for input field with value:", fileName);

        // Validate the input field exists and has the correct value
        const inputField = window.locator("#keptFilesList input").nth(keptFiles.indexOf(file));
        await expect(inputField).toHaveValue(fileName);
    }
});
