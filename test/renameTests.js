const { expect } = require('chai');
const { renameFileHandler } = require('../src/renameHandler');  // Adjust this path as needed

describe('File Renaming Tests', () => {
    let mockFiles;
    let mockWindowFile;
    let notifications = [];

    // Setup the mocks before each test
    beforeEach(() => {
        // Mock list of files in the directory
        mockFiles = ['file1.txt', 'file2.txt', 'document.pdf'];

        // Mock the notification system using an array to capture messages
        notifications = [];

        const mockShowNotification = (message, type) => {
            notifications.push({ message, type });
        };

        // Mock window.file methods manually
        mockWindowFile = {
            getFilesInDirectory: async () => mockFiles,  // Simulate getting files
            renameFile: async (oldPath, newPath) => ({ success: true }),  // Simulate a successful rename
            pathBasename: (filePath) => require('path').basename(filePath),
            pathJoin: (dir, file) => require('path').join(dir, file),
        };

        // Make mockShowNotification available globally in the test
        global.mockShowNotification = mockShowNotification;
    });

    it('should rename the file when the name is unique', async () => {
        const result = await renameFileHandler('file3.txt', '/mock/directory', mockWindowFile, mockShowNotification);

        expect(result).to.equal('success');
        expect(notifications).to.deep.include({
            message: 'File renamed successfully to file3.txt',
            type: 'success'
        });
    });

    it('should not rename the file if the name already exists', async () => {
        const result = await renameFileHandler('file1.txt', '/mock/directory', mockWindowFile, mockShowNotification);

        expect(result).to.equal('error');
        expect(notifications).to.deep.include({
            message: 'A file named "file1.txt" already exists. Please choose a different name.',
            type: 'error'
        });
    });

    it('should show an error if the input is empty', async () => {
        const result = await renameFileHandler('', '/mock/directory', mockWindowFile, mockShowNotification);

        expect(result).to.equal('error');
        expect(notifications).to.deep.include({
            message: 'Please enter a new file name.',
            type: 'error'
        });
    });
});


