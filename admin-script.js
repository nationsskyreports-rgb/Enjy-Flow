/* ═══════════════════════════════════════════════════
   Align by Enjy — Admin Script
   admin-script.js
   ═══════════════════════════════════════════════════ */

/* ─── GLOBAL STATE ─── */
let bookings = [];
let creditsData  = window.creditsData  || {};
let retreatsData = window.retreatsData || [];

const PAGE_TITLES = {
  dashboard:  'نظرة عامة',
  bookings:   'الحجوزات',
  classes:    'الكلاسات والأسعار',
  retreats:   'الريتريتس',
  students:   'المتدربات والرصيد',
  attendance: 'سجل الحضور',
  locations:  'مواقع الكلاسات',
  stats:      'الإحصائيات',
};

const CLASS_NAMES = {
  power:    'Power Yoga',
  diabetes: 'Yoga for Diabetes',
  gentle:   'Gentle Yoga',
  retreats: 'الريتريتس',
};

const STATUS_LABELS = {
  new:       'جديد',
  confirmed: 'مؤكد',
  done:      'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_COLORS = {
  new:       'blue',
  confirmed: 'green',
  done:      'purple',
  cancelled: 'red',
};

/* ─── LOGIN ─── */
async function doLogin() {
  const email = document.getElementById('loginUser').value.trim();
  const pass  = document.getElementById('loginPass').value.trim();
  const errEl = document.getElementById('loginErr');
  errEl.textContent = '';

  if (!email || !pass) { errEl.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }

  try {
    await window.fbSignIn(email, pass);
  } catch (e) {
    errEl.textContent = 'بريد إلكتروني أو كلمة مرور غير صحيحة';
  }
}

/* ─── LOGOUT ─── */
function logout() {
  if (confirm('هل تريدين تسجيل الخروج؟')) {
    window.fbSignOut();
  }
}

/* ─── NAVIGATION ─── */
function goPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  if (el) el.classList.add('active');

  document.getElementById('pageTitle').textContent = PAGE_TITLES[id] || id;

  closeSidebar();

  if (id === 'dashboard')  renderDashboard();
  if (id === 'bookings')   renderBookingsTable(bookings);
  if (id === 'classes')    renderClasses();
  if (id === 'retreats')   renderRetreats();
  if (id === 'students')   renderStudents();
  if (id === 'attendance') { const today = new Date().toISOString().slice(0,10); document.getElementById('attendDatePicker').value = today; loadAttendance(today); }
  if (id === 'stats')      renderStats();
  if (id === 'locations')  renderSavedLocations();
}

/* ─── SIDEBAR ─── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

/* ─── MODAL ─── */
function openModal(type, data) {
  const overlay = document.getElementById('modalOverlay');
  const title   = document.getElementById('modalTitle');
  const body    = document.getElementById('modalBody');
  const foot    = document.getElementById('modalFoot');

  overlay.classList.add('open');

  if (type === 'addBooking')   { renderAddBookingModal(title, body, foot); }
  if (type === 'editBooking')  { renderEditBookingModal(title, body, foot, data); }
  if (type === 'viewBooking')  { renderViewBookingModal(title, body, foot, data); }
  if (type === 'editCredits')  { renderEditCreditsModal(title, body, foot, data); }
  if (type === 'addClass')     { renderAddClassModal(title, body, foot); }
  if (type === 'addRetreat')   { renderAddRetreatModal(title, body, foot); }
  if (type === 'editRetreat')  { renderEditRetreatModal(title, body, foot, data); }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

/* ─── BOOKINGS LOADED (called by Firebase listener) ─── */
window.onBookingsLoaded = function() {
  bookings = window.bookings || [];
  updateNewBadge();
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  if (activePage.id === 'page-dashboard') renderDashboard();
  if (activePage.id === 'page-bookings')  renderBookingsTable(bookings);
  if (activePage.id === 'page-students')  renderStudents();
  if (activePage.id === 'page-stats')     renderStats();
};

window.onCreditsLoaded = function() {
  creditsData = window.creditsData || {};
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  if (activePage.id === 'page-students')  renderStudents();
  if (activePage.id === 'page-dashboard') renderDashboard();
};

function updateNewBadge() {
  const newCount = bookings.filter(b => b.status === 'new').length;
  const badge = document.getElementById('newBadge');
  if (badge) badge.textContent = newCount;
}

/* ─── DASHBOARD ─── */
function renderDashboard() {
  const uniquePhones = [...new Set(bookings.map(b => b.phone))].length;
  document.getElementById('sc1').textContent = uniquePhones;
  document.getElementById('sc2').textContent = bookings.length;
  document.getElementById('sc3').textContent = bookings.filter(b => b.status === 'new').length;

  // Latest bookings (last 5)
  const latest = [...bookings].slice(0, 5);
  const tbody  = document.getElementById('dashBookings');
  if (!latest.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد حجوزات بعد</td></tr>';
  } else {
    tbody.innerHTML = latest.map(b => `
      <tr>
        <td><strong>${b.fname} ${b.lname}</strong></td>
        <td>${CLASS_NAMES[b.program] || b.program}</td>
        <td>${b.sessionDate || b.date || '—'}</td>
        <td><span class="badge ${b.paymentStatus === 'paid' ? 'green' : 'yellow'}">${b.paymentStatus === 'paid' ? 'مدفوع' : 'معلق'}</span></td>
        <td><span class="badge ${STATUS_COLORS[b.status] || 'blue'}">${STATUS_LABELS[b.status] || b.status}</span></td>
        <td>
          <div class="action-btns">
            <button class="act-btn view" onclick="openModal('viewBooking', bookings.find(x=>x._key==='${b._key}'))" title="عرض"><i class="fa-solid fa-eye"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  // Class distribution
  const dist = {};
  bookings.forEach(b => { dist[b.program] = (dist[b.program] || 0) + 1; });
  const metricsEl = document.getElementById('classDistMetrics');
  metricsEl.innerHTML = Object.entries(dist).map(([k, v]) => `
    <div class="metric-item">
      <span class="m-label"><i class="fa-solid fa-dumbbell"></i>${CLASS_NAMES[k] || k}</span>
      <span class="m-val">${v} حجز</span>
    </div>`).join('') || '<div style="text-align:center;padding:16px;color:var(--text-muted)">لا توجد بيانات</div>';
}

/* ─── BOOKINGS TABLE ─── */
function renderBookingsTable(list) {
  const tbody   = document.getElementById('bookingsTable');
  const emptyEl = document.getElementById('bookEmpty');

  if (!list.length) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  tbody.innerHTML = list.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${b.fname} ${b.lname}</strong></td>
      <td dir="ltr">${b.phone || '—'}</td>
      <td>${CLASS_NAMES[b.program] || b.program}</td>
      <td>${b.sessionDate || b.date || '—'}</td>
      <td>
        ${b.paymentStatus === 'paid'
          ? `<span class="pay-paid"><i class="fa-solid fa-circle-check"></i> مدفوع</span>`
          : `<span class="pay-pending"><i class="fa-solid fa-clock"></i> معلق</span>`}
      </td>
      <td><span class="badge ${STATUS_COLORS[b.status] || 'blue'}">${STATUS_LABELS[b.status] || b.status}</span></td>
      <td>
        <div class="action-btns">
         <button class="act-btn view"  onclick="openModal('viewBooking', bookings[${i}])" title="عرض"><i class="fa-solid fa-eye"></i></button>
         <button class="act-btn edit"  onclick="openModal('editBooking', bookings[${i}])" title="تعديل"><i class="fa-solid fa-pen"></i></button>
         <button class="act-btn wa"    onclick="window.open('https://wa.me/2${(b.phone||'').replace(/^0/,'')}','_blank')" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
         <button class="act-btn del" onclick="deleteBooking('${b._key}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function filterBookings() {
  const q       = document.getElementById('bookSearch').value.toLowerCase();
  const cls     = document.getElementById('bookFilter').value;
  const status  = document.getElementById('statusFilter').value;
  const payment = document.getElementById('payFilter').value;

  const filtered = bookings.filter(b => {
    const name = `${b.fname} ${b.lname} ${b.phone}`.toLowerCase();
    if (q && !name.includes(q)) return false;
    if (cls && b.program !== cls) return false;
    if (status && b.status !== status) return false;
    if (payment && b.paymentStatus !== payment) return false;
    return true;
  });
  renderBookingsTable(filtered);
}

async function deleteBooking(key) {
  if (!confirm('هل تريدين حذف هذا الحجز نهائياً؟')) return;
  try {
    await window.fbDeleteBooking(key);
    showToast('تم الحذف بنجاح', 'success', 'fa-trash');
  } catch(e) {
    showToast('فشل الحذف', 'error', 'fa-triangle-exclamation');
  }
}

/* ─── MODALS: BOOKING ─── */
function renderAddBookingModal(title, body, foot) {
  title.textContent = 'إضافة حجز جديد';
  body.innerHTML = `
    <div class="form-row2">
      <div class="form-group"><label>الاسم الأول</label><input id="m-fname" class="form-input" placeholder="نورة"></div>
      <div class="form-group"><label>الاسم الأخير</label><input id="m-lname" class="form-input" placeholder="العتيبي"></div>
    </div>
    <div class="form-row2">
      <div class="form-group"><label>الجوال</label><input id="m-phone" class="form-input" placeholder="01XXXXXXXXX" dir="ltr"></div>
      <div class="form-group"><label>البريد</label><input id="m-email" class="form-input" type="email" placeholder="email@example.com" dir="ltr"></div>
    </div>
    <div class="form-row2">
      <div class="form-group"><label>الكلاس</label>
        <select id="m-program" class="form-input">
          <option value="power">Power Yoga</option>
          <option value="diabetes">Yoga for Diabetes</option>
          <option value="gentle">Gentle Yoga</option>
          <option value="retreats">الريتريتس</option>
        </select>
      </div>
      <div class="form-group"><label>المستوى</label>
        <select id="m-level" class="form-input">
          <option value="beginner">مبتدئة</option>
          <option value="some">بعض الخبرة</option>
          <option value="intermediate">متوسطة</option>
          <option value="advanced">متقدمة</option>
        </select>
      </div>
    </div>
    <div class="form-row2">
      <div class="form-group"><label>الحالة</label>
        <select id="m-status" class="form-input">
          <option value="new">جديد</option>
          <option value="confirmed">مؤكد</option>
          <option value="done">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>
      <div class="form-group"><label>الدفع</label>
        <select id="m-payment" class="form-input">
          <option value="pending">معلق</option>
          <option value="paid">مدفوع</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label>تاريخ الجلسة</label><input id="m-date" type="date" class="form-input"></div>
    <div class="form-group"><label>ملاحظات</label><textarea id="m-notes" class="form-input"></textarea></div>`;
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" onclick="submitAddBooking()"><i class="fa-solid fa-plus"></i> إضافة</button>`;
}

async function submitAddBooking() {
  const data = {
    fname: document.getElementById('m-fname').value.trim(),
    lname: document.getElementById('m-lname').value.trim(),
    phone: document.getElementById('m-phone').value.trim(),
    email: document.getElementById('m-email').value.trim(),
    program: document.getElementById('m-program').value,
    level:   document.getElementById('m-level').value,
    status:  document.getElementById('m-status').value,
    paymentStatus: document.getElementById('m-payment').value,
    sessionDate:   document.getElementById('m-date').value,
    notes:         document.getElementById('m-notes').value.trim(),
    date: new Date().toISOString().slice(0,10),
  };
  if (!data.fname || !data.phone) { alert('يرجى إدخال الاسم والجوال'); return; }
  try {
    await window.fbAddBooking(data);
    closeModal();
    showToast('تم إضافة الحجز بنجاح', 'success', 'fa-circle-check');
  } catch(e) {
    showToast('فشل الإضافة', 'error', 'fa-triangle-exclamation');
  }
}

function renderViewBookingModal(title, body, foot, b) {
  if (!b) return;
  title.textContent = `حجز: ${b.fname} ${b.lname}`;
  body.innerHTML = `
    <div class="metric-list">
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-user"></i>الاسم</span><span class="m-val">${b.fname} ${b.lname}</span></div>
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-phone"></i>الجوال</span><span class="m-val" dir="ltr">${b.phone}</span></div>
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-envelope"></i>البريد</span><span class="m-val" dir="ltr">${b.email || '—'}</span></div>
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-dumbbell"></i>الكلاس</span><span class="m-val">${CLASS_NAMES[b.program] || b.program}</span></div>
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-calendar"></i>تاريخ الجلسة</span><span class="m-val">${b.sessionDate || '—'}</span></div>
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-circle-half-stroke"></i>الحالة</span><span class="m-val"><span class="badge ${STATUS_COLORS[b.status]||'blue'}">${STATUS_LABELS[b.status]||b.status}</span></span></div>
      <div class="metric-item"><span class="m-label"><i class="fa-solid fa-credit-card"></i>الدفع</span><span class="m-val">${b.paymentStatus === 'paid' ? '✅ مدفوع' : '⏳ معلق'}</span></div>
      ${b.notes ? `<div class="metric-item"><span class="m-label"><i class="fa-solid fa-note-sticky"></i>ملاحظات</span><span class="m-val">${b.notes}</span></div>` : ''}
    </div>`;
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
    <a class="btn btn-primary" href="https://wa.me/2${b.phone?.replace(/^0/,'')}" target="_blank"><i class="fa-brands fa-whatsapp"></i> واتساب</a>`;
}

function renderEditBookingModal(title, body, foot, b) {
  if (!b) return;
  title.textContent = `تعديل: ${b.fname} ${b.lname}`;
  body.innerHTML = `
    <div class="form-row2">
      <div class="form-group"><label>الحالة</label>
        <select id="e-status" class="form-input">
          ${['new','confirmed','done','cancelled'].map(s => `<option value="${s}" ${b.status===s?'selected':''}>${STATUS_LABELS[s]}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>الدفع</label>
        <select id="e-payment" class="form-input">
          <option value="pending" ${b.paymentStatus!=='paid'?'selected':''}>معلق</option>
          <option value="paid"    ${b.paymentStatus==='paid'?'selected':''}>مدفوع</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label>مرجع الدفع</label><input id="e-payref" class="form-input" value="${b.paymentRef||''}" placeholder="رقم العملية"></div>
    <div class="form-group"><label>تاريخ الجلسة</label><input id="e-date" type="date" class="form-input" value="${b.sessionDate||''}"></div>`;
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" onclick="submitEditBooking('${b._key}')"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`;
}

async function submitEditBooking(key) {
  const status       = document.getElementById('e-status').value;
  const paymentStatus= document.getElementById('e-payment').value;
  const paymentRef   = document.getElementById('e-payref').value.trim();
  const sessionDate  = document.getElementById('e-date').value;
  try {
    await window.fbUpdateStatus(key, status);
    await window.fbUpdatePayment(key, paymentStatus, paymentRef);
    closeModal();
    showToast('تم التعديل بنجاح', 'success', 'fa-circle-check');
  } catch(e) {
    showToast('فشل التعديل', 'error', 'fa-triangle-exclamation');
  }
}

/* ─── CLASSES ─── */
const defaultClasses = [
  { id:'power',    name:'Power Yoga',        loc:'Royal Hills Clubhouse', schedule:'الأحد والأربعاء — 11 صباحاً', icon:'fa-fire',       color:'green',  prices:['جلسة: 400 ج','4 كلاسات: 1,500','8 كلاسات: 2,800'] },
  { id:'diabetes', name:'Yoga for Diabetes', loc:'Royal Hills',           schedule:'الاثنين والأربعاء — 7:30 م',  icon:'fa-heart-pulse',color:'accent', prices:['جلسة: 400 ج','4 كلاسات: 1,500'] },
  { id:'gentle',   name:'Gentle Yoga',       loc:'Pyramids Heights',      schedule:'سيتم التحديد قريباً',         icon:'fa-leaf',       color:'blue',   prices:['جلسة: 350 ج'] },
];

function renderClasses() {
  const grid = document.getElementById('classesGrid');
  grid.innerHTML = defaultClasses.map(cls => `
    <div class="class-card">
      <div class="cc-top">
        <div class="cc-icon" style="background:rgba(var(--${cls.color}-rgb,61,140,106),.12);color:var(--${cls.color==='green'?'green':cls.color==='blue'?'blue':'accent'})"><i class="fa-solid ${cls.icon}"></i></div>
        <span class="badge green">نشط</span>
      </div>
      <div class="cc-name">${cls.name}</div>
      <div class="cc-loc"><i class="fa-solid fa-location-dot"></i>${cls.loc}</div>
      <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:10px;"><i class="fa-regular fa-calendar" style="margin-left:5px"></i>${cls.schedule}</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${cls.prices.map(p => `<div style="font-size:.8rem;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-tag" style="color:var(--accent);font-size:.7rem"></i>${p}</div>`).join('')}
      </div>
      <div class="cc-row">
        <div class="cc-stat"><div class="val">${bookings.filter(b=>b.program===cls.id).length}</div><div class="lbl">حجز</div></div>
        <div class="cc-stat"><div class="val">${bookings.filter(b=>b.program===cls.id&&b.status==='confirmed').length}</div><div class="lbl">مؤكد</div></div>
        <div class="cc-stat"><div class="val">${bookings.filter(b=>b.program===cls.id&&b.paymentStatus==='paid').length}</div><div class="lbl">مدفوع</div></div>
      </div>
    </div>`).join('');
}

function renderAddClassModal(title, body, foot) {
  title.textContent = 'إضافة كلاس جديد';
  body.innerHTML = `
    <div class="form-group"><label>اسم الكلاس</label><input id="ac-name" class="form-input" placeholder="مثال: Morning Flow"></div>
    <div class="form-group"><label>الموقع</label><input id="ac-loc" class="form-input" placeholder="المكان"></div>
    <div class="form-group"><label>المواعيد</label><input id="ac-sched" class="form-input" placeholder="مثال: الثلاثاء والخميس"></div>
    <div class="form-group"><label>الوصف</label><textarea id="ac-desc" class="form-input"></textarea></div>`;
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" onclick="closeModal();showToast('تم إضافة الكلاس','success','fa-circle-check')"><i class="fa-solid fa-plus"></i> إضافة</button>`;
}

/* ─── RETREATS ─── */
function renderRetreats() {
  const grid = document.getElementById('retreatsGrid');
  const list = window.retreatsData || [];
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-mountain-sun"></i><p>لا توجد ريتريتس بعد — أضيفي أولاً</p></div>';
    return;
  }
  grid.innerHTML = list.map(r => `
    <div class="class-card">
      <div class="cc-top">
        <div class="cc-icon" style="background:rgba(200,149,108,.12);color:var(--accent)"><i class="fa-solid fa-mountain-sun"></i></div>
        <div class="action-btns">
          <button class="act-btn edit" onclick="openModal('editRetreat',window.retreatsData.find(x=>x._key==='${r._key}'))" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="act-btn del"  onclick="deleteRetreat('${r._key}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="cc-name">${r.name||'ريتريت'}</div>
      ${r.location ? `<div class="cc-loc"><i class="fa-solid fa-location-dot"></i>${r.location}</div>` : ''}
      ${r.dateRange ? `<div style="font-size:.78rem;color:var(--text-muted)"><i class="fa-regular fa-calendar" style="margin-left:5px"></i>${r.dateRange}</div>` : ''}
      ${r.price ? `<div style="font-size:.88rem;font-weight:700;color:var(--accent);margin-top:8px">${Number(r.price).toLocaleString('ar-EG')} ج.م</div>` : ''}
      <div class="cc-row">
        <div class="cc-stat"><div class="val">${r.capacity||'—'}</div><div class="lbl">مقعد</div></div>
        <div class="cc-stat"><div class="val">${r.duration||'—'}</div><div class="lbl">المدة</div></div>
      </div>
    </div>`).join('');
}

function renderAddRetreatModal(title, body, foot) {
  title.textContent = 'إضافة ريتريت';
  body.innerHTML = retreatFormHTML({});
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" onclick="submitAddRetreat()"><i class="fa-solid fa-plus"></i> إضافة</button>`;
}

function renderEditRetreatModal(title, body, foot, r) {
  if (!r) return;
  title.textContent = 'تعديل: ' + (r.name||'ريتريت');
  body.innerHTML = retreatFormHTML(r);
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" onclick="submitEditRetreat('${r._key}')"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`;
}

function retreatFormHTML(r) {
  return `
    <div class="form-group"><label>الاسم</label><input id="r-name" class="form-input" value="${r.name||''}"></div>
    <div class="form-group"><label>الوصف</label><textarea id="r-desc" class="form-input">${r.description||''}</textarea></div>
    <div class="form-row2">
      <div class="form-group"><label>الموقع</label><input id="r-loc" class="form-input" value="${r.location||''}"></div>
      <div class="form-group"><label>الفترة</label><input id="r-date" class="form-input" value="${r.dateRange||''}" placeholder="مثال: 10-12 مايو 2025"></div>
    </div>
    <div class="form-row2">
      <div class="form-group"><label>المدة</label><input id="r-dur" class="form-input" value="${r.duration||''}" placeholder="مثال: 3 أيام"></div>
      <div class="form-group"><label>السعة</label><input id="r-cap" class="form-input" type="number" value="${r.capacity||''}"></div>
    </div>
    <div class="form-group"><label>السعر (ج.م)</label><input id="r-price" class="form-input" type="number" value="${r.price||''}"></div>`;
}

function getRetreatFormData() {
  return {
    name:        document.getElementById('r-name').value.trim(),
    description: document.getElementById('r-desc').value.trim(),
    location:    document.getElementById('r-loc').value.trim(),
    dateRange:   document.getElementById('r-date').value.trim(),
    duration:    document.getElementById('r-dur').value.trim(),
    capacity:    document.getElementById('r-cap').value,
    price:       document.getElementById('r-price').value,
  };
}

async function submitAddRetreat() {
  const data = getRetreatFormData();
  if (!data.name) { alert('أدخلي اسم الريتريت'); return; }
  try { await window.fbAddRetreat(data); closeModal(); showToast('تم إضافة الريتريت','success','fa-circle-check'); }
  catch(e) { showToast('فشل الإضافة','error','fa-triangle-exclamation'); }
}

async function submitEditRetreat(key) {
  const data = getRetreatFormData();
  try { await window.fbUpdateRetreat(key, data); closeModal(); showToast('تم التعديل','success','fa-circle-check'); }
  catch(e) { showToast('فشل التعديل','error','fa-triangle-exclamation'); }
}

async function deleteRetreat(key) {
  if (!confirm('حذف هذا الريتريت؟')) return;
  try { await window.fbDeleteRetreat(key); showToast('تم الحذف','success','fa-trash'); }
  catch(e) { showToast('فشل الحذف','error','fa-triangle-exclamation'); }
}

/* ─── STUDENTS ─── */
function renderStudents() {
  const tbody = document.getElementById('studentsTable');
  const credits = window.creditsData || {};

  // Unique students from bookings
  const students = {};
  bookings.forEach(b => {
    const key = b.phone?.replace(/[^0-9]/g,'').slice(-10);
    if (!key) return;
    if (!students[key]) students[key] = { name:`${b.fname} ${b.lname}`, phone:b.phone, classes:new Set(), key };
    students[key].classes.add(CLASS_NAMES[b.program]||b.program);
  });

  const rows = Object.values(students);
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد متدربات</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((s, i) => {
    const cr = credits[s.key] || {};
    const cred = cr.credits !== undefined ? Number(cr.credits) : '—';
    const expiry = cr.expiry || '—';
    const attended = cr.totalAttended || 0;
    const cls = typeof cred === 'number' ? (cred === 0 ? 'red' : cred <= 2 ? 'yellow' : 'green') : '';
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${s.name}</strong></td>
      <td dir="ltr">${s.phone}</td>
      <td>${[...s.classes].join('، ')}</td>
      <td><span style="color:var(--${cls});font-weight:700">${cred}</span></td>
      <td>${expiry}</td>
      <td>${attended}</td>
      <td>
        <div class="action-btns">
          <button class="act-btn credit" onclick="openModal('editCredits',{key:'${s.key}',name:'${s.name}',phone:'${s.phone}'})" title="تعديل الرصيد"><i class="fa-solid fa-coins"></i></button>
          <button class="act-btn wa" onclick="window.open('https://wa.me/2${s.phone?.replace(/^0/,'')}','_blank')" title="واتساب"><i class="fa-brands fa-whatsapp"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterStudents(q) {
  const rows = document.querySelectorAll('#studentsTable tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q.toLowerCase()) ? '' : 'none';
  });
}

function renderEditCreditsModal(title, body, foot, data) {
  if (!data) return;
  const cr = (window.creditsData || {})[data.key] || {};
  title.textContent = `رصيد: ${data.name}`;
  body.innerHTML = `
    <div class="credits-box">
      <div class="cb-head">
        <div><div class="cb-num">${cr.credits !== undefined ? Number(cr.credits) : 0}</div><div class="cb-lbl">حصة متبقية حالياً</div></div>
      </div>
    </div>
    <div class="form-row2">
      <div class="form-group"><label>عدد الحصص الجديد</label><input id="cr-num" type="number" class="form-input" value="${cr.credits||0}" min="0"></div>
      <div class="form-group"><label>تاريخ الانتهاء</label><input id="cr-exp" type="date" class="form-input" value="${cr.expiry||''}"></div>
    </div>
    <div class="instapay-info"><i class="fa-solid fa-circle-info"></i><span>سيتم تحديث الرصيد فوراً وسيظهر للمتدربة في صفحتها الشخصية.</span></div>`;
  foot.innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    <button class="btn btn-primary" onclick="submitEditCredits('${data.phone}')"><i class="fa-solid fa-floppy-disk"></i> حفظ الرصيد</button>`;
}

async function submitEditCredits(phone) {
  const num    = document.getElementById('cr-num').value;
  const expiry = document.getElementById('cr-exp').value;
  if (!expiry) { alert('يرجى تحديد تاريخ الانتهاء'); return; }
  try {
    await window.fbSetCredits(phone, num, expiry);
    closeModal();
    showToast('تم تحديث الرصيد بنجاح','success','fa-circle-check');
  } catch(e) {
    showToast('فشل التحديث','error','fa-triangle-exclamation');
  }
}

/* ─── ATTENDANCE ─── */
async function loadAttendance(dateVal) {
  if (!dateVal) return;
  const date = new Date(dateVal);
  document.getElementById('attendDateLabel').textContent =
    date.toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
   const allData = window.attendanceData || {};
if (!Object.keys(allData).length) {
  setTimeout(() => loadAttendance(dateVal), 800);
  return;
}
   const dayData = allData[dateVal] || {};
  const rows    = Object.values(dayData);

  // stats
  document.getElementById('att1').textContent = rows.length;
  document.getElementById('att2').textContent = rows.filter(r => r.className==='Power Yoga').length;
  document.getElementById('att3').textContent = rows.filter(r => r.className==='Yoga for Diabetes').length;
  document.getElementById('att4').textContent = rows.filter(r => r.className==='Gentle Yoga').length;

  const tbody   = document.getElementById('attendanceTable');
  const emptyEl = document.getElementById('attendEmpty');

  if (!rows.length) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  tbody.innerHTML = rows.map((r, i) => {
    const cr = (window.creditsData || {})[r.phone?.replace(/[^0-9]/g,'').slice(-10)] || {};
    const cred = cr.credits !== undefined ? Number(cr.credits) : '—';
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${r.name||'—'}</strong></td>
      <td dir="ltr">${r.phone||'—'}</td>
      <td>${r.className||'—'}</td>
      <td>${r.time||'—'}</td>
      <td><span style="font-weight:700;color:var(--${typeof cred==='number'&&cred<=2?'yellow':'green'})">${cred}</span></td>
      <td>
        <button class="attend-btn" onclick="window.open('https://wa.me/2${(r.phone||'').replace(/^0/,'')}','_blank')">
          <i class="fa-brands fa-whatsapp"></i> تواصل
        </button>
      </td>
    </tr>`;
  }).join('');
}

/* ─── CHECK-IN LINKS ─── */
function copyCheckinLink(cls) {
  const url = `${location.origin}/Enjy-Flow/checkin.html?class=${cls}`;
  navigator.clipboard.writeText(url).then(() => showToast('تم نسخ الرابط','success','fa-link'));
}

function shareCheckinWA(cls, name) {
  const url = `${location.origin}/Enjy-Flow/checkin.html?class=${cls}`;
  window.open(`https://wa.me/?text=رابط تسجيل الحضور لـ ${name}:%0A${encodeURIComponent(url)}`, '_blank');
}

/* ─── LOCATIONS ─── */
function renderSavedLocations() {
  const locs = window.savedLocations || {};
  ['power','diabetes','gentle'].forEach(cls => {
    const loc = locs[cls];
    const badge = document.getElementById(`locStatus-${cls}`);
    const hint  = document.getElementById(`locHint-${cls}`);
    if (loc) {
      if (badge) { badge.textContent = '✅ محدد'; badge.className = 'badge green'; }
      if (hint)  hint.textContent = `خط العرض: ${loc.lat} | خط الطول: ${loc.lng} | النطاق: ${loc.radius||400}م`;
      const latEl = document.getElementById(`lat-${cls}`);
      const lngEl = document.getElementById(`lng-${cls}`);
      const radEl = document.getElementById(`radius-${cls}`);
      if (latEl) latEl.value = loc.lat;
      if (lngEl) lngEl.value = loc.lng;
      if (radEl) radEl.value = loc.radius || 400;
    } else {
      if (badge) { badge.textContent = 'لم يُحدَّد بعد'; badge.className = 'badge yellow'; }
    }
  });
}

async function saveLocation(cls) {
  const lat    = parseFloat(document.getElementById(`lat-${cls}`).value);
  const lng    = parseFloat(document.getElementById(`lng-${cls}`).value);
  const radius = parseInt(document.getElementById(`radius-${cls}`).value) || 400;
  if (!lat || !lng) { alert('يرجى إدخال خط العرض وخط الطول'); return; }
  try {
    await window.fbSaveLocation(cls, lat, lng, radius);
    showToast('تم حفظ الموقع بنجاح','success','fa-location-dot');
  } catch(e) {
    showToast('فشل الحفظ','error','fa-triangle-exclamation');
  }
}

/* ─── STATS ─── */
function renderStats() {
  const uniquePhones = [...new Set(bookings.map(b => b.phone))].length;
  document.getElementById('st1').textContent = uniquePhones;
  document.getElementById('st2').textContent = bookings.length;
  document.getElementById('st3').textContent = bookings.filter(b => b.status === 'new').length;
  document.getElementById('st4').textContent = bookings.filter(b => b.status === 'confirmed').length;

  const dist = {};
  bookings.forEach(b => { dist[b.program] = (dist[b.program] || 0) + 1; });
  document.getElementById('statsDistList').innerHTML = Object.entries(dist).map(([k, v]) => {
    const pct = Math.round((v / bookings.length) * 100);
    return `
      <div class="metric-item" style="flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="m-label"><i class="fa-solid fa-dumbbell"></i>${CLASS_NAMES[k]||k}</span>
          <span class="m-val">${v} (${pct}%)</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('') || '<div style="text-align:center;padding:16px;color:var(--text-muted)">لا توجد بيانات</div>';
}

/* ─── EXPORT CSV ─── */
function exportCSV() {
  const headers = ['الاسم','الجوال','البريد','الكلاس','تاريخ الجلسة','الدفع','الحالة','ملاحظات'];
  const rows = bookings.map(b => [
    `${b.fname} ${b.lname}`, b.phone, b.email, CLASS_NAMES[b.program]||b.program,
    b.sessionDate||b.date, b.paymentStatus==='paid'?'مدفوع':'معلق',
    STATUS_LABELS[b.status]||b.status, b.notes||''
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `align-bookings-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('تم تصدير البيانات','success','fa-file-export');
}

/* ─── TOAST ─── */
function showToast(msg, type='success', icon='fa-circle-check') {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});
