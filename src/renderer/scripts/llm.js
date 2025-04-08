import * as fileObject from "./fileObjects.js"
import * as currentIndex from "./currentIndex.js"

const popupContentElement = document.getElementById('AIButton');

export function LLM() {
   let renameInputElement = document.getElementById('renameInput');
   const filename = fileObject.get(currentIndex.get()).path;
   // Check for file types using mime 
   //--------------------------------------------------------------------
   const mimeType = window.file.getMimeType(filename);
   if (mimeType.startsWith("text/")) {
      // Text
      const fileContents = window.file.getFileContents(filename);
      if (!fileContents || fileContents.length === 0) {
         popupContentElement.textContent = "No file contents found.";
         setTimeout(() => {
            popupContentElement.textContent = "Please choose a file with contents.";
         }, 4000);
         return;
      }
      popupContentElement.textContent = "Thinking...";
      window.openai
         .openaiRequest([
            {
               role: "system",
               content:
               "You will review the following text and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension.",
            },
            { role: "user", content: fileContents },
         ])
         .then((response) => {
            const suggestion = response.choices[0].message;
            console.log("Renaming Suggestion:", suggestion.content);

            // Add a click event listener to the popup. Populates the input field wih the suggestion.
            if (renameInputElement) {
               renameInputElement.value = suggestion.content;

               // Remove previous animation classes
               renameInputElement.classList.remove("glowing", "wiggle");

               // Force reflow to restart animations
               void renameInputElement.offsetWidth;

               // Add animation classes again
               renameInputElement.classList.add("glowing", "wiggle");

               // Remove the classes after the animation completes
               setTimeout(() => {
                  renameInputElement.classList.remove("glowing", "wiggle");
               }, 500);
            }
            popupContentElement.textContent = "Another suggestion?";
         })
         .catch((error) => {
            console.error("Error sending OpenAI request:", error);
            popupContentElement.textContent = "There was an error reading the contents. Please try again.";
         });
   }
   // PDF & DOCX files
   else if (mimeType == "application/pdf" || filename.includes("docx")) {
      // Creating a Async function to process all PDF contents before using data.
      async function pdfAIcall() {
         let pdfPath = filename;
         if (filename.includes("docx")) {
            pdfPath = await window.file.convertDocxToPdf(filename);
         } else {
            // For actual PDF files, extract text directly.
            pdfPath = filename;
         }

         const pdfContent = await window.file.getPDFtext(pdfPath);
         console.log("PDF Content:", pdfContent);
         popupContentElement.textContent = "Thinking...";
         window.openai
            .openaiRequest([
               {
                  role: "system",
                  content:
                  "You will review the following text and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension.",
               },
               { role: "user", content: pdfContent },
            ])
            .then((response) => {
               const suggestion = response.choices[0].message;
               console.log("Renaming Suggestion:", suggestion.content);
               if (renameInputElement) {
                  renameInputElement.value = suggestion.content;
                  renameInputElement.classList.remove("glowing", "wiggle");
                  void renameInputElement.offsetWidth;
                  renameInputElement.classList.add("glowing", "wiggle");
                  setTimeout(() => {
                     renameInputElement.classList.remove("glowing", "wiggle");
                  }, 500);
               }
               popupContentElement.textContent = "Another suggestion?";
            })
            .catch((error) => {
               console.error("Error sending OpenAI request:", error);
               popupContentElement.textContent = "There was an error reading the contents. Please try again.";
            });
      }
      pdfAIcall();
   }
   // Jpeg or png
   else if (mimeType.startsWith("image/")) {

      const currentTime = Date.now();
      // Get the image limit and logged time from local storage
      let imageLimit = parseInt(localStorage.getItem("imageLimit") || "0", 10);
      let loggedTime = parseInt(localStorage.getItem("loggedTime") || "0", 10);

      //reset the counter if 24 hours have passed
      if (currentTime - loggedTime > 14400000) {
         imageLimit = 0;
         loggedTime = currentTime;
         localStorage.setItem("imageLimit", imageLimit);
         localStorage.setItem("loggedTime", loggedTime);
      }

      // 60000 minute
      // 86400000 24 hours
      // 14400000 4 hours
      // If 4 hours haven't passed and the image limit is reached, they cooked 
      if ((currentTime - loggedTime) <= 14400000 && imageLimit >= 2) {
         const timeLeft = window.file.convertMillisecondsToTimeLeft(14400000 - (currentTime - loggedTime));
         console.log(timeLeft);
         popupContentElement.textContent = "Your renaming limit for image files has been reached.";
         setTimeout(() => {
            popupContentElement.textContent = "You have " + timeLeft.hours + "h " + timeLeft.minutes + "m " + timeLeft.seconds + "s" + " left.";
         }, 4000);
         return;
      }
      try {
         const base64Image = window.file.getBase64(filename);
         popupContentElement.textContent = "Thinking...";

         window.openai
            .openaiRequest([
               {
                  role: "system",
                  content:
                  "You will review the following image and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension. Do not include explanation. File name only as the output."
               },
               {
                  role: "user",
                  content: [
                     {
                        type: "text",
                        text: "You will review the following image and give a proper file name suggestion for it. The file name should be as short as possible. Do not include the file extension. Do not include explanation. File name only as the output.",
                     },
                     {
                        type: "image_url",
                        image_url: {
                           url: `data:${mimeType};base64,${base64Image}`,
                           detail: "low",
                        },
                     },
                  ],
               },
            ])
            .then((response) => {
               const suggestion = response.choices[0].message;
               console.log("Renaming Suggestion:", suggestion.content);
               imageLimit++;
               localStorage.setItem("imageLimit", imageLimit);
               // Add a click event listener to the popup. Populates the input field wih the suggestion.
               if (renameInputElement) {
                  renameInputElement.value = suggestion.content;
                  renameInputElement.classList.remove("glowing", "wiggle");
                  void renameInputElement.offsetWidth;
                  renameInputElement.classList.add("glowing", "wiggle");
                  setTimeout(() => {
                     renameInputElement.classList.remove("glowing", "wiggle");
                  }, 500);
               }
               popupContentElement.textContent = "Another suggestion?";
            })
            .catch((error) => {
               console.error("Error sending OpenAI request:", error);
               popupContentElement.textContent = "This image goes against my requirements.";
            });
      } catch (error) {
         console.error("Error reading image file:", error);
      }

   } else {
      // Handle unsupported file types
      console.log("Unsupported file type:", mimeType);
      popupContentElement.textContent = 'File type not supported.';
      setTimeout(() => {
         popupContentElement.textContent = "I only support pdf, docx, jpeg, png, and txt files.";
      }, 4000);
      return;
   }
}

