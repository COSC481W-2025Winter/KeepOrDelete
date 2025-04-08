const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('path');
const fs = require('fs/promises');

let electronApp;
const testDirectory = path.join(__dirname, 'test-files');

// Test files
const testFiles = [
    path.join(testDirectory, 'A.txt'),
    path.join(testDirectory, 'b.txt'),
    path.join(testDirectory, 'c.txt'),
];

test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['./', '--test-config'], userAgent: 'Playwright' });

    await fs.mkdir(testDirectory, { recursive: true });
    await Promise.all(testFiles.map(file => fs.writeFile(file, 'Sample', 'utf8')));

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

test('Sort dropdown sorts files alphabetically A→Z and Z→A', async () => {
    const window = await electronApp.firstWindow();
    await window.evaluate(() => localStorage.clear());
    await window.goto("file://" + path.resolve(__dirname, "../src/renderer/index.html"));

    // Mock file selection dialog
    await electronApp.evaluate(({ dialog }, testDirectory) => {
        dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [testDirectory],
        });
    }, testDirectory);

    // Click to select directory and go to KeepOrDelete page
    await window.locator('#selectDirButton').click();
    const getCurrentFileName = async () => {
        return await window.locator('#currentItem').innerText();
    };

    await window.locator('#currentItem').waitFor({ state: 'visible' });
    await expect(window.locator('#currentItem')).not.toHaveText(''); // wait until
    // Default should be A→Z
    let fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toEqual('a.txt');

    // Change to Z→A
    await window.locator('#sortOrder').selectOption('desc name');
    await window.waitForTimeout(500); // allow re-sort/render

    fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toEqual('c.txt');

    // Change back to A→Z
    await window.locator('#sortOrder').selectOption('asc name');
    await window.waitForTimeout(500);

    fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toEqual('a.txt');

    await window.evaluate(() => localStorage.clear());
});