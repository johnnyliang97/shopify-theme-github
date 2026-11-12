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
      this.checkoutForm = this.querySelector("form");
      this.onCheckout = async (event) => {
        event.preventDefault();
        const button = this.checkoutForm.querySelector("button");
        if (button.disabled) return;
        const error = this.querySelector(".ap-popup__error");
        error.hidden = true;
        const label = button.textContent;

        try {
          const productForm = this.product.querySelector("product-form.m-product-form--main");
          const form = productForm?.querySelector("form");
          if (!form || form.querySelector('[name="add"]')?.disabled) {
            throw new Error("Please select an available size or option before continuing to checkout.");
          }
          if (!form.checkValidity() ||
              (typeof validateForm === "function" && validateForm(form.closest(".m-main-product--info"))?.length)) {
            throw new Error("Please complete the required product details before continuing to checkout.");
          }
          const data = productForm.getFormData ? productForm.getFormData() : new FormData(form);
          if (!data.get("id")) {
            throw new Error("Please select a size or option before continuing to checkout.");
          }

          button.disabled = true;
          button.textContent = "Continuing…";
          const response = await fetch(this.checkoutForm.action, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: data,
          });
          const result = await response.json();
          if (!response.ok || result.status) {
            throw new Error(typeof result.description === "string" ? result.description :
              "This item could not be added. Please check your selected size and quantity.");
          }
          window.location.assign(this.checkoutForm.dataset.checkoutUrl);
        } catch (failure) {
          error.textContent = failure instanceof TypeError ?
            "Unable to connect. Please try again." : failure.message;
          error.hidden = false;
        } finally {
          button.disabled = false;
          button.textContent = label;
        }
      };

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
      this.checkoutForm.addEventListener("submit", this.onCheckout);
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
      this.checkoutForm?.removeEventListener("submit", this.onCheckout);
    }
  });
}
