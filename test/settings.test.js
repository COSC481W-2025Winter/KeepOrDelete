const { test, expect, _electron: electron } = require('@playwright/test');

let electronApp;

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["./"] });
});

// Closing the app
test.afterAll(async () => {
  await electronApp.close();
});
 

test('Navigation to and from settings page', async () => {
  
  // Get the first BrowserWindow (which loads src/main_menu.html).
  const window = await electronApp.firstWindow();

  await window.click('#settings');
  await expect(window.url()).toContain('settings.html');

  await window.click('#backButton');
  await expect(window.url()).toContain('main_menu.html');
});

test('Settings page selectables are checked', async () => {
    const window = await electronApp.firstWindow();
    
    await window.click('#settings');

    //Clicking all checkboxes
    await window.click('#text_file');
    await window.click('#docx_file');
    await window.click('#image_file');
    await window.click('#html_file');

    //Checking if checkboxes are checked
    const txtChecked = await window.evaluate(() => document.getElementById('text_file').checked);
    await expect(txtChecked).toBe(true);
    const docxChecked = await window.evaluate(() => document.getElementById('docx_file').checked);
    await expect(docxChecked).toBe(true);
    const imgChecked = await window.evaluate(() => document.getElementById('image_file').checked);
    await expect(imgChecked).toBe(true);
    const htmlChecked = await window.evaluate(() => document.getElementById('html_file').checked);
    await expect(htmlChecked).toBe(true);
    
    // Vice versa
    await window.click('#text_file');
    await window.click('#docx_file');
    await window.click('#image_file');
    await window.click('#html_file');

    const htmlChecked2 = await window.evaluate(() => document.getElementById('html_file').checked);
    expect(htmlChecked2).toBe(false);
    const imgChecked2 = await window.evaluate(() => document.getElementById('image_file').checked);
    expect(imgChecked2).toBe(false);
    const docxChecked2 = await window.evaluate(() => document.getElementById('docx_file').checked);
    expect(docxChecked2).toBe(false);
    const txtChecked2 = await window.evaluate(() => document.getElementById('text_file').checked);
    expect(txtChecked2).toBe(false);
 });
