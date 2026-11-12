// App handoffs from a new tab can leave an empty about:blank tab on mobile.
// Let the browser open social app links from the current tab instead.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!window.matchMedia("(max-width: 1024px), (pointer: coarse)").matches) return;

  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link || link.target !== "_blank") return;

  const socialHosts = ["wa.me", "whatsapp.com", "ig.me", "instagram.com"];
  const isSocialLink = socialHosts.some((host) =>
    link.hostname === host || link.hostname.endsWith(`.${host}`)
  );
  if (isSocialLink && (link.protocol === "https:" || link.protocol === "http:")) {
    link.target = "_self";
  }
}, { capture: true });
