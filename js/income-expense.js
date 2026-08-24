//  মাদ্রাসার আয়-ব্যয় হিসাব — Firestore + প্রিন্ট সিস্টেম
// ============================================================
const ieBnMonths     = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
const ieBnMonthsFull = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const ieDefaultCats = {
    expense: ["শিক্ষকদের বেতন","বিদ্যুৎ বিল","পানির বিল","ভবন মেরামত","আসবাবপত্র","শিক্ষা উপকরণ","পরিষ্কার সামগ্রী","যাতায়াত","খাদ্য ও পানীয়","অন্যান্য খরচ"],
    income: ["ছাত্র বেতন","ভর্তি ফি","পরীক্ষা ফি","দান ও অনুদান","সরকারি অনুদান","সম্পদ বিক্রয়","অন্যান্য আয়"]
};

// IE মডিউলের নিজস্ব স্টেট
let ieFilter       = 'monthly';
let ieDateRef      = new Date();
let ieCurrentView  = 'list';
let ieChartType    = 'expense';
let ieEditingDocId = null;
let ieCatsCache    = { expense: [...ieDefaultCats.expense], income: [...ieDefaultCats.income] };
let ieTxnsCache    = [];  // বর্তমান রেঞ্জের লেনদেন ক্যাশ

// ===== ফান্ড সিস্টেম =====
const IE_DEFAULT_FUNDS = [
    { id: 'general', name: 'জেনারেল ফান্ড', color: '#1a5e1a', icon: 'fa-wallet' },
    { id: 'goraba',  name: 'গোরাবা ফান্ড',  color: '#1565C0', icon: 'fa-hand-holding-heart' },
];
let ieFundsCache   = [];   // ফান্ড তালিকা
let ieActiveFundId = null; // বর্তমান নির্বাচিত ফান্ড ID

// ফান্ড লোড
async function ieLoadFunds() {
    if (!currentMadrasaId) return;
    try {
        // orderBy বাদ — Firestore composite index এর ঝামেলা এড়াতে; JS দিয়ে sort
        const snap = await db.collection('ie_funds')
            .where('madrasaId', '==', currentMadrasaId)
            .get();
        if (!snap.empty) {
            ieFundsCache = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        } else {
            // প্রথমবার ডিফল্ট ফান্ড তৈরি
            ieFundsCache = [];
            for (const f of IE_DEFAULT_FUNDS) {
                const createdAt = new Date().toISOString();
                const ref = await db.collection('ie_funds').add({
                    madrasaId: currentMadrasaId,
                    name: f.name, color: f.color, icon: f.icon, createdAt
                });
                ieFundsCache.push({ id: ref.id, madrasaId: currentMadrasaId, name: f.name, color: f.color, icon: f.icon, createdAt });
            }
        }
        if (!ieActiveFundId && ieFundsCache.length > 0) {
            ieActiveFundId = ieFundsCache[0].id;
        }
        ieRenderFundTabs();
    } catch(e) {
        console.error('Fund load error:', e);
        alert('ফান্ড লোড করতে সমস্যা: ' + e.message);
    }
}

// ফান্ড ট্যাব রেন্ডার
function ieRenderFundTabs() {
    const container = document.getElementById('ieFundTabs');
    if (!container) return;
    if (!ieFundsCache.length) {
        container.innerHTML = '<div style="color:#aaa;font-size:0.85rem;padding:6px;">কোনো ফান্ড নেই। "ফান্ড পরিচালনা" থেকে যোগ করুন।</div>';
        return;
    }
    container.innerHTML = ieFundsCache.map(f => {
        const isActive = f.id === ieActiveFundId;
        const bg   = isActive ? (f.color || 'var(--primary)') : '#f0f4f8';
        const col  = isActive ? 'white' : '#444';
        const border = isActive ? `2px solid ${f.color || 'var(--primary)'}` : '2px solid transparent';
        return `<button onclick="ieSelectFund('${f.id}')" style="
            background:${bg}; color:${col}; border:${border};
            border-radius:20px; padding:6px 16px; font-size:0.88rem;
            cursor:pointer; font-family:inherit; white-space:nowrap;
            font-weight:bold; transition:0.2s; box-shadow:${isActive?'0 2px 6px rgba(0,0,0,0.15)':'none'};
        "><i class="fas ${f.icon||'fa-wallet'}"></i> ${f.name}</button>`;
    }).join('');
}

// ফান্ড সিলেক্ট
async function ieSelectFund(fundId) {
    ieActiveFundId = fundId;
    ieAllTxnsCache = null;
    ieAllTxnsCacheFundId = null;
    ieRenderFundTabs();
    await ieLoadCategories();
    await ieRenderUI();
}

// ফান্ড পরিচালনা মডাল খোলা
function ieOpenFundModal() {
    ieRenderFundList();
    showModal('ieFundModal');
}

// ফান্ড তালিকা রেন্ডার
function ieRenderFundList() {
    const ul = document.getElementById('ieFundList');
    if (!ieFundsCache.length) {
        ul.innerHTML = '<li style="text-align:center;padding:15px;color:#999;">কোনো ফান্ড নেই</li>';
        return;
    }
    ul.innerHTML = ieFundsCache.map((f, i) => `
        <li class="ie-manage-item" style="border-left:4px solid ${f.color||'var(--primary)'}; padding-left:12px;">
            <span><i class="fas ${f.icon||'fa-wallet'}" style="color:${f.color||'var(--primary)'};margin-right:6px;"></i><b>${f.name}</b></span>
            <div style="display:flex;gap:10px;align-items:center;">
                <i class="fas fa-edit" style="color:var(--info);cursor:pointer;" onclick="ieEditFund('${f.id}',${i})"></i>
                ${ieFundsCache.length > 1 ? `<i class="fas fa-trash" style="color:var(--danger);cursor:pointer;" onclick="ieDeleteFund('${f.id}',${i})"></i>` : ''}
            </div>
        </li>`).join('');
}

// ফান্ড যোগ করা
async function ieAddFund() {
    const name = document.getElementById('ieNewFundName').value.trim();
    if (!name) return;
    if (ieFundsCache.find(f => f.name === name)) { alert('এই নামের ফান্ড ইতিমধ্যে আছে।'); return; }
    const colors = ['#1a5e1a','#1565C0','#6A1B9A','#E65100','#00695C','#4E342E','#37474F'];
    const icons  = ['fa-wallet','fa-hand-holding-heart','fa-piggy-bank','fa-coins','fa-landmark','fa-donate','fa-money-bill'];
    const idx    = ieFundsCache.length % colors.length;
    try {
        const createdAt = new Date().toISOString();
        const ref = await db.collection('ie_funds').add({
            madrasaId: currentMadrasaId,
            name, color: colors[idx], icon: icons[idx], createdAt
        });
        ieFundsCache.push({ id: ref.id, madrasaId: currentMadrasaId, name, color: colors[idx], icon: icons[idx], createdAt });
        document.getElementById('ieNewFundName').value = '';
        ieRenderFundList();
        ieRenderFundTabs();
    } catch(e) { console.error(e); alert('ফান্ড যোগ করতে সমস্যা: ' + e.message); }
}

// ফান্ড নাম সম্পাদনা
async function ieEditFund(fundId, idx) {
    const f = ieFundsCache[idx];
    const newName = prompt('ফান্ডের নতুন নাম:', f.name);
    if (!newName || !newName.trim() || newName === f.name) return;
    try {
        await db.collection('ie_funds').doc(fundId).update({ name: newName.trim() });
        ieFundsCache[idx].name = newName.trim();
        ieRenderFundList();
        ieRenderFundTabs();
    } catch(e) { alert('আপডেট করতে সমস্যা: ' + e.message); }
}

// ফান্ড মুছে ফেলা
async function ieDeleteFund(fundId, idx) {
    if (!confirm('এই ফান্ড মুছলে এর সব লেনদেন ও ক্যাটাগরিও মুছে যাবে। নিশ্চিত?')) return;
    try {
        const batch = db.batch();
        // ১. লেনদেন মুছো
        const txnSnap = await db.collection('ie_transactions')
            .where('madrasaId','==',currentMadrasaId)
            .where('fundId','==',fundId).get();
        txnSnap.docs.forEach(d => batch.delete(d.ref));
        // ২. ক্যাটাগরি মুছো
        const catSnap = await db.collection('ie_categories')
            .where('madrasaId','==',currentMadrasaId)
            .where('fundId','==',fundId).get();
        catSnap.docs.forEach(d => batch.delete(d.ref));
        // ৩. ফান্ড নিজে মুছো
        batch.delete(db.collection('ie_funds').doc(fundId));
        await batch.commit();

        ieFundsCache.splice(idx, 1);
        if (ieActiveFundId === fundId) {
            ieActiveFundId = ieFundsCache.length > 0 ? ieFundsCache[0].id : null;
        }
        ieAllTxnsCache = null;
        ieAllTxnsCacheFundId = null;
        ieRenderFundList();
        ieRenderFundTabs();
        if (ieActiveFundId) {
            await ieLoadCategories();
            await ieRenderUI();
        }
    } catch(e) { console.error(e); alert('মুছতে সমস্যা: ' + e.message); }
}
// ===== ফান্ড সিস্টেম শেষ =====

// --- ১. Firestore কুয়েরি হেল্পার ---

async function ieLoadCategories() {
    if (!currentMadrasaId || !ieActiveFundId) return;
    const fundId = ieActiveFundId;
    try {
        // এই ফান্ডের ক্যাটাগরি আছে কিনা দেখো
        const snap = await db.collection('ie_categories')
            .where('madrasaId', '==', currentMadrasaId)
            .where('fundId', '==', fundId)
            .limit(1).get();

        if (!snap.empty) {
            // পাওয়া গেছে — লোড করো
            const d = snap.docs[0].data();
            ieCatsCache = {
                expense: d.expense || [...ieDefaultCats.expense],
                income:  d.income  || [...ieDefaultCats.income]
            };
        } else {
            // নেই — সব ক্যাটাগরি ডকুমেন্ট দেখো (পুরনো ফরম্যাট মাইগ্রেশনের জন্য)
            const allCatSnap = await db.collection('ie_categories')
                .where('madrasaId', '==', currentMadrasaId)
                .get();

            // পুরনো ডকুমেন্ট খোঁজো (fundId নেই)
            const oldDoc = allCatSnap.docs.find(d => !d.data().fundId);
            // এই ফান্ডটি কি প্রথম ফান্ড?
            const isFirstFund = ieFundsCache.length > 0 && ieFundsCache[0].id === fundId;

            if (oldDoc && isFirstFund) {
                // পুরনো ডেটা প্রথম ফান্ডে মাইগ্রেট করো
                const d = oldDoc.data();
                ieCatsCache = { expense: d.expense || [...ieDefaultCats.expense], income: d.income || [...ieDefaultCats.income] };
                await oldDoc.ref.update({ fundId });
            } else {
                // নতুন ফান্ড — ডিফল্ট ক্যাটাগরি দিয়ে তৈরি করো
                ieCatsCache = { expense: [...ieDefaultCats.expense], income: [...ieDefaultCats.income] };
                await db.collection('ie_categories').add({
                    madrasaId: currentMadrasaId, fundId,
                    expense: ieDefaultCats.expense,
                    income:  ieDefaultCats.income
                });
            }
        }
    } catch(e) { console.error('IE cats load:', e); }
}

async function ieSaveCategories() {
    if (!currentMadrasaId || !ieActiveFundId) return;
    const fundId = ieActiveFundId;
    try {
        const snap = await db.collection('ie_categories')
            .where('madrasaId', '==', currentMadrasaId)
            .where('fundId', '==', fundId)
            .limit(1).get();
        const data = { madrasaId: currentMadrasaId, fundId, expense: ieCatsCache.expense, income: ieCatsCache.income };
        if (!snap.empty) await snap.docs[0].ref.update(data);
        else await db.collection('ie_categories').add(data);
    } catch(e) { console.error('IE cats save:', e); alert('ক্যাটাগরি সেভ ব্যর্থ!'); }
}

// সব transaction একবারেই load করা হয় — Firestore composite index এর ঝামেলা নেই
let ieAllTxnsCache = null; // session cache
let ieAllTxnsCacheFundId = null; // কোন ফান্ডের ক্যাশ

async function ieGetAllTxns(forceRefresh = false) {
    const currentFundId = ieActiveFundId;
    if (!currentFundId || !currentMadrasaId) return [];
    if (ieAllTxnsCache && !forceRefresh && ieAllTxnsCacheFundId === currentFundId) return ieAllTxnsCache;
    try {
        const allSnap = await db.collection('ie_transactions')
            .where('madrasaId', '==', currentMadrasaId)
            .get();
        const allDocs = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // পুরনো ডেটা (fundId নেই) → প্রথম ফান্ডে ধরা হবে
        const firstFundId = ieFundsCache.length > 0 ? ieFundsCache[0].id : currentFundId;
        ieAllTxnsCache = allDocs.filter(d => {
            const docFund = d.fundId || firstFundId;
            return docFund === currentFundId;
        });
        ieAllTxnsCacheFundId = currentFundId;
        return ieAllTxnsCache;
    } catch(e) {
        console.error('IE txn load error:', e);
        alert('লেনদেন লোড করতে সমস্যা: ' + e.message);
        return [];
    }
}

async function ieLoadTransactions(start, end) {
    const all = await ieGetAllTxns();
    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];
    return all
        .filter(t => t.date >= startStr && t.date <= endStr)
        .sort((a, b) => (a.date > b.date ? -1 : 1)); // নতুন তারিখ আগে
}

async function ieLoadAllTransactions() {
    return await ieGetAllTxns();
}

// --- ২. তারিখ রেঞ্জ ---

function ieGetRange() {
    const d = new Date(ieDateRef);
    let start = new Date(d), end = new Date(d), label = '';
    start.setHours(0,0,0,0); end.setHours(23,59,59,999);
    if (ieFilter === 'monthly') {
        start.setDate(1);
        end = new Date(start.getFullYear(), start.getMonth()+1, 0, 23,59,59,999);
        label = `${ieBnMonthsFull[start.getMonth()]} ${toBengaliNumber(start.getFullYear())}`;
    } else if (ieFilter === 'yearly') {
        start = new Date(d.getFullYear(), 0, 1);
        end   = new Date(d.getFullYear(), 11, 31, 23,59,59,999);
        label = `${toBengaliNumber(d.getFullYear())} সাল`;
    } else {
        start = new Date(2000,0,1); end = new Date(2099,11,31);
        label = 'সকল সময়ের হিসাব';
    }
    return { start, end, label };
}

// --- ৩. মেইন রেন্ডার ---

async function ieRenderUI() {
    // active চেক বাদ — যেকোনো সময় call করা যাবে
    const sec = document.getElementById('incomeExpenseSection');
    if (!sec) return;

    const range = ieGetRange();
    const activeFund = ieFundsCache.find(f => f.id === ieActiveFundId);
    const fundLabel  = activeFund ? ` — ${activeFund.name}` : '';
    document.getElementById('ieDateRangeText').innerText = range.label + fundLabel;

    // লোডিং
    document.getElementById('ieTransactionList').innerHTML = '<div class="ie-empty-state"><i class="fas fa-spinner fa-spin"></i>লোড হচ্ছে...</div>';

    // পিরিয়ডের লেনদেন
    const txns = await ieLoadTransactions(range.start, range.end);
    ieTxnsCache = txns;

    // পূর্বের স্থিতি (range.start এর আগের সব)
    const allTxns = await ieLoadAllTransactions();
    const prevTxns = allTxns.filter(t => t.date < range.start.toISOString().split('T')[0]);
    const prevInc = prevTxns.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const prevExp = prevTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const prevBal = prevInc - prevExp;

    const inc = txns.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const exp = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const pBal   = inc - exp;
    const totBal = prevBal + pBal;

    document.getElementById('iePeriodIncome').innerText   = toBengaliNumber(inc)    + ' ৳';
    document.getElementById('iePeriodExpense').innerText  = toBengaliNumber(exp)    + ' ৳';
    document.getElementById('iePrevBalance').innerText    = toBengaliNumber(prevBal) + ' ৳';
    document.getElementById('iePrevBalance').style.color  = prevBal < 0 ? '#C62828' : '#2E7D32';

    const pBalEl = document.getElementById('iePeriodBalance');
    pBalEl.innerText = toBengaliNumber(pBal) + ' ৳';
    pBalEl.style.color = pBal < 0 ? '#C62828' : pBal > 0 ? '#2E7D32' : '#333';

    const totEl = document.getElementById('ieTotalBalance');
    totEl.innerText = toBengaliNumber(totBal) + ' ৳';
    totEl.style.color = totBal < 0 ? '#C62828' : totBal > 0 ? '#2E7D32' : '#333';

    if (ieCurrentView === 'list')     ieRenderList(txns);
    else if (ieCurrentView === 'category') ieRenderCategory(txns);
    else                              ieRenderReport(range, txns, allTxns);
}

// --- ৪. লিস্ট ভিউ ---

function ieRenderList(txns) {
    const el = document.getElementById('ieTransactionList');
    if (!txns.length) {
        el.innerHTML = '<div class="ie-empty-state"><i class="fas fa-receipt"></i><div>কোনো লেনদেন নেই</div><small>নিচের বাটন দিয়ে আয় বা ব্যয় যোগ করুন</small></div>';
        return;
    }
    el.innerHTML = '';
    txns.forEach(t => {
        const d = new Date(t.date + 'T00:00:00');
        const li = document.createElement('li');
        li.className = 'ie-t-item';
        li.onclick = () => ieOpenEdit(t);
        li.innerHTML = `
            <div class="ie-t-date-box">
                <span class="ie-t-date-day">${toBengaliNumber(d.getDate())}</span>
                <span class="ie-t-date-month">${ieBnMonths[d.getMonth()]}</span>
            </div>
            <div class="ie-t-mid">
                <div class="ie-t-cat">${t.category}</div>
                <div class="ie-t-note">${t.note || 'নোট নেই'}</div>
            </div>
            <div class="ie-t-right">
                <span class="ie-t-amount" style="color:${t.type==='income'?'#2E7D32':'#C62828'}">${t.type==='income'?'+':'-'}${toBengaliNumber(t.amount)} ৳</span>
                <span class="ie-t-badge">${t.method||''}</span>
            </div>`;
        el.appendChild(li);
    });
}

// --- ৫. ক্যাটাগরি ভিউ ---

function ieRenderCategory(txns) {
    const el = document.getElementById('ieCategoryTable');
    const filtered = txns.filter(t => t.type === ieChartType);
    const total = filtered.reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const catMap = {};
    filtered.forEach(t => { catMap[t.category] = (catMap[t.category]||0)+parseFloat(t.amount||0); });
    const sorted = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
    if (!sorted.length) { el.innerHTML = '<div class="ie-empty-state"><i class="fas fa-chart-bar"></i><div>কোনো তথ্য নেই</div></div>'; return; }
    const color = ieChartType === 'income' ? '#2E7D32' : '#C62828';
    el.innerHTML = sorted.map(([cat,amt]) => {
        const pct = total > 0 ? ((amt/total)*100).toFixed(1) : 0;
        return `<div onclick="ieShowCatDetail('${cat.replace(/'/g,"\\'")}','${ieChartType}')" style="padding:12px 15px; border-bottom:1px solid #eee; cursor:pointer;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:600;">${cat}</span>
                <span style="font-weight:bold; color:${color};">${toBengaliNumber(amt)} ৳</span>
            </div>
            <div style="height:5px; background:#eee; border-radius:3px;">
                <div style="width:${pct}%; height:100%; background:${color}; border-radius:3px;"></div>
            </div>
            <div style="font-size:0.78rem; color:#999; margin-top:3px;">${toBengaliNumber(pct)}% · ${toBengaliNumber(filtered.filter(t=>t.category===cat).length)} টি লেনদেন</div>
        </div>`;
    }).join('');
}

// --- ৬. সারাংশ রিপোর্ট ---

function ieRenderReport(range, txns, allTxns) {
    const tbody = document.getElementById('ieReportBody');
    let rows = [], tInc = 0, tExp = 0;

    if (ieFilter === 'yearly') {
        document.getElementById('ieReportColDate').innerText = 'মাস';
        for (let m=0; m<12; m++) {
            const mT = txns.filter(t => new Date(t.date+'T00:00:00').getMonth()===m);
            const mI = mT.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
            const mE = mT.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
            tInc+=mI; tExp+=mE;
            if (mI||mE) rows.push(`<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px 12px;">${ieBnMonthsFull[m]}</td>
                <td style="padding:10px 8px;text-align:right;color:#2E7D32;">${toBengaliNumber(mI)}</td>
                <td style="padding:10px 8px;text-align:right;color:#C62828;">${toBengaliNumber(mE)}</td>
                <td style="padding:10px 8px;text-align:right;font-weight:bold;color:${(mI-mE)<0?'#C62828':'#2E7D32'};">${toBengaliNumber(mI-mE)}</td>
            </tr>`);
        }
    } else if (ieFilter === 'monthly') {
        document.getElementById('ieReportColDate').innerText = 'তারিখ';
        const days = {};
        txns.forEach(t => { if(!days[t.date])days[t.date]={i:0,e:0}; if(t.type==='income')days[t.date].i+=parseFloat(t.amount||0); else days[t.date].e+=parseFloat(t.amount||0); });
        Object.entries(days).sort((a,b)=>a[0]>b[0]?1:-1).forEach(([date,v]) => {
            tInc+=v.i; tExp+=v.e;
            const d = new Date(date+'T00:00:00');
            rows.push(`<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px 12px;">${toBengaliNumber(d.getDate())} ${ieBnMonths[d.getMonth()]}</td>
                <td style="padding:10px 8px;text-align:right;color:#2E7D32;">${v.i?toBengaliNumber(v.i):'-'}</td>
                <td style="padding:10px 8px;text-align:right;color:#C62828;">${v.e?toBengaliNumber(v.e):'-'}</td>
                <td style="padding:10px 8px;text-align:right;font-weight:bold;color:${(v.i-v.e)<0?'#C62828':'#2E7D32'};">${toBengaliNumber(v.i-v.e)}</td>
            </tr>`);
        });
    } else {
        document.getElementById('ieReportColDate').innerText = 'বিবরণ';
        tInc = txns.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
        tExp = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
        rows.push(`<tr><td colspan="4" style="padding:12px;text-align:center;color:#888;">সকল সময়ের হিসাব</td></tr>`);
    }

    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:#aaa;">কোনো তথ্য নেই</td></tr>';
    document.getElementById('ieRTotalInc').innerText = toBengaliNumber(tInc) + ' ৳';
    document.getElementById('ieRTotalExp').innerText = toBengaliNumber(tExp) + ' ৳';
    const bal = tInc - tExp;
    const balEl = document.getElementById('ieRTotalBal');
    balEl.innerText = toBengaliNumber(bal) + ' ৳';
    balEl.style.color = bal < 0 ? '#C62828' : '#2E7D32';
}

// --- ৭. ফিল্টার ও ভিউ কন্ট্রোল ---

function ieSetFilter(f, btn) {
    ieFilter = f;
    document.querySelectorAll('.ie-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    ieDateRef = new Date();
    ieRenderUI();
}

function ieChangeDate(dir) {
    if (ieFilter === 'all') return;
    const d = new Date(ieDateRef);
    if (ieFilter === 'monthly') d.setMonth(d.getMonth()+dir);
    else if (ieFilter === 'yearly') d.setFullYear(d.getFullYear()+dir);
    ieDateRef = d;
    ieRenderUI();
}

function ieSwitchView(view, tab) {
    ieCurrentView = view;
    document.querySelectorAll('.ie-view-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    ['ieListView','ieCategoryView','ieReportView'].forEach(id => document.getElementById(id).style.display='none');
    if (view==='list')     document.getElementById('ieListView').style.display='block';
    else if (view==='category') document.getElementById('ieCategoryView').style.display='block';
    else                   document.getElementById('ieReportView').style.display='block';
    ieRenderUI();
}

function ieToggleType(type, btn) {
    ieChartType = type;
    document.querySelectorAll('.ie-type-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    ieRenderCategory(ieTxnsCache);
}

// --- ৮. লেনদেন মডাল ---

function ieOpenModal(type) {
    ieEditingDocId = null;
    document.getElementById('ieTxnModalTitle').innerText = type==='income' ? 'আয় যোগ করুন' : 'ব্যয় যোগ করুন';
    document.getElementById('ieTxnType').value   = type;
    document.getElementById('ieTxnId').value     = '';
    document.getElementById('ieTxnDate').valueAsDate = new Date();
    document.getElementById('ieTxnNote').value   = '';
    document.getElementById('ieTxnAmount').value = '';
    document.getElementById('ieBtnDelete').style.display = 'none';
    iePopulateCatDropdown(type);
    showModal('ieTxnModal');
}

function ieOpenEdit(t) {
    ieEditingDocId = t.id;
    document.getElementById('ieTxnModalTitle').innerText = t.type==='income' ? 'আয় সম্পাদনা' : 'ব্যয় সম্পাদনা';
    document.getElementById('ieTxnType').value   = t.type;
    document.getElementById('ieTxnId').value     = t.id;
    document.getElementById('ieTxnDate').value   = t.date;
    document.getElementById('ieTxnNote').value   = t.note || '';
    document.getElementById('ieTxnAmount').value = t.amount;
    document.getElementById('ieBtnDelete').style.display = 'inline-block';
    iePopulateCatDropdown(t.type, t.category);
    const mSel = document.getElementById('ieTxnMethod');
    for (const o of mSel.options) if (o.value===t.method) { o.selected=true; break; }
    showModal('ieTxnModal');
}

function iePopulateCatDropdown(type, selected) {
    const sel = document.getElementById('ieTxnCategory');
    sel.innerHTML = '';
    (ieCatsCache[type]||[]).forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.text = c;
        if (c===selected) o.selected = true;
        sel.appendChild(o);
    });
}

async function ieSaveTxn() {
    const btn = document.getElementById('ieSaveBtn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> সংরক্ষণ...';

    try {
        if (!currentMadrasaId) {
            alert('মাদ্রাসা ID পাওয়া যায়নি। পুনরায় লগইন করুন।');
            return;
        }

        const date   = document.getElementById('ieTxnDate').value;
        const cat    = document.getElementById('ieTxnCategory').value;
        const method = document.getElementById('ieTxnMethod').value;
        const amount = parseFloat(document.getElementById('ieTxnAmount').value);
        const note   = document.getElementById('ieTxnNote').value.trim();
        const type   = document.getElementById('ieTxnType').value;

        if (!date) { alert('তারিখ দিন।'); return; }
        if (!cat)  { alert('ক্যাটাগরি নির্বাচন করুন।'); return; }
        if (isNaN(amount) || amount <= 0) { alert('সঠিক পরিমাণ দিন।'); return; }

        const docId = document.getElementById('ieTxnId').value;

        if (docId) {
            // এডিট — fundId-ও নিশ্চিত করো (পুরনো ডেটায় নাও থাকতে পারে)
            await db.collection('ie_transactions').doc(docId).update({
                date, category: cat, method, amount, note, type,
                fundId: ieActiveFundId,
                updatedAt: new Date().toISOString()
            });
        } else {
            // নতুন
            await db.collection('ie_transactions').add({
                madrasaId: currentMadrasaId,
                fundId: ieActiveFundId,
                date, category: cat, method, amount, note, type,
                createdAt: new Date().toISOString()
            });
        }

        hideModal('ieTxnModal');
        ieAllTxnsCache = null;
        ieAllTxnsCacheFundId = null;
        await ieRenderUI();

    } catch(e) {
        console.error('IE save error:', e);
        alert('সংরক্ষণে সমস্যা হয়েছে: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

async function ieDeleteTxn() {
    const docId = document.getElementById('ieTxnId').value;
    if (!docId) return;
    if (!confirm('এই লেনদেনটি মুছে ফেলতে চান?')) return;
    try {
        await db.collection('ie_transactions').doc(docId).delete();
        hideModal('ieTxnModal');
        ieAllTxnsCache = null;
        ieAllTxnsCacheFundId = null;
        await ieRenderUI();
    } catch(e) { console.error('IE delete:', e); alert('মুছতে সমস্যা: ' + e.message); }
}

// --- ৯. ক্যাটাগরি ম্যানেজমেন্ট ---

function ieOpenCatModal() {
    ieLoadCategories().then(() => {
        ieRenderCats();
        showModal('ieCatModal');
    });
}

function ieRenderCats() {
    const type = document.getElementById('ieCatTypeSelect').value;
    const ul   = document.getElementById('ieCatList');
    const cats = ieCatsCache[type] || [];
    if (!cats.length) { ul.innerHTML = '<li style="text-align:center;padding:15px;color:#999;">কোনো খাত নেই</li>'; return; }
    ul.innerHTML = cats.map((c,i) => `
        <li class="ie-manage-item">
            <span>${c}</span>
            <div>
                <i class="fas fa-edit" style="color:var(--info);cursor:pointer;margin-right:12px;" onclick="ieEditCat('${type}',${i})"></i>
                <i class="fas fa-trash" style="color:var(--danger);cursor:pointer;" onclick="ieDelCat('${type}',${i})"></i>
            </div>
        </li>`).join('');
}

async function ieAddCat() {
    const type = document.getElementById('ieCatTypeSelect').value;
    const name = document.getElementById('ieNewCatName').value.trim();
    if (!name) return;
    if (ieCatsCache[type].includes(name)) { alert('এই নামের খাত ইতিমধ্যে আছে।'); return; }
    ieCatsCache[type].push(name);
    document.getElementById('ieNewCatName').value = '';
    await ieSaveCategories();
    ieRenderCats();
}

async function ieEditCat(type, idx) {
    const oldName = ieCatsCache[type][idx];
    const newName = prompt('খাতের নতুন নাম:', oldName);
    if (!newName || !newName.trim() || newName===oldName) return;
    ieCatsCache[type][idx] = newName.trim();
    // এই ফান্ডের পুরানো লেনদেনের ক্যাটাগরি আপডেট
    // Composite index এড়াতে madrasaId দিয়ে টেনে JS এ ফিল্টার করো
    try {
        const snap = await db.collection('ie_transactions')
            .where('madrasaId','==',currentMadrasaId).get();
        const toUpdate = snap.docs.filter(d => {
            const data = d.data();
            return data.fundId === ieActiveFundId && data.type === type && data.category === oldName;
        });
        if (toUpdate.length) {
            const batch = db.batch();
            toUpdate.forEach(d => batch.update(d.ref, { category: newName.trim() }));
            await batch.commit();
        }
    } catch(e) { console.error(e); }
    await ieSaveCategories();
    ieRenderCats();
    ieAllTxnsCache = null;
    ieAllTxnsCacheFundId = null;
    await ieRenderUI();
}

async function ieDelCat(type, idx) {
    if (!confirm('এই খাতটি মুছে ফেলতে চান?')) return;
    ieCatsCache[type].splice(idx, 1);
    await ieSaveCategories();
    ieRenderCats();
}

// --- ১০. ক্যাটাগরি ডিটেইল ---

function ieShowCatDetail(cat, type) {
    const range = ieGetRange();
    const txns  = ieTxnsCache.filter(t => t.type===type && t.category===cat);
    document.getElementById('ieCatDetailTitle').innerText  = cat;
    document.getElementById('ieCatDetailRange').innerText  = ieGetRange().label;
    const el = document.getElementById('ieCatDetailList');
    if (!txns.length) { el.innerHTML='<li style="padding:20px;text-align:center;color:#aaa;">কোনো লেনদেন নেই</li>'; }
    else {
        const color = type==='income' ? '#2E7D32' : '#C62828';
        el.innerHTML = txns.map(t => {
            const d = new Date(t.date+'T00:00:00');
            return `<li class="ie-t-item" onclick="hideModal('ieCatDetailModal'); setTimeout(()=>ieOpenEdit(${JSON.stringify(t).replace(/"/g,"'")},0)">
                <div class="ie-t-date-box">
                    <span class="ie-t-date-day">${toBengaliNumber(d.getDate())}</span>
                    <span class="ie-t-date-month">${ieBnMonths[d.getMonth()]}</span>
                </div>
                <div class="ie-t-mid">
                    <div class="ie-t-cat">${t.category}</div>
                    <div class="ie-t-note">${t.note||'নোট নেই'}</div>
                </div>
                <div class="ie-t-right">
                    <span class="ie-t-amount" style="color:${color};">${toBengaliNumber(t.amount)} ৳</span>
                    <span class="ie-t-badge">${t.method||''}</span>
                </div>
            </li>`;
        }).join('');
    }
    showModal('ieCatDetailModal');
}

// --- ১১. প্রিন্ট সিস্টেম ---

function iePrintCurrent() {
    const range  = ieGetRange();
    const txns   = ieTxnsCache;
    const view   = ieCurrentView;
    const madrasaName = (typeof currentMadrasaName !== 'undefined' && currentMadrasaName)
        ? currentMadrasaName
        : (document.getElementById('adminMadrasaName')?.innerText || 'মাদ্রাসা');

    const inc = txns.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const exp = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const bal = inc - exp;

    let contentHTML = '';

    if (view === 'list') {
        // লেনদেন তালিকা প্রিন্ট
        const rows = txns.map(t => {
            const d = new Date(t.date+'T00:00:00');
            return `<tr>
                <td>${d.getDate()} ${ieBnMonthsFull[d.getMonth()]} ${d.getFullYear()}</td>
                <td>${t.category}</td>
                <td>${t.note||'-'}</td>
                <td>${t.method||'-'}</td>
                <td style="color:#2E7D32; text-align:right;">${t.type==='income' ? toBengaliNumber(t.amount)+' ৳' : '-'}</td>
                <td style="color:#C62828; text-align:right;">${t.type==='expense' ? toBengaliNumber(t.amount)+' ৳' : '-'}</td>
            </tr>`;
        }).join('');
        contentHTML = `
            <table class="p-table">
                <thead><tr>
                    <th>তারিখ</th><th>খাত/ক্যাটাগরি</th><th>বিবরণ</th><th>মাধ্যম</th>
                    <th style="text-align:right;">আয়</th><th style="text-align:right;">ব্যয়</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;">কোনো লেনদেন নেই</td></tr>'}</tbody>
            </table>`;

    } else if (view === 'category') {
        // খাতভিত্তিক প্রিন্ট (আয় + ব্যয় উভয়)
        ['expense','income'].forEach(type => {
            const filtered = txns.filter(t=>t.type===type);
            const total    = filtered.reduce((s,t)=>s+parseFloat(t.amount||0),0);
            const catMap   = {};
            filtered.forEach(t => { catMap[t.category]=(catMap[t.category]||0)+parseFloat(t.amount||0); });
            const sorted   = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
            const color    = type==='income' ? '#2E7D32' : '#C62828';
            const label    = type==='income' ? 'আয়ের খাতভিত্তিক হিসাব' : 'ব্যয়ের খাতভিত্তিক হিসাব';
            const rows     = sorted.map(([cat,amt]) => {
                const pct = total > 0 ? ((amt/total)*100).toFixed(1) : 0;
                return `<tr>
                    <td>${cat}</td>
                    <td style="text-align:right; color:${color}; font-weight:bold;">${toBengaliNumber(amt)} ৳</td>
                    <td style="text-align:right;">${pct}%</td>
                    <td style="text-align:right;">${filtered.filter(t=>t.category===cat).length} টি</td>
                </tr>`;
            }).join('');
            contentHTML += `
                <h3 style="margin:20px 0 8px; color:${color}; border-bottom:2px solid ${color}; padding-bottom:5px;">${label}</h3>
                <table class="p-table">
                    <thead><tr><th>খাত</th><th style="text-align:right;">পরিমাণ</th><th style="text-align:right;">শতাংশ</th><th style="text-align:right;">লেনদেন</th></tr></thead>
                    <tbody>${rows||'<tr><td colspan="4" style="text-align:center;">কোনো তথ্য নেই</td></tr>'}</tbody>
                    <tfoot><tr style="background:#f5f5f5;font-weight:bold;">
                        <td>মোট</td>
                        <td style="text-align:right;color:${color};">${toBengaliNumber(total)} ৳</td>
                        <td style="text-align:right;">১০০%</td>
                        <td style="text-align:right;">${filtered.length} টি</td>
                    </tr></tfoot>
                </table>`;
        });

    } else {
        // সারাংশ রিপোর্ট প্রিন্ট
        let rows = '';
        let tInc = 0, tExp = 0;
        if (ieFilter === 'yearly') {
            for (let m=0; m<12; m++) {
                const mT = txns.filter(t=>new Date(t.date+'T00:00:00').getMonth()===m);
                const mI = mT.filter(t=>t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
                const mE = mT.filter(t=>t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
                if (mI||mE) { tInc+=mI; tExp+=mE;
                    rows+=`<tr><td>${ieBnMonthsFull[m]}</td>
                        <td style="text-align:right;color:#2E7D32;">${toBengaliNumber(mI)} ৳</td>
                        <td style="text-align:right;color:#C62828;">${toBengaliNumber(mE)} ৳</td>
                        <td style="text-align:right;font-weight:bold;color:${(mI-mE)<0?'#C62828':'#2E7D32'};">${toBengaliNumber(mI-mE)} ৳</td></tr>`;
                }
            }
        } else if (ieFilter === 'monthly') {
            const days = {};
            txns.forEach(t => { if(!days[t.date])days[t.date]={i:0,e:0}; if(t.type==='income')days[t.date].i+=parseFloat(t.amount||0); else days[t.date].e+=parseFloat(t.amount||0); });
            Object.entries(days).sort((a,b)=>a[0]>b[0]?1:-1).forEach(([date,v])=>{
                tInc+=v.i; tExp+=v.e;
                const d=new Date(date+'T00:00:00');
                rows+=`<tr><td>${d.getDate()} ${ieBnMonths[d.getMonth()]}</td>
                    <td style="text-align:right;color:#2E7D32;">${v.i?toBengaliNumber(v.i)+' ৳':'-'}</td>
                    <td style="text-align:right;color:#C62828;">${v.e?toBengaliNumber(v.e)+' ৳':'-'}</td>
                    <td style="text-align:right;font-weight:bold;color:${(v.i-v.e)<0?'#C62828':'#2E7D32'};">${toBengaliNumber(v.i-v.e)} ৳</td></tr>`;
            });
        } else {
            tInc = inc; tExp = exp;
            rows = `<tr><td>সকল সময়</td>
                <td style="text-align:right;color:#2E7D32;">${toBengaliNumber(inc)} ৳</td>
                <td style="text-align:right;color:#C62828;">${toBengaliNumber(exp)} ৳</td>
                <td style="text-align:right;font-weight:bold;">${toBengaliNumber(inc-exp)} ৳</td></tr>`;
        }
        const colDate = ieFilter==='yearly' ? 'মাস' : ieFilter==='monthly' ? 'তারিখ' : 'বিবরণ';
        contentHTML = `
            <table class="p-table">
                <thead><tr>
                    <th>${colDate}</th>
                    <th style="text-align:right;color:#2E7D32;">আয়</th>
                    <th style="text-align:right;color:#C62828;">ব্যয়</th>
                    <th style="text-align:right;">জমা</th>
                </tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="background:#f5f5f5;font-weight:bold;">
                    <td>সর্বমোট</td>
                    <td style="text-align:right;color:#2E7D32;">${toBengaliNumber(tInc)} ৳</td>
                    <td style="text-align:right;color:#C62828;">${toBengaliNumber(tExp)} ৳</td>
                    <td style="text-align:right;color:${(tInc-tExp)<0?'#C62828':'#2E7D32'};">${toBengaliNumber(tInc-tExp)} ৳</td>
                </tr></tfoot>
            </table>`;
    }

    const viewLabel = view==='list' ? 'লেনদেন তালিকা' : view==='category' ? 'খাতভিত্তিক বিশ্লেষণ' : 'সারাংশ রিপোর্ট';
    const activeFund = ieFundsCache.find(f => f.id === ieActiveFundId);
    const fundNameForPrint = activeFund ? activeFund.name : 'সকল ফান্ড';

    const ieReportHTML = `
    <style>
        .ie-header { text-align:center; border-bottom:3px double #333; padding-bottom:14px; margin-bottom:16px; }
        .ie-header h1 { font-size:1.4rem; font-weight:700; margin:0; }
        .ie-header h2 { font-size:1rem; font-weight:600; color:#444; margin:4px 0 0; }
        .ie-header .period { font-size:0.9rem; color:#666; margin-top:6px; }
        .ie-summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
        .ie-s-card { border:1px solid #ddd; border-radius:6px; padding:10px 12px; text-align:center; }
        .ie-s-card .label { font-size:0.8rem; color:#666; margin-bottom:4px; }
        .ie-s-card .value { font-size:1.2rem; font-weight:700; }
        .p-table { width:100%; border-collapse:collapse; margin-bottom:14px; }
        .p-table th { background:#2c6e49; color:white; padding:8px 10px; text-align:left; font-weight:600; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        .p-table td { padding:7px 10px; border-bottom:1px solid #eee; }
        .p-table tbody tr:nth-child(even) { background:#f9f9f9; }
        .p-table tfoot td { border-top:2px solid #333; background:#f0f0f0; }
        .ie-footer-note { text-align:center; font-size:0.75rem; color:#999; border-top:1px solid #ddd; padding-top:10px; margin-top:20px; }
    </style>
    <div class="ie-header">
        <h1>${madrasaName}</h1>
        <h2>আয়-ব্যয় হিসাব — ${viewLabel}</h2>
        <div class="period">ফান্ড: ${fundNameForPrint} | সময়কাল: ${range.label}</div>
    </div>
    <div class="ie-summary-grid">
        <div class="ie-s-card"><div class="label">মোট আয়</div><div class="value" style="color:#2E7D32;">${toBengaliNumber(inc)} ৳</div></div>
        <div class="ie-s-card"><div class="label">মোট ব্যয়</div><div class="value" style="color:#C62828;">${toBengaliNumber(exp)} ৳</div></div>
        <div class="ie-s-card"><div class="label">নিট জমা</div><div class="value" style="color:${bal<0?'#C62828':bal>0?'#2E7D32':'#333'};">${toBengaliNumber(bal)} ৳</div></div>
    </div>
    ${contentHTML}
    <div class="ie-footer-note">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD')}</div>`;

    document.getElementById('reportViewTitle').textContent = 'আয়-ব্যয় হিসাব — ' + viewLabel;
    document.getElementById('reportViewContent').innerHTML = ieReportHTML;
    enablePrintSettings('reportViewModal', 'reportViewContent');
    showModal('reportViewModal');
}

// --- ১২. ট্যাব পরিবর্তন ও ইনিশিয়ালাইজ ---

function ieWatchTab() {
    // অন্য ট্যাবে গেলে FAB লুকানো
    document.querySelectorAll('#adminApp .nav-link[data-target]').forEach(link => {
        link.addEventListener('click', () => {
            const fab = document.getElementById('ieFabContainer');
            if (!fab) return;
            if (link.dataset.target === 'incomeExpenseSection') {
                fab.style.display = 'flex';
            } else {
                fab.style.display = 'none';
            }
        });
    });
}

window.ieInit = async function ieInit() {
    if (!currentMadrasaId) return;
    // মাদ্রাসা পরিবর্তনে আগের ফান্ড ও ক্যাশ রিসেট করো
    ieActiveFundId = null;
    ieFundsCache = [];
    ieAllTxnsCache = null;
    ieAllTxnsCacheFundId = null;
    await ieLoadFunds();
    await ieLoadCategories();
    await ieRenderUI();
}

// Lazy-loaded: call immediately if DOM already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { ieWatchTab(); });
} else {
  ieWatchTab();
}
// ============================================================
//  আয়-ব্যয় সিস্টেম শেষ
