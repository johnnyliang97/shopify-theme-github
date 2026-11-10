if (!customElements.get("collection-description")) {
  customElements.define("collection-description", class extends HTMLElement {
    connectedCallback() {
      this.content = this.querySelector("[data-description-content]");
      this.button = this.querySelector("[data-description-toggle]");
      if (!this.content || !this.button) return;

      this.preview = this.querySelector("[data-description-preview]");
      if (!this.preview) {
        this.preview = document.createElement("div");
        this.preview.className = "m-collection-description__preview";
        this.preview.dataset.descriptionPreview = "";
        this.preview.hidden = true;
        this.content.before(this.preview);
      }
      this.button.remove();
      this.content.hidden = false;
      this.words = (this.content.innerText || this.content.textContent).trim().split(/\s+/);
      this.buttonTarget = Array.from(this.content.querySelectorAll("p, li")).pop() || this.content;
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
      const collapsedHeight = lineHeight * (Number(this.dataset.collapsedLines) || 2);
      this.content.hidden = false;
      this.preview.hidden = true;
      this.button.hidden = true;
      this.canCollapse = this.content.scrollHeight > collapsedHeight + 1;
      this.button.hidden = !this.canCollapse;
      this.collapsedHeight = collapsedHeight;
      this.render();
    };

    toggle = () => {
      const hadFocus = document.activeElement === this.button;
      this.expanded = !this.expanded;
      this.render();
      if (hadFocus) this.button.focus({ preventScroll: true });
    };

    render = () => {
      const collapsed = this.canCollapse && !this.expanded;
      this.content.hidden = collapsed;
      this.preview.hidden = !collapsed;
      this.button.setAttribute("aria-expanded", String(!collapsed));
      this.button.textContent = collapsed ? this.button.dataset.readMore : this.button.dataset.showLess;
      if (collapsed) {
        // Fit the text and inline button together, keeping the last word faded.
        let low = 1;
        let high = this.words.length;
        while (low < high) {
          const count = Math.ceil((low + high) / 2);
          this.renderPreview(count);
          if (this.preview.getBoundingClientRect().height <= this.collapsedHeight + 1) low = count;
          else high = count - 1;
        }
        this.renderPreview(low);
      } else {
        this.buttonTarget.append(this.button);
      }
    };

    renderPreview(count) {
      const tail = document.createElement("span");
      tail.className = "m-collection-description__tail";
      const fadedWord = document.createElement("span");
      fadedWord.className = "m-collection-description__fade";
      fadedWord.textContent = this.words[count - 1];
      tail.append(fadedWord, this.button);
      this.preview.replaceChildren(document.createTextNode(this.words.slice(0, count - 1).join(" ") + " "), tail);
    }
  });
}
