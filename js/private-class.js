/* =====================================================
   প্রাইভেট ক্লাস মডিউল — v3 (clean)
   Firestore: privateClasses collection
   ===================================================== */
(function(){

/* ---- CSS ---- */
const s = document.createElement('style');
s.textContent = `
.pc-wrap { font-family:'Segoe UI',sans-serif; }
.pc-notice { background:#fff8e1; border-left:4px solid #f39c12; padding:10px 14px; border-radius:0 8px 8px 0; margin-bottom:14px; font-size:13px; color:#7d6608; }
.pc-tab-bar { display:flex; margin-bottom:14px; border-radius:8px; overflow:hidden; border:1px solid #e8d5f5; }
.pc-tab { flex:1; padding:10px; text-align:center; cursor:pointer; font-size:13px; font-weight:600; background:#f9f3ff; color:#7d3c98; border:none; font-family:inherit; }
.pc-tab.active { background:#7d3c98; color:#fff; }
.pc-card { background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.07); margin-bottom:14px; overflow:hidden; border:1px solid #e8d0f0; }
.pc-card-head { background:linear-gradient(135deg,#4a235a,#7d3c98); color:#fff; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; }
.pc-card-head h3 { margin:0; font-size:15px; }
.pc-badge { background:rgba(255,255,255,0.25); border-radius:20px; padding:2px 10px; font-size:12px; font-weight:bold; }
.pc-stu-row { display:flex; align-items:center; padding:10px 14px; border-bottom:1px solid #f0e8f8; gap:10px; }
.pc-stu-row:last-child { border-bottom:none; }
.pc-avatar { width:38px; height:38px; border-radius:50%; background:#e8d5f5; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:bold; color:#7d3c98; flex-shrink:0; }
.pc-stu-info { flex:1; min-width:0; }
.pc-stu-name { font-size:14px; font-weight:600; color:#333; }
.pc-stu-meta { font-size:11px; color:#888; }
.pc-fee-info { text-align:right; font-size:12px; min-width:80px; }
.pc-paid-tag { color:#27ae60; font-weight:bold; }
.pc-due-tag { color:#e74c3c; font-weight:bold; }
.pc-row-btns { display:flex; gap:5px; }
.pc-ic-btn { width:28px; height:28px; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; }
.pc-summary { display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; padding:8px 0; background:#f9f3ff; border-top:1px solid #e8d5f5; }
.pc-sum-cell { padding:4px; border-right:1px solid #e8d5f5; }
.pc-sum-cell:last-child { border-right:none; }
.pc-sum-label { font-size:10px; color:#888; display:block; }
.pc-sum-val { font-size:14px; font-weight:bold; }
.pc-empty { text-align:center; padding:30px; color:#bbb; font-size:13px; }
.pc-empty i { font-size:2rem; display:block; margin-bottom:8px; }
.pc-hist-row { display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f0e8f8; font-size:13px; }
.pc-hist-row:last-child { border-bottom:none; }
/* Modal */
.pc-modal-bg { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9000; display:flex; align-items:center; justify-content:center; padding:15px; }
.pc-modal-box { background:#fff; border-radius:12px; padding:20px; width:100%; max-width:400px; max-height:90vh; overflow-y:auto; }
.pc-modal-box h3 { color:#4a235a; margin:0 0 16px; font-size:16px; border-bottom:2px solid #e8d5f5; padding-bottom:8px; }
.pc-inp { width:100%; padding:9px 12px; border:1px solid #ddd; border-radius:6px; font-size:14px; font-family:inherit; box-sizing:border-box; margin-top:4px; background:#fafafa; }
.pc-inp:focus { border-color:#7d3c98; outline:none; background:#fff; }
.pc-lbl { font-size:13px; font-weight:600; color:#555; display:block; margin-top:12px; }
.pc-lbl:first-child { margin-top:0; }
.pc-btn { padding:9px 18px; border:none; border-radius:6px; font-size:14px; cursor:pointer; font-family:inherit; font-weight:600; }
.pc-btn-primary { background:#7d3c98; color:#fff; }
.pc-btn-secondary { background:#f0e8f8; color:#4a235a; }
.pc-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:16px; border-top:1px solid #eee; padding-top:12px; }
/* Payment months */
.pc-months { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:8px; }
.pc-month-btn { padding:8px 4px; border:1.5px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:12px; font-family:inherit; background:#fafafa; color:#555; font-weight:600; transition:all .15s; }
.pc-month-btn.paid { background:#eafaf1; color:#1e8449; border-color:#a9dfbf; }
.pc-month-btn:active { transform:scale(0.97); }
`;
document.head.appendChild(s);

const MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

/* ---- state ---- */
let _owner   = null;   // { role, uid, name }
let _classes = [];
let _view    = 'classes';
let _containerId = null;

/* ---- helpers ---- */
function db(){ return firebase.firestore(); }

function ownerId(){
    if(!_owner) return 'unknown';
    // uid যদি undefined/null হয় auth uid ব্যবহার করো
    const uid = _owner.uid || (firebase.auth().currentUser && firebase.auth().currentUser.uid) || 'admin';
    return _owner.role + '_' + uid;
}

function nowMonth(){ return MONTHS[new Date().getMonth()]; }

function esc(str){ 
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---- public mount ---- */
window.pcMount = function(tabId){
    const isAdmin   = tabId === 'adminPrivateClass';
    const isTeacher = tabId === 'teacherPrivateClass';
    if(!isAdmin && !isTeacher) return;

    const cid = isAdmin ? 'adminPrivateClassContent' : 'teacherPrivateClassContent';
    _containerId = cid;

    // currentUserData ও currentUserType global variable থেকে নাও
    const role = isAdmin ? 'admin' : 'teacher';
    let uid  = '';
    let name = '';

    try {
        if(typeof currentUserData !== 'undefined' && currentUserData){
            uid  = currentUserData.id || currentUserData.uid || '';
            name = currentUserData.name || '';
        }
        // Admin-এর কোনো Firestore id নেই — Firebase Auth uid ব্যবহার করো
        if(!uid){
            const authUser = firebase.auth().currentUser;
            if(authUser) uid = authUser.uid;
        }
        if(!name && isAdmin) name = 'অ্যাডমিন';
        if(!name && isTeacher) name = 'শিক্ষক';
    } catch(e){}

    const newOId = role + '_' + uid;
    const oldOId = _owner ? (_owner.role + '_' + _owner.uid) : '';
    if(newOId !== oldOId){ _view = 'classes'; _classes = []; }

    _owner = { role, uid: uid || 'unknown', name: name || '' };
    render();
    loadClasses();
};

/* ---- load ---- */
async function loadClasses(){
    const el = document.getElementById(_containerId);
    if(!el) return;
    try {
        const snap = await db().collection('privateClasses')
            .where('ownerId','==', ownerId()).get();
        _classes = snap.docs.map(d=>({id:d.id,...d.data()}));
        _classes.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
        render();
    } catch(e){
        console.error('pc loadClasses:', e);
        const el2 = document.getElementById(_containerId);
        if(el2) el2.innerHTML = `<div class="pc-card"><div class="pc-empty"><i class="fas fa-exclamation-triangle" style="color:#e74c3c"></i><br>লোডে সমস্যা: ${esc(e.message)}</div></div>`;
    }
}

/* ---- render ---- */
function render(){
    const el = document.getElementById(_containerId);
    if(!el) return;
    let h = `<div class="pc-wrap">
      <div class="pc-notice"><i class="fas fa-lock"></i> এই তথ্য শুধু আপনার ব্যক্তিগত। প্রতিষ্ঠানের কোনো রিপোর্টে যুক্ত হবে না।</div>
      <div class="pc-tab-bar">
        <button class="pc-tab ${_view==='classes'?'active':''}" onclick="pcSetView('classes')"><i class="fas fa-chalkboard"></i> ক্লাস তালিকা</button>
        <button class="pc-tab ${_view==='history'?'active':''}" onclick="pcSetView('history')"><i class="fas fa-history"></i> পেমেন্ট ইতিহাস</button>
      </div>`;

    if(_view === 'classes'){
        h += `<div style="text-align:right;margin-bottom:12px;">
          <button class="pc-btn pc-btn-primary" onclick="pcOpenClassModal(null)"><i class="fas fa-plus"></i> নতুন ক্লাস</button></div>`;

        if(_classes.length === 0){
            h += `<div class="pc-card"><div class="pc-empty"><i class="fas fa-chalkboard-teacher"></i><br>কোনো প্রাইভেট ক্লাস নেই।<br><small>উপরের বাটনে ক্লিক করুন।</small></div></div>`;
        }

        _classes.forEach(cls => {
            const stus = Object.entries(cls.students || {});
            const nm = nowMonth();
            let thisIncome=0, totalCollected=0;
            stus.forEach(([,st])=>{
                const pay = st.payments||{};
                const fee = st.monthlyFee||0;
                MONTHS.forEach(m=>{ if(pay[m]==='paid') totalCollected+=fee; });
                if(pay[nm]==='paid') thisIncome+=fee;
            });
            const totalFee = stus.reduce((s,[,st])=>s+(st.monthlyFee||0),0);

            h += `<div class="pc-card">
              <div class="pc-card-head">
                <h3><i class="fas fa-chalkboard"></i> ${esc(cls.name)}</h3>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="pc-badge">${stus.length} জন</span>
                  <button class="pc-ic-btn" style="background:rgba(255,255,255,0.2);color:#fff;" onclick="pcOpenClassModal('${cls.id}')"><i class="fas fa-edit"></i></button>
                  <button class="pc-ic-btn" style="background:rgba(231,76,60,0.7);color:#fff;" onclick="pcDelClass('${cls.id}')"><i class="fas fa-trash"></i></button>
                </div>
              </div>`;
            if(cls.note) h += `<div style="padding:7px 14px;font-size:12px;color:#666;background:#fafafa;border-bottom:1px solid #f0e8f8;"><i class="fas fa-info-circle"></i> ${esc(cls.note)}</div>`;

            stus.forEach(([stId,st])=>{
                const pay = st.payments||{};
                const paid = pay[nm]==='paid';
                h += `<div class="pc-stu-row">
                  <div class="pc-avatar">${(st.name||'?')[0].toUpperCase()}</div>
                  <div class="pc-stu-info">
                    <div class="pc-stu-name">${esc(st.name)}</div>
                    <div class="pc-stu-meta">${esc(st.phone||'')} ${st.address?'• '+esc(st.address):''}</div>
                  </div>
                  <div class="pc-fee-info">
                    <div style="font-weight:bold;color:#4a235a;">${(st.monthlyFee||0).toLocaleString()} ৳</div>
                    <div class="${paid?'pc-paid-tag':'pc-due-tag'}">${paid?'✓ পরিশোধ':'● বকেয়া'}</div>
                  </div>
                  <div class="pc-row-btns">
                    <button class="pc-ic-btn" style="background:#e8d5f5;color:#4a235a;" title="বেতন" onclick="pcOpenPayModal('${cls.id}','${stId}')"><i class="fas fa-money-bill-wave"></i></button>
                    <button class="pc-ic-btn" style="background:#d6eaf8;color:#2980b9;" title="সম্পাদনা" onclick="pcOpenStuModal('${cls.id}','${stId}')"><i class="fas fa-edit"></i></button>
                    <button class="pc-ic-btn" style="background:#fdecea;color:#e74c3c;" title="মুছুন" onclick="pcDelStu('${cls.id}','${stId}')"><i class="fas fa-times"></i></button>
                  </div>
                </div>`;
            });

            if(stus.length===0) h += `<div class="pc-empty" style="padding:14px;"><i class="fas fa-user-plus" style="font-size:1.3rem;"></i> ছাত্র নেই</div>`;

            h += `<div style="text-align:right;padding:7px 14px;border-top:1px dashed #e8d5f5;">
              <button class="pc-btn pc-btn-secondary" style="font-size:12px;padding:5px 12px;" onclick="pcOpenStuModal('${cls.id}')"><i class="fas fa-plus"></i> ছাত্র যোগ</button>
            </div>
            <div class="pc-summary">
              <div class="pc-sum-cell"><span class="pc-sum-label">এই মাসের আয়</span><span class="pc-sum-val" style="color:#27ae60;">${thisIncome.toLocaleString()} ৳</span></div>
              <div class="pc-sum-cell"><span class="pc-sum-label">মোট মাসিক</span><span class="pc-sum-val" style="color:#4a235a;">${totalFee.toLocaleString()} ৳</span></div>
              <div class="pc-sum-cell"><span class="pc-sum-label">মোট সংগ্রহ</span><span class="pc-sum-val" style="color:#2980b9;">${totalCollected.toLocaleString()} ৳</span></div>
            </div>
            </div>`;
        });

    } else {
        // History view — মাসিক সিস্টেম
        const selectedMonth = window._pcHistMonth !== undefined ? window._pcHistMonth : new Date().getMonth();
        const selMonthName  = MONTHS[selectedMonth];

        // মাস সিলেক্টর
        h += `<div style="margin-bottom:14px;">
          <div style="font-size:13px;font-weight:600;color:#4a235a;margin-bottom:8px;"><i class="fas fa-calendar-alt"></i> মাস নির্বাচন করুন:</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">`;
        MONTHS.forEach((m,i)=>{
            const isSel = i===selectedMonth;
            h += `<button onclick="pcSelectHistMonth(${i})" style="padding:7px 4px;border:1.5px solid ${isSel?'#7d3c98':'#ddd'};border-radius:8px;background:${isSel?'#7d3c98':'#f9f3ff'};color:${isSel?'#fff':'#4a235a'};font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">${m}</button>`;
        });
        h += `</div></div>`;

        // ঐ মাসের সব ছাত্রের তথ্য
        let paid=[], due=[], totalPaidAmt=0, totalDueAmt=0;
        _classes.forEach(cls=>{
            Object.entries(cls.students||{}).forEach(([,st])=>{
                const pay = st.payments||{};
                const fee = st.monthlyFee||0;
                if(pay[selMonthName]==='paid'){
                    paid.push({cls:cls.name, stu:st.name, fee, date:pay[selMonthName+'_date']||''});
                    totalPaidAmt += fee;
                } else {
                    due.push({cls:cls.name, stu:st.name, fee});
                    totalDueAmt += fee;
                }
            });
        });

        // সারসংক্ষেপ
        h += `<div class="pc-card" style="margin-bottom:14px;">
          <div class="pc-card-head"><h3><i class="fas fa-chart-pie"></i> ${selMonthName} — সারসংক্ষেপ</h3></div>
          <div class="pc-summary">
            <div class="pc-sum-cell"><span class="pc-sum-label">পরিশোধিত</span><span class="pc-sum-val" style="color:#27ae60;">${paid.length} জন</span></div>
            <div class="pc-sum-cell"><span class="pc-sum-label">বকেয়া</span><span class="pc-sum-val" style="color:#e74c3c;">${due.length} জন</span></div>
            <div class="pc-sum-cell"><span class="pc-sum-label">আয়</span><span class="pc-sum-val" style="color:#2980b9;">${totalPaidAmt.toLocaleString()} ৳</span></div>
          </div>
        </div>`;

        // পরিশোধিত তালিকা
        if(paid.length>0){
            h += `<div class="pc-card" style="margin-bottom:14px;">
              <div style="background:#eafaf1;padding:8px 14px;font-weight:600;font-size:13px;color:#1e8449;border-bottom:1px solid #a9dfbf;">
                <i class="fas fa-check-circle"></i> পরিশোধিত (${paid.length} জন) — ${totalPaidAmt.toLocaleString()} ৳
              </div>`;
            paid.forEach(r=>{
                h += `<div class="pc-hist-row">
                  <div>
                    <div style="font-weight:600;">${esc(r.stu)} <span style="color:#999;font-weight:normal;font-size:12px;">— ${esc(r.cls)}</span></div>
                    ${r.date?`<div style="font-size:11px;color:#888;"><i class="fas fa-calendar-check"></i> ${r.date}</div>`:''}
                  </div>
                  <div style="font-weight:bold;color:#27ae60;font-size:14px;">${r.fee.toLocaleString()} ৳</div>
                </div>`;
            });
            h += `</div>`;
        }

        // বকেয়া তালিকা
        if(due.length>0){
            h += `<div class="pc-card">
              <div style="background:#fdecea;padding:8px 14px;font-weight:600;font-size:13px;color:#c0392b;border-bottom:1px solid #f5b7b1;">
                <i class="fas fa-exclamation-circle"></i> বকেয়া (${due.length} জন) — ${totalDueAmt.toLocaleString()} ৳
              </div>`;
            due.forEach(r=>{
                h += `<div class="pc-hist-row">
                  <div>
                    <div style="font-weight:600;">${esc(r.stu)} <span style="color:#999;font-weight:normal;font-size:12px;">— ${esc(r.cls)}</span></div>
                  </div>
                  <div style="font-weight:bold;color:#e74c3c;font-size:14px;">${r.fee.toLocaleString()} ৳</div>
                </div>`;
            });
            h += `</div>`;
        }

        if(paid.length===0 && due.length===0){
            h += `<div class="pc-card"><div class="pc-empty"><i class="fas fa-users"></i><br>এই মাসে কোনো ছাত্র নেই।</div></div>`;
        }
    }

    h += `</div>`;
    el.innerHTML = h;
}

/* ---- global view switch ---- */
window.pcSetView = function(v){ _view=v; render(); };

/* ---- Class modal ---- */
window.pcOpenClassModal = function(classId){
    const cls = classId ? _classes.find(c=>c.id===classId) : null;
    const box = document.createElement('div');
    box.className = 'pc-modal-bg'; box.id = 'pcClassModal';
    box.innerHTML = `<div class="pc-modal-box">
      <h3>${cls?'ক্লাস সম্পাদনা':'নতুন প্রাইভেট ক্লাস'}</h3>
      <label class="pc-lbl">ক্লাসের নাম *</label>
      <input class="pc-inp" id="pcCName" value="${cls?esc(cls.name):''}">
      <label class="pc-lbl">নোট (ঐচ্ছিক)</label>
      <input class="pc-inp" id="pcCNote" placeholder="যেমন: সন্ধ্যার ব্যাচ" value="${cls?esc(cls.note||''):''}">
      <div class="pc-modal-actions">
        <button class="pc-btn pc-btn-secondary" onclick="pcCloseModal('pcClassModal')">বাতিল</button>
        <button class="pc-btn pc-btn-primary" id="pcCSaveBtn" onclick="pcSaveClass('${classId||''}')">সংরক্ষণ</button>
      </div>
    </div>`;
    document.body.appendChild(box);
    document.getElementById('pcCName').focus();
};

window.pcSaveClass = async function(classId){
    const name = (document.getElementById('pcCName').value||'').trim();
    const note = (document.getElementById('pcCNote').value||'').trim();
    if(!name){ alert('ক্লাসের নাম লিখুন।'); return; }
    const btn = document.getElementById('pcCSaveBtn');
    if(btn){ btn.disabled=true; btn.textContent='...'; }
    try {
        const mid = (typeof currentMadrasaId!=='undefined' && currentMadrasaId) ? currentMadrasaId : '';
        const oId = ownerId();
        const oName = (_owner&&_owner.name) ? _owner.name : '';
        // সব field-এ শুধু string/number — undefined নয়
        const data = {
            ownerId:   String(oId),
            ownerName: String(oName),
            madrasaId: String(mid),
            name:      String(name),
            note:      String(note),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if(classId){
            await db().collection('privateClasses').doc(classId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            data.students  = {};
            await db().collection('privateClasses').add(data);
        }
        pcCloseModal('pcClassModal');
        await loadClasses();
    } catch(e){
        console.error('pcSaveClass:', e);
        alert('সমস্যা হয়েছে: ' + (e.message||e.code||e));
        if(btn){ btn.disabled=false; btn.textContent='সংরক্ষণ'; }
    }
};

window.pcDelClass = async function(id){
    if(!confirm('এই ক্লাস মুছবেন?')) return;
    try { await db().collection('privateClasses').doc(id).delete(); await loadClasses(); }
    catch(e){ alert('মুছতে সমস্যা: '+e.message); }
};

/* ---- Student modal ---- */
window.pcOpenStuModal = function(classId, stId){
    const cls = _classes.find(c=>c.id===classId);
    const st  = stId && cls ? (cls.students||{})[stId] : null;
    const isEdit = !!st;
    const box = document.createElement('div');
    box.className = 'pc-modal-bg'; box.id = 'pcStuModal';
    box.innerHTML = `<div class="pc-modal-box">
      <h3>${isEdit ? 'ছাত্র সম্পাদনা' : 'ছাত্র যোগ'} — ${esc(cls?cls.name:'')}</h3>
      <label class="pc-lbl">ছাত্রের নাম *</label>
      <input class="pc-inp" id="pcSName" value="${isEdit?esc(st.name||''):''}">
      <label class="pc-lbl">মোবাইল</label>
      <input class="pc-inp" id="pcSPhone" type="tel" placeholder="01XXXXXXXXX" value="${isEdit?esc(st.phone||''):''}">
      <label class="pc-lbl">ঠিকানা</label>
      <input class="pc-inp" id="pcSAddr" value="${isEdit?esc(st.address||''):''}">
      <label class="pc-lbl">মাসিক বেতন (টাকা) *</label>
      <input class="pc-inp" id="pcSFee" type="number" min="0" value="${isEdit?(st.monthlyFee||''):''}">
      <div class="pc-modal-actions">
        <button class="pc-btn pc-btn-secondary" onclick="pcCloseModal('pcStuModal')">বাতিল</button>
        <button class="pc-btn pc-btn-primary" id="pcSSaveBtn" onclick="pcSaveStu('${classId}','${stId||''}')">সংরক্ষণ</button>
      </div>
    </div>`;
    document.body.appendChild(box);
    document.getElementById('pcSName').focus();
};

window.pcSaveStu = async function(classId, stId){
    const name = (document.getElementById('pcSName').value||'').trim();
    const phone= (document.getElementById('pcSPhone').value||'').trim();
    const addr = (document.getElementById('pcSAddr').value||'').trim();
    const fee  = parseFloat(document.getElementById('pcSFee').value)||0;
    if(!name){ alert('নাম দিন।'); return; }
    if(!fee)  { alert('মাসিক বেতন দিন।'); return; }
    const btn = document.getElementById('pcSSaveBtn');
    if(btn){ btn.disabled=true; btn.textContent='...'; }
    try {
        const cls = _classes.find(c=>c.id===classId);
        const existing = (cls&&cls.students) ? {...cls.students} : {};
        const isEdit = stId && existing[stId];
        const key = isEdit ? stId : ('st_'+Date.now());
        const oldPayments = isEdit ? (existing[stId].payments||{}) : {};
        existing[key] = { name:String(name), phone:String(phone), address:String(addr), monthlyFee:fee, payments:oldPayments };
        await db().collection('privateClasses').doc(classId).update({ students: existing });
        pcCloseModal('pcStuModal');
        await loadClasses();
    } catch(e){
        console.error('pcSaveStu:', e);
        alert('সমস্যা: '+(e.message||e.code||e));
        if(btn){ btn.disabled=false; btn.textContent='সংরক্ষণ'; }
    }
};

window.pcDelStu = async function(classId, stId){
    if(!confirm('এই ছাত্রকে মুছবেন?')) return;
    try {
        const cls = _classes.find(c=>c.id===classId);
        const stus = {...(cls.students||{})};
        delete stus[stId];
        await db().collection('privateClasses').doc(classId).update({students:stus});
        await loadClasses();
    } catch(e){ alert('মুছতে সমস্যা: '+e.message); }
};

/* ---- Payment modal ---- */
window.pcOpenPayModal = function(classId, stId){
    const cls = _classes.find(c=>c.id===classId);
    const st  = cls&&cls.students ? cls.students[stId] : null;
    if(!st) return;
    const pay = st.payments||{};
    const box = document.createElement('div');
    box.className = 'pc-modal-bg'; box.id = 'pcPayModal';
    let mHTML = '<div class="pc-months">';
    MONTHS.forEach(m=>{
        const paid = pay[m]==='paid';
        mHTML += `<button class="pc-month-btn ${paid?'paid':''}" id="pcPM_${m}" onclick="pcTogglePay('${classId}','${stId}','${m}')">
          ${m}<br><small>${paid?'✓':'○'}</small></button>`;
    });
    mHTML += '</div>';
    box.innerHTML = `<div class="pc-modal-box">
      <h3><i class="fas fa-money-bill-wave"></i> বেতন পরিচালনা</h3>
      <div style="background:#f9f3ff;border-radius:8px;padding:10px 14px;margin-bottom:12px;">
        <div style="font-weight:bold;">${esc(st.name)}</div>
        <div style="font-size:12px;color:#777;">${esc(cls.name)} • ${(st.monthlyFee||0).toLocaleString()} ৳/মাস</div>
      </div>
      <div style="font-size:13px;font-weight:600;color:#4a235a;margin-bottom:8px;">মাসে ক্লিক করে পরিশোধ/বকেয়া সেট করুন:</div>
      ${mHTML}
      <div class="pc-modal-actions">
        <button class="pc-btn pc-btn-primary" onclick="pcCloseModal('pcPayModal'); pcMount(document.querySelector('[id$=PrivateClass].tab-content.active') ? document.querySelector('[id$=PrivateClass].tab-content.active').id : '${_owner&&_owner.role==='admin'?'adminPrivateClass':'teacherPrivateClass'}')">সম্পন্ন</button>
      </div>
    </div>`;
    document.body.appendChild(box);
};

window.pcTogglePay = async function(classId, stId, month){
    const cls = _classes.find(c=>c.id===classId);
    if(!cls) return;
    const st  = (cls.students||{})[stId];
    if(!st) return;
    const pay = {...(st.payments||{})};
    const wasPaid = pay[month]==='paid';
    if(wasPaid){ delete pay[month]; delete pay[month+'_date']; }
    else { pay[month]='paid'; pay[month+'_date']=new Date().toLocaleDateString('bn-BD'); }
    // UI তাৎক্ষণিক আপডেট
    const btn = document.getElementById('pcPM_'+month);
    if(btn){
        btn.classList.toggle('paid', !wasPaid);
        btn.innerHTML = month+'<br><small>'+(!wasPaid?'✓':'○')+'</small>';
    }
    // local update
    const ci = _classes.findIndex(c=>c.id===classId);
    if(ci>=0){ _classes[ci].students[stId] = {...st, payments:pay}; }
    try {
        const stus = {...cls.students, [stId]:{...st, payments:pay}};
        await db().collection('privateClasses').doc(classId).update({students:stus});
    } catch(e){ console.error('pcTogglePay:', e); }
};

window.pcSelectHistMonth = function(idx){
    window._pcHistMonth = idx;
    _view = 'history';
    render();
};

window.pcCloseModal = function(id){
    const el = document.getElementById(id);
    if(el) el.remove();
};

})(); // end IIFE
