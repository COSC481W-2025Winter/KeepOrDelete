let inspectMode = false;

const inspectButton = document.getElementById("inspectButton");

inspectButton.addEventListener("click", () => {
   const iframe = document.querySelector("#previewContainer iframe");
   const fileContainer = document.getElementById("fileContainer");
   const textPreview = document.querySelector("#previewContainer pre");
   // Toggle inspect mode state
   toggleInspectMode();

   if (inspectMode) {
      fileContainer.style.transform = "scale(1.25)";
      //iframe.style.transform = "scale(0.75)";
      file
    } else {
      fileContainer.style.transform = "scale(1)";
      //iframe.style.transform = "scale(1)";
    }
    
   
   
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
   inspectButton.innerHTML = inspectMode ? '<img src="./res/close.svg" alt="Inpsect Button"/>' : '<img src="./res/inspect.svg" alt="Inpsect Button"/>';
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
