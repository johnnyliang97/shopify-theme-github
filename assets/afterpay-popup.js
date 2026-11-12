if (!customElements.get("afterpay-popup")) {
  customElements.define("afterpay-popup", class extends HTMLElement {
    connectedCallback() {
      this.product = this.closest(".m-main-product");
      this.dialog = this.querySelector("dialog");
      if (!this.product || !this.dialog) return;

      this.onClick = (event) => {
        const trigger = event.target.closest(".ap-mini-banner .ap-logo");
        if (!trigger) return;
        event.preventDefault();
        if (this.dialog.open) return;
        this.trigger = trigger;
        this.previousOverflow = document.documentElement.style.overflow;
        this.dialog.showModal();
        document.documentElement.style.overflow = "hidden";
      };
      this.onClose = () => {
        document.documentElement.style.overflow = this.previousOverflow;
        if (this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
        this.trigger = null;
      };
      this.onBackdropClick = (event) => {
        const rect = this.dialog.getBoundingClientRect();
        if (event.target === this.dialog &&
            (event.clientX < rect.left || event.clientX > rect.right ||
             event.clientY < rect.top || event.clientY > rect.bottom)) {
          this.dialog.close();
        }
      };
      this.onCloseClick = () => this.dialog.close();

      this.enhanceLogos = () => {
        this.product.querySelectorAll(".ap-mini-banner a.ap-logo").forEach((link) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = link.className;
          button.setAttribute("aria-label", "About Afterpay");
          button.setAttribute("aria-haspopup", "dialog");
          button.append(...link.childNodes);
          link.replaceWith(button);
        });
      };
      this.enhanceLogos();
      this.observer = new MutationObserver(this.enhanceLogos);
      this.observer.observe(this.product, { childList: true, subtree: true });
      this.product.addEventListener("click", this.onClick);
      this.dialog.addEventListener("close", this.onClose);
      this.dialog.addEventListener("click", this.onBackdropClick);
      this.querySelector(".ap-popup__close").addEventListener("click", this.onCloseClick);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.product?.removeEventListener("click", this.onClick);
      if (this.dialog?.open) {
        this.dialog.close();
        this.onClose();
      }
      this.dialog?.removeEventListener("close", this.onClose);
      this.dialog?.removeEventListener("click", this.onBackdropClick);
      this.querySelector(".ap-popup__close")?.removeEventListener("click", this.onCloseClick);
    }
  });
}
