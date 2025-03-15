const { test, expect, _electron: electron } = require('@playwright/test');
let electronApp;
const fileTypes = ['py', 'java', 'js', 'jar', 'txt', 'csv', 'pdf', 'md', 'doc', 'docx', 'pptx', 'png', 'jpg', 'mp4', 'wav', 'mp3'];

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["./"] });
});

test.afterAll(async () => {
  await electronApp.close();
});

// Navigation test
test('Navigation to and from settings page', async () => {
  const window = await electronApp.firstWindow();
  await window.click('#settings');
  await expect(window).toHaveURL(/settings\.html/);
  await window.click('#backButton');
  await expect(window).toHaveURL(/main_menu\.html/);
});

// Checkbox test
test('Settings page selectables are checked and unchecked', async () => {
  const window = await electronApp.firstWindow();
  await window.click('#settings');

  // Get current states
  const initialStates = {};
  for (const type of fileTypes) {
    initialStates[type] = await window.evaluate((id) => document.getElementById(id).checked, type);
  }

  // Click each checkbox
  for (const type of fileTypes) {
    await window.click(`#${type}`);
    const currentState = await window.evaluate((id) => document.getElementById(id).checked, type);
    expect(currentState).toBe(!initialStates[type]);
  }

  // Turn back to original state
  for (const type of fileTypes) {
    await window.click(`#${type}`);
    const currentState = await window.evaluate((id) => document.getElementById(id).checked, type);
    expect(currentState).toBe(initialStates[type]);
  }
  await window.waitForTimeout(500);
});

// Config file test
test('Config file exists', async () => {
  const window = await electronApp.firstWindow();
  const os = require('os');
  const path = require('path');
  const fs = require('fs');

  let userDataPath;
  await window.waitForTimeout(500);
  if (process.platform === 'win32') {
    userDataPath = path.join(process.env.APPDATA, 'KeepOrDelete');
  } else if (process.platform === 'darwin') {
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'KeepOrDelete');
  } else {
    userDataPath = path.join(os.homedir(), '.config', 'KeepOrDelete');
  }
  const configPath = path.join(userDataPath, 'config.json');

  
  const existsBefore = fs.existsSync(configPath);
  if (existsBefore) {
    fs.rmSync(configPath);
  }
  const existsAfter = fs.existsSync(configPath);
  expect(existsBefore).toBe(true);
  expect(existsAfter).toBe(false);

  
});
