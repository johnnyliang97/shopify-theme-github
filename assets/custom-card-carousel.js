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
      const containerType = this.dataset.containerType;
      const containerWidth = parseInt(this.dataset.containerWidth) || 1200;

      // Calculate offsets for "custom" container type
      const getDesktopOffset = () => {
        if (containerType !== 'custom') return 0;
        const windowWidth = window.innerWidth;
        if (windowWidth <= 1280) return 0; // Below container width + padding
        
        // Calculate half of the remaining space
        // Standard gutter in this theme seems to be around 15px
        // Or we can just use (windowWidth - containerWidth) / 2
        // Adding a small buffer if needed, but usually container centers exactly
        const offset = Math.max(0, (windowWidth - containerWidth) / 2);
        return offset + 15; // +15px for gutter/padding safety usually found in themes
      };

      let desktopOffset = getDesktopOffset();

      // Define padding offsets
      // Custom type: 
      // Mobile: 0 (Full bleed)
      // Desktop: Calculated offset (Align to container)
      
      // Full Width type:
      // All: 0
      
      let offsets = {
        mobile: 0,
        tablet: 0,
        desktop: 0
      };

      if (containerType === 'custom') {
        offsets = {
          mobile: 0,
          tablet: 0,
          desktop: desktopOffset
        };
      } else if (containerType === 'full_width') {
        offsets = {
          mobile: 0,
          tablet: 0,
          desktop: 0
        };
      }

      if (typeof MinimogLibs !== 'undefined' && MinimogLibs.Swiper) {
        this.swiper = new MinimogLibs.Swiper(slideContainer, {
          slidesPerView: 1.2,
          spaceBetween: 16,
          slidesOffsetBefore: offsets.mobile,
          slidesOffsetAfter: offsets.mobile,
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
              slidesOffsetBefore: offsets.mobile,
              slidesOffsetAfter: offsets.mobile,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 24,
              slidesOffsetBefore: offsets.tablet,
              slidesOffsetAfter: offsets.tablet,
            },
            1024: {
              slidesPerView: items + 0.2,
              spaceBetween: 30,
              slidesOffsetBefore: offsets.desktop,
              // For "custom" type, we want the right side to bleed to the edge, so 0 offset after
              // For "extend previous cards to far left" on last slide, slidesOffsetBefore works naturally
              slidesOffsetAfter: 0, 
            },
          },
          on: {
            init: () => this.updateArrowPosition(),
            resize: () => {
              this.updateArrowPosition();
              if (containerType === 'custom') {
                const newOffset = getDesktopOffset();
                if (this.swiper && this.swiper.params) {
                    // Update breakpoint params
                    const desktopBreakpoint = this.swiper.params.breakpoints[1024];
                    if (desktopBreakpoint) {
                        desktopBreakpoint.slidesOffsetBefore = newOffset;
                        desktopBreakpoint.slidesOffsetAfter = 0;
                    }
                    // Update current params if screen is large
                    if (window.innerWidth >= 1024) {
                        this.swiper.params.slidesOffsetBefore = newOffset;
                        this.swiper.params.slidesOffsetAfter = 0;
                        this.swiper.update();
                    }
                }
              }
            }
          }
        });
        
        // Initial update
        this.updateArrowPosition();
        
        // Additional safety check for resize
        window.addEventListener('resize', () => {
            this.updateArrowPosition();
            // Also trigger swiper update if needed (though on: resize handles it mostly)
        });
        
      } else {
          console.warn('MinimogLibs.Swiper not found. Make sure vendor scripts are loaded.');
      }
    }
    
    updateArrowPosition() {
      const imageWrapper = this.querySelector('.m-custom-card-carousel__image-wrapper');
      const prevArrow = this.querySelector('.swiper-button-prev');
      const nextArrow = this.querySelector('.swiper-button-next');
      
      if (imageWrapper && prevArrow && nextArrow) {
        const imageHeight = imageWrapper.offsetHeight;
        if (imageHeight > 0) {
            prevArrow.style.top = `${imageHeight / 2}px`;
            nextArrow.style.top = `${imageHeight / 2}px`;
        }
      }
    }
  }

  customElements.define("m-custom-card-carousel", MCustomCardCarousel);
}
