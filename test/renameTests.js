const { expect } = require('chai');
const { renameFileHandler } = require('../src/renameHandler.js');

describe('File Renaming Tests', () => {
    let mockFiles;
    let mockWindowFile;
    let notifications = [];

    beforeEach(() => {
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
            pathDirname: (filePath) => require('path').dirname(filePath)  // FIX: Mock pathDirname
        };

        global.mockShowNotification = mockShowNotification;
    });

    it('should rename the file when the name is unique', async () => {
        const result = await renameFileHandler('file3.txt', '/mock/directory/file1.txt', mockWindowFile, mockShowNotification);

        expect(result).to.not.equal('error');
        expect(notifications).to.deep.include({
            message: 'File renamed successfully to file3.txt',
            type: 'success'
        });
    });

    it('should not rename the file if the name already exists', async () => {
        const result = await renameFileHandler('file1.txt', '/mock/directory/file2.txt', mockWindowFile, mockShowNotification);

        expect(result).to.equal('error');
        expect(notifications).to.deep.include({
            message: 'A file named "file1.txt" already exists. Please choose a different name.',
            type: 'error'
        });
    });

    it('should show an error if the input is empty', async () => {
        const result = await renameFileHandler('', '/mock/directory/file2.txt', mockWindowFile, mockShowNotification);

        expect(result).to.equal('error');
        expect(notifications).to.deep.include({
            message: 'Please enter a new file name.',
            type: 'error'
        });
    });
});



