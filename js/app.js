/* Translations live in js/translations.js — edit that file for all text content. */

(function () {
  'use strict';

  /* ── Utility ── */
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  /* ============================================================
     LANGUAGE TOGGLE
     ============================================================ */
  var currentLang = 'no';

  function applyTranslations(lang) {
    var t = translations[lang];
    if (!t) return;

    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });

    $$('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    $$('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) el.placeholder = t[key];
    });

    document.documentElement.lang = lang;
    if (t.page_title) document.title = t.page_title;
  }

  function initLanguageToggle() {
    var btnNo = $('btn-no');
    var btnEn = $('btn-en');
    if (!btnNo || !btnEn) return;

    function setLang(lang) {
      currentLang = lang;
      applyTranslations(lang);
      btnNo.classList.toggle('lang-toggle__btn--active', lang === 'no');
      btnEn.classList.toggle('lang-toggle__btn--active', lang === 'en');
      localStorage.setItem('site_lang', lang);
    }

    btnNo.addEventListener('click', function () { setLang('no'); });
    btnEn.addEventListener('click', function () { setLang('en'); });

    var saved = localStorage.getItem('site_lang') || 'no';
    setLang(saved);
  }

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
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Åpne meny');
      document.body.style.overflow = '';
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
     FAQ ACCORDION
     ============================================================ */
  function initFAQ() {
    var items = $$('.faq__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var button = item.querySelector('.faq__question');
      var answer = item.querySelector('.faq__answer');
      if (!button || !answer) return;

      button.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        items.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('is-open');
            var ob = other.querySelector('.faq__question');
            var oa = other.querySelector('.faq__answer');
            if (ob) ob.setAttribute('aria-expanded', 'false');
            if (oa) oa.hidden = true;
          }
        });

        item.classList.toggle('is-open', !isOpen);
        button.setAttribute('aria-expanded', String(!isOpen));
        answer.hidden = isOpen;
      });
    });
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
    if (!form) return;

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
      var fields   = form.querySelectorAll('[required]');
      var allValid = true;
      fields.forEach(function (f) { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

      var submitBtn  = form.querySelector('.form__submit');
      var submitSpan = submitBtn ? submitBtn.querySelector('[data-i18n="form_submit"]') : null;
      var t          = translations[currentLang] || translations.no;

      if (submitBtn)  submitBtn.disabled = true;
      if (submitSpan) submitSpan.textContent = t.form_sending || 'Sender…';

      setTimeout(function () {
        form.reset();
        form.querySelectorAll('.form__input, .form__select, .form__textarea').forEach(function (f) {
          f.classList.remove('is-invalid');
        });
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (submitBtn)  submitBtn.disabled = false;
        if (submitSpan) submitSpan.textContent = t.form_submit || 'Send melding';
      }, 900);
    });
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
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initLanguageToggle();
    initMobileMenu();
    initStickyHeader();
    initScrollSpy();
    initFAQ();
    initBackToTop();
    initScrollReveal();
    initContactForm();
    initCookieBanner();
  });

})();
