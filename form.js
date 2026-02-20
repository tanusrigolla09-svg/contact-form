/**
 * js/form.js
 * DOM interactions, event handling, UI feedback.
 * Depends on: Validator (js/validate.js must load first)
 */

(function () {
  'use strict';

  /* ── Elements ── */
  const form           = document.getElementById('contactForm');
  const nameInput      = document.getElementById('name');
  const emailInput     = document.getElementById('email');
  const msgInput       = document.getElementById('message');
  const charCountEl    = document.getElementById('charCount');
  const progressBar    = document.getElementById('progressBar');
  const submitBtn      = document.getElementById('submitBtn');
  const btnSpin        = document.getElementById('btnSpin');
  const btnLabel       = submitBtn.querySelector('.btn-label');
  const btnSendIcon    = submitBtn.querySelector('.btn-send-icon');
  const formView       = document.getElementById('formView');
  const successScreen  = document.getElementById('successScreen');
  const sendAnotherBtn = document.getElementById('sendAnotherBtn');

  /* ── Required fields config ── */
  const fields = {
    name:    { input: nameInput,  errorId: 'nameError',    fn: v => Validator.validateName(v) },
    email:   { input: emailInput, errorId: 'emailError',   fn: v => Validator.validateEmail(v) },
    message: { input: msgInput,   errorId: 'messageError', fn: v => Validator.validateMessage(v) },
  };

  /* ============================================
     HELPERS
  ============================================ */

  function fieldEl(key)  { return document.getElementById('field-' + key); }
  function errorEl(key)  { return document.getElementById(fields[key].errorId); }

  function markError(key, msg) {
    const fe = fieldEl(key);
    fe.classList.remove('is-valid');
    fe.classList.add('has-error');
    // Re-trigger animation by removing and re-adding the class
    const ee = errorEl(key);
    ee.textContent = msg;
    ee.style.animation = 'none';
    void ee.offsetWidth; // force reflow
    ee.style.animation = '';
    fields[key].input.setAttribute('aria-invalid', 'true');
  }

  function markValid(key) {
    const fe = fieldEl(key);
    fe.classList.remove('has-error');
    fe.classList.add('is-valid');
    errorEl(key).textContent = '';
    fields[key].input.setAttribute('aria-invalid', 'false');
  }

  function markClear(key) {
    const fe = fieldEl(key);
    fe.classList.remove('has-error', 'is-valid');
    errorEl(key).textContent = '';
    fields[key].input.removeAttribute('aria-invalid');
  }

  function runValidation(key) {
    const result = fields[key].fn(fields[key].input.value);
    result.valid ? markValid(key) : markError(key, result.message);
    return result.valid;
  }

  /* Progress bar: percentage of required fields that have content */
  function updateProgress() {
    const filled = Object.keys(fields).filter(k => fields[k].input.value.trim().length > 0).length;
    progressBar.style.width = Math.round((filled / Object.keys(fields).length) * 100) + '%';
  }

  /* Submit button loading state */
  function setLoading(on) {
    submitBtn.disabled     = on;
    btnLabel.textContent   = on ? 'Sending…' : 'Send Message';
    btnSendIcon.style.display = on ? 'none'   : 'inline';
    btnSpin.style.display     = on ? 'inline' : 'none';
  }

  /* Swap between form and success views */
  function showSuccessScreen() {
    formView.style.display      = 'none';
    successScreen.style.display = 'flex';
  }

  function showFormScreen() {
    successScreen.style.display = 'none';
    formView.style.display      = 'block';
  }

  /* ============================================
     EVENT LISTENERS
  ============================================ */

  /* Character counter */
  msgInput.addEventListener('input', () => {
    const len = msgInput.value.length;
    charCountEl.textContent = len;
    const counter = charCountEl.parentElement;
    counter.classList.toggle('warn', len > 450);
    updateProgress();
  });

  /* Progress on all required inputs */
  nameInput.addEventListener('input', updateProgress);
  emailInput.addEventListener('input', updateProgress);

  /* Validate on blur — only if user typed something */
  Object.keys(fields).forEach(key => {
    fields[key].input.addEventListener('blur', () => {
      if (fields[key].input.value.trim() !== '') runValidation(key);
    });

    /* Live re-validate while typing, only after an error is already shown */
    fields[key].input.addEventListener('input', () => {
      if (fieldEl(key).classList.contains('has-error')) runValidation(key);
    });
  });

  /* ── FORM SUBMIT ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Stop native browser submission

    const { allValid, results } = Validator.validateAll(
      nameInput.value,
      emailInput.value,
      msgInput.value
    );

    // Show result for every required field
    Object.keys(fields).forEach(key => {
      results[key].valid ? markValid(key) : markError(key, results[key].message);
    });

    if (!allValid) {
      // Focus the first invalid field
      const firstBad = Object.keys(fields).find(k => !results[k].valid);
      if (firstBad) fields[firstBad].input.focus();
      return;
    }

    // All valid — simulate sending
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      form.reset();
      charCountEl.textContent = '0';
      progressBar.style.width = '0%';
      Object.keys(fields).forEach(markClear);
      showSuccessScreen();
    }, 1000);
  });

  /* ── RESET BUTTON ── */
  form.addEventListener('reset', () => {
    setTimeout(() => {
      charCountEl.textContent = '0';
      progressBar.style.width = '0%';
      Object.keys(fields).forEach(markClear);
    }, 0);
  });

  /* ── SEND ANOTHER ── */
  sendAnotherBtn.addEventListener('click', () => {
    showFormScreen();
    nameInput.focus();
  });

  /* ── Ctrl/Cmd + Enter shortcut ── */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });

})();
