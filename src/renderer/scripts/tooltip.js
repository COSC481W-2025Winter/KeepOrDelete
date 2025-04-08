const hasShownTooltip = sessionStorage.getItem("tooltipShown");
const tooltip = document.getElementById("tooltip");

export function show() {
   // Checks to see if user is a test agent
   const isTesting = navigator.userAgent.includes("Playwright");

   // Only runs if user is real
   if (!isTesting && !hasShownTooltip) {
      tooltip.classList.add("show");

      // Dismiss tooltip on user input
      document.addEventListener("mousedown", dismissTooltip);
      document.addEventListener("keydown", dismissTooltip);
      document.addEventListener("touchstart", dismissTooltip);

      // WIGGLE IS THE MOST IMPORTANT PART OF THE PROJECT
      triggerWiggle();
      setInterval(triggerWiggle, 3000);
      sessionStorage.setItem("tooltipShown", "true");
   }
}

export function reset() {
   const tooltip = document.getElementById("tooltip");

   // Check if the tooltip has already been reset in this session
   if (sessionStorage.getItem("tooltipReset") === "true") {
      return; // Skip if already reset
   }

   if (tooltip) {
      tooltip.style.display = "block";  // Show the tooltip
      tooltip.classList.remove("hide");
      tooltip.classList.add("show");

      // Mark that the tooltip reset has been done in this session
      sessionStorage.setItem("tooltipReset", "true");
   } else {
      console.error("Tooltip element not found.");
   }
}

function dismissTooltip() {
   const tooltip = document.getElementById("tooltip");

   if (tooltip) {
      tooltip.classList.remove("show");
      tooltip.classList.add("hide");

      // Optionally remove after a timeout
      setTimeout(() => {
         tooltip.style.display = "none"; // Completely hide
      }, 400);
   }
}

// WIGGLE WIGGLE WIGGLE
function triggerWiggle() {
   if (!tooltip.classList.contains("wiggle")) {
      tooltip.classList.add("wiggle");
      setTimeout(() => tooltip.classList.remove("wiggle"), 500);
   }
}

// Similar code for deletion tooltips
export function showDeletionTooltips() {
   const isTesting = navigator.userAgent.includes("Playwright");

   if (isTesting) return;

   const finalizeTooltip = document.getElementById("finalizeTooltip");
   const trashTooltip = document.getElementById("trashTooltip");

   if (!sessionStorage.getItem("finalizeTooltipShown")) {
      if (finalizeTooltip) finalizeTooltip.classList.add("show");
      if (trashTooltip) trashTooltip.classList.add("show");

      sessionStorage.setItem("finalizeTooltipShown", "true");

      document.addEventListener("mousedown", hideDeletionTooltips);
      document.addEventListener("keydown", hideDeletionTooltips);
      document.addEventListener("touchstart", hideDeletionTooltips);

      triggerSideWiggle();
      const interval = setInterval(triggerSideWiggle, 3000);
      window._deletionWiggleInterval = interval;
   }
}

function hideDeletionTooltips() {
   const finalizeTooltip = document.getElementById("finalizeTooltip");
   const trashTooltip = document.getElementById("trashTooltip");

   finalizeTooltip?.classList.remove("show");
   finalizeTooltip?.classList.add("hide");

   trashTooltip?.classList.remove("show");
   trashTooltip?.classList.add("hide");

   setTimeout(() => {
      finalizeTooltip.style.display = "none";
      trashTooltip.style.display = "none";
   }, 500);
   
   if (window._deletionWiggleInterval) {
      clearInterval(window._deletionWiggleInterval);
      window._deletionWiggleInterval = null;
   }
   
}

function triggerSideWiggle() {
   const finalizeTooltip = document.getElementById("finalizeTooltip");
   const trashTooltip = document.getElementById("trashTooltip");

   if (!finalizeTooltip.classList.contains("wiggle-side")) {
      finalizeTooltip.classList.add("wiggle-side");
      trashTooltip.classList.add("wiggle-side");

      setTimeout(() => {
         finalizeTooltip.classList.remove("wiggle-side");
         trashTooltip.classList.remove("wiggle-side");
      }, 500);
   }
}