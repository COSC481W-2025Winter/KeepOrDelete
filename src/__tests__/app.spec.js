import { expect, test } from '@playwright/test'
import {
   clickMenuItemById,
   findLatestBuild,
   ipcMainCallFirstListener,
   ipcRendererCallFirstListener,
   parseElectronApp,
   ipcMainInvokeHandler,
   ipcRendererInvoke
} from 'electron-playwright-helpers'
import { ElectronApplication, Page, _electron as electron } from 'playwright'

let electronApp;

test.beforeAll(async () => {
   // find the latest build in the out directory
   const latestBuild = findLatestBuild()

   // parse the directory and find paths and other info
   const appInfo = parseElectronApp(latestBuild)

   // set the CI environment variable to true
   process.env.CI = 'e2e'

   try {
      electronApp = await electron.launch({
         args: [appInfo.main],
         executablePath: appInfo.executable
      });
   } catch (e) {
      require("console").log(e);
      return;
   }

   electronApp.on('window', async (page) => {
      const filename = page.url()?.split('/').pop()
      console.log(`Window opened: ${filename}`)

      // capture errors
      page.on('pageerror', (error) => {
         console.error(error)
      })
      // capture console messages
      page.on('console', (msg) => {
         console.log(msg.text())
      })
   })

})

test('renders the first page', async () => {
   page = await electronApp.firstWindow()
   await page.waitForSelector('h1')
   const text = await page.$eval('h1', (el) => el.textContent)
   expect(text).toBe('KeepOrDelete')
   const title = await page.title()
   expect(title).toBe('Window 1')
})

test.afterAll(async () => {
   await electronApp.close()
})

