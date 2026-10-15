/* متابعة حضور المشايخ — PWA مستقل بلا خادم (الحفظ في الجهاز) */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const LS_DRAFT = 'mm_draft_v1', LS_HIST = 'mm_hist_v1';
const PERIODS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة'];
const CLASSES = {
  'متوسط': ['الأول أ','الأول ب','الأول ج','الأول د','الثاني أ','الثاني ب','الثاني ج','الثاني د','الثالث أ','الثالث ب','الثالث ج','الثالث د'],
  'ثانوي': ['الأول ثانوي','الثاني علمي','الثاني شرعي','الثالث علمي','الثالث شرعي'],
  'كلية': ['المستوى الأول','المستوى الثاني','المستوى الثالث','المستوى الرابع','المستوى الخامس','المستوى السادس','المستوى السابع','المستوى الثامن'],
};
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const blankRow = () => ({ sheikh:'', period:'', att:null, note:'' });
function loadDraft(){
  try {
    const d = JSON.parse(localStorage.getItem(LS_DRAFT));
    if (d && Array.isArray(d.rows)) return d;
  } catch {}
  return { sheikhs:[], stage:'متوسط', klass:'الأول أ', klassCustom:'', date:todayISO(), areef:'', rows:Array.from({length:8}, blankRow) };
}
let S = loadDraft();
function save(){ try{ localStorage.setItem(LS_DRAFT, JSON.stringify(S)); }catch{} $('#saveState').textContent = 'حُفظ تلقائيًا ' + new Date().toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}); }
let saveT = null;
function autoSave(){ clearTimeout(saveT); saveT = setTimeout(save, 400); }

function renderStages(){
  $('#stage').innerHTML = Object.keys(CLASSES).map(k=>`<option ${S.stage===k?'selected':''}>${k}</option>`).join('');
}
function renderKlasses(){
  const list = CLASSES[S.stage] || [];
  if (!list.includes(S.klass)) S.klass = list[0] || '';
  $('#klass').innerHTML = list.map(k=>`<option ${S.klass===k?'selected':''}>${k}</option>`).join('') + `<option value="__custom" ${S.klass==='__custom'?'selected':''}>أخرى (كتابة)…</option>`;
  $('#klassCustom').hidden = S.klass !== '__custom';
  if (S.klass === '__custom') $('#klassCustom').value = S.klassCustom || '';
}
function renderRows(){
  const tb = $('#rows');
  tb.innerHTML = S.rows.map((r, i)=>`<tr>
    <td class="num">${i+1}</td>
    <td><select data-i="${i}" data-f="sheikh"><option value="">— اختر الشيخ —</option>${S.sheikhs.map(n=>`<option ${r.sheikh===n?'selected':''}>${n}</option>`).join('')}</select></td>
    <td><select data-i="${i}" data-f="period"><option value="">—</option>${PERIODS.map(p=>`<option ${r.period===p?'selected':''}>${p}</option>`).join('')}</select></td>
    <td><div class="att"><button data-i="${i}" data-a="present" class="${r.att==='present'?'on-ok':''}" aria-label="حاضر">✓</button></div></td>
    <td><div class="att"><button data-i="${i}" data-a="absent" class="${r.att==='absent'?'on-no':''}" aria-label="لم يحضر">✕</button></div></td>
    <td><input data-i="${i}" data-f="note" value="${(r.note||'').replace(/"/g,'&quot;')}" placeholder="—"></td>
  </tr>`).join('');
}
function paintMeta(){ $('#dayDate').value = S.date || todayISO(); $('#areef').value = S.areef || ''; $('#signName').textContent = S.areef || ''; }
function renderAll(){ renderStages(); renderKlasses(); renderRows(); paintMeta(); }

$('#stage').onchange = e => { S.stage = e.target.value; S.klass = (CLASSES[S.stage]||[])[0] || ''; renderKlasses(); autoSave(); };
$('#klass').onchange = e => { S.klass = e.target.value; renderKlasses(); autoSave(); };
$('#klassCustom').oninput = e => { S.klassCustom = e.target.value; autoSave(); };
$('#dayDate').onclick = e => { try{ e.target.showPicker(); }catch{} };
$('#dayDate').onchange = e => { S.date = e.target.value; autoSave(); };
$('#areef').oninput = e => { S.areef = e.target.value; $('#signName').textContent = S.areef || ''; autoSave(); };
$('#rows').addEventListener('change', e => {
  const i = +e.target.dataset.i; if (isNaN(i)) return;
  if (e.target.dataset.f) { S.rows[i][e.target.dataset.f] = e.target.value; autoSave(); }
});
$('#rows').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const i = +b.dataset.i, v = b.dataset.a;
  S.rows[i].att = S.rows[i].att === v ? null : v;
  renderRows(); autoSave();
});
$('#rows').addEventListener('input', e => {
  const i = +e.target.dataset.i; if (isNaN(i) || e.target.dataset.f !== 'note') return;
  S.rows[i].note = e.target.value; autoSave();
});
$('#btnAddRow').onclick = () => { S.rows.push(blankRow()); renderRows(); autoSave(); };

// إدارة المشايخ
function renderSheikhs(){
  $('#sheikhList').innerHTML = S.sheikhs.map((n,i)=>`<div class="srow"><span>${n}</span><button data-del="${i}">حذف</button></div>`).join('') || '<p class="muted">لا مشايخ بعد — أضف أول اسم.</p>';
}
$('#sheikhList').addEventListener('click', e => {
  const b = e.target.closest('button[data-del]'); if (!b) return;
  S.sheikhs.splice(+b.dataset.del, 1); renderSheikhs(); renderRows(); autoSave();
});
function addSheikh(){
  const v = $('#newSheikh').value.trim();
  if (!v) return;
  if (!S.sheikhs.includes(v)) S.sheikhs.push(v);
  $('#newSheikh').value = ''; renderSheikhs(); renderRows(); autoSave();
}
$('#btnAddSheikh').onclick = addSheikh;
$('#btnSheikhs').onclick = () => { renderSheikhs(); $('#modal').hidden = false; };
$('#btnCloseModal').onclick = () => { $('#modal').hidden = true; };
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });

// السجل
function getHist(){ try{ return JSON.parse(localStorage.getItem(LS_HIST)) || []; }catch{ return []; } }
function setHist(h){ try{ localStorage.setItem(LS_HIST, JSON.stringify(h)); }catch{} }
$('#btnSaveDay').onclick = () => {
  save();
  const h = getHist().filter(x => !(x.date === S.date && x.klass === (S.klass === '__custom' ? S.klassCustom : S.klass)));
  h.unshift({ date:S.date, stage:S.stage, klass:S.klass === '__custom' ? S.klassCustom : S.klass, areef:S.areef, sheikhs:S.sheikhs, rows:S.rows });
  setHist(h.slice(0, 60)); renderHist();
  $('#saveState').textContent = 'حُفظت نسخة اليوم في السجل';
};
function renderHist(){
  const h = getHist();
  $('#histList').innerHTML = h.map((x,i)=>`<div class="hist"><b>${x.date} • ${x.stage} • ${x.klass||'—'}</b>
    <button class="btn gold" data-v="${i}">عرض</button><button class="btn ghost" data-d="${i}">حذف</button></div>`).join('') || '<p class="muted">لا نسخ محفوظة بعد.</p>';
}
$('#histList').addEventListener('click', e => {
  const v = e.target.closest('button[data-v]'), d = e.target.closest('button[data-d]');
  const h = getHist();
  if (v) { const x = h[+v.dataset.v]; if (x) { S = { ...x, sheikhs:x.sheikhs||S.sheikhs, klassCustom:'' }; if (S.klass && !Object.values(CLASSES).flat().includes(S.klass)) { S.klassCustom = S.klass; S.klass = '__custom'; } renderAll(); save(); window.scrollTo({top:0}); $('#historySec').hidden = true; } }
  if (d) { h.splice(+d.dataset.d, 1); setHist(h); renderHist(); }
});
let histOpen = false;
$('#btnHistory').onclick = () => { histOpen = !histOpen; $('#historySec').hidden = !histOpen; if (histOpen) renderHist(); };

// طباعة + تثبيت
$('#btnPrint').onclick = () => window.print();
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#btnInstall').hidden = false; });
$('#btnInstall').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btnInstall').hidden = true; };

renderAll(); save();
