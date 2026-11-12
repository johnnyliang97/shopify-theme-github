(() => {
  if (!window.customElements) return;

  const selector = ".installment-shoppay shopify-payment-terms";
  const styleId = "lestyle-payment-terms-typography";
  const observedRoots = new WeakSet();
  const boundLogos = new WeakSet();

  const styleTerms = (host) => {
    const root = host.shadowRoot;
    if (!root || observedRoots.has(root)) return;
    observedRoots.add(root);

    // Shopify renders the banner inside an open shadow root.
    const customizeTerms = () => {
      if (!root.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
        #shopify-installments {
          font-family: var(--font-stack-body);
          font-size: 14px;
          line-height: 1.4;
          color: #777777;
        }
        #shopify-installments-cta[data-lestyle-logo-trigger] {
          display: none;
        }
        [data-lestyle-installments-logo] {
          cursor: pointer;
          border-radius: 2px;
        }
        [data-lestyle-installments-logo]:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 3px;
        }
      `;
        root.appendChild(style);
      }

      const trigger = root.getElementById("shopify-installments-cta");
      const logoSvg = Array.from(root.querySelectorAll("#shopify-installments-content svg"))
        .find((svg) => svg.querySelector("title")?.textContent.trim().toLowerCase() === "shop");
      const logo = logoSvg?.closest("div");
      if (!trigger || !logo) return;

      logo.setAttribute("data-lestyle-installments-logo", "");
      logo.setAttribute("role", "button");
      logo.setAttribute("tabindex", "0");
      logo.setAttribute("aria-haspopup", "dialog");
      logo.setAttribute("aria-label", trigger.getAttribute("aria-label") || "View installment details");
      trigger.setAttribute("data-lestyle-logo-trigger", "");

      if (boundLogos.has(logo)) return;
      boundLogos.add(logo);
      const openDetails = () => root.getElementById("shopify-installments-cta")?.click();
      logo.addEventListener("click", openDetails);
      logo.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!event.repeat) openDetails();
        }
      });
    };

    customizeTerms();
    new MutationObserver(customizeTerms).observe(root, { childList: true, subtree: true });
  };

  const scan = (node) => {
    if (node.matches?.(selector)) styleTerms(node);
    node.querySelectorAll(selector).forEach(styleTerms);
  };

  customElements.whenDefined("shopify-payment-terms").then(() => {
    document.querySelectorAll(".m-main-product").forEach((product) => {
      scan(product);
      // Variant changes replace the price block, including the payment terms.
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) scan(node);
          });
        });
      }).observe(product, { childList: true, subtree: true });
    });
  });
})();
