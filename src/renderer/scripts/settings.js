import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as swipe from "./swipe.js"
import * as progressBar from "./progressBar.js"

const settingsButton = document.getElementById("settingsButton");
const settingsModal = document.getElementById("settingsModal");
const backButtonSettings = document.getElementById("backButtonSettings");

export async function removedFileTypes() {
   return await window.file.getRemovedFileTypes();
}

settingsButton.addEventListener("click", () => {
   settingsModal.showModal();
});

// Back button functionality
backButtonSettings.addEventListener("click", async () => {

   if (fileObject.isEmpty()) {
      localStorage.setItem("returnFromSettings", "true"); // Trigger welcome screen
   }
   const removedFileTypes = await window.file.getRemovedFileTypes();
   currentIndex.reset();
   swipe.displayCurrentFile();
   progressBar.update();
   console.log(removedFileTypes)
   settingsModal.close();
});

// Function to handle checkbox changes
function handleCheckboxChange(event) {
   const fileType = event.target.value;
   if (!event.target.checked) {
      console.log(`Unchecked: ${fileType}`);
      window.file.removeFileType(fileType);
   } else {
      console.log(`Checked: ${fileType}`);
      window.file.addFileType(fileType);
   }
}

// Function to set checkbox states based on removedFileTypes
async function setCheckboxStates() {
   try {
      const removedFileTypes = await window.file.getRemovedFileTypes();
      console.log('Removed file types:', removedFileTypes);  // Log to check the values

      // For each checkbox, check if the file type exists in removedFileTypes and set it accordingly
      document.querySelectorAll(".settings input[type='checkbox']").forEach((checkbox) => {
         const fileType = checkbox.value;
         checkbox.checked = !removedFileTypes.includes(fileType);
      });
   } catch (error) {
      console.error("Error setting checkbox states:", error);
   }
}

// Initialize checkbox states when the page loads
setCheckboxStates();

// Select all checkboxes and add event listeners
document.querySelectorAll(".settings input[type='checkbox']").forEach((checkbox) => {
   checkbox.addEventListener("change", handleCheckboxChange);
});
