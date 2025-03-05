window.onload = async function () {

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "./main_menu.html";
});

// Function to handle checkbox changes
async function handleCheckboxChange(event) {
  const fileType = event.target.value;
  console.log("removeFileType function:", window.file.removeFileType);

  if (!event.target.checked) {
    console.log(`Unchecked: ${fileType}`);
    await window.file.removeFileType(fileType)
      .then(response => console.log(response.message))
      .catch(error => console.error(error));
  } else {
    console.log(`Checked: ${fileType}`);  
    await window.file.addFileType(fileType)
      .then(response => console.log(response.message))
      .catch(error => console.error(error));
  }
}


// Select all checkboxes and add event listeners
document.querySelectorAll(".settings input[type='checkbox']").forEach((checkbox) => {
  checkbox.addEventListener("change", handleCheckboxChange);
});

// Example of checking initial states (optional)
document.getElementById('txt').checked;
document.getElementById('html').checked;
document.getElementById('png').checked;
document.getElementById('docx_file')?.checked; // Ensure element exists before accessing

};