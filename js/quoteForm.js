// Quote / contact flow. Front-end only — no network. Desktop is a
// one-screen form; mobile is a 2-step flow driven by [data-step].
// Validation never adds height: errors land in the one reserved
// live-region line.

const TYPE_LABELS = {
  'new-roller': 'New Roller',
  'roller-repair': 'Roller Repair',
  'industrial-coating': 'Industrial Coating',
  'tank-lining': 'Tank & Rubber Lining',
  'send-drawing': 'Send a Drawing',
};

const mqMobile = window.matchMedia('(max-width: 768px)');

export function initQuoteForm() {
  const view = document.querySelector('.view--quote');
  const form = view.querySelector('[data-quote-form]');
  const aside = view.querySelector('.quote-aside');
  const status = view.querySelector('[data-form-status]');
  const success = view.querySelector('[data-quote-success]');
  const successMeta = view.querySelector('[data-success-meta]');
  const nameInput = form.querySelector('#q-name');
  const emailInput = form.querySelector('#q-email');
  const industrySelect = form.querySelector('#q-industry');
  const dropzone = form.querySelector('[data-dropzone]');
  const dzInput = form.querySelector('[data-dz-input]');
  const dzFiles = form.querySelector('[data-dz-files]');

  function setStatus(msg, ok = false) {
    status.textContent = msg;
    status.classList.toggle('is-ok', ok);
  }

  function setType(slug) {
    const radio = form.querySelector(`input[name="rfq-type"][value="${slug}"]`);
    if (radio) {
      radio.checked = true;
      syncDropzoneEmphasis();
    }
  }

  function setIndustry(name) {
    const opt = [...industrySelect.options].find((o) => o.text === name);
    if (opt) industrySelect.value = opt.value || opt.text;
  }

  function currentType() {
    return form.querySelector('input[name="rfq-type"]:checked')?.value || 'new-roller';
  }

  function syncDropzoneEmphasis() {
    dropzone.classList.toggle('is-pulse', currentType() === 'send-drawing');
  }
  form.querySelectorAll('input[name="rfq-type"]').forEach((r) => r.addEventListener('change', syncDropzoneEmphasis));

  // ---- steps (mobile only; desktop shows everything) ----
  function setStep(n) {
    form.dataset.step = String(n);
    const first = form.querySelector(n === 1 ? '#q-name' : '#q-state');
    if (mqMobile.matches && first) first.focus({ preventScroll: true });
  }

  function validateContact() {
    let ok = true;
    [nameInput, emailInput].forEach((input) => {
      const valid = input.checkValidity();
      input.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (!valid) ok = false;
    });
    return ok;
  }

  form.querySelector('[data-step-next]').addEventListener('click', () => {
    if (!validateContact()) {
      setStatus('ENTER A NAME AND A VALID EMAIL TO CONTINUE.');
      return;
    }
    setStatus('');
    setStep(2);
  });
  form.querySelector('[data-step-back]').addEventListener('click', () => {
    setStatus('');
    setStep(1);
  });

  // ---- dropzone (UI only — files never leave the page) ----
  function showFiles(list) {
    const names = [...list].map((f) => f.name);
    if (!names.length) {
      dzFiles.textContent = '';
      return;
    }
    const head = names.slice(0, 2).join(' · ');
    dzFiles.textContent = names.length > 2 ? `${head} +${names.length - 2}` : head;
  }
  dropzone.addEventListener('click', () => dzInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dzInput.click();
    }
  });
  dzInput.addEventListener('change', () => showFiles(dzInput.files));
  ['dragenter', 'dragover'].forEach((t) =>
    dropzone.addEventListener(t, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-drag');
    })
  );
  ['dragleave', 'drop'].forEach((t) =>
    dropzone.addEventListener(t, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-drag');
    })
  );
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer?.files?.length) showFiles(e.dataTransfer.files);
  });

  // ---- submit → success state ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateContact()) {
      setStatus('ENTER A NAME AND A VALID EMAIL.');
      if (mqMobile.matches) setStep(1);
      return;
    }
    setStatus('');
    successMeta.textContent = `TYPE: ${TYPE_LABELS[currentType()]} · REPLY-TO: ${emailInput.value}`;
    success.hidden = false;
    form.inert = true;
    aside.inert = true;
    success.querySelector('h3').setAttribute('tabindex', '-1');
    success.querySelector('h3').focus({ preventScroll: true });
  });

  view.querySelector('[data-quote-reset]').addEventListener('click', () => {
    success.hidden = true;
    form.inert = false;
    aside.inert = false;
    form.reset();
    showFiles([]);
    [nameInput, emailInput].forEach((i) => i.removeAttribute('aria-invalid'));
    syncDropzoneEmphasis();
    setStatus('');
    setStep(1);
    nameInput.focus({ preventScroll: true });
  });

  syncDropzoneEmphasis();

  return {
    applyParams(params) {
      const type = params.get('type');
      const industry = params.get('industry');
      if (type && TYPE_LABELS[type]) setType(type);
      if (industry) setIndustry(industry);
    },
    setType,
    setIndustry,
  };
}
