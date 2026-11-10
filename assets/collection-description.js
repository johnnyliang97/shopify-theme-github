if (!customElements.get("collection-description")) {
  customElements.define("collection-description", class extends HTMLElement {
    connectedCallback() {
      this.content = this.querySelector("[data-description-content]");
      this.button = this.querySelector("[data-description-toggle]");
      if (!this.content || !this.button) return;

      this.expanded = this.expanded || false;
      this.button.addEventListener("click", this.toggle);
      this.content.addEventListener("load", this.measure, true);
      this.observer = new ResizeObserver((entries) => {
        const width = entries[0].contentRect.width;
        if (width !== this.lastWidth) {
          this.lastWidth = width;
          this.measure();
        }
      });
      this.observer.observe(this);
      this.measure();
      document.fonts.ready.then(() => {
        if (this.isConnected) this.measure();
      });
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.button?.removeEventListener("click", this.toggle);
      this.content?.removeEventListener("load", this.measure, true);
      this.lastWidth = null;
    }

    measure = () => {
      const style = window.getComputedStyle(this.content);
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.6;
      const collapsedHeight = lineHeight * (Number(this.dataset.collapsedLines) || 3);
      this.content.style.setProperty("--description-collapsed-height", `${collapsedHeight}px`);
      this.canCollapse = this.content.scrollHeight > collapsedHeight + 1;
      this.button.hidden = !this.canCollapse;
      this.render();
    };

    toggle = () => {
      this.expanded = !this.expanded;
      this.render();
    };

    render = () => {
      const collapsed = this.canCollapse && !this.expanded;
      this.content.classList.toggle("is-collapsed", collapsed);
      this.button.setAttribute("aria-expanded", String(!collapsed));
      this.button.textContent = collapsed ? this.button.dataset.readMore : this.button.dataset.showLess;
    };
  });
}
