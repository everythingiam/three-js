export class Modal {
  constructor(modalId, openBtnId, closeBtnId) {
    this.modal = modalId;
    this.openBtn = openBtnId;
    this.closeBtn = closeBtnId;
  }

  init() {
    if (this.openBtn) {
      this.openBtn.addEventListener("click", () => this.open());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.close());
    }

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.close();
      }
    });
  }

  open() {
    this.modal.showModal();
    requestAnimationFrame(() => {
      this.modal.classList.add("modal-visible");
    });
  }

  close() {
    this.modal.classList.remove("modal-visible");
    setTimeout(() => this.modal.close(), 150);
  }
}
