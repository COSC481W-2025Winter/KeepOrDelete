import * as currentIndex from "./currentIndex.js"

class FileObject {
   constructor({ name, path, modifiedDate, createdDate, size, status = null, ext }) {
      this.name = name;
      this.path = path;
      this.modifiedDate = new Date(modifiedDate);
      this.createdDate = new Date(createdDate);
      this.size = size;
      this.status = status;
      this.ext = ext;
   }
}

// Collection of `FileObject` instances.
let fileObjects = [];

/// Clears the `fileObjects` array.
export function reset() {
   fileObjects = []
}

/// Returns a copy of a single `fileObject` element.
export function get(i) {
   return fileObjects[i];
}

/// Returns a copy of the `fileObjects` array.
export function getAll() {
   return fileObjects;
}

/// Sets the status of a single `fileObjects` element.
export function setStatus(i, status) {
   fileObjects[i].status = status;
}

/// Returns `true` if `fileObjects` is empty. Returns `false` otherwise.
export function isEmpty() {
   return !fileObjects.slice(currentIndex.get()).some(fo => fo.status === null);
}

/// Given an array of filepaths, resets `fileObjects` as an array of
// `FileObject` instances created from the filepaths.
export function setFromFiles(files) {
   fileObjects = files.map(f => new FileObject(f));
}

/// Sorts `fileObjects` by the specified order ("asc" | "desc")
export function sortBy(order) {
   fileObjects.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return order === "asc" ? -1 : 1;
      if (nameA > nameB) return order === "asc" ? 1 : -1;
      return 0; // Stable sort
   });
}
