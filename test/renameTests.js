const { expect } = require('chai');
const { renameFileHandler } = require('../src/renameHandler.js'); //import the function under renameHandler.js

describe('File Renaming Tests', () => {
    let mockFiles;
    let mockWindowFile;
    let notifications = [];

    //before each test, reset mocks and the notification
    beforeEach(() => {
        //simulate the initial set of files in the directory
        mockFiles = ['file1.txt', 'file2.txt', 'document.pdf'];
        notifications = [];

        const mockShowNotification = (message, type) => {
            notifications.push({ message, type });
        };

        mockWindowFile = {
            getFilesInDirectory: async () => mockFiles,
            renameFile: async (oldPath, newPath) => ({ success: true }),
            pathBasename: (filePath) => require('path').basename(filePath),
            pathJoin: (dir, file) => require('path').join(dir, file),
            pathDirname: (filePath) => require('path').dirname(filePath)
        };

        global.mockShowNotification = mockShowNotification;
    });

    //Test case: Rename the file when the new name is unique
    it('should rename the file when the name is unique', async () => {
        const result = await renameFileHandler('file3.txt', '/mock/directory/file1.txt', mockWindowFile, mockShowNotification);

        expect(result).to.not.equal('error');
        expect(notifications).to.deep.include({
            message: 'File renamed successfully to file3.txt',
            type: 'success'
        });
    });

    //Test case: Should not rename if a file with the new name already exists
    it('should not rename the file if the name already exists', async () => {
        const result = await renameFileHandler('file1.txt', '/mock/directory/file2.txt', mockWindowFile, mockShowNotification);

        expect(result).to.equal('error');
        expect(notifications).to.deep.include({
            message: 'A file named "file1.txt" already exists. Please choose a different name.',
            type: 'error'
        });
    });

    //Test case: Shows an error if the input file name is empty 
    it('should show an error if the input is empty', async () => {
        const result = await renameFileHandler('', '/mock/directory/file2.txt', mockWindowFile, mockShowNotification);

        expect(result).to.equal('error');
        expect(notifications).to.deep.include({
            message: 'Please enter a new file name.',
            type: 'error'
        });
    });
});



