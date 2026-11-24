/* Zastras Accelerate: progressive enhancement only.
   The page, navigation and contact form all work without this file.
   It adds: a mobile menu, "you are here" highlighting, and inline form feedback. */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- Menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var mobileQuery = window.matchMedia("(max-width: 62rem)");

  function setMenu(open, returnFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.hidden = !open;
    if (!open && returnFocus) toggle.focus();
  }

  function syncMenuToViewport() {
    // Desktop: navigation is always visible. Mobile: collapsed until opened.
    if (!toggle || !nav) return;
    if (mobileQuery.matches) {
      setMenu(toggle.getAttribute("aria-expanded") === "true", false);
    } else {
      nav.hidden = false;
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  if (toggle && nav) {
    syncMenuToViewport();
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true", false);
    });
    nav.addEventListener("click", function (event) {
      if (mobileQuery.matches && event.target.closest("a")) setMenu(false, false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileQuery.matches && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false, true);
      }
    });
    var onChange = function () { syncMenuToViewport(); };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onChange);
    else mobileQuery.addListener(onChange);
  }

  /* ------------------------------------------ Current-section highlighting */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (navLinks.length && "IntersectionObserver" in window) {
    var targets = navLinks
      .map(function (link) { return document.getElementById(link.getAttribute("href").slice(1)); })
      .filter(Boolean);

    var setCurrent = function (id) {
      navLinks.forEach(function (link) {
        if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    targets.forEach(function (el) { observer.observe(el); });

    // Clear the highlight when back in the hero, above the first section
    var hero = document.getElementById("top");
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) navLinks.forEach(function (l) { l.removeAttribute("aria-current"); });
      }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
    }
  }

  /* ---------------------------------------------------------- Contact form */
  var form = document.getElementById("contact-form");
  if (!form || !window.fetch || !window.FormData) return; // fall back to a normal POST

  var panel = document.getElementById("form-panel");
  var success = document.getElementById("form-success");
  var successTitle = document.getElementById("success-title");
  var sendAnother = document.getElementById("send-another");
  var statusEl = document.getElementById("form-status");
  var errorEl = document.getElementById("form-error");
  var button = document.getElementById("submit-btn");
  var buttonLabel = button.querySelector("[data-label]");
  var idleLabel = buttonLabel.textContent;
  var TIMEOUT_MS = 20000;
  var submitting = false;

  // We show our own messages, so switch off the browser's native bubbles.
  form.noValidate = true;

  var FIELD_MESSAGES = {
    name: { valueMissing: "Enter your name." },
    email: {
      valueMissing: "Enter your work email so we can reply.",
      typeMismatch: "Enter an email address in the form name@company.co.uk."
    },
    message: {
      valueMissing: "Tell us briefly what you would like to improve.",
      tooShort: "Add a little more detail, at least a sentence or so."
    }
  };

  function errorFor(field) {
    return document.getElementById(field.id + "-err");
  }

  function setFieldError(field, message) {
    var slot = errorFor(field);
    if (!slot) return;
    if (message) {
      field.setAttribute("aria-invalid", "true");
      slot.textContent = message;
      slot.classList.add("is-visible");
    } else {
      field.removeAttribute("aria-invalid");
      slot.textContent = "";
      slot.classList.remove("is-visible");
    }
  }

  function messageFor(field) {
    var v = field.validity;
    if (v.valid) return "";
    var table = FIELD_MESSAGES[field.name] || {};
    for (var key in table) {
      if (v[key]) return table[key];
    }
    return "Check this field.";
  }

  function validate() {
    var firstInvalid = null;
    var count = 0;
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.name.charAt(0) === "_" || field.type === "hidden" || field.type === "submit") return;
      var message = field.willValidate ? messageFor(field) : "";
      setFieldError(field, message);
      if (message) {
        count += 1;
        if (!firstInvalid) firstInvalid = field;
      }
    });
    return { firstInvalid: firstInvalid, count: count };
  }

  function clearMessages() {
    statusEl.textContent = "";
    statusEl.className = "form-status";
    errorEl.textContent = "";
    errorEl.className = "form-status";
  }

  function showError(text) {
    statusEl.textContent = "";
    statusEl.className = "form-status";
    errorEl.className = "form-status is-error";
    // Clear first so repeated identical errors are announced again.
    errorEl.textContent = "";
    window.setTimeout(function () { errorEl.textContent = text; }, 30);
  }

  function showSending() {
    errorEl.textContent = "";
    errorEl.className = "form-status";
    statusEl.className = "form-status is-info";
    statusEl.textContent = "Sending your enquiry…";
  }

  function setBusy(busy) {
    submitting = busy;
    form.setAttribute("aria-busy", String(busy));
    // aria-disabled (not disabled) keeps keyboard focus on the button.
    button.setAttribute("aria-disabled", String(busy));
    buttonLabel.textContent = busy ? "Sending…" : idleLabel;
  }

  // Clear a field's error as soon as the visitor starts correcting it.
  form.addEventListener("input", function (event) {
    var field = event.target;
    if (field.getAttribute && field.getAttribute("aria-invalid") === "true" && messageFor(field) === "") {
      setFieldError(field, "");
    }
  });

  function applyServerErrors(errors) {
    var generic = [];
    var focus = null;
    errors.forEach(function (item) {
      var field = item && item.field ? form.elements[item.field] : null;
      if (field && field.id) {
        var text = field.name === "email" ? "Enter a valid email address."
          : (item.message || "Check this field.");
        setFieldError(field, text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : "."));
        if (!focus) focus = field;
      } else if (item && item.message) {
        generic.push(item.message);
      }
    });
    if (focus) {
      showError("Please check the highlighted field" + (errors.length > 1 ? "s" : "") + " and try again.");
      focus.focus();
      return true;
    }
    return false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (submitting) return; // ignore double clicks and repeated Enter presses

    clearMessages();
    var result = validate();
    if (result.firstInvalid) {
      showError(result.count === 1
        ? "Please correct the highlighted field."
        : "Please correct the " + result.count + " highlighted fields.");
      result.firstInvalid.focus();
      return;
    }

    setBusy(true);
    showSending();

    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
      })
      .then(function (res) {
        if (timer) window.clearTimeout(timer);
        setBusy(false);
        statusEl.textContent = "";
        statusEl.className = "form-status";

        if (res.ok) {
          // Formspree answered with a success status: only now do we say so.
          form.reset();
          Array.prototype.forEach.call(form.elements, function (f) { if (f.id) setFieldError(f, ""); });
          panel.hidden = true;
          success.hidden = false;
          successTitle.focus();
          return;
        }

        // While reCAPTCHA is switched on for the form, Formspree refuses background (AJAX) submissions
        // with a 403. Rather than fail, hand the same data to a normal form post, which Formspree accepts
        // and which takes the visitor through Formspree's own security check. Nothing is lost.
        if (res.status === 403 && res.data && typeof res.data.error === "string" && /ajax|recaptcha/i.test(res.data.error)) {
          setBusy(true);
          errorEl.textContent = "";
          errorEl.className = "form-status";
          statusEl.className = "form-status is-info";
          statusEl.textContent = "One moment: taking you to the form service\u2019s security check to finish sending\u2026";
          HTMLFormElement.prototype.submit.call(form);
          return;
        }

        var errors = res.data && Array.isArray(res.data.errors) ? res.data.errors : [];
        if (res.status >= 400 && res.status < 500 && errors.length && applyServerErrors(errors)) return;

        if (res.status === 429) {
          showError("There have been a lot of submissions just now, so this one was not accepted. Your message is still here: please try again in a few minutes.");
        } else if (res.status >= 400 && res.status < 500) {
          showError("The form service did not accept this enquiry. Your message is still here. Please check the details and try again.");
        } else {
          showError("The form service could not take your enquiry just now, so it has not been sent. Your message is still here: please try again in a little while.");
        }
      })
      .catch(function (err) {
        if (timer) window.clearTimeout(timer);
        setBusy(false);
        statusEl.textContent = "";
        statusEl.className = "form-status";
        if (err && err.name === "AbortError") {
          showError("Sending took longer than expected, so we cannot confirm it arrived. Your message is still here: please try again.");
        } else {
          showError("We could not reach the form service, so your enquiry has not been sent. Check your connection and try again. Your message is still here.");
        }
      });
  });

  if (sendAnother) {
    sendAnother.addEventListener("click", function () {
      clearMessages();
      success.hidden = true;
      panel.hidden = false;
      var first = document.getElementById("f-name");
      if (first) first.focus();
    });
  }
})();
