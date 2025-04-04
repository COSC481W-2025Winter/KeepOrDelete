import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"
import * as progress from "./progress.js"
import * as settings from "./settings.js"
import * as rename from "./rename.js"

const currentItemElement = document.getElementById("currentItem");
const currentItemSizeElement = document.getElementById("currentItemSize");
   const renameContainer = document.getElementById("renameContainer");
const previewContainer = document.getElementById("previewContainer");
const inspectButton = document.getElementById("inspectButton");

let inspectMode = false;

let startX;
let currentX;
let isSwiping;
let startTime;

// Mouse event listeners
previewContainer.addEventListener("mousedown", (e) => {
   if (fileObject.isEmpty()) return;

   startSwipe(e);

   document.addEventListener("mousemove", moveSwipe);
   document.addEventListener("mouseup", endSwipe);
});

// Touch event listeners
previewContainer.addEventListener("touchstart", (e) => {
   if (fileObject.isEmpty()) return;

   startSwipe(e);

   document.addEventListener("touchmove", moveSwipe);
   document.addEventListener("touchend", endSwipe);
});

/// Resets preview container position post swipe
function resetPreviewPosition() {
   previewContainer.style.transition = "transform 0.2s ease-out";
   previewContainer.style.transform = "translateX(0px) rotate(0deg)";
   previewContainer.style.opacity = "1";
}

async function refreshPreview(filePath) {
   const previewHTML = await window.file.generatePreviewHTML(filePath);
   previewContainer.innerHTML = previewHTML || "<p>Preview not available</p>";
   resetPreviewPosition();
   progress.updateProgress();
}

// Next file function (aka Keep)
async function nextFile() {
   if (fileObject.isEmpty()) return;

   fileObject.setStatus(currentIndex.get(), "keep");
   currentIndex.increment();
   displayCurrentFile();
   progress.updateProgress();
}

export async function displayCurrentFile() {
   const fileObjects = fileObject.getAll();
   const index = currentIndex.get();
   const removedFileTypes = await settings.removedFileTypes();

   while (index < fileObjects.length && (fileObjects[index].status !== null || removedFileTypes.includes(fileObjects[index].ext))) {
      index.increment();
   }

   if (index >= fileObjects.length) {
      currentItemElement.innerText = "No files in queue.";
      currentItemSizeElement.innerText = "";
      previewContainer.innerHTML = "You've reached the end! Press the 'Review and Finalize' button to wrap up.";
      return
   }
   console.log(fileObjects[index].ext)
   const file = fileObjects[index];
   currentItemElement.innerText = "Current File: " + file.name;
   let formattedSize = window.file.formatFileSize(file.size);
   currentItemSizeElement.innerText = "| File Size: " + formattedSize;
   refreshPreview(file.path);
   // Reset rename input field
   rename.resetRenameInput(renameContainer);
   //reset inspect mode upon file change
   inspectMode = false;
   inspectButton.innerText = "Inspect Document";
   // Attach Enter event listener for renaming
   //attachRenameListeners();
}

// Swipe animation handler
export function animateSwipe(direction) {
   if (fileObject.isEmpty()) return;

   let translateX;
   let rotateDeg;

   const icon = document.createElement("div");
   icon.classList.add("swipeIcon");

   // Keep Icon
   if (direction === "left") {
      icon.innerHTML = "🗑️";
      icon.style.color = "red";
      translateX = "-120%";
      rotateDeg = "-20deg";
      // Delete Icon
   } else {
      icon.innerHTML = "✅";
      icon.style.color = "green";
      translateX = "120%";
      rotateDeg = "20deg";
   }

   previewContainer.appendChild(icon);
   icon.classList.add("show");

   // Swipe animation
   previewContainer.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
   previewContainer.style.transform = `translateX(${translateX}) rotate(${rotateDeg})`;
   previewContainer.style.opacity = "0";

   // File handling will occurr after CSS animation
   previewContainer.addEventListener("transitionend", function handleTransitionEnd() {
      if (direction === "right") nextFile();
         else markForDeletion();
      if (fileObject.isEmpty()) {
         previewContainer.innerHTML = "You've reached the end! Press the 'Review and Finalize' button to wrap up.";
         icon.remove();
      };
      previewContainer.removeEventListener("transitionend", handleTransitionEnd);
   });
}

// Detects when swipe is started
export function startSwipe(e) {
   // Prevent swiping in Inspect Mode
   if (inspectMode) return;
   // Starting position
   startX = e.clientX || e.touches[0].clientX;
   currentX = startX;
   // Track swiping state
   isSwiping = true;
   startTime = new Date().getTime();
}

// Tracks swipe movement
export function moveSwipe(e) {
   if (!isSwiping) return;
   // Get current position
   if (e.type === "touchmove") {
      currentX = e.touches[0].clientX;
   } else {
      currentX = e.clientX;
   }
   // Calculate distance moved
   let diffX = currentX - startX;
   // Use distance moved to move the previewContainer
   previewContainer.style.transform = `translateX(${diffX}px) rotate(${diffX / 15}deg)`;
}

export function endSwipe(_e) {
   if (!isSwiping || inspectMode) return;
   isSwiping = false;
   // Get final distance swiped
   let diffX = currentX - startX;
   // Swipe duration
   let timeTaken = new Date().getTime() - startTime;
   // Swipe speed
   let velocity = Math.abs(diffX) / timeTaken;
   // Starts animation based on speed of swipe or distance swiped
   if (Math.abs(diffX) > 50 || velocity > 0.6) {
      animateSwipe(diffX > 0 ? "right" : "left");
   } else {
      resetPreviewPosition();
   }
}

export function getInspectMode() {
   return inspectMode;
}

export function setInspectMode(b) {
   inspectMode = b;
}

export function toggleInspectMode() {
   inspectMode = !inspectMode;
}

// Delete function
export async function markForDeletion() {
   if (fileObject.isEmpty()) {
      await window.file.showMessageBox({
         type: "error",
         title: "Error",
         message: "No file(s) to delete."
      });
      return;
   }

   const index = currentIndex.get();

   console.log("Before update:", JSON.stringify(fileObject.get(index)));

   fileObject.setStatus(index, "delete");

   console.log("After update:", JSON.stringify(fileObject.get(index)));

   localStorage.setItem("fileObjects", JSON.stringify(fileObject.getAll()));

   console.log("Updated localStorage:", localStorage.getItem("fileObjects"));

   currentIndex.increment();
   displayCurrentFile();
   progress.updateProgress();
   resetPreviewPosition();
}
