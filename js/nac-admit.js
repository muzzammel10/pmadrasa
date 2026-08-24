/* ===================================================
   নতুন আধুনিক প্রবেশপত্র সিস্টেম (NAC)
   =================================================== */
(function(){

    let _nacPerPage = 4;

    /* সেকশন ইনিট — ক্লাস ও পরীক্ষা ড্রপডাউন পপুলেট */
    window.nacInitSection = function() {
        // পরীক্ষা ড্রপডাউন
        const examSel = document.getElementById('nacExamSelect');
        if (examSel) {
            const yearExams = (typeof exams !== 'undefined' ? exams : []).filter(e => e.year === currentYear);
            examSel.innerHTML = '<option value="">-- পরীক্ষা বাছাই করুন --</option>' +
                yearExams.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        }
        // ক্লাস চেকবক্স
        const clsSel = document.getElementById('nacClassSelector');
        if (clsSel) {
            const yearClasses = (typeof classes !== 'undefined' ? classes : []).filter(c => c.year === currentYear);
            if (yearClasses.length === 0) {
                clsSel.innerHTML = '<p style="color:#aaa;font-size:0.9rem;">কোনো ক্লাস পাওয়া যায়নি।</p>';
            } else {
                clsSel.innerHTML = yearClasses.map(c =>
                    `<label style="display:inline-flex;align-items:center;gap:5px;margin:4px 8px 4px 0;font-size:0.9rem;">
                        <input type="checkbox" name="nacClass" value="${c.id}" checked> ${c.name}
                    </label>`
                ).join('');
            }
        }
    };

    /* প্রতি পেজ কার্ড সংখ্যা সেট */
    window.nacSetPerPage = function(n) {
        _nacPerPage = n;
        document.getElementById('nacPP4').classList.toggle('active', n === 4);
        document.getElementById('nacPP6').classList.toggle('active', n === 6);
    };

    /* বিকল্পগুলো সংগ্রহ */
    function nacGetOptions() {
        return {
            photo:      document.getElementById('nacShowPhoto')?.checked || false,
            name:       document.getElementById('nacShowName')?.checked !== false,
            fatherName: document.getElementById('nacShowFather')?.checked !== false,
            roll:       document.getElementById('nacShowRoll')?.checked !== false,
            className:  document.getElementById('nacShowClass')?.checked !== false,
        };
    }

    /* নির্বাচিত ক্লাস ID */
    function nacGetSelectedClasses() {
        return [...document.querySelectorAll('input[name="nacClass"]:checked')].map(el => el.value);
    }

    /* একটি আধুনিক প্রবেশপত্র HTML তৈরি */
    function nacCardHtml(student, examName, opts) {
        const className   = (typeof getClassNameById === 'function') ? getClassNameById(student.class) : '';
        const rollBN      = (typeof toBengaliNumber  === 'function') ? toBengaliNumber(student.roll)   : student.roll;
        const yearBN      = (typeof toBengaliNumber  === 'function') ? toBengaliNumber(currentYear)    : currentYear;
        const madrasaName = (typeof currentMadrasaName !== 'undefined') ? currentMadrasaName : 'মাদ্রাসা';

        // মাদ্রাসার আসল লোগো
        const logoSrc = (typeof currentMadrasaLogo !== 'undefined' && currentMadrasaLogo && !currentMadrasaLogo.includes('placeholder'))
            ? currentMadrasaLogo : null;
        const logoHtml = logoSrc
            ? `<img src="${logoSrc}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.7);flex-shrink:0;" alt="লোগো">`
            : `<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-mosque" style="color:#f1c40f;font-size:20px;"></i></div>`;

        const photoBlock = opts.photo
            ? `<img src="${student.photo || ''}" class="nac-card-photo" alt="ছবি"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <div class="nac-card-photo-placeholder" style="display:none;"><i class="fas fa-user"></i></div>`
            : '';

        const infoRows = [];
        if (opts.name)       infoRows.push(`<div class="nac-card-info-row"><span class="nac-info-key">নাম&nbsp;:</span><span class="nac-info-val">${student.name || ''}</span></div>`);
        if (opts.fatherName) infoRows.push(`<div class="nac-card-info-row"><span class="nac-info-key">পিতা&nbsp;:</span><span class="nac-info-val">${student.fatherName || ''}</span></div>`);
        if (opts.className)  infoRows.push(`<div class="nac-card-info-row"><span class="nac-info-key">শ্রেণি&nbsp;:</span><span class="nac-info-val">${className}</span></div>`);
        if (opts.roll)       infoRows.push(`<div class="nac-card-info-row"><span class="nac-info-key">রোল&nbsp;:</span><span class="nac-info-val">${rollBN}</span></div>`);

        return `<div class="nac-card">
            <!-- হেডার: মাদ্রাসার নাম ও লোগো -->
            <div class="nac-card-header" style="background-color:#1a5e1a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
                ${logoHtml}
                <div class="nac-card-header-text">
                    <div class="nac-card-madrasa-name" style="color:#ffffff!important;">${madrasaName}</div>
                    <span class="nac-card-exam-tag" style="background-color:#f1c40f!important;color:#111!important;-webkit-print-color-adjust:exact!important;">${examName} — ${yearBN}</span>
                </div>
            </div>

            <!-- প্রবেশপত্র টাইটেল -->
            <div class="nac-card-title-bar" style="background-color:#c0392b!important;color:#ffffff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">&#9733; প্রবেশপত্র &#9733;</div>

            <!-- ছাত্রের তথ্য -->
            <div class="nac-card-body">
                ${opts.photo ? `<div>${photoBlock}</div>` : ''}
                <div class="nac-card-info">${infoRows.join('')}</div>
            </div>

            <!-- স্বাক্ষরের জায়গা (ফুটারের উপরে) -->
            <div style="display:flex;justify-content:space-between;padding:8px 14px 4px 14px;gap:10px;">
                <div style="text-align:center;flex:1;">
                    <div style="border-top:1.5px solid #1a5e1a;margin-bottom:4px;"></div>
                    <span style="font-size:11px;color:#333;font-weight:600;">পরিচালকের স্বাক্ষর</span>
                </div>
                <div style="text-align:center;flex:1;">
                    <div style="border-top:1.5px solid #1a5e1a;margin-bottom:4px;"></div>
                    <span style="font-size:11px;color:#333;font-weight:600;">শিক্ষকের স্বাক্ষর</span>
                </div>
            </div>

            <!-- ফুটার: নোটিশ -->
            <div class="nac-card-footer" style="background-color:#1a5e1a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;padding:5px 12px;text-align:center;">
                <div style="color:#fff!important;font-size:10px;width:100%;text-align:center;">পরীক্ষার সময় প্রবেশপত্র অবশ্যই সঙ্গে আনতে হবে</div>
            </div>
        </div>`;
    }

    /* সব পেজের HTML তৈরি */
    window.nacBuildPagesFn = function nacBuildPagesHtml(studentList, examName, opts, perPage) {
        if (studentList.length === 0) return '<p style="text-align:center;color:#888;padding:30px;">কোনো ছাত্র পাওয়া যায়নি।</p>';
        const gridClass = perPage === 6 ? 'nac-grid-6' : 'nac-grid-4';
        let html = '';
        for (let i = 0; i < studentList.length; i += perPage) {
            const chunk = studentList.slice(i, i + perPage);
            const cards = chunk.map(s => nacCardHtml(s, examName, opts)).join('');
            html += `<div class="nac-print-page"><div class="${gridClass}">${cards}</div></div>`;
        }
        return html;
    }

    /* ভ্যালিডেশন ও ছাত্র তালিকা */
    function nacValidate() {
        const examId = document.getElementById('nacExamSelect')?.value;
        if (!examId) { alert('অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।'); return null; }
        const selClasses = nacGetSelectedClasses();
        if (selClasses.length === 0) { alert('অনুগ্রহ করে অন্তত একটি ক্লাস নির্বাচন করুন।'); return null; }
        const examObj = (typeof exams !== 'undefined' ? exams : []).find(e => e.id === examId);
        const examName = examObj ? examObj.name : 'পরীক্ষা';
        const allStudents = (typeof students !== 'undefined' ? students : []);
        const filtered = allStudents
            .filter(s => selClasses.includes(s.class))
            .sort((a, b) => {
                const cn = (getClassNameById(a.class) || '').localeCompare(getClassNameById(b.class) || '');
                return cn !== 0 ? cn : (a.roll || 0) - (b.roll || 0);
            });
        if (filtered.length === 0) { alert('নির্বাচিত ক্লাসে কোনো ছাত্র পাওয়া যায়নি।'); return null; }
        return { filtered, examName };
    }

    /* প্রিভিউ মডাল */
    window.nacPreview = function() {
        const v = nacValidate(); if (!v) return;
        const opts = nacGetOptions();
        const html = nacBuildPagesFn(v.filtered, v.examName, opts, _nacPerPage);
        document.getElementById('nacModalBody').innerHTML = html;
        document.getElementById('nacModal').style.display = 'flex';
    };

    window.nacCloseModal = function() {
        document.getElementById('nacModal').style.display = 'none';
    };

    /* মডাল থেকে প্রিন্ট */
    window.nacPrintFromModal = function() {
        const bodyHtml = document.getElementById('nacModalBody').innerHTML;
        const madrasaName = (typeof currentMadrasaName !== 'undefined') ? currentMadrasaName : 'মাদ্রাসা';
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html lang="bn"><head>
        <meta charset="UTF-8">
        <title>প্রবেশপত্র — ${madrasaName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            *{margin:0;padding:0;box-sizing:border-box;font-family:'Hind Siliguri','Segoe UI',Tahoma,sans-serif;}
            body{background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; color-adjust:exact;}
            @page{size:A4 portrait; margin:8mm;}
            .nac-print-page{width:100%; page-break-after:always; box-sizing:border-box;}
            .nac-grid-4{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6mm;height:calc(297mm - 16mm);}
            .nac-grid-6{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:4mm;height:calc(297mm - 16mm);}

            /* কার্ড মূল কাঠামো */
            .nac-card{border:2.5px solid #1a5e1a;border-radius:10px;overflow:hidden;background:#fff;display:flex;flex-direction:column;position:relative;color:#111;height:100%;}

            /* হেডার — গাঢ় সবুজ ব্যাকগ্রাউন্ড রঙিন প্রিন্টের জন্য */
            .nac-card-header{
                background-color:#1a5e1a !important;
                -webkit-print-color-adjust:exact !important;
                print-color-adjust:exact !important;
                padding:10px 12px 8px 12px;
                display:flex;align-items:center;gap:10px;position:relative;
            }
            .nac-card-logo{
                width:40px;height:40px;
                background-color:rgba(255,255,255,0.2) !important;
                -webkit-print-color-adjust:exact !important;
                border-radius:50%;display:flex;align-items:center;justify-content:center;
                font-size:20px;flex-shrink:0;border:2px solid rgba(255,255,255,0.6);
            }
            .nac-card-header-text{flex:1;text-align:center;}
            .nac-card-madrasa-name{color:#fff !important;font-size:15px;font-weight:900;line-height:1.3;text-shadow:0 1px 2px rgba(0,0,0,0.4);}
            .nac-card-exam-tag{
                display:inline-block;
                background-color:#f1c40f !important;
                -webkit-print-color-adjust:exact !important;
                print-color-adjust:exact !important;
                color:#111 !important;font-size:11px;font-weight:bold;padding:2px 10px;border-radius:10px;margin-top:4px;
            }

            /* টাইটেল বার */
            .nac-card-title-bar{
                background-color:#c0392b !important;
                -webkit-print-color-adjust:exact !important;
                print-color-adjust:exact !important;
                color:#fff !important;text-align:center;font-weight:900;font-size:13px;
                padding:5px 0;letter-spacing:2px;
            }

            /* বডি */
            .nac-card-body{flex:1;padding:10px 14px 8px 14px;display:flex;gap:12px;align-items:flex-start;}
            .nac-card-photo{width:65px;height:75px;border:2px solid #1a5e1a;border-radius:6px;object-fit:cover;flex-shrink:0;}
            .nac-card-photo-placeholder{width:65px;height:75px;border:2px dashed #aaa;border-radius:6px;flex-shrink:0;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:26px;}
            .nac-card-info{flex:1;padding-top:4px;}
            .nac-card-info-row{display:flex;align-items:center;margin-bottom:7px;border-bottom:1.5px dotted #bbb;padding-bottom:6px;gap:6px;}
            .nac-card-info-row:last-child{border-bottom:none;margin-bottom:0;}
            .nac-info-key{font-size:12px;color:#444;font-weight:700;min-width:65px;flex-shrink:0;}
            .nac-info-val{font-size:13px;color:#111;font-weight:800;}

            /* রোল ব্যাজ */
            .nac-roll-badge{
                position:absolute;top:8px;right:10px;
                background-color:rgba(255,255,255,0.2) !important;
                -webkit-print-color-adjust:exact !important;
                border:2px solid rgba(255,255,255,0.6);
                border-radius:7px;color:#fff !important;font-size:10px;font-weight:900;
                padding:3px 9px;text-align:center;line-height:1.3;
            }

            /* ফুটার */
            .nac-card-footer{
                background-color:#1a5e1a !important;
                -webkit-print-color-adjust:exact !important;
                print-color-adjust:exact !important;
                padding:7px 12px;display:flex;justify-content:space-between;align-items:center;
            }
            .nac-sig-box{text-align:center;font-size:10px;color:#fff !important;min-width:65px;}
            .nac-sig-line{border-top:1.5px solid rgba(255,255,255,0.7);margin-bottom:3px;width:65px;}
            .nac-footer-notice{font-size:9px;color:#fff !important;text-align:center;flex:1;padding:0 6px;line-height:1.4;}

            @media print{
                body{margin:0;}
                .nac-print-page{page-break-after:always;}
            }
        </style>
        </head><body>${bodyHtml}</body></html>`);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 600);
    };

    /* সরাসরি প্রিন্ট (প্রিভিউ ছাড়া) */
    window.nacDirectPrint = function() {
        const v = nacValidate(); if (!v) return;
        const opts = nacGetOptions();
        const html = nacBuildPagesFn(v.filtered, v.examName, opts, _nacPerPage);
        document.getElementById('nacModalBody').innerHTML = html;
        nacPrintFromModal();
    };

})();
/* ===== নতুন আধুনিক প্রবেশপত্র সিস্টেম JS শেষ ===== */

/* ===== রিপোর্ট সেকশন থেকে নতুন প্রবেশপত্র ফাংশন ===== */
window.nacSetPerPage2 = function(n) {
    window._nacPerPage2 = n;
    document.getElementById('nacPP4b')?.classList.toggle('active', n === 4);
    document.getElementById('nacPP6b')?.classList.toggle('active', n === 6);
};
window._nacPerPage2 = 4;

function nacGetOptsFromReport() {
    return {
        photo:      document.getElementById('nacShowPhoto2')?.checked || false,
        name:       document.getElementById('nacShowName2')?.checked !== false,
        fatherName: document.getElementById('nacShowFather2')?.checked !== false,
        roll:       document.getElementById('nacShowRoll2')?.checked !== false,
        className:  document.getElementById('nacShowClass2')?.checked !== false,
    };
}

function nacValidateFromReport() {
    const examId = document.getElementById('reportExamSelector')?.value;
    if (!examId) { alert('অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।'); return null; }
    const selClasses = Array.from(document.querySelectorAll('#reportClassSelector input:checked')).map(cb => cb.value);
    if (selClasses.length === 0) { alert('অনুগ্রহ করে অন্তত একটি ক্লাস নির্বাচন করুন।'); return null; }
    const examObj = (typeof exams !== 'undefined' ? exams : []).find(e => e.id === examId);
    const examName = examObj ? examObj.name : 'পরীক্ষা';
    const filtered = (typeof students !== 'undefined' ? students : [])
        .filter(s => selClasses.includes(s.class))
        .sort((a, b) => {
            const cn = (getClassNameById(a.class)||'').localeCompare(getClassNameById(b.class)||'');
            return cn !== 0 ? cn : (a.roll||0)-(b.roll||0);
        });
    if (filtered.length === 0) { alert('নির্বাচিত ক্লাসে কোনো ছাত্র পাওয়া যায়নি।'); return null; }
    return { filtered, examName };
}

window.nacPreviewFromReport = function() {
    const v = nacValidateFromReport(); if (!v) return;
    const opts = nacGetOptsFromReport();
    // nacBuildPagesHtml and nacCardHtml are defined in the NAC IIFE — call them via window or inline
    const perPage = window._nacPerPage2 || 4;
    const html = nacBuildPagesFn(v.filtered, v.examName, opts, perPage);
    document.getElementById('nacModalBody').innerHTML = html;
    document.getElementById('nacModal').style.display = 'flex';
};

window.nacDirectPrintFromReport = function() {
    const v = nacValidateFromReport(); if (!v) return;
    const opts = nacGetOptsFromReport();
    const perPage = window._nacPerPage2 || 4;
    const html = nacBuildPagesFn(v.filtered, v.examName, opts, perPage);
    document.getElementById('nacModalBody').innerHTML = html;
    nacPrintFromModal();
};
/* ===== রিপোর্ট সেকশন থেকে নতুন প্রবেশপত্র ফাংশন শেষ ===== */
