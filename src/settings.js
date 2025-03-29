// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "./main_page/keep_or_delete.html";
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
