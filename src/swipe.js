import * as fileObject from "./fileObjects.js"
import * as userAction from "./userAction.js"
import { getInspectMode, setInspectMode } from "./inspect.js"

const previewContainer = document.getElementById("previewContainer");

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
export function resetPreviewPosition() {
   previewContainer.style.transition = "transform 0.2s ease-out";
   previewContainer.style.transform = "translateX(0px) rotate(0deg)";
   previewContainer.style.opacity = "1";
}

// Swipe animation handler
export function animateSwipe(direction) {
   console.log(fileObject.getAll());
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
   previewContainer.addEventListener("transitionend", async function handleTransitionEnd() {
      // Prevent another instance of this async function from running. SO sketchy.
      previewContainer.removeEventListener("transitionend", handleTransitionEnd);

      if (direction === "right") await userAction.markForKeep();
         else await userAction.markForDelete();

      if (fileObject.isEmpty()) {
         previewContainer.innerHTML = "You've reached the end! Press the 'Review and Finalize' button to wrap up.";
         icon.remove();
      };
   });
}

// Detects when swipe is started
export function startSwipe(e) {
   // Prevent swiping in Inspect Mode
   if (getInspectMode()) return;
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
   if (!isSwiping || getInspectMode()) return;
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
