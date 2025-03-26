const fs = require("fs")
const crypto = require("crypto")
const htmlToPdfmake = require('html-to-pdfmake');
const jsdom = require('jsdom');
const mammoth = require('mammoth');
const os = require('os');
const path = require("node:path")
const pdfFonts = require('pdfmake/build/vfs_fonts');
const pdfMake = require('pdfmake/build/pdfmake');
const { JSDOM } = jsdom;

async function convertDocxToPdf(filepath) {
  /// Converts from DOCX to PDF for previewing purposes.
  var html;

  await mammoth.convertToHtml({ path: filepath })
    .then(function(result) {
      html = result.value;
      // Any messages, such as warnings during conversion
      var _messages = result.messages;
    })
    .catch(function(error) {
      console.error(error);
      return;
    });

  // Preliminary pdfMake configuration.
  pdfMake.vfs = pdfFonts;

  // Create new DOM window object.
  const { window } = new JSDOM('');

  const converted = htmlToPdfmake(html, { window });
  const docDefinition = { content: converted };

  pdfPath = path.join(os.tmpdir(), crypto.createHash("md5").update(path.basename(filepath)).digest("hex") + ".pdf");

  return new Promise((resolve, reject) => {
    pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
      fs.writeFile(pdfPath, buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(pdfPath);
        }
      });
    });
  });
}

module.exports = { convertDocxToPdf };
