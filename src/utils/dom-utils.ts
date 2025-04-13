/**
 * Safely adds an event listener to a DOM element, checking if it exists first
 * @param selector The CSS selector for the element
 * @param event The event to listen for
 * @param callback The callback function
 * @param options Event listener options
 */
export const safeAddEventListener = (
  selector: string,
  event: string,
  callback: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void => {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener(event, callback, options);
      }
    });
  } else {
    // DOM is already ready
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, callback, options);
    }
  }
};

/**
 * Safely gets a DOM element, returning null if it doesn't exist
 * @param selector The CSS selector for the element
 * @returns The DOM element or null
 */
export const safeGetElement = (selector: string): Element | null => {
  return document.querySelector(selector);
};

/**
 * Initializes a DOM element when it becomes available
 * @param selector The CSS selector for the element
 * @param callback The callback function to run when the element is available
 * @param maxAttempts Maximum number of attempts to find the element
 */
export const whenElementAvailable = (
  selector: string,
  callback: (element: Element) => void,
  maxAttempts = 10
): void => {
  let attempts = 0;

  const checkElement = () => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      return;
    }

    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(checkElement, 100);
    }
  };

  // Start checking once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkElement);
  } else {
    checkElement();
  }
};
