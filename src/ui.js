import * as tooltip from "./tooltip.js"

const welcome = document.getElementById("welcomeScreen");

export function toggleUIElements(visible) {
   const ids = [
      "trash_button",
      "dirDisplay",
      "previewContainer",
      "notification",
      "progress-bar",
      "tooltip",
      "fileinfo",
      "backButton",
   ];

   ids.forEach(id => {
      const element = document.getElementById(id);

      if (element) {
         element.classList.toggle("hidden", !visible);
      }

      if (welcome) {
         welcome.classList.toggle("hidden", visible);
      }

      if (visible) tooltip.reset();
   });
}
