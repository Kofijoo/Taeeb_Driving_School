(function () {
  'use strict';

  /* ── Utility ── */
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  function initMobileMenu() {
    var hamburger = $('hamburger');
    var nav       = $('mainNav');
    if (!hamburger || !nav) return;

    function openMenu() {
      nav.classList.add('is-open');
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Lukk meny');
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Åpne meny');
    }

    hamburger.addEventListener('click', function () {
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('.main-nav__link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  /* ============================================================
     STICKY HEADER SHADOW
     ============================================================ */
  function initStickyHeader() {
    var header = $('siteHeader');
    if (!header) return;
    var scrolled = false;
    window.addEventListener('scroll', function () {
      var s = window.scrollY > 16;
      if (s !== scrolled) { scrolled = s; header.classList.toggle('is-scrolled', scrolled); }
    }, { passive: true });
  }

  /* ============================================================
     ACTIVE NAV LINK (scroll spy)
     ============================================================ */
  function initScrollSpy() {
    var sections = $$('main section[id]');
    var navLinks = $$('.main-nav__link');
    if (!sections.length || !navLinks.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(function (sec) { observer.observe(sec); });
  }

  /* ============================================================
     BACK TO TOP
     ============================================================ */
  function initBackToTop() {
    var btn = $('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     SCROLL REVEAL ANIMATIONS
     ============================================================ */
  function initScrollReveal() {
    var elements = $$('.reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     CONTACT FORM
     ============================================================ */
  function initContactForm() {
    var form    = $('contactForm');
    var success = $('formSuccess');
    var error   = $('formError');
    if (!form) return;

    var submitBtn  = form.querySelector('.form__submit');
    var submitSpan = submitBtn ? submitBtn.querySelector('span') : null;
    var sending    = false;

    function validateField(field) {
      var ok = field.validity.valid;
      field.classList.toggle('is-invalid', !ok);
      return ok;
    }

    form.querySelectorAll('.form__input, .form__select, .form__textarea').forEach(function (field) {
      field.addEventListener('blur', function () {
        if (field.hasAttribute('required')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;

      var fields   = form.querySelectorAll('[required]');
      var allValid = true;
      fields.forEach(function (f) { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

      if (success) success.hidden = true;
      if (error)   error.hidden = true;

      sending = true;
      if (submitBtn)  submitBtn.disabled = true;
      if (submitSpan) submitSpan.textContent = 'Sender…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Formspree status ' + response.status);
          form.reset();
          form.querySelectorAll('.form__input, .form__select, .form__textarea').forEach(function (f) {
            f.classList.remove('is-invalid');
          });
          if (success) {
            success.hidden = false;
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .catch(function (err) {
          console.error('Kontaktskjema: sending feilet', err);
          if (error) {
            error.hidden = false;
            error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .finally(function () {
          sending = false;
          if (submitBtn)  submitBtn.disabled = false;
          if (submitSpan) submitSpan.textContent = 'Send melding';
        });
    });
  }

  /* ============================================================
     GENERIC MODALS (Personvernerklæring, Skolereglement)
     Same .calendar-modal visual pattern as Bookingkalender, but that
     modal keeps its own separate, untouched script above -- this
     handler only ever targets elements marked [data-generic-modal],
     so it can never interfere with Bookingkalender's behaviour.
     ============================================================ */
  function initGenericModals() {
    var modals = document.querySelectorAll('.calendar-modal[data-generic-modal]');
    if (!modals.length) return;

    // Per-modal trigger memory (not a single shared variable) -- required
    // for nested modals (e.g. Priser -> Pakke -> Personvernerklæring) so
    // closing an inner modal always restores focus to what opened THAT
    // modal specifically, even while outer modals are still open.
    var triggerByModal = new WeakMap();

    function focusableIn(modal) {
      return Array.prototype.slice.call(
        modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return el.offsetParent !== null; });
    }

    function openModal(modal, trigger) {
      triggerByModal.set(modal, trigger || document.activeElement);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('calendar-modal-open');
      var closeBtn = modal.querySelector('.calendar-modal__close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal(modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      var anyOtherOpen = document.querySelector('.calendar-modal.is-open');
      if (!anyOtherOpen) document.body.classList.remove('calendar-modal-open');
      var trigger = triggerByModal.get(modal);
      if (trigger) trigger.focus();
    }

    document.querySelectorAll('[data-modal-target]').forEach(function (trigger) {
      var modal = document.getElementById(trigger.getAttribute('data-modal-target'));
      if (!modal) return;
      trigger.addEventListener('click', function (ev) {
        ev.preventDefault();
        openModal(modal, trigger);
      });
    });

    modals.forEach(function (modal) {
      modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
        el.addEventListener('click', function () { closeModal(modal); });
      });
    });

    document.addEventListener('keydown', function (ev) {
      var openModalEl = document.querySelector('.calendar-modal[data-generic-modal].is-open');
      if (!openModalEl) return;

      if (ev.key === 'Escape') {
        closeModal(openModalEl);
        return;
      }

      if (ev.key === 'Tab') {
        var focusable = focusableIn(openModalEl);
        if (!focusable.length) return;
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ============================================================
     PACKAGE ENQUIRY
     Populates and submits the shared #pakkeModal form. Modal open/
     close/focus-trap/Escape/backdrop is already handled generically
     by initGenericModals() above (#pakkeModal carries [data-generic-
     modal] just like the legal modals) -- this only injects the
     clicked package's data and submits the form to its own,
     separate Formspree endpoint.
     ============================================================ */
  function initPackageEnquiry() {
    var form = $('pakkeForm');
    if (!form) return;

    var PACKAGES = {
      superpakke:     { label: 'SUPERPAKKE',                            heading: 'Bestill SUPERPAKKE' },
      kjoretimepakke: { label: 'Kjøretimepakke automat (10 kjøretimer)', heading: 'Bestill 10 kjøretimer' },
      obligatorisk:   { label: 'Obligatorisk pakke',                    heading: 'Forespørsel – Obligatorisk pakke' }
    };

    var heading        = $('pakke-modal-heading');
    var selectedLabel  = $('pakkeSelectedLabel');
    var valgtPakkeField = $('pakkeValgtPakke');
    var subjectField   = $('pakkeSubject');
    var success        = $('pakkeFormSuccess');
    var error           = $('pakkeFormError');
    var currentPackage = null;

    function applyPackage(pkg) {
      currentPackage = pkg;
      if (heading) heading.textContent = pkg.heading;
      if (selectedLabel) selectedLabel.textContent = pkg.label;
      if (valgtPakkeField) valgtPakkeField.value = pkg.label;
      if (subjectField) subjectField.value = 'Pakkeforespørsel – ' + pkg.label;
    }

    document.querySelectorAll('[data-package]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pkg = PACKAGES[btn.getAttribute('data-package')];
        if (!pkg) return;
        applyPackage(pkg);
        // Every package click opens the modal fresh -- clear any
        // success/error banner left over from a previous enquiry.
        if (success) success.hidden = true;
        if (error)   error.hidden = true;
      });
    });

    var submitBtn  = form.querySelector('.form__submit');
    var submitSpan = submitBtn ? submitBtn.querySelector('span') : null;
    var sending    = false;

    function validateField(field) {
      var ok = field.validity.valid;
      field.classList.toggle('is-invalid', !ok);
      return ok;
    }

    form.querySelectorAll('.form__input, .form__select, .form__textarea').forEach(function (field) {
      field.addEventListener('blur', function () {
        if (field.hasAttribute('required')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;

      var fields   = form.querySelectorAll('[required]');
      var allValid = true;
      fields.forEach(function (f) { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

      if (success) success.hidden = true;
      if (error)   error.hidden = true;

      sending = true;
      if (submitBtn)  submitBtn.disabled = true;
      if (submitSpan) submitSpan.textContent = 'Sender…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Formspree status ' + response.status);
          form.reset();
          form.querySelectorAll('.form__input, .form__select, .form__textarea').forEach(function (f) {
            f.classList.remove('is-invalid');
          });
          // form.reset() restores the hidden package fields to their
          // empty HTML defaults -- reapply the last-selected package so
          // the (still-visible-if-reopened) modal never shows stale/blank
          // package data after a successful submission.
          if (currentPackage) applyPackage(currentPackage);
          if (success) {
            success.hidden = false;
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .catch(function (err) {
          console.error('Pakkeforespørsel: sending feilet', err);
          if (error) {
            error.hidden = false;
            error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .finally(function () {
          sending = false;
          if (submitBtn)  submitBtn.disabled = false;
          if (submitSpan) submitSpan.textContent = 'Send forespørsel';
        });
    });
  }

  /* ============================================================
     REVIEWS CAROUSEL
     ============================================================ */
  function initCarousel() {
    var track  = document.querySelector('.carousel__track');
    var slides = document.querySelectorAll('.carousel__slide');
    var dots   = document.querySelectorAll('.carousel__dot');
    var prev   = $('carouselPrev');
    var next   = $('carouselNext');
    if (!track || !slides.length) return;

    var current = 0;
    var timer;

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('carousel__dot--active', i === current); });
    }

    function startAuto() { timer = setInterval(function () { goTo(current + 1); }, 5000); }
    function stopAuto()  { clearInterval(timer); }

    if (prev) prev.addEventListener('click', function () { stopAuto(); goTo(current - 1); startAuto(); });
    if (next) next.addEventListener('click', function () { stopAuto(); goTo(current + 1); startAuto(); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { stopAuto(); goTo(i); startAuto(); });
    });

    startAuto();
  }

  /* ============================================================
     COOKIE BANNER
     ============================================================ */
  function initCookieBanner() {
    var banner  = $('cookieBanner');
    var accept  = $('cookieAccept');
    var decline = $('cookieDecline');
    if (!banner) return;

    function hideBanner() { banner.classList.add('is-hidden'); }

    if (localStorage.getItem('cookie_consent')) { hideBanner(); return; }

    if (accept)  accept.addEventListener('click',  function () { localStorage.setItem('cookie_consent', 'accepted'); hideBanner(); });
    if (decline) decline.addEventListener('click', function () { localStorage.setItem('cookie_consent', 'declined'); hideBanner(); });
  }

  /* ============================================================
     ANNOUNCEMENTS EXPAND/COLLAPSE
     ============================================================ */
  function initAnnouncements() {
    $$('.ann-card__toggle').forEach(function (btn) {
      var card    = btn.closest('.ann-card');
      var preview = card.querySelector('.ann-card__preview');
      var full    = card.querySelector('.ann-card__full');
      if (!full) return;

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          full.hidden = true;
          if (preview) preview.style.display = '';
          btn.setAttribute('aria-expanded', 'false');
          btn.childNodes[0].textContent = 'Les mer ';
        } else {
          full.hidden = false;
          if (preview) preview.style.display = 'none';
          btn.setAttribute('aria-expanded', 'true');
          btn.childNodes[0].textContent = 'Vis mindre ';
        }
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initStickyHeader();
    initScrollSpy();
    initBackToTop();
    initScrollReveal();
    initContactForm();
    initCookieBanner();
    initGenericModals();
    initPackageEnquiry();
    initCarousel();
    initAnnouncements();
  });

})();
