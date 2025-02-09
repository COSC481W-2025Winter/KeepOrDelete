//components we need for testing
const { expect } = require("chai");
const fs = require("fs").promises;
const path = require("path");
const { EventEmitter } = require("events");
const ipcMain = new EventEmitter();


//group of deleting file test
describe("IPC delete-file", function () {
    const testDirectory = path.join(__dirname, "test-files"); //test directory
    const testFiles = [ //array of common file types to ensure robust testing
        path.join(testDirectory, "testFile.txt"), //test file txt
        path.join(testDirectory, "testFile.pdf"), //test file pdf
        path.join(testDirectory, "testFile.html"), //tests html 
        path.join(testDirectory, "testFile.json"), //json
        path.join(testDirectory, "testFile.mp3"), //mp3
        path.join(testDirectory, "testFile.zip"), //zip
        path.join(testDirectory, "testfile.jpeg") //jpeg
    ];
    before(async function () {
        try {
            await fs.mkdir(testDirectory, { recursive: true }); //make the test directory
            console.log("Test directory created:", testDirectory);
        } catch (error) {
            console.error("Error creating test directory:", error);
            throw error;
        }
    });
    beforeEach(async function () {
        try {
            //these are populating our array of sample contents
            await fs.writeFile(testFiles[0], "Text content", "utf8");
            await fs.writeFile(testFiles[1], JSON.stringify({ key: "value" }), "utf8");
            await fs.writeFile(testFiles[2], "<h1>Test</h1>", "utf8");
            await fs.writeFile(testFiles[3], Buffer.from("%PDF-1.4\n...", "binary"));
            await fs.writeFile(testFiles[4], Buffer.from([255, 216, 255, 224, 0, 16]), "binary");
            await fs.writeFile(testFiles[5], Buffer.from([0x49, 0x44, 0x33]), "binary"); // MP3 header
            await fs.writeFile(testFiles[6], Buffer.from([0x50, 0x4B, 0x03, 0x04]), "binary"); // ZIP header
        } catch (error) {
            console.error("Error creating test file:", error);
            throw error;
        }
    });
    //depopulating manually after each test
    afterEach(async function () {
        for (const filePath of testFiles) {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                if (error.code !== "ENOENT") console.error("Error deleting test file:", error);
            }
        }
    });
    //remove the test directory after all tests so nothing left behind
    after(async function () {
        try {
            await fs.rm(testDirectory, { recursive: true, force: true });
        } catch (error) {
            console.error("Error removing test directory:", error);
            throw error;
        }
    });


    //TEST DELETING COMMON FILE TYPES
    it("will delete common file types", async function () {
        //mocking event behavior, our deletion method
        ipcMain.on("delete-file", async (event, filePath) => {
            console.log(`Attempting to delete file: ${filePath}`);
            try {
                await fs.rm(filePath); //same logic that is in our actual code!
                console.log(`File deleted successfully: ${filePath}`); // Debugging line
            } catch (error) {
                console.error("Error deleting file via IPC event:", error);
            }
        });

        for (const filePath of testFiles) {
            //be sure the file is accessable before trying to delete
            try {
                await fs.access(filePath);
            } catch (error) {
                throw new Error(`Test file ${filePath} does not exist before deletion.`);
            }

            // mock ipcMain delete method, event, and pass the file
            ipcMain.emit("delete-file", {}, filePath);
            // we have to include, give it time to execute or itll be weird
            await new Promise((resolve) => setTimeout(resolve, 100));

            //boolean to ensure file cannot be accessed (it got removed!)
            let fileExists = true;
            try {
                await fs.access(filePath);
            } catch (error) {
                fileExists = false; //this should be hit!
            }
            expect(fileExists).to.be.false;
        }
    });
    //TEST FOR DELETING A FILE THAT DOESNT EXIST
    it("will error when trying to delete a fake file", async function () {
        const fakeFile = path.join(testDirectory, "fakeFile.txt");
        ipcMain.once("file-deletion-error", (event, errorMsg) => {
            try {
                expect(errorMsg).to.include("ENOENT"); //expect this error message
                done(); //callback so no timeout
            } catch (error) {
                done(error);
            }
        });
        //mocking event behavior, our deletion method, same as other test
        ipcMain.on("delete-file", async (event, filePath) => {
            console.log(`Attempting to delete file: ${filePath}`);
            try {
                await fs.promises.rm(filePath); //same logic that is in our actual code, NOW WILL ERROR (hopefully)
                console.log(`File deleted successfully: ${filePath}`); // Debugging line
            } catch (error) {
                console.error("Error deleting file via IPC event:", error);
            }
        });
        ipcMain.emit("delete-file", {}, fakeFile); //invoke mock IPC
    });
});

