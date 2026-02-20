if (!customElements.get("m-cart-addons")) {
  class MCartAddons extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        zipCode: '[name="address[zip]"]',
        province: '[name="address[province]"]',
        country: '[name="address[country]"]',
        addressForm: '[data-address="root"]',
        shippingMessage: ".m-cart-addon__shipping-rate",
        cartDiscountCode: '[name="discount"]',
        cartDiscountCodeNoti: "[data-discount-noti]",
        cartNote: '[name="note"]',
        saveAddonButton: ".m-cart-addon--save",
        closeAddonButton: ".m-cart-addon--close",
        calcShippingButton: ".m-cart-addon--calculate",
        triggerAddonButton: ".m-cart-addon--trigger-button",
        devliveryTime: '[name="attributes[Delivery time]"]',
      };
    }

    connectedCallback() {
      this.cartWrapper = document.querySelector(".m-cart-drawer");
      this.isCartPage = MinimogSettings.templateName === "cart";
      if (this.isCartPage) {
        this.cartWrapper = document.querySelector(".m-cart__footer--wrapper");
      }
      this.initAddress = false;
      this.cartOverlay = this.cartWrapper.querySelector(".m-cart__overlay");
      this.domNodes = queryDomNodes(this.selectors, this);
      this.rootUrl = window.Shopify.routes.root;
      this.discountCodeKey = "minimog-discount-code";
      this.deliveryCodeKey = "minimog-delivery-code";
      this.init();
    }

    disconnectedCallback() {
      if (this._removeCloseAddonButton) this._removeCloseAddonButton();
      if (this._removeCalcShippingButton) this._removeCalcShippingButton();
    }

    init() {
      const { cartDiscountCode, cartDiscountCodeNoti, devliveryTime } = this.domNodes;
      addEventDelegate({
        selector: this.selectors.triggerAddonButton,
        context: this,
        handler: (e, addonButton) => {
          e.preventDefault();
          if (this.isCartPage) {
            const addonCurrentActive = document.querySelector(".m-cart-addon__body.open");
            if (addonCurrentActive) addonCurrentActive.classList.remove("open");
          }
          const { open: addonTarget } = addonButton.dataset;
          const addonNode = this.cartWrapper.querySelector(`#m-addons-${addonTarget}`);
          this.removeActiveAllButton();
          addonButton.classList.add("active");
          addonNode && addonNode.classList.add("open");
          this.cartOverlay && this.cartOverlay.classList.add("open");
          this.openAddon = addonNode;

          if (addonTarget === "shipping") {
            fetchSection("country-options", { url: window.MinimogSettings.base_url })
              .then((html) => {
                const select = html.querySelector("#AddressCountry");
                const options = select && select.querySelectorAll("option");
                const defaultSelect = addonNode.querySelector("#MadrressCountry select");
                options &&
                  options.forEach((option) => {
                    defaultSelect && defaultSelect.appendChild(option);
                  });
                this.setupCountries();
                defaultSelect.value = defaultSelect && defaultSelect.dataset.default;
              })
              .catch(console.error);
          }
        },
      });
      this._removeCloseAddonButton = addEventDelegate({
        selector: this.selectors.closeAddonButton,
        context: this.cartWrapper,
        handler: this.close.bind(this),
      });

      this._removeCalcShippingButton = addEventDelegate({
        selector: this.selectors.calcShippingButton,
        context: this.cartWrapper,
        handler: this.calcShipping.bind(this),
      });
      if (cartDiscountCode) {
        const code = localStorage.getItem(this.discountCodeKey);
        if (code) {
          cartDiscountCode.value = code;
          if (cartDiscountCodeNoti) {
            cartDiscountCodeNoti.style.display = "inline";
          }
        }
      }
      if (devliveryTime) {
        const code = localStorage.getItem(this.deliveryCodeKey);
        if (code) devliveryTime.value = code;
      }
      this.saveAddonValue();
      const today = new Date().toISOString().slice(0, 16);
      const deliveryTimeElm = this.querySelector("#delivery-time");
      if (deliveryTimeElm) deliveryTimeElm.min = today;
    }

    removeActiveAllButton() {
      const triggerButtons = this.querySelectorAll(this.selectors.triggerAddonButton);
      triggerButtons && triggerButtons.forEach((button) => button.classList.remove("active"));
    }

    setupCountries() {
      if (this.initAddress) return;
      if (Shopify && Shopify.CountryProvinceSelector) {
        new Shopify.CountryProvinceSelector("AddressCountry", "AddressProvince", {
          hideElement: "AddressProvinceContainer",
        });
        this.initAddress = true;
      }
    }

    close(event) {
      event.preventDefault();
      this.openAddon.classList.remove("open");
      this.cartOverlay && this.cartOverlay.classList.remove("open");
      this.removeActiveAllButton();
      this.openAddon = null;
    }

    calcShipping(event) {
      event.preventDefault();
      const actionsWrapper = event.target.closest(".m-cart-addon__action");
      actionsWrapper.classList.add("m-spinner-loading");
      const zipCode = this.domNodes.zipCode && this.domNodes.zipCode.value && this.domNodes.zipCode.value.trim();
      const country = this.domNodes.country.value;
      const province = this.domNodes.province.value;
      this.domNodes.shippingMessage.classList.remove("error");
      this.domNodes.shippingMessage.innerHTML = "";
      const showDeliveryDays = actionsWrapper.dataset.showDeliveryDays === "true";
      fetch(
        `${this.rootUrl}cart/shipping_rates.json?shipping_address%5Bzip%5D=${zipCode}&shipping_address%5Bcountry%5D=${country}&shipping_address%5Bprovince%5D=${province}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res && res.shipping_rates) {
            const { shipping_rates } = res;
            const { shippingRatesResult, noShippingRate } = MinimogStrings;
            if (shipping_rates.length > 0) {
              actionsWrapper.classList.remove("m-spinner-loading");
              const shippingLabel = document.createElement("P");
              shippingLabel.classList.add("m-cart-addon__shipping-rate--label");
              shippingLabel.innerHTML = `${shippingRatesResult.replace("{{count}}", shipping_rates.length)}:`;
              this.domNodes.shippingMessage.appendChild(shippingLabel);
              shipping_rates.map((rate) => {
                const { deliveryOne = "Day", deliveryOther = "Days" } = actionsWrapper.dataset;
                let deliveryDays = "";
                if (rate.delivery_days.length > 0 && showDeliveryDays) {
                  let textDay = deliveryOne;
                  const firstDeliveryDay = rate.delivery_days[0];
                  const lastDeliveryDay = rate.delivery_days.at(-1);
                  if (firstDeliveryDay > 1) textDay = deliveryOther;
                  if (firstDeliveryDay === lastDeliveryDay) {
                    deliveryDays = `(${firstDeliveryDay} ${textDay})`;
                  } else {
                    deliveryDays = `(${firstDeliveryDay} - ${lastDeliveryDay} ${textDay})`;
                  }
                }
                const shippingRateItem = document.createElement("P");
                shippingRateItem.classList.add("m-cart-addon__shipping-rate--item");
                shippingRateItem.innerHTML = `${rate.name}: <span>${rate.price} ${Shopify.currency.active}</span> ${deliveryDays}`;
                this.domNodes.shippingMessage.appendChild(shippingRateItem);
              });
            } else {
              actionsWrapper.classList.remove("m-spinner-loading");
              this.domNodes.shippingMessage.innerHTML = `<p>${noShippingRate}</p>`;
            }
          } else {
            actionsWrapper.classList.remove("m-spinner-loading");
            Object.entries(res).map((error) => {
              this.domNodes.shippingMessage.classList.add(error[0] && error[0].toLowerCase());
              const message = `${error[1][0]}`;
              const shippingRateError = document.createElement("P");
              shippingRateError.classList.add("m-cart-addon__shipping-rate--error");
              shippingRateError.innerHTML = `${message}<sup>*</sup>`;
              this.domNodes.shippingMessage.appendChild(shippingRateError);
            });
          }
        })
        .catch(console.error);
    }

    async handleGiftWithPurchase(code) {
      if (!code || code.trim().toUpperCase() !== "VEKC") return;

      const GIFT_SKU = "VERSACE-KEYCHAIN-REPEAT-CUSTOMER-GIFT";
      const GIFT_HANDLE = "versace-keychain";
      console.log(`[Gift] Checking for gift item: ${GIFT_SKU}`);

      try {
        let targetVariantId = null;
        
        // Fetch product by handle directly
        try {
            const productRes = await fetch(`${this.rootUrl}products/${GIFT_HANDLE}.js`);
            if (!productRes.ok) throw new Error("Product fetch failed");
            const productData = await productRes.json();
            
            const variant = productData.variants.find((v) => v.sku === GIFT_SKU);
            if (variant) {
                targetVariantId = variant.id;
                console.log(`[Gift] Found variant ID: ${targetVariantId}`);
            }
        } catch (e) {
            console.warn(`[Gift] Failed to fetch product by handle ${GIFT_HANDLE}. Falling back to search.`, e);
             // Search fallback
             const searchUrl = `${this.rootUrl}search/suggest.json?q=${encodeURIComponent(GIFT_SKU)}&resources[type]=product&resources[limit]=5&resources[options][fields]=variants.sku,body,title`;
             const searchRes = await fetch(searchUrl);
             const searchData = await searchRes.json();
             const products = searchData.resources.results.products;
             if (products && products.length > 0) {
                 for (const product of products) {
                     const productHandle = product.url.split("/products/")[1].split("?")[0];
                     const productRes = await fetch(`${this.rootUrl}products/${productHandle}.js`);
                     const productData = await productRes.json();
                     const variant = productData.variants.find((v) => v.sku === GIFT_SKU);
                     if (variant) {
                         targetVariantId = variant.id;
                         break;
                     }
                 }
             }
        }

        if (!targetVariantId) {
             console.warn(`[Gift] Variant for SKU ${GIFT_SKU} not found.`);
             return;
        }

        const cartRes = await fetch(`${this.rootUrl}cart.js`);
        const cartData = await cartRes.json();
        const isItemInCart = cartData.items.some((item) => item.id === targetVariantId);

        if (!isItemInCart) {
           // Determine which sections to update
           const isCartPage = document.body.classList.contains('template-cart') || window.location.pathname.includes('/cart');
           let sectionsToFetch = ['cart-drawer', 'cart-count'];
           if (isCartPage) {
               sectionsToFetch.push('cart-template');
           }
           
           const formData = {
             items: [{
               id: targetVariantId,
               quantity: 1
             }],
             sections: sectionsToFetch.join(','),
             sections_url: window.location.pathname
           };
 
           const addRes = await fetch(`${this.rootUrl}cart/add.js`, {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify(formData),
           });
           
           const addData = await addRes.json();
           console.log(`[Gift] Added gift item to cart.`);
           
           // Update Cart Drawer Manually (to avoid extra fetch)
           if (addData.sections && addData.sections['cart-drawer']) {
               const cartDrawer = document.getElementById("MinimogCartDrawer");
               if (cartDrawer) {
                   const parser = new DOMParser();
                   const doc = parser.parseFromString(addData.sections['cart-drawer'], 'text/html');
                   const newDrawerContent = doc.getElementById("MinimogCartDrawer")?.innerHTML;
                   if (newDrawerContent) {
                       const wasActive = cartDrawer.classList.contains("m-cart-drawer--active");
                       cartDrawer.innerHTML = newDrawerContent;
                       
                       if (wasActive) {
                           cartDrawer.classList.add("m-cart-drawer--active");
                           const inner = cartDrawer.querySelector(".m-cart-drawer__inner");
                           if (inner) inner.style.setProperty("--translate-x", "0");
                       } else {
                           if (cartDrawer.open) cartDrawer.open();
                       }
                   }
               }
           }

           // Update Cart Page via Theme Event
           if (window.MinimogTheme && window.MinimogTheme.pubSubEvents) {
                window.MinimogEvents.emit(window.MinimogTheme.pubSubEvents.cartUpdate, { cart: addData });
           }
          
           window.MinimogTheme.Notification.show({
                target: document.body,
                method: "appendChild",
                type: "success",
                message: "Gift item added to cart!",
                last: 3000
            });
        } else {
             console.log(`[Gift] Gift item already in cart.`);
        }
      } catch (error) {
        console.error("[Gift] Error handling gift with purchase:", error);
      }
    }

    saveAddonValue() {
      addEventDelegate({
        event: "click",
        context: this.cartWrapper,
        selector: this.selectors.saveAddonButton,
        handler: (event, target) => {
          event.preventDefault();
          const { cartDiscountCode, cartDiscountCodeNoti, devliveryTime } = this.domNodes;
          if (target.dataset.action === "coupon" && cartDiscountCode) {
            const code = cartDiscountCode.value;
            localStorage.setItem(this.discountCodeKey, code);
            if (code !== "" && cartDiscountCodeNoti) {
              cartDiscountCodeNoti.style.display = "inline";
            } else {
              cartDiscountCodeNoti.style.display = "none";
            }
            
            // Show notification
            if (code) {
                window.MinimogTheme.Notification.show({
                    target: document.body,
                    method: "appendChild",
                    type: "success",
                    message: "Discount code applied successfully",
                    last: 3000
                });
            }

            // Split codes by comma or space and handle each
            const codes = code.split(/[\s,]+/).filter(Boolean);
            codes.forEach(c => this.handleGiftWithPurchase(c));
            
            this.close(event);
          }
          if (target.dataset.action === "note") {
            this.updateCartNote();
            this.close(event);
          }
          if (target.dataset.action === "delivery") {
            const code = devliveryTime.value;
            const isValidDate = Date.parse(code);
            if (isValidDate > Date.now()) {
              localStorage.setItem(this.deliveryCodeKey, code);
              this.close(event);
            } else {
              localStorage.setItem(this.deliveryCodeKey, "");
              devliveryTime.value = "";
              window.MinimogTheme.Notification.show({
                target: this.querySelector(".m-cart-addon-message-error"),
                method: "appendChild",
                type: "error",
                message: window.MinimogStrings.valideDateTimeDelivery,
                last: 3000,
                sticky: false,
              });
            }
          }
        },
      });
    }

    updateCartNote() {
      const cartNoteValue = this.domNodes.cartNote.value;
      const body = JSON.stringify({ note: cartNoteValue });
      fetch(`${window.MinimogSettings.routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
    }
  }
  customElements.define("m-cart-addons", MCartAddons);
}