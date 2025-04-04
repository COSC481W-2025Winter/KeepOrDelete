import * as currentIndex from "./currentIndex.js"
import * as swipe from "./swipe.js"
import * as fileObjects from "./fileObjects.js"

const sortOrderDropdown = document.getElementById("sortOrder");

sortOrderDropdown.addEventListener("change", () => {
   sortFiles();
   currentIndex.reset();
   swipe.displayCurrentFile();
   sortOrderDropdown.blur()
});

function sortFiles() {
   const sortOrder = sortOrderDropdown.value;
   fileObjects.sortBy(sortOrder);
   localStorage.setItem("fileObjects", JSON.stringify(fileObjects.getAll()));
}
