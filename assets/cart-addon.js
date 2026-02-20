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
      this.giftDiscountCode = "VEKC";
      this.giftVariantId = "VERSACE-KEYCHAIN-REPEAT-CUSTOMER-GIFT";
      this.isAddingGift = false;
      this.discountAppliedKey = "minimog-discount-applied";
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
      this.onCartUpdatedListener = this.onCartUpdated.bind(this);
      this.init();
      document.addEventListener("cart:updated", this.onCartUpdatedListener);
    }

    disconnectedCallback() {
      if (this._removeCloseAddonButton) this._removeCloseAddonButton();
      if (this._removeCalcShippingButton) this._removeCalcShippingButton();
      if (this.onCartUpdatedListener) {
        document.removeEventListener("cart:updated", this.onCartUpdatedListener);
      }
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
        this.ensureGiftItemForDiscount(code);
        this.showDiscountNotificationIfNeeded(code);
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
            this.applyDiscountCode(code);
            this.ensureGiftItemForDiscount(code);
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

    onCartUpdated() {
      const code = localStorage.getItem(this.discountCodeKey);
      this.ensureGiftItemForDiscount(code);
      this.showDiscountNotificationIfNeeded(code);
    }

    normalizeDiscountCode(code) {
      return (code || "").trim().toUpperCase();
    }

    getGiftVariantId() {
      const variantId = parseInt(this.giftVariantId, 10);
      if (Number.isNaN(variantId)) return null;
      return variantId;
    }

    getSectionsToUpdate() {
      let sections = [];
      document.documentElement.dispatchEvent(
        new CustomEvent("cart:grouped-sections", { bubbles: true, detail: { sections: sections } })
      );
      return sections;
    }

    showDiscountNotificationIfNeeded(code) {
      const normalizedCode = this.normalizeDiscountCode(code);
      const pendingCode = this.normalizeDiscountCode(localStorage.getItem(this.discountAppliedKey));
      if (!pendingCode || pendingCode !== normalizedCode) return;
      this.checkDiscountApplied(normalizedCode)
        .then((isApplied) => {
          if (!isApplied) return;
          window.MinimogTheme.Notification.show({
            target: this.cartWrapper || document.body,
            method: "appendChild",
            type: "success",
            message: `Discount code ${normalizedCode} applied`,
            last: 3000,
            sticky: false,
          });
          localStorage.removeItem(this.discountAppliedKey);
        })
        .catch(() => {
          localStorage.removeItem(this.discountAppliedKey);
        });
    }

    async checkDiscountApplied(code) {
      const cart = await fetch(`${this.rootUrl}cart.js`).then((res) => res.json());
      const hasCartDiscount = (cart.cart_level_discount_applications || []).some((discount) =>
        this.normalizeDiscountCode(discount.title).includes(code)
      );
      if (hasCartDiscount) return true;
      if (code === this.giftDiscountCode) {
        return cart.items.some((item) => Number(item.id) === this.getGiftVariantId());
      }
      return false;
    }

    applyDiscountCode(code) {
      const normalizedCode = this.normalizeDiscountCode(code);
      if (!normalizedCode) return;
      localStorage.setItem(this.discountAppliedKey, normalizedCode);
      const redirectPath = window.location.pathname + window.location.search;
      window.location.href = `${this.rootUrl}discount/${encodeURIComponent(normalizedCode)}?redirect=${encodeURIComponent(redirectPath)}`;
    }

    async ensureGiftItemForDiscount(code) {
      const normalizedCode = this.normalizeDiscountCode(code);
      if (normalizedCode !== this.giftDiscountCode) return;
      if (this.isAddingGift) return;
      const giftVariantId = this.getGiftVariantId();
      if (!giftVariantId) return;
      this.isAddingGift = true;
      try {
        const cart = await fetch(`${this.rootUrl}cart.js`).then((res) => res.json());
        const alreadyInCart = cart.items.some((item) => Number(item.id) === giftVariantId);
        if (alreadyInCart) return;
        const sectionsToBundle = this.getSectionsToUpdate();
        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];
        const formData = new FormData();
        formData.append("id", giftVariantId);
        formData.append("quantity", 1);
        formData.append("sections", sectionsToBundle);
        formData.append("sections_url", window.location.pathname);
        config.body = formData;
        const response = await fetch(`${MinimogSettings.routes.cart_add_url}`, config).then((res) => res.json());
        if (!response.status) {
          window.MinimogEvents.emit(MinimogTheme.pubSubEvents.cartUpdate, { cart: response });
          window.MinimogTheme.Notification.show({
            target: this.cartWrapper || document.body,
            method: "appendChild",
            type: "success",
            message: "Gift added to cart",
            last: 3000,
            sticky: false,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.isAddingGift = false;
      }
    }
  }
  customElements.define("m-cart-addons", MCartAddons);
}
