(function () {
  "use strict";

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
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html")
    ) {
      link.classList.add("active");
    }
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

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      galleryItems.forEach((item) => {
        const category = item.dataset.category;
        const show = filter === "all" || category === filter;
        item.classList.toggle("hidden", !show);
      });
    });
  });

  /* Lightbox */
  const lightbox = document.querySelector(".lightbox");
  const lightboxImg = document.querySelector(".lightbox img");
  const lightboxClose = document.querySelector(".lightbox-close");

  if (lightbox && lightboxImg) {
    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (!img) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });

    function closeLightbox() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    }

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
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

  function validateContactForm() {
    const required = form.querySelectorAll("[required]");
    let valid = true;

    required.forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = "#b91c3c";
      } else {
        field.style.borderColor = "";
      }
    });

    const email = form.querySelector('[type="email"]');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      valid = false;
      email.style.borderColor = "#b91c3c";
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
        submitBtn.textContent = "Sending…";
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
          submitBtn.textContent = "Send Message";
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
