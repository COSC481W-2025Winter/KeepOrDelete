let currentIndex = 0; // Track file index

/// Returns a copy of `currentIndex`.
export function get() {
   return currentIndex;
}

/// Resets `currentIndex` to zero (`0`).
export function reset() {
   currentIndex = 0;
}

/// Adds one (`1`) to `currentIndex`.
export function increment() {
   currentIndex += 1;
}

/// Subtracts one (`1`) to `currentIndex`.
export function decrement() {
   currentIndex -= 1;
}
