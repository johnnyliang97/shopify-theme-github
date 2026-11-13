(() => {
  // Forms renders inside a shadow root. Scope overrides to its floating teaser
  // so the subscription form and the app's dismissal controls keep working.
  const teaser = '[data-form-root="true"][data-layout="floating"][data-current-step="tease"]';
  const styles = `
    ${teaser} {
      top: 50% !important;
      right: 0 !important;
      bottom: auto !important;
      left: auto !important;
      transform: translateY(-50%) !important;
      rotate: none !important;
      padding: 0 !important;
      width: auto !important;
      z-index: 30 !important;
    }
    ${teaser} [data-testid="form-teaser"] {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      width: 36px !important;
      min-width: 36px !important;
      max-width: 36px !important;
      height: 152px !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 36px 7px 12px !important;
      border-right: 0 !important;
      border-radius: 8px 0 0 8px !important;
      background: #222 !important;
      color: #fff !important;
      box-shadow: 0 2px 10px #0002 !important;
    }
    ${teaser} [data-testid="form-teaser"] h3 {
      margin: 0 !important;
      padding: 0 !important;
      writing-mode: vertical-rl !important;
      transform: rotate(180deg) !important;
      font-family: var(--font-stack-body, sans-serif) !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      line-height: 1 !important;
      letter-spacing: .3px !important;
      white-space: nowrap !important;
      color: #fff !important;
    }
    ${teaser} [data-testid="form-teaser"] [aria-label="Close modal"] {
      position: absolute !important;
      top: 4px !important;
      right: 4px !important;
      left: auto !important;
      bottom: auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
      border-radius: 4px !important;
      background: transparent !important;
      color: #fff !important;
    }
    ${teaser} [data-testid="form-teaser"] [aria-label="Close modal"] svg {
      width: 10px !important;
      height: 10px !important;
      fill: currentColor !important;
    }
    ${teaser} [data-testid="form-teaser"]:focus-visible {
      outline: 2px solid #c19967 !important;
      outline-offset: 3px !important;
    }
  `;
  const enhanced = new WeakSet();
  const enhance = () => {
    document.querySelectorAll("shopify-forms-embed").forEach((host) => {
      const root = host.shadowRoot;
      if (!root || enhanced.has(root)) return;
      const style = document.createElement("style");
      style.dataset.lestyleFormsTeaser = "";
      style.textContent = styles;
      root.append(style);
      enhanced.add(root);
    });
  };
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  };
  enhance();
  customElements.whenDefined("shopify-forms-embed").then(schedule);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
