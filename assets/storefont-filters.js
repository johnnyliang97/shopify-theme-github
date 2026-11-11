const cachedFiltersResult = [];

class CollectionFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      section: ".facest-filters-section",
      productGridContainer: "#CollectionProductGrid",
      filtersForm: "#CollectionFiltersForm",
      sortingInToolbar: "[data-toolbar-sorting] select",
      sortingInForm: "[data-form-sorting] select",
      initialActiveSortingOption: ".m-sortby-mobile--content li.active",
      filtersWrapper: ".m-filter--wrapper",
      sidebar: ".m-sidebar",
      sidebarContent: ".m-sidebar--content",
      openSidebar: ".m-sidebar--open",
      closeSidebar: ".m-sidebar--close",
    };
    this.accordions = "";
  }

  connectedCallback() {
    this.domNodes = queryDomNodes(this.selectors);
    this.setData();
    this.debouncedOnSubmit = debounce((evt) => this.onSubmitHandler(evt), 500);
    this.domNodes.filtersForm.addEventListener("input", (event) => {
      this.syncTagToggles();
      if (this.refineDraft) return;
      this.debouncedOnSubmit(event);
    });
    this.setLoadingTarget();
    this.initSorting();
    this.initTagToggles();
    this.initRefine();
    window.addEventListener("popstate", this.onHistoryChange);
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.onHistoryChange);
    this.listeners.forEach((unsubscribeFunc) => unsubscribeFunc());
  }

  setData = () => {
    const { section, initialActiveSortingOption } = this.domNodes;
    this.enableSorting = section.dataset.enableSorting === "true";
    this.filtersPosition = section.dataset.filtersPosition;
    this.sectionId = section.dataset.sectionId;
    this.activeSortingOption = initialActiveSortingOption;
    this.view = section.dataset.view;
    this.listeners = [];
  };

  initSorting = () => {
    const { sortingInToolbar } = this.domNodes;
    if (!this.enableSorting || !sortingInToolbar) return;
    sortingInToolbar.addEventListener("change", () => {
      this.handleSorting(sortingInToolbar.value);
    });

    this.listeners.push(
      addEventDelegate({
        selector: ".m-sortby-mobile--content li",
        handler: (e, option) => {
          if (option !== this.activeSortingOption) {
            this.activeSortingOption?.classList?.remove?.("active");
            option.classList.add("active");
            this.activeSortingOption = option;
            MinimogTheme.Collection.closeMobileSorting();
            this.handleSorting(option.dataset.value);
          }
        },
      }),
    );
  };

  handleSorting = (sortingValue) => {
    const { filtersForm, sortingInForm } = this.domNodes;
    sortingInForm.value = sortingValue;
    filtersForm.dispatchEvent(new Event("input"));
  };

  getTagInput = (button) => {
    return Array.from(this.domNodes.filtersForm.elements).find(
      (input) => input.name === button.dataset.filterParam && input.value === button.dataset.filterValue
    );
  };

  syncTagToggles = () => {
    this.tagButtons?.forEach((button) => {
      const input = this.getTagInput(button);
      button.setAttribute("aria-pressed", input?.checked ? "true" : "false");
      button.disabled = !input || (input.disabled && !input.checked);
    });
  };

  initTagToggles = () => {
    this.tagButtons = this.domNodes.section.querySelectorAll("[data-sale-filter-toggle], [data-tag-filter-toggle]");
    this.syncTagToggles();
    this.tagButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const input = this.getTagInput(button);
        if (!input || button.disabled) return;
        input.checked = !input.checked;
        this.domNodes.filtersForm.dispatchEvent(new Event("input"));
      });
    });
  };

  initRefine = () => {
    const { section, filtersForm } = this.domNodes;
    if (section.dataset.mobileRefine !== "true") return;
    this.refineSortInputs = section.querySelectorAll("[data-refine-sort]");
    this.refineSortInputs.forEach((input) => {
      input.addEventListener("change", () => this.handleSorting(input.value));
    });
    const open = () => {
      this.refineDraft = Array.from(filtersForm.elements).map((input) => ({
        input, value: input.value, checked: input.checked
      }));
      this.refineRangeStyles = Array.from(filtersForm.querySelectorAll(".m-facets-price--ranges")).map((range) => ({
        range, from: range.style.getPropertyValue("--from"), to: range.style.getPropertyValue("--to")
      }));
      this.syncRefineSorting();
    };
    const cancel = () => {
      this.refineDraft?.forEach(({ input, value, checked }) => {
        input.value = value;
        if (typeof checked === "boolean") input.checked = checked;
      });
      this.refineRangeStyles?.forEach(({ range, from, to }) => {
        range.style.setProperty("--from", from);
        range.style.setProperty("--to", to);
      });
      this.refineDraft = null;
      this.refineRangeStyles = null;
      this.syncRefineSorting();
      this.syncTagToggles();
    };
    const resize = () => {
      if (this.refineDraft && window.innerWidth >= 768) MinimogTheme.Collection.closeSidebarFilter();
    };
    section.addEventListener("collection:refine-open", open);
    section.addEventListener("collection:refine-cancel", cancel);
    window.addEventListener("resize", resize);
    this.listeners.push(() => {
      section.removeEventListener("collection:refine-open", open);
      section.removeEventListener("collection:refine-cancel", cancel);
      window.removeEventListener("resize", resize);
    });
    section.querySelector("[data-refine-apply]")?.addEventListener("click", (event) => {
      this.refineDraft = null;
      this.refineRangeStyles = null;
      MinimogTheme.Collection.closeSidebarFilter();
      this.onSubmitHandler(event);
    });
    filtersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (this.refineDraft) {
        section.querySelector("[data-refine-apply]")?.click();
      } else {
        this.debouncedOnSubmit(event);
      }
    });
    this.syncRefineSorting();
  };

  syncRefineSorting = () => {
    this.refineSortInputs?.forEach((input) => {
      input.checked = input.value === this.domNodes.sortingInForm?.value;
    });
  };

  setLoadingTarget = () => {
    const screen = window.innerWidth < 768 ? "mobile" : "desktop";
    const { productGridContainer } = this.domNodes;
    const isFiltersOffCanvas = screen === "mobile" || this.filtersPosition === "fixed";
    const options = isFiltersOffCanvas ? {} : { overlay: productGridContainer };
    this.loading = new MinimogLibs.AnimateLoading(document.body, options);
  };

  onSubmitHandler(event) {
    event.preventDefault();
    if (this.refineDraft) return;
    const formData = new FormData(this.domNodes.filtersForm);
    const searchParams = new URLSearchParams(formData).toString();
    this.renderPage(searchParams);
  }

  onHistoryChange = () => {
    if (this.refineDraft) MinimogTheme.Collection.closeSidebarFilter();
    const searchParams = new URLSearchParams(window.location.search).toString();
    this.renderPage(searchParams, false);
  };

  renderPage = (searchParams, updateURLHash = true) => {
    this.loading.start();
    const _url = `${window.location.pathname}?section_id=${this.sectionId}&${searchParams}`;
    const cachedResult = cachedFiltersResult.find(({ url }) => url === _url);
    const renderFunc = cachedResult ? this.renderSectionFromCache : this.renderSectionFromFetch;
    renderFunc(_url)
      .then(() => {
        MinimogTheme.Collection.init();
        this.loading.finish(this.scrollToTop);
        document.dispatchEvent(new CustomEvent("collection:rerendered"));
      })
      .catch(console.error);

    if (updateURLHash) this.updateURLHash(searchParams);
  };

  renderSectionFromFetch = (url) => {
    return fetch(url)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Failed to load section!");
      })
      .then((text) => {
        cachedFiltersResult.push({ url, html: text });
        this.renderProductGrid(text);
      })
      .catch(console.error);
  };

  renderSectionFromCache = async (_url) => {
    const cachedResult = cachedFiltersResult.find(({ url }) => url === _url);
    this.renderProductGrid(cachedResult.html);
  };

  renderProductGrid = (html) => {
    const newSection = new DOMParser().parseFromString(html, "text/html").querySelector(".facest-filters-section");
    this.domNodes.section.replaceWith(newSection);
    handleBackgroundImageLazyload();
  };

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, "", `${window.location.pathname}${searchParams && "?".concat(searchParams)}`);
  }

  scrollToTop = () => {
    const target = document.getElementById("CollectionProductGrid");

    const scrollIntoView = (selector, offset) => {
      window.scrollTo({
        behavior: 'smooth',
        top: selector.getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset
      })
    }

    scrollIntoView(target, 80);
  };
}

customElements.define("collection-filters-form", CollectionFiltersForm);
