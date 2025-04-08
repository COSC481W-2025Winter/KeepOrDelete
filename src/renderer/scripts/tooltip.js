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
