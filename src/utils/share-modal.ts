import { whenElementAvailable } from "./dom-utils";

// Initialize share modal functionality when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initShareModal();
});

function initShareModal() {
  // Safely add event listeners to share buttons
  whenElementAvailable(".share-button", (element) => {
    element.addEventListener("click", openShareModal);
  });

  // Safely add event listeners to close buttons
  whenElementAvailable(".share-modal-close", (element) => {
    element.addEventListener("click", closeShareModal);
  });

  // Close modal when clicking outside
  whenElementAvailable(".share-modal-overlay", (element) => {
    element.addEventListener("click", (e) => {
      if (e.target === element) {
        closeShareModal();
      }
    });
  });
}

function openShareModal() {
  const modal = document.querySelector(".share-modal-container");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeShareModal() {
  const modal = document.querySelector(".share-modal-container");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Export functions for use in other components
export { openShareModal, closeShareModal };
