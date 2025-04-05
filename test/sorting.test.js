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

test.beforeEach(async () => {
    electronApp = await electron.launch({ args: ['./', '--test-config'], userAgent: 'Playwright' });

    await fs.mkdir(testDirectory, { recursive: true });
    await fs.writeFile(path.join(testDirectory, 'A.txt'), 'aa', 'utf8');
    await fs.writeFile(path.join(testDirectory, 'b.txt'), 'a', 'utf8');
    await fs.writeFile(path.join(testDirectory, 'c.txt'), 'aaa', 'utf8');

    const window = await electronApp.firstWindow();
    await window.evaluate(() => localStorage.clear());
});


test.afterEach(async () => {
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
    await window.goto("file://" + path.resolve(__dirname, "../src/main_page/keep_or_delete.html"));

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
        const text = await window.locator('#currentItem').innerText();
        return text.replace('Current File: ', '').trim();
    };

    await expect(window.locator('#currentItem')).toHaveText(/Current File: .+/);
    // Default should be A→Z
    let fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toBe('a.txt');

    // Change to Z→A
    await window.locator('#sortOrder').selectOption('desc');
    await window.waitForTimeout(500); // allow re-sort/render

    fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toBe('c.txt');

    // Change back to A→Z
    await window.locator('#sortOrder').selectOption('asc');
    await window.waitForTimeout(500);

    fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toBe('a.txt');

    await window.evaluate(() => localStorage.clear());
});

test('sort by file size', async () => {
    const window = await electronApp.firstWindow();
    await window.evaluate(() => localStorage.clear());
    await window.goto("file://" + path.resolve(__dirname, "../src/main_page/keep_or_delete.html"));

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
        const text = await window.locator('#currentItem').innerText();
        return text.replace('Current File: ', '').trim();
    };

    await expect(window.locator('#currentItem')).toHaveText(/Current File: .+/);
    // Default should be A→Z
    let fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toBe('a.txt');

    // Change to Z→A
    await window.locator('#sortOrder').selectOption('up');
    await window.waitForTimeout(500); // allow re-sort/render

    fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toBe('b.txt');

    await window.locator('#sortOrder').selectOption('down');
    await window.waitForTimeout(500); // allow re-sort/render

    fileName = await getCurrentFileName();
    expect(fileName.toLowerCase()).toBe('c.txt');
});