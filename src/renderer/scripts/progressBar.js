import * as fileObject from "./fileObjects.js"
import * as settings from "./settings.js"

const saved = document.getElementById("dataSaved");
const progress = document.getElementById("progress");

// Progress Bar based on files left
export async function update() {
   const removedFileTypes = await settings.removedFileTypes();
   const activeFiles = fileObject.getAll().filter(f => !removedFileTypes.includes(f.ext));
   const completedFiles = activeFiles.filter(f => f.status !== null);

   let percent;
   percent = Math.round((completedFiles.length / activeFiles.length) * 100);
   progress.style.width = `${percent}%`;
   progress.textContent = percent + "%";

   // Calculate total space saved
   const totalSpaceSaved = fileObject.getAll().filter(f => f.status === "delete").reduce((sum, file) => sum + file.size, 0);

   // Adding some glowing and scaling animation cause vibes.
   if (percent === 100) {
      progress.classList.add("complete");
      saved.textContent = "You've saved: " + window.file.formatFileSize(totalSpaceSaved) + "!";
      setTimeout(() => {
         progress.classList.remove("complete");
      }, 1000);
   }
   // Re-trigger the glowing animation
   progress.classList.remove("glowing");
   void progress.offsetWidth;
   progress.classList.add("glowing");
}
