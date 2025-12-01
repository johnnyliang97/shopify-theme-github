if (!customElements.get("m-custom-card-carousel")) {
  class MCustomCardCarousel extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.initSlider();
    }

    initSlider() {
      const slideContainer = this.querySelector(".swiper-container");
      if (!slideContainer) return;

      const items = parseInt(this.dataset.items) || 4;
      const autoplay = this.dataset.autoplay === "true";
      const autoplaySpeed = parseInt(this.dataset.autoplaySpeed) || 5000;
      const showPagination = this.dataset.showPagination === "true";
      const showNavigation = this.dataset.showNavigation === "true";

      if (typeof MinimogLibs !== 'undefined' && MinimogLibs.Swiper) {
        this.swiper = new MinimogLibs.Swiper(slideContainer, {
          slidesPerView: 1.2,
          spaceBetween: 16,
          autoplay: autoplay ? { delay: autoplaySpeed } : false,
          navigation: showNavigation ? {
            nextEl: this.querySelector(".swiper-button-next"),
            prevEl: this.querySelector(".swiper-button-prev"),
          } : false,
          pagination: showPagination ? {
            el: this.querySelector(".swiper-pagination"),
            clickable: true,
          } : false,
          breakpoints: {
            640: {
              slidesPerView: 2.2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: items,
              spaceBetween: 30,
            },
          },
        });
      } else {
          console.warn('MinimogLibs.Swiper not found. Make sure vendor scripts are loaded.');
      }
    }
  }

  customElements.define("m-custom-card-carousel", MCustomCardCarousel);
}
