const { test, expect, _electron: electron } = require('@playwright/test');
let electronApp;

// Custom logging function with date
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["./"] });
});

test.afterAll(async () => {
  await electronApp.close();
});

// Checkbox test for 'txt' only
test('Settings page: toggle txt checkbox and check config update', async () => {
  const window = await electronApp.firstWindow();
  await window.evaluate(() => localStorage.clear());
  await window.click('#settings');

  // Ensure the 'txt' checkbox is checked at the start
  log("Setting 'txt' checkbox to checked...");
  await window.evaluate(() => { document.getElementById('txt').checked = true; });

  // Confirm the checkbox is now checked
  const initialState = await window.evaluate(() => document.getElementById('txt').checked);
  log(`Initial state after setting: ${initialState}`);
  expect(initialState).toBe(true);

  // Toggle 'txt' checkbox
  log("Clicking 'txt' checkbox...");
  await window.click('#txt');

  const newState = await window.evaluate(() => document.getElementById('txt').checked);
  log(`New state: ${newState}`);
  expect(newState).toBe(false); // Since we start as checked, clicking should uncheck it.

  // Check if config file gets updated
  const os = require('os');
  const path = require('path');
  const fs = require('fs');

  let userDataPath;
  log("Checking for config file...");

  if (process.platform === 'win32') {
    userDataPath = path.join(process.env.APPDATA, 'KeepOrDelete');
  } else if (process.platform === 'darwin') {
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'KeepOrDelete');
  } else {
    userDataPath = path.join(os.homedir(), '.config', 'KeepOrDelete');
  }
  const configPath = path.join(userDataPath, 'config.json');

  // Read the config file
  log(`Checking if config file exists at: ${configPath}`);
  expect(fs.existsSync(configPath)).toBe(true);

  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  log("Config Data:", configData);

  log("Checking if 'txt' is in removedFileTypes...");
  expect(Array.isArray(configData.removedFileTypes)).toBe(true);

  const isTxtRemoved = configData.removedFileTypes.includes('txt');
  log(`'txt' in removedFileTypes: ${isTxtRemoved}`);

  expect(isTxtRemoved).toBe(!newState);


  // Reset the checkbox to its original state (checked)
  log("Resetting 'txt' checkbox to checked...");
  await window.click('#txt');

  const resetState = await window.evaluate(() => document.getElementById('txt').checked);
  log(`Reset state: ${resetState}`);
  expect(resetState).toBe(true);

  await window.evaluate(() => localStorage.clear());
});
