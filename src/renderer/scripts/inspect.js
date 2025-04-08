let inspectMode = false;

const inspectButton = document.getElementById("inspectButton");

inspectButton.addEventListener("click", () => {
   const iframe = document.querySelector("#previewContainer iframe");
   const textPreview = document.querySelector("#previewContainer pre");
   // Toggle inspect mode state
   toggleInspectMode();

   if (iframe) {
      // Toggle pointer-events for PDF(allows pdf interaction)
      iframe.style.pointerEvents = inspectMode ? "auto" : "none";
   }

   if (textPreview) {
      // Toggle user-select for text files (allows highlighting)
      textPreview.style.userSelect = inspectMode ? "text" : "none";
      const txtContainer = textPreview.closest('.txtPreview');
      if (txtContainer) {
         txtContainer.style.pointerEvents = inspectMode ? "auto" : "none";
      }
   }

   // Update button text
   inspectButton.innerText = inspectMode ? "❌" : "🔎";
   inspectButton.title = inspectMode ? "Exit inspect mode" : "Inspect Document"
});

function toggleInspectMode() {
   inspectMode = !inspectMode;
}

export function getInspectMode() {
   return inspectMode;
}

export function setInspectMode(b) {
   inspectMode = b;
}
