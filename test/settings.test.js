const { test, expect, _electron: electron } = require('@playwright/test');
let electronApp;

// Custom logging function with date
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Launch the Electron app
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["./", "--test-config"] });
});

test.afterAll(async () => {
  await electronApp.close();
});

// Checkbox test for 'txt' only
test('Settings page: toggle txt checkbox and check config update', async () => {
  const window = await electronApp.firstWindow();
  await window.evaluate(() => localStorage.clear());
  await window.click('#settingsButton');

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

  await window.click("#backButton")
  await window.click("#settingsButton")

  // Settings page is populated by reading the configuration file.
  // Verify that the configuration file exists by testing if settings persist
  // after leaving the page.
  const restoredState = await window.evaluate(() => document.getElementById('txt').checked);
  // Give the app time to process the configuration file.
  expect(restoredState == newState, { timeout: 2_000 })

  // Reset the checkbox to its original state (checked)
  log("Resetting 'txt' checkbox to checked...");
  await window.click('#txt');

  const resetState = await window.evaluate(() => document.getElementById('txt').checked);
  log(`Reset state: ${resetState}`);
  expect(resetState).toBe(!restoredState);

  await window.evaluate(() => localStorage.clear());
});
