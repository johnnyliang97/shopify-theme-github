if (!customElements.get("lestyle-size-guide")) {
  customElements.define("lestyle-size-guide", class extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector("dialog");
      this.trigger = this.querySelector("[data-size-guide-open]");
      this.tabs = [...this.querySelectorAll("[role=tab]")];
      if (!this.dialog || !this.trigger) return;
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      this.trigger.addEventListener("click", () => {
        if (this.dialog.open) return;
        this.previousOverflow = document.documentElement.style.overflow;
        this.dialog.showModal();
        document.documentElement.style.overflow = "hidden";
        this.locked = true;
        this.querySelector(".ls-size-guide__body").scrollTop = 0;
      }, options);
      this.querySelector("[data-size-guide-close]").addEventListener("click", () => this.dialog.close(), options);
      this.dialog.addEventListener("close", () => {
        this.unlock();
        if (this.trigger.isConnected) this.trigger.focus({ preventScroll: true });
      }, options);
      this.dialog.addEventListener("click", (event) => {
        const rect = this.dialog.getBoundingClientRect();
        if (event.target === this.dialog &&
          (event.clientX < rect.left || event.clientX > rect.right ||
           event.clientY < rect.top || event.clientY > rect.bottom)) this.dialog.close();
      }, options);
      this.dialog.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        this.dialog.close();
      }, options);
      this.tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => this.select(tab), options);
        tab.addEventListener("keydown", (event) => {
          let next;
          if (event.key === "ArrowRight") next = (index + 1) % this.tabs.length;
          if (event.key === "ArrowLeft") next = (index + this.tabs.length - 1) % this.tabs.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = this.tabs.length - 1;
          if (next === undefined) return;
          event.preventDefault();
          this.select(this.tabs[next]);
          this.tabs[next].focus();
        }, options);
      });
    }

    select(selected) {
      this.tabs.forEach((tab) => {
        const active = tab === selected;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      this.querySelectorAll("[data-size-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.sizePanel !== selected.dataset.sizeGroup;
      });
    }

    unlock() {
      if (!this.locked) return;
      document.documentElement.style.overflow = this.previousOverflow;
      this.locked = false;
    }

    disconnectedCallback() {
      this.events?.abort();
      if (this.dialog?.open) this.dialog.close();
      this.unlock();
    }
  });
}
