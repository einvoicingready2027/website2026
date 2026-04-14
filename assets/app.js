
'use strict';

// ── Theme ─────────────────────────────────────────────
(function(){
  const root = document.documentElement;
  const btn  = document.querySelector('[data-theme-btn]');
  let theme  = localStorage.getItem('theme') ||
               (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');

  function apply(t){
    root.setAttribute('data-theme', t);
    if(btn) btn.innerHTML = t === 'dark'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  apply(theme);
  if(btn) btn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
    apply(theme);
  });
})();

// ── Scroll-entry (IntersectionObserver) ──────────────
(function(){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal, .stagger').forEach(el => io.observe(el));
})();

// ── Form logic ────────────────────────────────────────
const WEBHOOK_URL = 'https://helped-evident-cobra.ngrok-free.app/webhook-test/a1b2c3d4-e5f6-7890-abcd-ef1234567890';

let _zaehler = 0;
function genVorgangsId(){
  _zaehler++;
  const year = new Date().toLocaleString('sv-SE', { timeZone:'Europe/Berlin' }).slice(0,4);
  return year + String(_zaehler).padStart(6,'0');
}

const form      = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const fileInput = document.getElementById('fileInput');
const fileDrop  = document.getElementById('fileDrop');
const fileNameEl= document.getElementById('fileName');
const alertOk   = document.getElementById('alert-success');
const alertErr  = document.getElementById('alert-error');

if(form){
  fileInput.addEventListener('change', () => {
    if(fileInput.files.length > 0){
      fileNameEl.textContent = '✓ ' + fileInput.files[0].name;
      fileNameEl.style.display = 'block';
      fileDrop.classList.add('has-file');
      fileInput.closest('.field').classList.remove('has-error');
    }
  });

  ['dragover','dragleave','drop'].forEach(ev => {
    fileDrop.addEventListener(ev, e => {
      e.preventDefault();
      fileDrop.classList.toggle('dragover', ev === 'dragover');
    });
  });

  function showAlert(type){
    alertOk.style.display = 'none';
    alertErr.style.display = 'none';
    const el = type === 'ok' ? alertOk : alertErr;
    el.style.display = 'flex';
    document.getElementById('einreichen').scrollIntoView({ behavior:'smooth' });
  }

  function validateField(el){
    const field = el.closest('.field');
    if(!field) return true;
    let valid = true;
    if(el.hasAttribute('required') && !el.value.trim()) valid = false;
    if(el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) valid = false;
    if(el.type === 'file' && el.hasAttribute('required') && el.files.length === 0) valid = false;
    field.classList.toggle('has-error', !valid);
    return valid;
  }

  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('blur',  () => validateField(el));
    el.addEventListener('input', () => { if(el.closest('.field').classList.contains('has-error')) validateField(el) });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('input[required], select[required]').forEach(el => { if(!validateField(el)) ok = false });
    if(!ok) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird eingereicht…';

    const data = {};
    new FormData(form).forEach((v,k) => { if(!(v instanceof File)) data[k] = v });
    data['Eingereicht_am'] = new Date().toLocaleString('sv-SE', { timeZone:'Europe/Berlin', hour12:false }).replace(' ','T');
    data['Vorgangs_ID']    = genVorgangsId();

    const file = fileInput.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = async () => {
        data['Dokument-PDF-Name']   = file.name;
        data['Dokument-PDF-Base64'] = reader.result.split(',')[1];
        await send(data);
      };
      reader.readAsDataURL(file);
    } else {
      await send(data);
    }
  });

  async function send(data){
    try {
      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if(r.ok){
        showAlert('ok');
        form.reset();
        fileNameEl.style.display = 'none';
        fileDrop.classList.remove('has-file');
        form.querySelectorAll('.field').forEach(f => f.classList.remove('has-error'));
      } else { showAlert('err') }
    } catch { showAlert('err') }
    finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Dokument einreichen →';
    }
  }
}
