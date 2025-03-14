const { test, expect, _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs/promises");

// Create test directory variable
const testDirectory = path.join(__dirname, "test-files");

let electronApp;
// Creating test files
const testFiles = [
    path.join(testDirectory, "testFile.txt"),
    path.join(testDirectory, "testFile2.txt"),
];

// Launch the Electron app
test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ["./"] });

    // Create file contents
    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all([
        fs.writeFile(testFiles[0], "Name this file 'hi'", "utf8"),
        fs.writeFile(testFiles[1], "", "utf8"),
    ]);
});

// Closing the app
test.afterAll(async () => {
    await electronApp.close();
    // Delete test directory
    try {
        await fs.rm(testDirectory, { recursive: true, force: true });
        console.log(`Deleted test directory: ${testDirectory}`);
    } catch (error) {
        console.error(`Error deleting test directory: ${error}`);
    }
});

test("Clicking on AI button with empty file returns expected message", async ({
    page,
}) => {
    const window = await electronApp.firstWindow();

    // Load mock directory
    await electronApp.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory],
        });
    }, testDirectory);

    // Override the API call to avoid burning tokens.
    await window.evaluate(() => {
        window.openai = {
            openaiRequest: async (args) => {
                return {
                    choices: [
                        {
                            message: { content: "dummy suggestion" },
                        },
                    ],
                };
            },
        };
    });

    // Navigate to keep or delete page with mock directory
    await window.click("#SelectButton");
    await window.click("#goButton");
    await expect(window.url()).toContain("keep_or_delete.html");

    // Make sure selected file has contents. This would be passed on to AWS Lambda
    await window.click("#aiButton");
    const popupContentLocator = window.locator("#popupContent");
    await expect(popupContentLocator).toContainText("Thinking...");

    // Make sure selected file is empty. This would not be passed on to AWS Lambda.
    await window.click("#nextButton");
    await window.click("#aiButton");
    await expect(popupContentLocator).toContainText("No file contents found.");
});
