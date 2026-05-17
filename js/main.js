(function () {
  "use strict";

  /* Prefer WebP when available (PNG fallback via onerror) */
  (function enableWebpImages() {
    const test = new Image();
    test.onload = test.onerror = function () {
      if (test.height !== 2) return;
      document
        .querySelectorAll('img[src*="/images/"][src$=".png"], img[src*="images/"][src$=".png"]')
        .forEach((img) => {
          if (img.classList.contains("logo-img") || img.closest(".logo")) return;
          const png = img.getAttribute("src");
          if (!png || img.dataset.webpDone) return;
          img.dataset.webpDone = "1";
          img.dataset.pngFallback = png;
          img.src = png.replace(/\.png$/, ".webp");
          img.addEventListener("error", function onWebpError() {
            if (img.dataset.pngFallback) img.src = img.dataset.pngFallback;
            img.removeEventListener("error", onWebpError);
          });
        });
    };
    test.src =
      "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=";
  })();

  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".main-nav");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelectorAll(".nav-link");

  /* Sticky header */
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 60);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* Mobile navigation */
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* Active nav link */
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";
  const allNavLinks = document.querySelectorAll(".main-nav a[href]");
  allNavLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html")
    ) {
      link.classList.add("active");
    }
  });

  /* Stagger fade-in delays on grids */
  document
    .querySelectorAll(
      ".collection-grid, .gallery-grid, .why-grid, .testimonials-grid, .lookbook-bento"
    )
    .forEach((grid) => {
      grid.querySelectorAll(".fade-in").forEach((el, i) => {
        const n = (i % 6) + 1;
        el.classList.add(`stagger-${n}`);
      });
    });

  /* Scroll reveal */
  const fadeEls = document.querySelectorAll(".fade-in");
  if (fadeEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    fadeEls.forEach((el) => observer.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add("visible"));
  }

  /* Gallery filters */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");
  const galleryEmpty = document.querySelector(".gallery-empty");

  function applyGalleryFilter(filter, updateUrl) {
    let visibleCount = 0;

    filterBtns.forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === filter);
    });

    galleryItems.forEach((item) => {
      const category = item.dataset.category;
      const show = filter === "all" || category === filter;
      item.classList.toggle("hidden", !show);
      if (show) visibleCount += 1;
    });

    if (galleryEmpty) {
      galleryEmpty.classList.toggle("is-visible", visibleCount === 0);
    }

    if (updateUrl && window.history?.replaceState) {
      const url = new URL(window.location.href);
      if (filter === "all") {
        url.searchParams.delete("filter");
      } else {
        url.searchParams.set("filter", filter);
      }
      window.history.replaceState({}, "", url);
    }
  }

  if (filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        applyGalleryFilter(btn.dataset.filter, true);
      });
    });

    const params = new URLSearchParams(window.location.search);
    const initial =
      params.get("filter") ||
      (window.location.hash || "").replace("#", "").trim();
    const validFilters = ["all", "mens", "womens", "accessories", "loungewear"];
    if (initial && validFilters.includes(initial)) {
      applyGalleryFilter(initial, false);
    }

    const emptyReset = document.querySelector(".gallery-empty-reset");
    if (emptyReset) {
      emptyReset.addEventListener("click", () => {
        applyGalleryFilter("all", true);
      });
    }
  }

  /* Lightbox */
  const lightbox = document.querySelector(".lightbox");
  const lightboxImg = document.querySelector(".lightbox img");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxCaption = document.querySelector(".lightbox-caption");
  const lightboxPrev = document.querySelector(".lightbox-prev");
  const lightboxNext = document.querySelector(".lightbox-next");

  if (lightbox && lightboxImg && galleryItems.length) {
    const visibleItems = () =>
      [...galleryItems].filter((item) => !item.classList.contains("hidden"));
    let currentIndex = 0;

    function updateLightboxCaption(item) {
      if (!lightboxCaption) return;
      const title = item.querySelector(".gallery-caption h3");
      const cat = item.querySelector(".gallery-caption span");
      lightboxCaption.innerHTML = title
        ? `<h3>${title.textContent}</h3>${cat ? `<span>${cat.textContent}</span>` : ""}`
        : "";
    }

    function openLightboxAt(index) {
      const items = visibleItems();
      if (!items.length) return;
      currentIndex = ((index % items.length) + items.length) % items.length;
      const item = items[currentIndex];
      const img = item.querySelector("img");
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      updateLightboxCaption(item);
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const items = visibleItems();
        currentIndex = Math.max(0, items.indexOf(item));
        openLightboxAt(currentIndex);
      });
    });

    function closeLightbox() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    }

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        openLightboxAt(currentIndex - 1);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", (e) => {
        e.stopPropagation();
        openLightboxAt(currentIndex + 1);
      });
    }

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") openLightboxAt(currentIndex - 1);
      if (e.key === "ArrowRight") openLightboxAt(currentIndex + 1);
    });
  }

  /* Contact form — delivers to biancamandela297@gmail.com via Web3Forms */
  const form = document.getElementById("contact-form");
  const successMsg = document.querySelector(".form-success");
  const submitBtn = form?.querySelector('[type="submit"]');
  const RECIPIENT_EMAIL = "biancamandela297@gmail.com";
  const WEB3FORMS_URL = "https://api.web3forms.com/submit";

  function getFormValue(name) {
    return form.querySelector(`[name="${name}"]`)?.value?.trim() || "";
  }

  function showFormMessage(message, isError) {
    if (!successMsg) return;
    successMsg.classList.add("show");
    successMsg.classList.toggle("form-error", Boolean(isError));
    successMsg.textContent = message;
  }

  function getFieldErrorEl(field) {
    const group = field.closest(".form-group");
    if (!group) return null;
    let el = group.querySelector(".form-error-msg");
    if (!el) {
      el = document.createElement("span");
      el.className = "form-error-msg";
      el.setAttribute("role", "alert");
      group.appendChild(el);
    }
    return el;
  }

  function setFieldError(field, message) {
    const group = field.closest(".form-group");
    const err = getFieldErrorEl(field);
    if (group) group.classList.toggle("is-invalid", Boolean(message));
    if (err) err.textContent = message || "";
    field.style.borderColor = message ? "#b91c3c" : "";
  }

  function clearFormErrors() {
    form.querySelectorAll(".form-group").forEach((g) => {
      g.classList.remove("is-invalid");
      const err = g.querySelector(".form-error-msg");
      if (err) err.textContent = "";
    });
    form.querySelectorAll("input, select, textarea").forEach((f) => {
      f.style.borderColor = "";
    });
  }

  function validateContactForm() {
    clearFormErrors();
    let valid = true;

    form.querySelectorAll("[required]").forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        const label =
          field.labels?.[0]?.textContent ||
          field.name ||
          "This field";
        setFieldError(field, `${label} is required.`);
      }
    });

    const email = form.querySelector('[type="email"]');
    if (email?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      valid = false;
      setFieldError(email, "Please enter a valid email address.");
    }

    return valid;
  }

  function buildMailtoLink() {
    const subject = "New enquiry — Bianca Fashion Shop website";
    const body = [
      `First Name: ${getFormValue("First Name")}`,
      `Last Name: ${getFormValue("Last Name")}`,
      `Email: ${getFormValue("email")}`,
      `Phone: ${getFormValue("Phone") || "Not provided"}`,
      `Service: ${getFormValue("Service")}`,
      "",
      "Message:",
      getFormValue("Message"),
    ].join("\n");

    return `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function submitViaMailto() {
    window.location.href = buildMailtoLink();
    showFormMessage(
      "Your email app is opening with your message ready to send. Tap Send to deliver it to Bianca.",
      false
    );
  }

  async function submitViaWeb3Forms(accessKey) {
    const payload = {
      access_key: accessKey,
      subject: "New enquiry — Bianca Fashion Shop website",
      from_name: `${getFormValue("First Name")} ${getFormValue("Last Name")}`,
      name: `${getFormValue("First Name")} ${getFormValue("Last Name")}`,
      email: getFormValue("email"),
      phone: getFormValue("Phone") || "Not provided",
      service: getFormValue("Service"),
      message: getFormValue("Message"),
    };

    const response = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not send message");
    }
  }

  if (form) {
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.name === "botcheck") return;
        if (field.hasAttribute("required") && !field.value.trim()) {
          const label =
            field.labels?.[0]?.textContent || field.name || "This field";
          setFieldError(field, `${label} is required.`);
          return;
        }
        if (
          field.type === "email" &&
          field.value &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)
        ) {
          setFieldError(field, "Please enter a valid email address.");
          return;
        }
        setFieldError(field, "");
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (form.querySelector('[name="botcheck"]')?.value) {
        return;
      }

      if (!validateContactForm()) {
        showFormMessage("Please fill in all required fields correctly.", true);
        return;
      }

      const accessKey = (window.WEB3FORMS_ACCESS_KEY || "").trim();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = "Sending…";
        submitBtn.classList.add("is-loading");
      }

      try {
        if (!accessKey) {
          submitViaMailto();
          return;
        }

        await submitViaWeb3Forms(accessKey);

        showFormMessage(
          "Thank you! Your message has been sent to Bianca. She will be in touch within 24 hours.",
          false
        );
        form.reset();
      } catch {
        submitViaMailto();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.label || "Send Message";
          submitBtn.classList.remove("is-loading");
        }
        setTimeout(() => {
          if (successMsg) {
            successMsg.classList.remove("show", "form-error");
          }
        }, 12000);
      }
    });
  }
})();
