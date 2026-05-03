'use strict';

/* ── Theme toggle (no localStorage) ─────────────────────── */
(function(){
  const root = document.documentElement;
  const btn  = document.querySelector('[data-theme-btn]');
  let theme  = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
  function apply(t){
    root.setAttribute('data-theme', t);
    if(btn) btn.innerHTML = t==='dark'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  apply(theme);
  if(btn) btn.addEventListener('click', ()=>{ theme=theme==='dark'?'light':'dark'; apply(theme); });
})();

/* ── Scroll reveal ───────────────────────────────────────── */
(function(){
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, {threshold:0.08});
  document.querySelectorAll('.reveal, .stagger').forEach(el=>io.observe(el));
})();

/* ── Spotlight Effect for Bento Cards ────────────────────── */
(function(){
  const bentoCards = document.querySelectorAll('.bento-card');
  bentoCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
})();

/* ── Webhook ─────────────────────────────────────────────── */
const WEBHOOK_URL = 'https://n8n.srv1622881.hstgr.cloud/webhook-test/a1b2c3d4-e5f6-7890-abcd-ef1234567890';

let _zaehler = 0;
function genVorgangsId(){
  _zaehler++;
  const year = new Date().toLocaleString('sv-SE',{timeZone:'Europe/Berlin'}).slice(0,4);
  return year + String(_zaehler).padStart(6,'0');
}

/* ── Package limits ──────────────────────────────────────── */
const LIMITS = { Schnellcheck:1, Starter:2, Professional:5 };

const form        = document.getElementById('uploadForm');
const submitBtn   = document.getElementById('submitBtn');
const fileInput   = document.getElementById('fileInput');
const fileDrop    = document.getElementById('fileDrop');
const fileNameEl  = document.getElementById('fileName');
const alertOk     = document.getElementById('alert-success');
const alertErr    = document.getElementById('alert-error');
const pkgSelect   = document.getElementById('packageSelect');
const pkgHint     = document.getElementById('packageHint');
const dropHint    = document.getElementById('dropHint');
const fileErrEl   = document.getElementById('fileError');

/* Update hint text when package changes */
function refreshPkgUi(){
  if(!pkgSelect) return;
  const pkg = pkgSelect.value;
  const lim = LIMITS[pkg];
  if(lim){
    if(pkgHint)  pkgHint.textContent  = pkg + ': bis zu ' + lim + ' PDF' + (lim>1?'s':'') + ' pro Einreichung.';
    if(dropHint) dropHint.textContent = 'Nur .pdf · max. 10 MB je Datei · ' + lim + ' PDF' + (lim>1?'s':'') + ' im Paket';
    if(fileInput) {
      fileInput.disabled = false;
      fileInput.multiple = (lim > 1);
    }
    if(fileDrop) fileDrop.style.opacity = '1';
    if(fileDrop) fileDrop.style.cursor = 'pointer';
  } else {
    if(pkgHint)  pkgHint.textContent  = 'Bitte zuerst ein Paket auswählen.';
    if(dropHint) dropHint.textContent = 'Nur .pdf · max. 10 MB · Anzahl je nach Paket';
    if(fileInput) fileInput.disabled = true;
    if(fileDrop) fileDrop.style.opacity = '0.5';
    if(fileDrop) fileDrop.style.cursor = 'not-allowed';
  }
}

/* Update file label */
function refreshFileLabel(files){
  if(!files || files.length===0){
    fileNameEl.style.display='none'; fileNameEl.textContent='';
    fileDrop.classList.remove('has-file'); return;
  }
  
  const pkg = pkgSelect?.value;
  const lim = LIMITS[pkg] || 0;
  const isValidCount = pkg && files.length <= lim;

  fileNameEl.textContent = '✓ ' + files.length + ' Datei' + (files.length>1?'en':'') + ': ' + Array.from(files).map(f=>f.name).join(', ');
  fileNameEl.style.display='block';
  
  if (isValidCount) {
    fileDrop.classList.add('has-file');
  } else {
    fileDrop.classList.remove('has-file');
  }
}

/* Validate file field */
function validateFiles(){
  const field = fileInput.closest('.field');
  const pkg   = pkgSelect?.value;
  const lim   = LIMITS[pkg]||0;
  const files = fileInput.files;
  let valid=true, msg='Bitte gültige PDF-Datei(en) gemäß Paket hochladen';
  if(!pkg)                        { valid=false; msg='Bitte zuerst ein Paket auswählen'; }
  else if(!files||files.length===0){ valid=false; msg='Bitte mindestens eine PDF hochladen'; }
  else if(files.length>lim)       { valid=false; msg='Für '+pkg+' sind maximal '+lim+' PDF'+(lim>1?'s':'')+' erlaubt'; }
  else if(Array.from(files).some(f=>!f.name.toLowerCase().endsWith('.pdf'))){ valid=false; msg='Nur PDF-Dateien erlaubt'; }
  field.classList.toggle('has-error',!valid);
  if(fileErrEl) fileErrEl.textContent=msg;
  return valid;
}

/* Pre-fill package from pricing card / shortcut */
function prefillPackage(pkg){
  if(!pkgSelect||!LIMITS[pkg]) return;
  pkgSelect.value = pkg;
  refreshPkgUi();
  document.getElementById('einreichen')?.scrollIntoView({behavior:'smooth'});
}

document.querySelectorAll('[data-pkg]').forEach(el=>{
  el.addEventListener('click', ()=>prefillPackage(el.getAttribute('data-pkg')));
});

/* ── Form logic ──────────────────────────────────────────── */
if(form){
  refreshPkgUi();

  pkgSelect?.addEventListener('change', ()=>{
    refreshPkgUi();
    const pkg = pkgSelect.value;
    const lim = LIMITS[pkg] || 0;
    if (fileInput.files.length > lim && lim > 0) {
      const dt = new DataTransfer();
      for (let i = 0; i < lim; i++) dt.items.add(fileInput.files[i]);
      fileInput.files = dt.files;
    }
    refreshFileLabel(fileInput.files);
    if(fileInput.files.length) validateFiles();
  });

  fileInput.addEventListener('change', ()=>{
    const pkg = pkgSelect?.value;
    const lim = LIMITS[pkg] || 0;
    if (fileInput.files.length > lim && lim > 0) {
      // Force truncation if the browser/user bypassed 'multiple' or used drag-drop
      const dt = new DataTransfer();
      for (let i = 0; i < lim; i++) dt.items.add(fileInput.files[i]);
      fileInput.files = dt.files;
    }
    refreshFileLabel(fileInput.files);
    if(pkgSelect.value) validateFiles();
  });

  ['dragover','dragleave','drop'].forEach(ev=>{
    fileDrop.addEventListener(ev, e=>{
      e.preventDefault();
      if(pkgSelect && !pkgSelect.value) return; 
      fileDrop.classList.toggle('dragover', ev==='dragover');
      if(ev==='drop' && e.dataTransfer.files.length){
        const pkg = pkgSelect.value;
        const lim = LIMITS[pkg] || 0;
        const dt = new DataTransfer();
        const count = Math.min(e.dataTransfer.files.length, lim);
        for (let i = 0; i < count; i++) dt.items.add(e.dataTransfer.files[i]);
        
        fileInput.files = dt.files;
        refreshFileLabel(fileInput.files);
        if(pkgSelect.value) validateFiles();
      }
    });
  });

  function showAlert(type){
    alertOk.style.display='none'; alertErr.style.display='none';
    (type==='ok'?alertOk:alertErr).style.display='flex';
    document.getElementById('einreichen').scrollIntoView({behavior:'smooth'});
  }

  function validateField(el){
    const field=el.closest('.field'); if(!field) return true;
    if(el.type==='file')     return validateFiles();
    if(el.type==='checkbox') { const ok=el.checked; field.classList.toggle('has-error',!ok); return ok; }
    let ok=true;
    if(el.hasAttribute('required')&&!el.value.trim()) ok=false;
    if(el.type==='email'&&el.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) ok=false;
    field.classList.toggle('has-error',!ok);
    return ok;
  }

  form.querySelectorAll('input, select').forEach(el=>{
    el.addEventListener('blur', ()=>validateField(el));
    el.addEventListener('input',()=>{ if(el.closest('.field')?.classList.contains('has-error')) validateField(el); });
    el.addEventListener('change',()=>validateField(el));
  });

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    let ok=true;
    form.querySelectorAll('input[required], select[required]').forEach(el=>{ if(!validateField(el)) ok=false; });
    if(!validateFiles()) ok=false;
    if(!ok) return;

    submitBtn.disabled=true; submitBtn.textContent='Wird eingereicht…';

    const data={};
    new FormData(form).forEach((v,k)=>{ if(!(v instanceof File)) data[k]=v; });
    data['Eingereicht_am'] = new Date().toLocaleString('sv-SE',{timeZone:'Europe/Berlin',hour12:false}).replace(' ','T');
    data['Vorgangs_ID']    = genVorgangsId();

    const files = Array.from(fileInput.files||[]);
    const encoded = await Promise.all(files.map(file=>new Promise(res=>{
      const r=new FileReader();
      r.onload=()=>res({name:file.name,base64:r.result.split(',')[1]});
      r.readAsDataURL(file);
    })));
    data['Dokument-PDF-Anzahl']  = files.length;
    data['Dokument-PDF-Namen']   = encoded.map(f=>f.name).join(', ');
    data['Dokument-PDF-Dateien'] = encoded;
    if(encoded[0]){ data['Dokument-PDF-Name']=encoded[0].name; data['Dokument-PDF-Base64']=encoded[0].base64; }

    try {
      const res = await fetch(WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      if(res.ok){
        showAlert('ok');
        form.reset();
        refreshFileLabel([]);
        refreshPkgUi();
        form.querySelectorAll('.field').forEach(f=>f.classList.remove('has-error'));
      } else { showAlert('err'); }
    } catch { showAlert('err'); }
    finally { submitBtn.disabled=false; submitBtn.textContent='Jetzt einreichen →'; }
  });
}
