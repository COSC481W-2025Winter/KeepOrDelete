const { convertDocxToPdf } = require("./docxConverter.js");
const fs = require("fs")
const mime = require("mime");
const path = require("node:path")

/**
   * Generates HTML containing a preview of the contents of the input file.
   */
async function generatePreviewHTML(filepath) {
   // Fetch the generic category of the input file.
   const mimeType = mime.getType(path.basename(filepath));

   // May return this if file is unknown or unsupported.
   const unsupported = `<div class="unsupportedPreview"><p>No preview available for this filetype.</p></div>`;

   console.log(`${filepath} has MIME type ${mimeType}.`);

   // Short circuit on null MIME.
   if (mimeType == null) {
      return unsupported;
   }

   if (mimeType.startsWith("text/")) {
      // Escape HTML tags so they aren't interpreted as actual HTML.
      var fileContents = fs.readFileSync(filepath).toString().replaceAll("<", "&lt;");

      // <pre> tag displays preformatted text. Displays all whitespace chars.
      return `<div class="txtPreview"><pre>${fileContents}</pre></div>`;
   } else if (mimeType == "application/pdf") {
      return `<div class="pdfPreview"><iframe data-testid="pdf-iframe" src="${filepath}#toolbar=0"></iframe></div>`;
   } else if (filepath.includes("docx")) {
      const pdfPath = await convertDocxToPdf(filepath);

      return `<div class="pdfPreview"><iframe data-testid="pdf-iframe" src="${pdfPath}#toolbar=0"></iframe></div>`;
   } else if (mimeType.startsWith("image/")) {
      return `<div class="imgPreview"><img data-testid="img-element" src="${filepath}" alt="Image failed to load." /></div>`;
   } else if (mimeType.startsWith("video/")) {
      return `<div class="videoPreview"><video controls autoplay muted disablepictureinpicture><source data-testid="video-src" src="${filepath}" alt="Video failed to load." /></video></div>`;
   }

   return unsupported;
}

module.exports = { generatePreviewHTML };
