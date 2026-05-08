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

/* ── Mobile Menu Toggle ─────────────────────────────────── */
(function(){
  const toggle = document.getElementById('mobileToggle');
  const menu   = document.getElementById('mobileMenu');
  const body   = document.body;
  const links  = document.querySelectorAll('.mobile-menu-inner a');

  if(toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('active');
      toggle.classList.toggle('active');
      body.style.overflow = isOpen ? 'hidden' : '';
      
      // Toggle icon
      toggle.innerHTML = isOpen 
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        body.style.overflow = '';
        toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      });
    });
  }
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
const WEBHOOK_URL = 'https://n8n.srv1622881.hstgr.cloud/webhook-test/document-intake';

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
const fileListContainer = document.getElementById('fileListContainer');
const alertOk     = document.getElementById('alert-success');
const alertErr    = document.getElementById('alert-error');
const pkgSelect   = document.getElementById('packageSelect');
const dokuTypSelect = document.getElementById('dokutyp');
const pkgHint     = document.getElementById('packageHint');
const dropHint    = document.getElementById('dropHint');
const fileErrEl   = document.getElementById('fileError');
const fileLimitNotice = document.getElementById('fileLimitNotice');

let allFiles = []; // Persistent storage for additive uploads: Array of { file: File, type: string }

function showLimitNotice(msg) {
  if (!fileLimitNotice) return;
  fileLimitNotice.textContent = msg;
  fileLimitNotice.style.display = 'block';
}

function hideLimitNotice() {
  if (fileLimitNotice) fileLimitNotice.style.display = 'none';
}

/* Update hint text when package changes */
function refreshPkgUi(){
  if(!pkgSelect) return;
  const pkg = pkgSelect.value;
  const lim = LIMITS[pkg];
  hideLimitNotice();
  if(lim){
    if(pkgHint)  pkgHint.textContent  = pkg + ': bis zu ' + lim + ' PDF' + (lim>1?'s':'') + ' pro Einreichung.';
    if(dropHint) dropHint.textContent = 'Nur .pdf · max. 10 MB je Datei · ' + lim + ' PDF' + (lim>1?'s':'') + ' im Paket';
    if(fileInput) {
      fileInput.disabled = false;
      fileInput.multiple = (lim > 1);
    }
    if(fileDrop) fileDrop.style.opacity = '1';
    if(fileDrop) fileDrop.style.cursor = 'pointer';
    
    if (allFiles.length > lim) {
      allFiles = allFiles.slice(0, lim);
      syncInputFiles();
      refreshFileLabel();
    }
  } else {
    if(pkgHint)  pkgHint.textContent  = 'Bitte zuerst ein Paket auswählen.';
    if(dropHint) dropHint.textContent = 'Nur .pdf · max. 10 MB · Anzahl je nach Paket';
    if(fileInput) fileInput.disabled = true;
    if(fileDrop) fileDrop.style.opacity = '0.5';
    if(fileDrop) fileDrop.style.cursor = 'not-allowed';
    allFiles = [];
    syncInputFiles();
    refreshFileLabel();
  }
}

/* Sync the hidden file input with the allFiles array */
function syncInputFiles() {
  const dt = new DataTransfer();
  allFiles.forEach(item => dt.items.add(item.file));
  fileInput.files = dt.files;
}

/* Remove a specific file */
function removeFile(idx) {
  allFiles.splice(idx, 1);
  syncInputFiles();
  refreshFileLabel();
  validateFiles();
  hideLimitNotice();
}

/* Update an individual file's type */
function updateFileType(idx, type) {
  if (allFiles[idx]) {
    allFiles[idx].type = type;
  }
}

/* Update file list with type selectors and remove buttons */
function refreshFileLabel(){
  if(!fileListContainer) return;
  fileListContainer.innerHTML = '';
  
  if(allFiles.length===0){
    fileDrop.classList.remove('has-file');
    return;
  }
  
  const pkg = pkgSelect?.value;
  const lim = LIMITS[pkg] || 0;
  const isValidCount = pkg && allFiles.length <= lim;

  if (isValidCount) {
    fileDrop.classList.add('has-file');
  } else {
    fileDrop.classList.remove('has-file');
  }

  allFiles.forEach((item, idx) => {
    const file = item.file;
    const type = item.type;
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <div class="file-item-info">
        <span class="file-item-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </span>
        <span class="file-item-name" title="${file.name}">${file.name}</span>
      </div>
      <div class="file-item-actions">
        <select class="file-type-select" onchange="updateFileType(${idx}, this.value)">
          <option value="Rechnung" ${type === 'Rechnung' ? 'selected' : ''}>Rechnung</option>
          <option value="Gutschrift" ${type === 'Gutschrift' ? 'selected' : ''}>Gutschrift</option>
        </select>
        <button type="button" class="file-remove-btn" onclick="removeFile(${idx})" aria-label="Datei entfernen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `;
    fileListContainer.appendChild(div);
  });
}

/* Validate file field */
function validateFiles(){
  const field = fileInput.closest('.field');
  const pkg   = pkgSelect?.value;
  const lim   = LIMITS[pkg]||0;
  const files = allFiles;
  let valid=true, msg='Bitte gültige PDF-Datei(en) gemäß Paket hochladen';
  if(!pkg)                        { valid=false; msg='Bitte zuerst ein Paket auswählen'; }
  else if(!files||files.length===0){ valid=false; msg='Bitte mindestens eine PDF hochladen'; }
  else if(files.length>lim)       { valid=false; msg='Für '+pkg+' sind maximal '+lim+' PDF'+(lim>1?'s':'')+' erlaubt'; }
  else if(files.some(item=>!item.file.name.toLowerCase().endsWith('.pdf'))){ valid=false; msg='Nur PDF-Dateien erlaubt'; }
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
    if(allFiles.length) validateFiles();
  });

  fileInput.addEventListener('change', (e)=>{
    const pkg = pkgSelect?.value;
    const lim = LIMITS[pkg] || 0;
    const stdType = dokuTypSelect?.value || 'Rechnung';
    
    hideLimitNotice();

    if (allFiles.length >= lim && lim > 0) {
      showLimitNotice(`Maximale Anzahl erreicht: Sie haben bereits die ${lim} erlaubten Dokumente für das Paket "${pkg}" ausgewählt. Bitte entfernen Sie zuerst ein Dokument, um ein neues hinzuzufügen.`);
      fileInput.value = '';
      return;
    }

    const newFiles = Array.from(e.target.files);
    let exceeded = false;
    newFiles.forEach(f => {
      if (allFiles.length < lim) {
        if (f.name.toLowerCase().endsWith('.pdf')) {
          allFiles.push({ file: f, type: stdType });
        }
      } else {
        exceeded = true;
      }
    });

    if (exceeded) {
      showLimitNotice(`Einige Dateien wurden nicht hinzugefügt, da das Limit von ${lim} Dokumenten für das Paket "${pkg}" erreicht wurde.`);
    }

    syncInputFiles();
    refreshFileLabel();
    if(pkgSelect.value) validateFiles();
    fileInput.value = '';
  });

  ['dragover','dragleave','drop'].forEach(ev=>{
    fileDrop.addEventListener(ev, e=>{
      e.preventDefault();
      if(pkgSelect && !pkgSelect.value) return; 
      fileDrop.classList.toggle('dragover', ev==='dragover');
      if(ev=== 'drop' && e.dataTransfer.files.length){
        const pkg = pkgSelect.value;
        const lim = LIMITS[pkg] || 0;
        const stdType = dokuTypSelect?.value || 'Rechnung';
        
        hideLimitNotice();

        if (allFiles.length >= lim && lim > 0) {
          showLimitNotice(`Maximale Anzahl erreicht: Sie haben bereits die ${lim} erlaubten Dokumente für das Paket "${pkg}" ausgewählt. Bitte entfernen Sie zuerst ein Dokument, um ein neues hinzuzufügen.`);
          return;
        }

        const droppedFiles = Array.from(e.dataTransfer.files);
        let exceeded = false;
        droppedFiles.forEach(f => {
          if (allFiles.length < lim) {
            if (f.name.toLowerCase().endsWith('.pdf')) {
              allFiles.push({ file: f, type: stdType });
            }
          } else {
            exceeded = true;
          }
        });
        
        if (exceeded) {
          showLimitNotice(`Einige Dateien wurden nicht hinzugefügt, da das Limit von ${lim} Dokumenten für das Paket "${pkg}" erreicht wurde.`);
        }

        syncInputFiles();
        refreshFileLabel();
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

    const files = allFiles;
    const encoded = await Promise.all(files.map(item=>new Promise(res=>{
      const r=new FileReader();
      r.onload=()=>res({name:item.file.name, type: item.type, base64:r.result.split(',')[1]});
      r.readAsDataURL(item.file);
    })));
    data['Dokument-PDF-Anzahl']  = files.length;
    data['Dokument-PDF-Details'] = encoded.map(f=>`${f.name} (${f.type})`).join(', ');
    data['Dokument-PDF-Dateien'] = encoded;
    if(encoded[0]){ 
      data['Dokument-PDF-Name']=encoded[0].name; 
      data['Dokument-PDF-Type']=encoded[0].type; 
      data['Dokument-PDF-Base64']=encoded[0].base64; 
    }

    try {
      const res = await fetch(WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      if(res.ok){
        showAlert('ok');
        form.reset();
        allFiles = [];
        refreshFileLabel();
        refreshPkgUi();
        form.querySelectorAll('.field').forEach(f=>f.classList.remove('has-error'));
      } else { showAlert('err'); }
    } catch { showAlert('err'); }
    finally { submitBtn.disabled=false; submitBtn.textContent='Jetzt einreichen →'; }
  });
}
