const { test, expect, _electron: electron } = require('@playwright/test')

// This boilerplate lifted from https://circleci.com/blog/electron-testing/

test('an h1 contains hello world"', async () => {
   const electronApp = await electron.launch({ args: ['.'] })

   // Wait for the first BrowserWindow to open
   const window = await electronApp.firstWindow()

   // Check for the presence of an h1 element with the text "hello"
   const headerElement = await window.$('h1')
   const headerText = await headerElement.textContent()
   expect(headerText).toBe("KeepOrDelete")

   // Close the app
   await electronApp.close()
})
