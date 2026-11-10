class Collection {
  constructor() {
    this.selectors = {
      section: ".facest-filters-section",
      toolbar: ".m-collection-toolbar",
      cols: [".m-toolbar--column-switcher button"],
      productContainer: "[data-product-container]",
      loadMoreBtn: "[data-load-more]",
      // Sidebar filters selectors
      sidebar: ".m-sidebar",
      sidebarContent: ".m-sidebar--content",
      openSidebar: ".m-sidebar--open",
      closeSidebar: ".m-sidebar--close",
      filtersWrapper: ".m-filter--wrapper",
    };
    this.mobileSortingSelectors = {
      openSorting: ".m-sortby--open",
      closeSorting: ".m-sortby-mobile--close",
      sortingWrapper: ".m-sortby-mobile--wrapper",
      sortingList: ".m-sortby-mobile--content",
    };
    this.sectionId = "";
    this.isDesignMode = MinimogSettings.design_mode;

    this.currentPage = 1;
    this.paginationType; // "paginate" | "loadmore" | "infinite"
    this.totalPages;
    this.totalProducts;
    this.infiniteLoadingObserver;

    this.showColSwitchers;
    this.cachedCol;
    this.initialCol;
    this.activeCol;
    this.STORAGE_KEY = "gridColumnViews";
    this.MAX_COL_BY_SCREEN_SIZE = {
      mobile: 2,
      tablet: 4,
      desktop: 5,
    };

    this.enableFilters;
    this.enableSorting;
    this.filtersType; // "storefront_filters" | "tags_filter"
    this.filtersPosition; // "leftColumn" | "rightColumn" | "fixed"
    this.accordions;
    this.sideEffectEventsAdded = false;
  }

  init = () => {
    this.domNodes = queryDomNodes(this.selectors);
    this.mbSortingNodes = queryDomNodes(this.mobileSortingSelectors);
    this.setData();
    this.initGridView();
    this.initFilters();
    this.initMobileSorting();
    this.initProducts();
    this.sideEffectEventsAdded = true;
    MinimogEvents.subscribe("ON_PRODUCT_LIST_UPDATED", () => refreshProductReview());

    // Handle sticky toolbar on mobile
    this.handleStickyToolbar();
    document.addEventListener("matchMobile", () => this.handleStickyToolbar());
    document.addEventListener("unmatchMobile", () => this.handleStickyToolbar());
  };

  setData = () => {
    const { section, productContainer } = this.domNodes;
    // Grid view data
    this.sectionId = section.dataset.sectionId;
    this.paginationType = section.dataset.paginationType;
    this.totalPages = productContainer && Number(productContainer.dataset.totalPages);
    this.view = section.dataset.view;
    // TODO: get from URL Search Params
    this.activeCol = null;
    this.currentPage = 1;
    this.initialCol = Number(section.dataset.initialColumn);
    this.responsiveGrid = section.dataset.responsiveGrid === "true";
    this.cachedCol = this.responsiveGrid ? this.initialCol : Number(window.localStorage.getItem(this.STORAGE_KEY)) || this.initialCol;
    this.showColSwitchers = !this.responsiveGrid && section.dataset.showColSwitchers === "true";
    // Filters data
    this.enableFilters = section.dataset.enableFilters === "true";
    this.enableSorting = section.dataset.enableSorting === "true";
    this.filtersType = section.dataset.filtersType;
    this.filtersPosition = section.dataset.filtersPosition;
  };

  initGridView = () => {
    if (!this.responsiveGrid) this.toggleView(this.isDesignMode ? this.initialCol : this.cachedCol);
    this.updateViewByScreen();
    if (this.showColSwitchers) {
      addEventDelegate({
        selector: this.selectors.cols[0],
        context: this.domNodes.toolbar,
        handler: (e, colNode) => this.toggleView(Number(colNode.dataset.column)),
      });
    }
    this.initLoadMore();
    if (!this.sideEffectEventsAdded) {
      window.addEventListener("resize", debounce(this.updateViewByScreen, 500));
    }
  };

  initFilters = () => {
    if (!this.enableFilters) return;
    const { sidebar, openSidebar, closeSidebar } = this.domNodes;
    window.requestAnimationFrame(this.initAccordions);
    openSidebar.addEventListener("click", this.openSidebarFilter);
    closeSidebar.addEventListener("click", this.closeSidebarFilter);
    sidebar.addEventListener("click", (e) => e.target === sidebar && this.closeSidebarFilter());
  };

  initMobileSorting = () => {
    if (!this.enableSorting) return;
    const { openSorting, closeSorting, sortingWrapper } = this.mbSortingNodes;
    openSorting.addEventListener("click", this.openMobileSorting);
    closeSorting.addEventListener("click", this.closeMobileSorting);
    sortingWrapper.addEventListener("click", (e) => e.target === sortingWrapper && this.closeMobileSorting());
  };

  openMobileSorting = () => {
    const { sortingWrapper, sortingList } = this.mbSortingNodes;
    sortingWrapper.style.display = "block";
    window.requestAnimationFrame(() => {
      sortingWrapper.style.setProperty("--m-bg-opacity", "0.5");
      sortingList.style.setProperty("--m-translate-y", "0");
    });
  };

  closeMobileSorting = (e) => {
    const { sortingWrapper, sortingList } = this.mbSortingNodes;
    sortingWrapper.style.setProperty("--m-bg-opacity", "0");
    sortingList.style.setProperty("--m-translate-y", "100%");
    setTimeout(() => sortingWrapper.style.setProperty("display", "none"), 300);
  };

  initAccordions = () => {
    this.accordions && this.accordions.destroy();
    const { filtersWrapper } = this.domNodes;
    filtersWrapper.classList.remove("acc-initialized");
    this.accordions = new MinimogLibs.Accordion(filtersWrapper, {
      presetContentHeight: window.innerWidth > 1280 && this.filtersPosition !== "fixed",
      callback: () => filtersWrapper.style.setProperty('opacity', '1')
    });
  };

  openSidebarFilter = () => {
    const { sidebar, sidebarContent, section } = this.domNodes;
    sidebar.style.display = "block";
    window.requestAnimationFrame(() => {
      sidebar.style.setProperty("--m-bg-opacity", "0.5");
      sidebarContent.style.setProperty("--m-translate-x", "0");
      this.accordions && this.accordions.setContentHeight();
    });
    section.classList.add("sidebar-open");
  };

  closeSidebarFilter = () => {
    const { sidebar, sidebarContent, section } = this.domNodes;
    section.classList.remove("sidebar-open");
    if (window.innerWidth < 1280 || sidebar.dataset.type === "fixed") {
      sidebarContent.style.setProperty("--m-translate-x", "-100%");
      sidebar.style.removeProperty("--m-bg-opacity");
      setTimeout(() => sidebar.style.removeProperty("display"), 300);
    }
  };

  toggleView = (col) => {
    if (!col || this.view === "search") return;
    if (this.responsiveGrid) col = window.innerWidth >= 1024 ? 4 : 2;
    const { cols, productContainer } = this.domNodes;
    if (!productContainer) return;
    // Resize image product card
    const allImages = productContainer.querySelectorAll("responsive-image");
    if (allImages && allImages.length > 0) {
      allImages.forEach((img) => {
        img.disconnectedCallback();
        img.connectedCallback();
      });
    }

    const activeCol = this.activeCol || this.initialCol;
    if (this.showColSwitchers) {
      cols[activeCol - 1].classList.remove("active");
      cols[col - 1].classList.add("active");
    }

    productContainer.classList.remove(`m-cols-${activeCol}`);
    productContainer.classList.add(`m-cols-${col}`);

    if (!this.responsiveGrid) window.localStorage.setItem(this.STORAGE_KEY, col);
    this.activeCol = col;
    this.positionGridPromotions();
  };

  positionGridPromotions = () => {
    const { productContainer } = this.domNodes;
    if (!productContainer) return;
    const promotions = Array.from(productContainer.querySelectorAll("[data-grid-promotion]"));
    if (!promotions.length) return;

    const activeColumns = this.activeCol || this.initialCol;
    const columns = window.innerWidth < 768 ? Math.min(activeColumns, 2) : activeColumns;
    const span = Math.min(2, columns);
    productContainer.style.setProperty("--collection-grid-columns", columns);
    // Reuse the random choice when resizing, while aligning to the new row width.
    promotions.forEach((promotion) => promotion.remove());
    promotions.forEach((promotion) => {
      if (!promotion.dataset.placementRandom) promotion.dataset.placementRandom = Math.random();
      const items = Array.from(productContainer.children);
      const candidates = [];
      const lastPromotionIndex = items.reduce((last, item, index) => item.matches("[data-grid-promotion]") ? index : last, -1);
      let slots = 0;
      items.forEach((item, index) => {
        const column = slots % columns;
        if (index > lastPromotionIndex && item.matches(".m-product-item") && (column === 0 || column === columns - span)) {
          candidates.push(index);
        }
        const itemSpan = item.matches("[data-grid-promotion]") ? span : 1;
        if (column + itemSpan > columns) slots += columns - column;
        slots += itemSpan;
      });
      // Prefer a position after at least one product when there is room.
      const amongProducts = candidates.filter((index) => index > 0);
      const positions = amongProducts.length ? amongProducts : candidates;
      const index = positions[Math.floor(Number(promotion.dataset.placementRandom) * positions.length)] ?? items.length;
      productContainer.insertBefore(promotion, items[index] || null);
    });
    this.balancePromotionRow();
  };

  balancePromotionRow = () => {
    const { productContainer } = this.domNodes;
    if (!productContainer) return;
    const products = productContainer.querySelectorAll(".m-product-item");
    products.forEach((product) => product.classList.remove("m-product-item--fill-row"));
    if (!this.responsiveGrid || this.activeCol !== 4 || !productContainer.querySelector("[data-grid-promotion]")) return;

    // A two-card promotion can leave two products at the end of a four-column grid.
    let slots = 0;
    let lastRow = [];
    Array.from(productContainer.children).forEach((item) => {
      const span = item.matches("[data-grid-promotion]") ? 2 : 1;
      const column = slots % 4;
      if (column === 0 || column + span > 4) {
        if (column + span > 4) slots += 4 - column;
        lastRow = [];
      }
      lastRow.push(item);
      slots += span;
    });
    if (slots % 4 === 2 && lastRow.length === 2 && lastRow.every((item) => item.matches(".m-product-item"))) {
      lastRow.forEach((product) => product.classList.add("m-product-item--fill-row"));
    }
  };

  updateViewByScreen = () => {
    if (this.responsiveGrid) {
      const columns = window.innerWidth >= 1024 ? 4 : 2;
      if (columns !== this.activeCol) this.toggleView(columns);
      else this.positionGridPromotions();
      return;
    }
    if (this.activeCol === 1) {
      this.positionGridPromotions();
      return; // List layout
    }
    const device = this.getDeviceByScreenSize();
    const maxCol = this.MAX_COL_BY_SCREEN_SIZE[device];
    if (maxCol < this.activeCol) this.toggleView(maxCol);
    else this.positionGridPromotions();
  };

  getDeviceByScreenSize = () => {
    if (window.innerWidth < 768) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  };

  initLoadMore = () => {
    if (this.paginationType === "paginate" || this.totalPages <= 1 || this.view === "search") return;

    const { loadMoreBtn } = this.domNodes;
    loadMoreBtn.addEventListener("click", this.loadMoreProducts);

    if (this.paginationType === "infinite") {
      this.infiniteLoadingObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio === 1) this.loadMoreProducts();
          });
        },
        { threshold: 1 }
      );

      this.infiniteLoadingObserver.observe(loadMoreBtn);
    }
  };

  loadMoreProducts = () => {
    const nextPage = this.currentPage + 1;
    if (nextPage > this.totalPages) return;

    const { productContainer, loadMoreBtn } = this.domNodes;
    this.toggleLoading(true);
    fetchSection(this.sectionId, { fromCache: true, params: { page: nextPage } })
      .then((productGridHTML) => {
        const productNodes = productGridHTML.querySelectorAll("[data-product-container] .m-product-item");
        productNodes.forEach((prodNode) => productContainer.appendChild(prodNode));
        this.initProducts();
      })
      .catch((err) => console.error(`Failed to load more products.`, err))
      .finally(() => {
        MinimogEvents.emit("ON_PRODUCT_LIST_UPDATED");
        this.toggleLoading(false);
        this.currentPage = nextPage;
        if (nextPage >= this.totalPages) {
          loadMoreBtn.parentNode.remove();
          this.infiniteLoadingObserver && this.infiniteLoadingObserver.unobserve(loadMoreBtn);
        }
      });
  };

  initProducts = () => {
    this.balancePromotionRow();
    MinimogTheme.CompareProduct && MinimogTheme.CompareProduct.setCompareButtonsState();
    MinimogTheme.Wishlist && MinimogTheme.Wishlist.setWishlistButtonsState();
  };

  toggleLoading = (loading) => {
    const { loadMoreBtn } = this.domNodes;
    if (loadMoreBtn) {
      const method = loading ? "add" : "remove";
      loadMoreBtn.classList[method]("m-spinner-loading");
    }
  };

  handleStickyToolbar() {
    const toolbar = this.domNodes.toolbar;
    const extraSpace = toolbar && toolbar.offsetTop;
    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      if (MinimogTheme.config.mqlMobile) {
        const currentScroll = window.scrollY;
        if (currentScroll <= extraSpace) {
          toolbar.classList.remove("scroll-up", "m-collection-toolbar--sticky");
          return;
        }
        toolbar.classList.add("m-collection-toolbar--sticky");
        if (
          currentScroll > toolbar.offsetHeight + extraSpace &&
          currentScroll > lastScroll &&
          !toolbar.classList.contains("scroll-down")
        ) {
          toolbar.classList.remove("scroll-up");
          toolbar.classList.add("scroll-down");
        } else if (currentScroll < lastScroll && toolbar.classList.contains("scroll-down")) {
          toolbar.classList.remove("scroll-down");
          toolbar.classList.add("scroll-up");
        }
        lastScroll = currentScroll;
      } else {
        toolbar.classList.remove("scroll-up", "m-collection-toolbar--sticky", "scroll-down");
      }
    });
  }
}
