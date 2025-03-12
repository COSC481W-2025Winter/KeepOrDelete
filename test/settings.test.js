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

    //get status of check boxes bofore clicking 
    const txtCheckedBefore = await window.evaluate(() => document.getElementById('txt').checked);
    const pdfCheckedBefore = await window.evaluate(() => document.getElementById('pdf').checked);
    const mp4CheckedBefore = await window.evaluate(() => document.getElementById('mp4').checked);
    const javaCheckedBefore = await window.evaluate(() => document.getElementById('java').checked);

    //Clicking all checkboxes
    await window.click('#txt');
    await window.click('#pdf');
    await window.click('#mp4');
    await window.click('#java');

    //Checking if checkboxes are checked
    const txtChecked = await window.evaluate(() => document.getElementById('txt').checked);
    await expect(txtChecked).toEqual(txtCheckedBefore).toBe(false);
    const pdfChecked = await window.evaluate(() => document.getElementById('pdf').checked);
    await expect(pdfChecked).toBe(true);
    const mp4Checked = await window.evaluate(() => document.getElementById('mp4').checked);
    await expect(mp4Checked).toBe(true);
    const javaChecked = await window.evaluate(() => document.getElementById('java').checked);
    await expect(javaChecked).toBe(true);
    
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
