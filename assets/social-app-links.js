// App handoffs from a new tab can leave an empty about:blank tab on mobile.
// Let the browser open social app links from the current tab instead.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link) return;

  const isWhatsApp = link.hostname === "wa.me" || link.hostname === "whatsapp.com" ||
    link.hostname.endsWith(".whatsapp.com");
  if (isWhatsApp && document.body.classList.contains("template-product")) {
    const url = new URL(link.href);
    if (!url.searchParams.has("text")) {
      const productUrl = document.querySelector('link[rel="canonical"]')?.href ||
        `${window.location.origin}${window.location.pathname}`;
      url.searchParams.set("text", `${productUrl}\nHi, I'd like to enquire about this product.`);
      link.href = url.href;
    }
  }

  if (link.target !== "_blank" ||
      !window.matchMedia("(max-width: 1024px), (pointer: coarse)").matches) return;

  const socialHosts = ["wa.me", "whatsapp.com", "ig.me", "instagram.com"];
  const isSocialLink = socialHosts.some((host) =>
    link.hostname === host || link.hostname.endsWith(`.${host}`)
  );
  if (isSocialLink && (link.protocol === "https:" || link.protocol === "http:")) {
    link.target = "_self";
  }
}, { capture: true });
