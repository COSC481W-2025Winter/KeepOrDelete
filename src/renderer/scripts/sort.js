import * as currentIndex from "./currentIndex.js"
import * as ui from "./ui.js"
import * as fileObjects from "./fileObjects.js"

const sortOrderDropdown = document.getElementById("sortOrder");

sortOrderDropdown.addEventListener("change", () => {
   sortFiles();
   currentIndex.reset();
   ui.displayCurrentFile();
   sortOrderDropdown.blur()
});

function sortFiles() {
   const [order, target] = sortOrderDropdown.value.split(" ");
   fileObjects.sortBy(order, target);
   localStorage.setItem("fileObjects", JSON.stringify(fileObjects.getAll()));
}

export function restoreSort() {
   // Set the dropdown to the A → Z value
   sortOrderDropdown.value = "asc name";
   sortFiles();
   sortOrderDropdown.blur()
}
