// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "./main_menu.html";
});

// Function to handle checkbox changes
function handleCheckboxChange(event) {
  const fileType = event.target.value;
  if (!event.target.checked) {
    console.log(`Unchecked: ${fileType}`);
    window.file.removeFileType(fileType)
  } else {
    console.log(`Checked: ${fileType}`);  
    window.file.addFileType(fileType)
  }
}


// Select all checkboxes and add event listeners
document.querySelectorAll(".settings input[type='checkbox']").forEach((checkbox) => {
  checkbox.addEventListener("change", handleCheckboxChange);
});

