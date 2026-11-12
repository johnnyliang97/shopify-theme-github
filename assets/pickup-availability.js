if (!customElements.get("pickup-availability")) {
  class PickupAvailability extends HTMLElement {
    constructor() {
      super();

      if (!this.hasAttribute("available")) return;

      this.errorHtml = this.querySelector("template").content.firstElementChild.cloneNode(true);
      this.onClickRefreshList = this.onClickRefreshList.bind(this);
      this.fetchAvailability(this.dataset.variantId);
    }

    fetchAvailability(variantId) {
      let rootUrl = this.dataset.baseUrl;
      if (!rootUrl.endsWith("/")) {
        rootUrl = rootUrl + "/";
      }
      const variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;

      fetch(variantSectionUrl)
        .then((response) => response.text())
        .then((text) => {
          const sectionInnerHTML = new DOMParser().parseFromString(text, "text/html").querySelector(".shopify-section");
          this.renderPreview(sectionInnerHTML);
        })
        .catch((e) => {
          const button = this.querySelector("button");
          if (button) button.removeEventListener("click", this.onClickRefreshList);
          this.renderError();
        });
    }

    onClickRefreshList(evt) {
      this.fetchAvailability(this.dataset.variantId);
    }

    update(variant) {
      if (variant?.available) {
        this.fetchAvailability(variant.id);
      } else {
        this.removeAttribute('available');
        this.innerHTML = "";
      }
    }

    renderError() {
      this.innerHTML = "";
      this.appendChild(this.errorHtml);

      this.querySelector("button").addEventListener("click", this.onClickRefreshList);
    }

    renderPreview(sectionInnerHTML) {
      document.querySelectorAll("#Drawer-Pickup-Availability, #Drawer-Uber-Delivery").forEach((drawer) => drawer.remove());
      if (!sectionInnerHTML.querySelector("pickup-availability-preview")) {
        this.innerHTML = "";
        this.removeAttribute("available");
        return;
      }

      this.innerHTML = sectionInnerHTML.querySelector("pickup-availability-preview").outerHTML;
      this.setAttribute("available", "");

      sectionInnerHTML.querySelectorAll("pickup-availability-drawer").forEach((drawer) => {
        document.body.appendChild(drawer);
      });

      this.querySelectorAll(".m-pickup-availability__button, [data-drawer-target]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.dataset.drawerTarget || "Drawer-Pickup-Availability";
          document.getElementById(target)?.openDrawer(button);
        });
      });
    }
  }

  customElements.define("pickup-availability", PickupAvailability);
}

if (!customElements.get("pickup-availability-drawer")) {
  class PickupAvailabilityDrawer extends HTMLElement {
    constructor() {
      super();

      this.drawerWapper = this.querySelector(".m-drawer__wrapper");
      this.drawerContent = this.querySelector(".m-drawer__content");
      this.drawerClose = this.querySelector(".m-drawer__close");

      this.drawerClose.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeDrawer();
      });

      this.onBackdropClick = (e) => {
        if (e.target === this.drawerWapper) this.closeDrawer();
      };
      this.onKeydown = (e) => {
        if (e.key === "Escape" && this.isOpen) {
          e.preventDefault();
          this.closeDrawer();
        }
      };
    }

    connectedCallback() {
      document.body.addEventListener("click", this.onBackdropClick);
      document.addEventListener("keydown", this.onKeydown);
    }

    disconnectedCallback() {
      document.body.removeEventListener("click", this.onBackdropClick);
      document.removeEventListener("keydown", this.onKeydown);
      clearTimeout(this.closeTimer);
      if (this.isOpen) {
        if (typeof removeTrapFocus === "function") removeTrapFocus();
        if (!this.wasScrollLocked) document.documentElement.classList.remove("prevent-scroll");
      }
    }

    openDrawer(trigger = document.activeElement) {
      clearTimeout(this.closeTimer);
      if (!this.isOpen) this.wasScrollLocked = document.documentElement.classList.contains("prevent-scroll");
      this.isOpen = true;
      this.trigger = trigger;
      this.trigger?.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("prevent-scroll");
      if (window.innerWidth < 770) {
        this.drawerWapper.classList.add("mobile");
      }
      this.drawerWapper.classList.remove("m:hidden");
      requestAnimationFrame(() => {
        if (!this.isOpen || !this.isConnected) return;
        this.drawerWapper.style.setProperty("--m-bg-opacity", "0.5");
        this.drawerContent.style.setProperty("--m-translate-x", "0");
        if (typeof trapFocus === "function") trapFocus(this.drawerContent, this.drawerClose);
      });
    }

    closeDrawer() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.trigger?.setAttribute("aria-expanded", "false");
      if (typeof removeTrapFocus === "function") removeTrapFocus(this.trigger?.isConnected ? this.trigger : null);
      if (!this.wasScrollLocked) document.documentElement.classList.remove("prevent-scroll");
      this.drawerWapper.style.setProperty("--m-bg-opacity", "0");
      this.drawerContent.style.setProperty("--m-translate-x", "100%");
      this.closeTimer = setTimeout(() => {
        this.drawerWapper.classList.add("m:hidden");
        this.drawerWapper.classList.remove("mobile");
      }, 300);
    }
  }

  customElements.define("pickup-availability-drawer", PickupAvailabilityDrawer);
}
