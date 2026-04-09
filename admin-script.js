window.bookings = [];
window.creditsData = {};
window.retreatsData = [];
window.attendanceData = {};
window.savedLocations = {};

let classes = [
  {id:1,name:'Power Yoga',location:'Royal Hills Clubhouse',schedule:'الأحد والأربعاء — 11 صباحاً',price1:400,price4:1500,price8:2800,capacity:6,enrolled:5,color:'#3D8C6A',icon:'fa-fire'},
  {id:2,name:'Yoga for Diabetes',location:'Royal Hills',schedule:'الاثنين والأربعاء — 7:30 مساءً',price1:400,price4:1500,price8:null,capacity:6,enrolled:4,color:'#C8956C',icon:'fa-heart-pulse'},
  {id:3,name:'Gentle Yoga',location:'Pyramids Heights',schedule:'يتم تحديد الموعد قريباً',price1:350,price4:null,price8:null,capacity:8,enrolled:2,color:'#5B8FF9',icon:'fa-leaf'},
];

const programMap = {power:'Power Yoga',diabetes:'Yoga for Diabetes',gentle:'Gentle Yoga',retreats:'الريتريتس'};
const levelMap = {beginner:'مبتدئة',some:'ممارست قليلاً',intermediate:'متوسطة',advanced:'متقدمة'};
const statusMap = {new:'جديد',confirmed:'مؤكد',done:'مكتمل',cancelled:'ملغي'};
const statusBadge = {new:'blue',confirmed:'green',done:'green',cancelled:'red'};

window.onBookingsLoaded = function() {
  updateBadge();
  const currentPage = document.querySelector('.page.active')?.id?.replace('page-','');
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'bookings') renderBookings(window.bookings);
  else if (currentPage === 'students') renderStudents(buildStudents());
  else if (currentPage === 'stats') renderStats();
  updateDashStats();
};

window.onCreditsLoaded = function() {
  const currentPage = document.querySelector('.page.active')?.id?.replace('page-','');
  if (currentPage === 'students') renderStudents(buildStudents());
};

function updateDashStats() {
  const b = window.bookings;
  const uniquePhones = new Set(b.map(x => x.phone)).size;
  document.getElementById('sc1').textContent = uniquePhones || '0';
  document.getElementById('sc2').textContent = b.length || '0';
  document.getElementById('sc3').textContent = b.filter(x => x.status === 'new').length || '0';
}

function updateBadge() {
  const n = window.bookings.filter(x => x.status === 'new').length;
  document.getElementById('newBadge').textContent = n > 0 ? n : '';
}

// ── LOGIN ──
async function doLogin() {
  const email = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const err = document.getElementById('loginErr');
  const btn = document.querySelector('.btn-login');
  if (!email || !pass) { err.textContent = 'يرجى ملء جميع الحقول'; return; }
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الدخول...';
  btn.disabled = true;
  try {
    await window.fbSignIn(email, pass);
  } catch(e) {
    err.textContent = 'البريد الإلكتروني أو كلمة المرور غلط';
    setTimeout(() => err.textContent = '', 3000);
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> دخول';
    btn.disabled = false;
  }
}
document.getElementById('loginPass').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
document.getElementById('loginUser').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
async function logout() { await window.fbSignOut(); }

// ── NAV ──
const pageTitles = {
  dashboard:'نظرة عامة', bookings:'الحجوزات', classes:'الكلاسات',
  retreats:'الريتريتس', students:'المتدربات والرصيد', stats:'الإحصائيات',
  attendance:'سجل الحضور', locations:'مواقع الكلاسات'
};

function goPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[id] || '';
  closeSidebar();
  if (id === 'dashboard') { renderDashboard(); updateDashStats(); }
  else if (id === 'bookings') renderBookings(window.bookings);
  else if (id === 'classes') renderClasses();
  else if (id === 'retreats') renderRetreats();
  else if (id === 'students') renderStudents(buildStudents());
  else if (id === 'stats') renderStats();
  else if (id === 'attendance') {
    const today = new Date().toISOString().slice(0,10);
    document.getElementById('attendDatePicker').value = today;
    loadAttendance(today);
  }
  else if (id === 'locations') renderSavedLocations();
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sidebarOverlay').classList.toggle('active')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('active')}

// ── DASHBOARD ──
function renderDashboard() {
  const b = window.bookings;
  const recent = b.slice(0, 5);
  const tb = document.getElementById('dashBookings');
  if (!recent.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">لا توجد حجوزات بعد</td></tr>';
  } else {
    tb.innerHTML = recent.map(b => `<tr>
      <td><strong>${b.fname} ${b.lname}</strong></td>
      <td style="font-size:.8rem">${programMap[b.program]||b.program}</td>
      <td style="font-size:.75rem;color:var(--text-muted)">${b.sessionDate||b.date||'—'}</td>
      <td>${b.paymentStatus==='paid'?`<span class="pay-paid"><i class="fa-solid fa-check-circle"></i>مدفوع</span>`:`<span class="pay-pending"><i class="fa-solid fa-clock"></i>معلق</span>`}</td>
      <td><span class="badge ${statusBadge[b.status]||'blue'}">${statusMap[b.status]||b.status}</span></td>
      <td><div class="action-btns">
        <button class="act-btn view" onclick="quickStatus('${b._key}','confirmed')" title="تأكيد"><i class="fa-solid fa-check"></i></button>
        <button class="act-btn wa" onclick="waContact('${b.phone}','${b.fname}')" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
      </div></td>
    </tr>`).join('');
  }
  const counts = {power:0,diabetes:0,gentle:0,retreats:0};
  b.forEach(x => { if(counts[x.program]!==undefined) counts[x.program]++; });
  const total = b.length || 1;
  document.getElementById('classDistMetrics').innerHTML = Object.entries(counts).filter(([,v])=>v>0).map(([k,v]) => `
    <div class="metric-item">
      <span class="m-label"><i class="fa-solid fa-circle" style="color:${k==='power'?'var(--green)':k==='diabetes'?'var(--accent)':k==='retreats'?'var(--purple)':'var(--blue)'}"></i>${programMap[k]}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:60px;height:5px;background:var(--bg);border-radius:6px;overflow:hidden"><div style="height:100%;background:${k==='power'?'var(--green)':k==='diabetes'?'var(--accent)':k==='retreats'?'var(--purple)':'var(--blue)'};width:${Math.round(v/total*100)}%;border-radius:6px"></div></div>
        <span class="m-val">${v}</span>
      </div>
    </div>`).join('') || '<div style="text-align:center;color:var(--text-muted);padding:12px">لا توجد بيانات</div>';
}

// ── BOOKINGS ──
function renderBookings(list) {
  const tb = document.getElementById('bookingsTable');
  const empty = document.getElementById('bookEmpty');
  if (!list.length) { tb.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';
  tb.innerHTML = list.map((b, i) => `<tr>
    <td style="color:var(--text-muted);font-size:.75rem">${i+1}</td>
    <td><strong style="font-size:.85rem">${b.fname} ${b.lname}</strong></td>
    <td dir="ltr" style="color:var(--text-muted);font-size:.78rem">${b.phone}</td>
    <td style="font-size:.78rem">${programMap[b.program]||b.program}</td>
    <td style="font-size:.75rem;color:var(--text-muted)">${b.sessionDate||b.date||'—'}</td>
    <td>
      ${b.paymentStatus==='paid'
        ? `<span class="pay-paid"><i class="fa-solid fa-check-circle"></i>مدفوع</span>`
        : `<button class="btn" style="font-size:.7rem;padding:3px 8px;background:rgba(240,180,41,.1);color:var(--yellow);border:1px solid rgba(240,180,41,.3)" onclick="openPaymentModal('${b._key}','${b.fname} ${b.lname}')"><i class="fa-solid fa-mobile-screen"></i> InstaPay</button>`}
    </td>
    <td>
      <select onchange="changeStatus('${b._key}',this.value)" style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:3px 6px;font-size:.75rem;outline:none;font-family:inherit">
        ${['new','confirmed','done','cancelled'].map(s=>`<option value="${s}"${b.status===s?' selected':''}>${statusMap[s]}</option>`).join('')}
      </select>
    </td>
    <td><div class="action-btns">
      <button class="act-btn view" onclick="viewBooking('${b._key}')" title="عرض"><i class="fa-solid fa-eye"></i></button>
      <button class="act-btn wa" onclick="waContact('${b.phone}','${b.fname}')" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
      <button class="act-btn del" onclick="deleteBooking('${b._key}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
    </div></td>
  </tr>`).join('');
}

function filterBookings() {
  const q = (document.getElementById('bookSearch').value||'').toLowerCase();
  const prog = document.getElementById('bookFilter').value;
  const stat = document.getElementById('statusFilter').value;
  const pay = document.getElementById('payFilter').value;
  renderBookings(window.bookings.filter(b => {
    const name = (b.fname+' '+b.lname+b.phone).toLowerCase();
    const matchPay = !pay || (pay === 'paid' ? b.paymentStatus === 'paid' : b.paymentStatus !== 'paid');
    return (!q||name.includes(q))&&(!prog||b.program===prog)&&(!stat||b.status===stat)&&matchPay;
  }));
}

async function changeStatus(key, val) {
  try {
    await window.fbUpdateStatus(key, val);
    const b = window.bookings.find(x => x._key === key);
    showToast(`تم تحديث حالة ${b?.fname||''}`, 'success', 'fa-check-circle');
  } catch(e) { showToast('حدث خطأ', 'error', 'fa-triangle-exclamation'); }
}
async function quickStatus(key, val) { await window.fbUpdateStatus(key, val); showToast('تم التأكيد', 'success', 'fa-check-circle'); }
async function deleteBooking(key) {
  if (!confirm('هل أنت متأكدة من حذف هذا الحجز؟')) return;
  try { await window.fbDeleteBooking(key); showToast('تم حذف الحجز', 'error', 'fa-trash'); }
  catch(e) { showToast('حدث خطأ', 'error', 'fa-triangle-exclamation'); }
}
function viewBooking(key) { const b = window.bookings.find(x => x._key === key); if (!b) return; openModal('viewBooking', b); }
function openPaymentModal(key, name) { openModal('confirmPayment', { _key: key, displayName: name }); }
function waContact(phone, name) {
  const msg = encodeURIComponent(`مرحباً ${name}! أنا إنجي من Align by Enjy. بخصوص حجزكِ...`);
  window.open(`https://wa.me/2${phone}?text=${msg}`, '_blank');
}

// ── CLASSES ──
function renderClasses() {
  document.getElementById('classesGrid').innerHTML = classes.map(c => `
    <div class="class-card">
      <div class="cc-top">
        <div class="cc-icon" style="background:${c.color}22;color:${c.color}"><i class="fa-solid ${c.icon}"></i></div>
        <div style="display:flex;gap:5px">
          <button class="btn btn-ghost" style="font-size:.75rem;padding:5px 10px" onclick="editClass(${c.id})"><i class="fa-solid fa-pen"></i> تعديل</button>
          <button class="btn btn-danger" style="font-size:.75rem;padding:5px 10px" onclick="deleteClass(${c.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="cc-name">${c.name}</div>
      <div class="cc-loc"><i class="fa-solid fa-location-dot"></i>${c.location}</div>
      <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:8px"><i class="fa-regular fa-calendar" style="margin-left:4px"></i>${c.schedule}</div>
      <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:5px">الحضور: ${c.enrolled}/${c.capacity}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(c.enrolled/c.capacity*100)}%"></div></div>
      <div class="cc-row">
        <div class="cc-stat"><div class="val">${c.price1} ج</div><div class="lbl">جلسة واحدة</div></div>
        ${c.price4?`<div class="cc-stat"><div class="val">${c.price4} ج</div><div class="lbl">4 كلاسات</div></div>`:''}
        ${c.price8?`<div class="cc-stat"><div class="val">${c.price8} ج</div><div class="lbl">8 كلاسات</div></div>`:''}
      </div>
    </div>`).join('');
}
function editClass(id) { openModal('editClass', classes.find(x => x.id===id)); }
function deleteClass(id) {
  if (!confirm("هل أنتِ متأكدة من حذف هذا الكلاس؟")) return;
  const idx = classes.findIndex(x => x.id === id);
  if (idx > -1) { classes.splice(idx, 1); renderClasses(); showToast('تم حذف الكلاس بنجاح', 'success', 'fa-trash-can'); }
}

// ── RETREATS ──
function renderRetreats() {
  const grid = document.getElementById('retreatsGrid');
  if (!window.retreatsData.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-mountain-sun"></i><p>لا توجد ريتريتس بعد. أضيفي أول ريتريت!</p></div>`;
    return;
  }
  grid.innerHTML = window.retreatsData.map(r => `
    <div class="class-card">
      <div class="cc-top">
        <div class="cc-icon" style="background:rgba(167,139,250,.15);color:var(--purple)"><i class="fa-solid fa-mountain-sun"></i></div>
        <div class="action-btns">
          <button class="act-btn edit" onclick="editRetreat('${r._key}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="act-btn del" onclick="deleteRetreat('${r._key}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="cc-name">${r.name||'—'}</div>
      <div class="cc-loc"><i class="fa-solid fa-location-dot"></i>${r.location||'—'}</div>
      <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:6px"><i class="fa-regular fa-calendar" style="margin-left:4px"></i>${r.dateRange||'—'}</div>
      ${r.description?`<div style="font-size:.78rem;color:var(--text-muted);margin-bottom:10px">${r.description}</div>`:''}
      <div class="cc-row">
        <div class="cc-stat"><div class="val">${r.price||'—'} ج</div><div class="lbl">سعر الريتريت</div></div>
        <div class="cc-stat"><div class="val">${r.capacity||'—'}</div><div class="lbl">أماكن متاحة</div></div>
        <div class="cc-stat"><div class="val">${r.duration||'—'}</div><div class="lbl">المدة</div></div>
      </div>
    </div>`).join('');
}
async function deleteRetreat(key) {
  if (!confirm("هل أنتِ متأكدة من حذف هذا الريتريت؟")) return;
  try { await window.fbDeleteRetreat(key); showToast('تم حذف الريتريت بنجاح', 'success', 'fa-trash-can'); }
  catch(e) { showToast('حدث خطأ أثناء الحذف', 'error', 'fa-triangle-exclamation'); }
}
function editRetreat(key) { const r = window.retreatsData.find(x => x._key === key); if (r) openModal('editRetreat', r); }

// ── STUDENTS + CREDITS ──
function buildStudents() {
  const map = {};
  window.bookings.forEach(b => {
    const k = b.phone;
    if (!map[k]) map[k] = {name:b.fname+' '+b.lname, phone:b.phone, classes:[], sessions:0, lastDate:b.sessionDate||b.date||''};
    if (!map[k].classes.includes(programMap[b.program])) map[k].classes.push(programMap[b.program]);
    map[k].sessions++;
    const bDate = b.sessionDate || b.date || '';
    if (bDate > map[k].lastDate) map[k].lastDate = bDate;
  });
  return Object.values(map);
}

function renderStudents(list) {
  const tb = document.getElementById('studentsTable');
  if (!list || !list.length) { tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">لا توجد بيانات بعد</td></tr>'; return; }
  const today = new Date().toISOString().slice(0,10);
  tb.innerHTML = list.map((s, i) => {
    const rawPhone = s.phone.replace(/[^0-9]/g,'');
    const key = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const cr = window.creditsData[key] || {};
    const credits = cr.credits !== undefined ? Number(cr.credits) : '—';
    const expiry = cr.expiry || '—';
    const attended = cr.totalAttended || 0;
    let expiryHTML = `<span style="color:var(--text-faint)">—</span>`;
    let rowWarning = false;
    if (cr.expiry) {
      const diff = (new Date(cr.expiry) - new Date(today)) / (1000*60*60*24);
      if (diff < 0) { expiryHTML = `<span class="badge red" style="font-size:.7rem">${expiry} (منتهي!)</span>`; rowWarning = true; }
      else if (diff <= 7) expiryHTML = `<span class="badge yellow" style="font-size:.7rem">${expiry} (قريباً)</span>`;
      else expiryHTML = `<span class="badge green" style="font-size:.7rem">${expiry}</span>`;
    }
    const isNoCredits = typeof credits === 'number' && credits <= 0;
    const creditsColor = (isNoCredits || rowWarning) ? 'var(--red)' : 'var(--green)';
    return `<tr>
      <td style="color:var(--text-muted)">${i+1}</td>
      <td><strong style="font-size:.85rem">${s.name}</strong></td>
      <td dir="ltr" style="font-size:.78rem;color:var(--text-muted)">${s.phone}</td>
      <td>${s.classes.map(c => `<span class="badge blue" style="margin-left:3px;font-size:.65rem">${c}</span>`).join('')}</td>
      <td style="text-align:center">${typeof credits === 'number' ? `<strong style="color:${creditsColor};font-size:1.1rem">${credits}</strong>` : `<span style="color:var(--text-faint)">—</span>`}</td>
      <td style="text-align:center">${expiryHTML}</td>
      <td style="text-align:center"><strong>${attended}</strong></td>
      <td><div class="action-btns">
        <button class="act-btn credit" onclick="openCreditsModal('${s.phone}','${s.name}')" title="إدارة الرصيد"><i class="fa-solid fa-coins"></i></button>
        ${(typeof credits === 'number' && credits > 0 && !rowWarning) ? `<button class="act-btn view" onclick="markAttendance('${s.phone}','${s.name.split(' ')[0]}')" title="تسجيل حضور"><i class="fa-solid fa-user-check"></i></button>` : ''}
        <button class="act-btn wa" onclick="waContact('${s.phone}','${s.name.split(' ')[0]}')" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
        <button class="act-btn view" onclick="window.open('attendance.html?phone=${key}','_blank')" title="صفحة رصيد المتدربة" style=""><i class="fa-solid fa-id-card"></i></button>
      </div></td>
    </tr>`;
  }).join('');
}
function filterStudents(q) { renderStudents(buildStudents().filter(s => (s.name+s.phone).toLowerCase().includes(q.toLowerCase()))); }
function openCreditsModal(phone, name) { openModal('manageCredits', { phone, name }); }
async function markAttendance(phone, firstName) {
  try {
    const ok = await window.fbMarkAttendance(phone);
    if (ok) showToast(`✓ تم تسجيل حضور ${firstName}، تم خصم جلسة من رصيدها`, 'success', 'fa-user-check');
    else showToast(`رصيد ${firstName} صفر، لا يمكن تسجيل الحضور`, 'error', 'fa-triangle-exclamation');
  } catch(e) { showToast('حدث خطأ', 'error', 'fa-triangle-exclamation'); }
}

// ── STATS ──
function renderStats() {
  const b = window.bookings;
  const uniquePhones = new Set(b.map(x => x.phone)).size;
  document.getElementById('st1').textContent = uniquePhones;
  document.getElementById('st2').textContent = b.length;
  document.getElementById('st3').textContent = b.filter(x=>x.status==='new').length;
  document.getElementById('st4').textContent = b.filter(x=>x.status==='confirmed').length;
  const counts = {power:0,diabetes:0,gentle:0,retreats:0};
  b.forEach(x => { if(counts[x.program]!==undefined) counts[x.program]++; });
  const total = b.length || 1;
  document.getElementById('statsDistList').innerHTML = Object.entries(counts).map(([k,v]) => `
    <div class="metric-item">
      <span class="m-label"><i class="fa-solid fa-circle" style="color:${k==='power'?'var(--green)':k==='diabetes'?'var(--accent)':k==='retreats'?'var(--purple)':'var(--blue)'}"></i>${programMap[k]}</span>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:100px;height:7px;background:var(--bg);border-radius:6px;overflow:hidden"><div style="height:100%;background:${k==='power'?'var(--green)':k==='diabetes'?'var(--accent)':k==='retreats'?'var(--purple)':'var(--blue)'};width:${Math.round(v/total*100)}%;border-radius:6px"></div></div>
        <span class="m-val">${v} (${Math.round(v/total*100)}%)</span>
      </div>
    </div>`).join('');
}

// ── ATTENDANCE ──
function loadAttendance(date) {
  if (!date) return;
  document.getElementById('attendDateLabel').textContent = `يوم: ${date}`;
  const dayData = window.attendanceData[date] || {};
  const entries = Object.values(dayData);
  const tb = document.getElementById('attendanceTable');
  const empty = document.getElementById('attendEmpty');

  const counts = {power:0, diabetes:0, gentle:0};
  entries.forEach(e => {
    const cls = (e.className||'').toLowerCase();
    if (cls.includes('power')) counts.power++;
    else if (cls.includes('diabetes')) counts.diabetes++;
    else if (cls.includes('gentle')) counts.gentle++;
  });
  document.getElementById('att1').textContent = entries.length;
  document.getElementById('att2').textContent = counts.power;
  document.getElementById('att3').textContent = counts.diabetes;
  document.getElementById('att4').textContent = counts.gentle;

  if (!entries.length) { if(tb) tb.innerHTML=''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  entries.sort((a,b) => (a.time||'').localeCompare(b.time||''));
  if(tb) tb.innerHTML = entries.map((e,i) => {
    const raw = (e.phone||'').replace(/[^0-9]/g,'');
    const key = raw.length >= 10 ? raw.slice(-10) : raw;
    const cr = window.creditsData[key];
    const remaining = cr ? Number(cr.credits) : '—';
    const credStyle = typeof remaining==='number' ? remaining===0?'color:var(--red)':remaining<=2?'color:var(--yellow)':'color:var(--green)' : 'color:var(--text-muted)';
    return `<tr>
      <td style="color:var(--text-muted)">${i+1}</td>
      <td><strong style="font-size:.85rem">${e.name||'—'}</strong></td>
      <td dir="ltr" style="font-size:.78rem;color:var(--text-muted)">${e.phone||'—'}</td>
      <td style="font-size:.8rem">${e.className||'—'}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${e.time||'—'}</td>
      <td style="text-align:center"><strong style="${credStyle}">${remaining}</strong></td>
      <td><div class="action-btns">
        <button class="act-btn wa" onclick="waContact('${e.phone}','${(e.name||'').split(' ')[0]}')" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
        <button class="act-btn view" onclick="window.open('attendance.html?phone=${key}','_blank')" title="رصيد المتدربة"><i class="fa-solid fa-coins"></i></button>
      </div></td>
    </tr>`;
  }).join('');
}

function copyCheckinLink(cls) {
  const url = window.location.origin + window.location.pathname.replace('admin.html','') + `checkin.html?class=${cls}`;
  navigator.clipboard.writeText(url).then(() => showToast('تم نسخ الرابط ✓','success','fa-copy'));
}
function shareCheckinWA(cls, name) {
  const url = window.location.origin + window.location.pathname.replace('admin.html','') + `checkin.html?class=${cls}`;
  const msg = encodeURIComponent(`🧘‍♀️ Align by Enjy\nسجّلي حضورك في كلاس ${name} من هنا:\n${url}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

// ── LOCATIONS ──
function renderSavedLocations() {
  const locs = window.savedLocations || {};
  ['power','diabetes','gentle'].forEach(cls => {
    const data = locs[cls];
    if (data) {
      const latEl = document.getElementById(`lat-${cls}`);
      const lngEl = document.getElementById(`lng-${cls}`);
      const radEl = document.getElementById(`radius-${cls}`);
      if (latEl) latEl.value = data.lat || '';
      if (lngEl) lngEl.value = data.lng || '';
      if (radEl) radEl.value = data.radius || 400;
      const badge = document.getElementById(`locStatus-${cls}`);
      if (badge) { badge.textContent = 'محدد ✓'; badge.className = 'badge green'; }
      const hint = document.getElementById(`locHint-${cls}`);
      if (hint) hint.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--green)"></i> آخر تحديث: ${data.updatedAt||'—'}`;
    } else {
      const badge = document.getElementById(`locStatus-${cls}`);
      if (badge) { badge.textContent = 'لم يُحدَّد بعد'; badge.className = 'badge yellow'; }
    }
  });
}

async function saveLocation(classId) {
  const lat = parseFloat(document.getElementById(`lat-${classId}`).value);
  const lng = parseFloat(document.getElementById(`lng-${classId}`).value);
  const radius = parseInt(document.getElementById(`radius-${classId}`).value) || 400;
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) { showToast('يرجى إدخال إحداثيات صحيحة', 'error', 'fa-triangle-exclamation'); return; }
  if (lat < 20 || lat > 35 || lng < 24 || lng > 40) { showToast('الإحداثيات خارج نطاق مصر، تأكدي من الأرقام', 'error', 'fa-triangle-exclamation'); return; }
  try {
    await window.fbSaveLocation(classId, lat, lng, radius);
    const hint = document.getElementById(`locHint-${classId}`);
    if (hint) hint.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--green)"></i> تم الحفظ بنجاح ✓`;
    const badge = document.getElementById(`locStatus-${classId}`);
    if (badge) { badge.textContent = 'محدد ✓'; badge.className = 'badge green'; }
    showToast('تم حفظ موقع الكلاس بنجاح', 'success', 'fa-location-dot');
  } catch(e) { showToast('حدث خطأ أثناء الحفظ', 'error', 'fa-triangle-exclamation'); }
}

// ── EXPORT ──
function exportCSV() {
  const rows = [['#','الاسم','الجوال','الإيميل','الكلاس','المستوى','تاريخ الجلسة','الدفع','الحالة'],
    ...window.bookings.map((b,i) => [i+1,`${b.fname} ${b.lname}`,b.phone,b.email||'',programMap[b.program]||b.program,levelMap[b.level]||b.level||'',b.sessionDate||b.date||'',b.paymentStatus==='paid'?'مدفوع':'معلق',statusMap[b.status]||b.status])];
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv); a.download='bookings.csv'; a.click();
  showToast('تم تصدير البيانات','success','fa-file-export');
}

// ── MODALS ──
function openModal(type, data) {
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const foot = document.getElementById('modalFoot');

  if (type === 'addBooking') {
    title.textContent = 'إضافة حجز جديد';
    body.innerHTML = `
      <div class="form-row2"><div class="form-group"><label>الاسم الأول</label><input id="mfname" type="text" placeholder="نورة"></div><div class="form-group"><label>الاسم الأخير</label><input id="mlname" type="text" placeholder="العتيبي"></div></div>
      <div class="form-row2"><div class="form-group"><label>الجوال</label><input id="mphone" type="tel" dir="ltr" placeholder="01XXXXXXXXX"></div><div class="form-group"><label>الإيميل</label><input id="memail" type="email" dir="ltr" placeholder="email@example.com"></div></div>
      <div class="form-row2">
        <div class="form-group"><label>الكلاس</label><select id="mprogram"><option value="power">Power Yoga</option><option value="diabetes">Yoga for Diabetes</option><option value="gentle">Gentle Yoga</option><option value="retreats">الريتريتس</option></select></div>
        <div class="form-group"><label>المستوى</label><select id="mlevel"><option value="beginner">مبتدئة</option><option value="some">ممارست قليلاً</option><option value="intermediate">متوسطة</option><option value="advanced">متقدمة</option></select></div>
      </div>
      <div class="form-row2">
        <div class="form-group"><label>تاريخ الجلسة</label><input id="msessiondate" type="date"></div>
        <div class="form-group"><label>طريقة الدفع</label><select id="mpaymethod"><option value="instapay">InstaPay</option><option value="cash">كاش</option><option value="other">أخرى</option></select></div>
      </div>
      <div class="form-group"><label>حالة الدفع</label><select id="mpaystatus"><option value="pending">معلق</option><option value="paid">مدفوع ✓</option></select></div>
      <div class="form-group"><label>ملاحظات</label><textarea id="mnotes" placeholder="أي ملاحظات..."></textarea></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button><button class="btn btn-primary" onclick="saveAddBooking()"><i class="fa-solid fa-plus"></i> إضافة</button>`;
  }
  else if (type === 'viewBooking' && data) {
    title.textContent = 'تفاصيل الحجز';
    body.innerHTML = `
      <div class="metric-list">
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-user"></i> الاسم</span><span class="m-val">${data.fname} ${data.lname}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-phone"></i> الجوال</span><span class="m-val" dir="ltr">${data.phone}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-envelope"></i> الإيميل</span><span class="m-val" dir="ltr">${data.email||'—'}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-dumbbell"></i> الكلاس</span><span class="m-val">${programMap[data.program]||data.program}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-signal"></i> المستوى</span><span class="m-val">${levelMap[data.level]||data.level||'—'}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-regular fa-calendar"></i> تاريخ الجلسة</span><span class="m-val">${data.sessionDate||data.date||'—'}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-mobile-screen"></i> طريقة الدفع</span><span class="m-val">${data.paymentMethod==='instapay'?'InstaPay':data.paymentMethod==='cash'?'كاش':data.paymentMethod||'—'}</span></div>
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-circle-dollar-to-slot"></i> حالة الدفع</span><span class="m-val">${data.paymentStatus==='paid'?`<span class="pay-paid"><i class="fa-solid fa-check-circle"></i>مدفوع</span>`:`<span class="pay-pending"><i class="fa-solid fa-clock"></i>معلق</span>`}</span></div>
        ${data.paymentRef?`<div class="metric-item"><span class="m-label"><i class="fa-solid fa-hashtag"></i> مرجع الدفع</span><span class="m-val" dir="ltr">${data.paymentRef}</span></div>`:''}
        <div class="metric-item"><span class="m-label"><i class="fa-solid fa-info-circle"></i> الحالة</span><span class="m-val"><span class="badge ${statusBadge[data.status]}">${statusMap[data.status]}</span></span></div>
        ${data.notes?`<div class="metric-item"><span class="m-label"><i class="fa-solid fa-note-sticky"></i> ملاحظات</span><span class="m-val">${data.notes}</span></div>`:''}
      </div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إغلاق</button><button class="btn btn-primary" onclick="waContact('${data.phone}','${data.fname}');closeModal()"><i class="fa-brands fa-whatsapp"></i> تواصل</button>`;
  }
  else if (type === 'confirmPayment' && data) {
    title.textContent = 'تأكيد دفع InstaPay';
    body.innerHTML = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:16px">تأكيد استلام مدفوعات <strong>${data.displayName}</strong> عبر InstaPay</p>
      <div class="form-group"><label>رقم مرجع التحويل (اختياري)</label><input id="payRef" type="text" dir="ltr" placeholder="مثال: 12345678"></div>
      <div class="instapay-info"><i class="fa-solid fa-circle-info"></i><div>بعد التأكيد سيتغير وضع الدفع إلى "مدفوع".</div></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button><button class="btn btn-primary" onclick="confirmPayment('${data._key}')"><i class="fa-solid fa-check"></i> تأكيد الاستلام</button>`;
  }
  else if (type === 'manageCredits' && data) {
    const rawPhone = data.phone.replace(/[^0-9]/g,'');
    const key = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const cr = window.creditsData[key] || {};
    const today = new Date().toISOString().slice(0,10);
    title.textContent = `رصيد: ${data.name}`;
    body.innerHTML = `
      ${cr.credits !== undefined ? `
        <div class="credits-box">
          <div class="cb-head">
            <div><div class="cb-num">${cr.credits}</div><div class="cb-lbl">كلاسات متبقية</div></div>
            <div style="text-align:left"><div style="font-size:.78rem;color:var(--text-muted)">إجمالي الحضور</div><div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${cr.totalAttended||0}</div></div>
          </div>
          <div class="cb-expiry ${cr.expiry && cr.expiry < today ? 'expired' : cr.expiry && (new Date(cr.expiry)-new Date(today))/(1000*60*60*24)<=14 ? 'soon' : ''}">
            <i class="fa-regular fa-calendar"></i> انتهاء الصلاحية: ${cr.expiry||'—'}${cr.expiry && cr.expiry < today ? ' (منتهي!)' : ''}
          </div>
        </div>` : `<p style="font-size:.85rem;color:var(--text-muted);margin-bottom:16px">لا يوجد رصيد مسجل لهذه المتدربة. أضيفي رصيد جديد:</p>`}
      <div class="form-row2">
        <div class="form-group"><label>عدد الكلاسات المضافة</label><input id="crCredits" type="number" placeholder="4" min="1" max="50"></div>
        <div class="form-group"><label>تاريخ انتهاء الصلاحية</label><input id="crExpiry" type="date" value="${cr.expiry||''}"></div>
      </div>
      <p class="form-hint">* سيتم إضافة الرصيد الجديد على الرصيد الحالي تلقائياً.</p>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
      ${cr.credits > 0 ? `<button class="attend-btn" onclick="markAttendance('${data.phone}','${data.name.split(' ')[0]}');closeModal()"><i class="fa-solid fa-user-check"></i> تسجيل حضور الآن</button>` : ''}
      <button class="btn btn-primary" onclick="saveCredits('${data.phone}')"><i class="fa-solid fa-floppy-disk"></i> حفظ الرصيد</button>`;
  }
  else if (type === 'editClass' && data) {
    title.textContent = 'تعديل: ' + data.name;
    body.innerHTML = `
      <div class="form-group"><label>اسم الكلاس</label><input id="ecname" type="text" value="${data.name}"></div>
      <div class="form-group"><label>الموقع</label><input id="ecloc" type="text" value="${data.location}"></div>
      <div class="form-group"><label>المواعيد</label><input id="ecsched" type="text" value="${data.schedule}"></div>
      <div class="form-row2"><div class="form-group"><label>سعر الجلسة</label><input id="ecp1" type="number" value="${data.price1}"></div><div class="form-group"><label>سعر 4 كلاسات</label><input id="ecp4" type="number" value="${data.price4||''}"></div></div>
      <div class="form-row2"><div class="form-group"><label>سعر 8 كلاسات</label><input id="ecp8" type="number" value="${data.price8||''}"></div><div class="form-group"><label>السعة القصوى</label><input id="eccap" type="number" value="${data.capacity}"></div></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button><button class="btn btn-primary" onclick="saveEditClass(${data.id})"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`;
  }
  else if (type === 'addClass') {
    title.textContent = 'إضافة كلاس جديد';
    body.innerHTML = `
      <div class="form-group"><label>اسم الكلاس</label><input id="ecname" type="text" placeholder="Morning Flow"></div>
      <div class="form-group"><label>الموقع</label><input id="ecloc" type="text"></div>
      <div class="form-group"><label>المواعيد</label><input id="ecsched" type="text"></div>
      <div class="form-row2"><div class="form-group"><label>سعر الجلسة</label><input id="ecp1" type="number" placeholder="400"></div><div class="form-group"><label>سعر 4 كلاسات</label><input id="ecp4" type="number"></div></div>
      <div class="form-row2"><div class="form-group"><label>سعر 8 كلاسات</label><input id="ecp8" type="number"></div><div class="form-group"><label>السعة القصوى</label><input id="eccap" type="number" placeholder="6"></div></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button><button class="btn btn-primary" onclick="saveNewClass()"><i class="fa-solid fa-plus"></i> إضافة</button>`;
  }
  else if (type === 'addRetreat') {
    title.textContent = 'إضافة ريتريت جديد';
    body.innerHTML = `
      <div class="form-group"><label>اسم الريتريت</label><input id="rtname" type="text" placeholder="Bali Yoga Retreat 2026"></div>
      <div class="form-group"><label>الموقع</label><input id="rtloc" type="text" placeholder="بالي — إندونيسيا"></div>
      <div class="form-row2"><div class="form-group"><label>تاريخ البدء</label><input id="rtstart" type="date"></div><div class="form-group"><label>تاريخ الانتهاء</label><input id="rtend" type="date"></div></div>
      <div class="form-row2"><div class="form-group"><label>السعر (جنيه)</label><input id="rtprice" type="number" placeholder="15000"></div><div class="form-group"><label>عدد الأماكن</label><input id="rtcap" type="number" placeholder="10"></div></div>
      <div class="form-group"><label>المدة</label><input id="rtdur" type="text" placeholder="7 أيام"></div>
      <div class="form-group"><label>الوصف</label><textarea id="rtdesc" placeholder="وصف مختصر..."></textarea></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button><button class="btn btn-primary" onclick="saveNewRetreat()"><i class="fa-solid fa-plus"></i> إضافة</button>`;
  }
  else if (type === 'editRetreat' && data) {
    title.textContent = 'تعديل: ' + (data.name||'الريتريت');
    const [startDate, endDate] = (data.dateRange||'').split(' — ');
    body.innerHTML = `
      <div class="form-group"><label>اسم الريتريت</label><input id="rtname" type="text" value="${data.name||''}"></div>
      <div class="form-group"><label>الموقع</label><input id="rtloc" type="text" value="${data.location||''}"></div>
      <div class="form-row2"><div class="form-group"><label>تاريخ البدء</label><input id="rtstart" type="date" value="${startDate||''}"></div><div class="form-group"><label>تاريخ الانتهاء</label><input id="rtend" type="date" value="${endDate||''}"></div></div>
      <div class="form-row2"><div class="form-group"><label>السعر (جنيه)</label><input id="rtprice" type="number" value="${data.price||''}"></div><div class="form-group"><label>عدد الأماكن</label><input id="rtcap" type="number" value="${data.capacity||''}"></div></div>
      <div class="form-group"><label>المدة</label><input id="rtdur" type="text" value="${data.duration||''}"></div>
      <div class="form-group"><label>الوصف</label><textarea id="rtdesc">${data.description||''}</textarea></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" onclick="closeModal()">إلغاء</button><button class="btn btn-primary" onclick="saveEditRetreat('${data._key}')"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`;
  }

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeModalOutside(e) { if(e.target===document.getElementById('modalOverlay')) closeModal(); }

async function saveAddBooking() {
  const fn=document.getElementById('mfname').value.trim();
  const ph=document.getElementById('mphone').value.trim();
  if(!fn||!ph){showToast('يرجى ملء الاسم والجوال','error','fa-triangle-exclamation');return;}
  try {
    await window.fbAddBooking({fname:fn,lname:document.getElementById('mlname').value.trim(),phone:ph,email:document.getElementById('memail').value.trim(),program:document.getElementById('mprogram').value,level:document.getElementById('mlevel').value,notes:document.getElementById('mnotes').value.trim(),sessionDate:document.getElementById('msessiondate').value||new Date().toISOString().slice(0,10),date:new Date().toISOString().slice(0,10),paymentMethod:document.getElementById('mpaymethod').value,paymentStatus:document.getElementById('mpaystatus').value,status:'new'});
    closeModal(); showToast(`تم إضافة حجز ${fn} بنجاح`,'success','fa-check-circle');
  } catch(e) { showToast('حدث خطأ','error','fa-triangle-exclamation'); }
}

async function confirmPayment(key) {
  const ref = document.getElementById('payRef')?.value?.trim() || '';
  try { await window.fbUpdatePayment(key, 'paid', ref); closeModal(); showToast('تم تأكيد استلام الدفع ✓', 'success', 'fa-check-circle'); }
  catch(e) { showToast('حدث خطأ', 'error', 'fa-triangle-exclamation'); }
}

async function saveCredits(phone) {
  const newCreditsInput = document.getElementById('crCredits').value;
  const expiry = document.getElementById('crExpiry').value;
  if (!newCreditsInput) { showToast('يرجى إدخال عدد الكلاسات', 'error', 'fa-triangle-exclamation'); return; }
  if (!expiry) { showToast('يرجى إدخال تاريخ انتهاء الصلاحية', 'error', 'fa-triangle-exclamation'); return; }
  const rawPhone = phone.replace(/[^0-9]/g,'');
  const key = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
  const existing = window.creditsData[key] || { credits: 0 };
  const currentCredits = Number(existing.credits) || 0;
  const totalCredits = currentCredits + Number(newCreditsInput);
  try {
    await window.fbSetCredits(phone, totalCredits, expiry);
    closeModal(); showToast(`تمت إضافة ${newCreditsInput} حصص. الرصيد الإجمالي: ${totalCredits} ✓`, 'success', 'fa-coins');
  } catch(e) { showToast('حدث خطأ أثناء حفظ الرصيد', 'error', 'fa-triangle-exclamation'); }
}

function saveEditClass(id) {
  const c=classes.find(x=>x.id===id);if(!c)return;
  c.name=document.getElementById('ecname').value||c.name;
  c.location=document.getElementById('ecloc').value||c.location;
  c.schedule=document.getElementById('ecsched').value||c.schedule;
  c.price1=+document.getElementById('ecp1').value||c.price1;
  c.price4=+document.getElementById('ecp4').value||null;
  c.price8=+document.getElementById('ecp8').value||null;
  c.capacity=+document.getElementById('eccap').value||c.capacity;
  closeModal();renderClasses();showToast('تم تحديث الكلاس','success','fa-check-circle');
}

function saveNewClass() {
  const name=document.getElementById('ecname').value.trim();
  if(!name){showToast('يرجى كتابة اسم الكلاس','error','fa-triangle-exclamation');return;}
  classes.push({id:Date.now(),name,location:document.getElementById('ecloc').value,schedule:document.getElementById('ecsched').value,price1:+document.getElementById('ecp1').value||0,price4:+document.getElementById('ecp4').value||null,price8:+document.getElementById('ecp8').value||null,capacity:+document.getElementById('eccap').value||6,enrolled:0,color:'#3D8C6A',icon:'fa-spa'});
  closeModal();renderClasses();showToast('تم إضافة الكلاس','success','fa-plus');
}

async function saveNewRetreat() {
  const name = document.getElementById('rtname').value.trim();
  if (!name) { showToast('يرجى كتابة اسم الريتريت','error','fa-triangle-exclamation'); return; }
  const start = document.getElementById('rtstart').value;
  const end = document.getElementById('rtend').value;
  try {
    await window.fbAddRetreat({name,location:document.getElementById('rtloc').value,dateRange:start&&end?`${start} — ${end}`:start||end||'يتم تحديده قريباً',price:+document.getElementById('rtprice').value||0,capacity:+document.getElementById('rtcap').value||10,duration:document.getElementById('rtdur').value,description:document.getElementById('rtdesc').value});
    closeModal(); showToast('تم إضافة الريتريت بنجاح','success','fa-mountain-sun');
  } catch(e) { showToast('حدث خطأ','error','fa-triangle-exclamation'); }
}

async function saveEditRetreat(key) {
  const name = document.getElementById('rtname').value.trim();
  if (!name) { showToast('يرجى كتابة اسم الريتريت','error','fa-triangle-exclamation'); return; }
  const start = document.getElementById('rtstart').value;
  const end = document.getElementById('rtend').value;
  try {
    await window.fbUpdateRetreat(key,{name,location:document.getElementById('rtloc').value,dateRange:start&&end?`${start} — ${end}`:start||end||'يتم تحديده قريباً',price:+document.getElementById('rtprice').value||0,capacity:+document.getElementById('rtcap').value||10,duration:document.getElementById('rtdur').value,description:document.getElementById('rtdesc').value});
    closeModal(); showToast('تم تحديث الريتريت','success','fa-check-circle');
  } catch(e) { showToast('حدث خطأ','error','fa-triangle-exclamation'); }
}

function showToast(msg, type='info', icon='fa-info-circle') {
  const c=document.getElementById('toastContainer');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<i class="fa-solid ${icon}"></i> ${msg}`;
  c.appendChild(t);setTimeout(()=>t.remove(),3500);
}
