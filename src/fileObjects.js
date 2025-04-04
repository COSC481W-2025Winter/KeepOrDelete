// File data object
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

let fileObjects = []; // Array for FileObject instances

export function reset() {
   fileObjects = []
}

export function get(i) {
   return fileObjects[i];
}

export function getAll() {
   return fileObjects;
}

export function setStatus(i, status) {
   fileObjects[i].status = status;
}

export function isEmpty() {
   return fileObjects.length === 0;
}

export function setFromFiles(files) {
   fileObjects = files.map(f => new FileObject(f));
}
