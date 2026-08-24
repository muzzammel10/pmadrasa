/**
 * Lazy Loader for heavy modules + their CSS
 */
window._lazyModules = window._lazyModules || {};

window.loadLazyCSS = function(name, href) {
  if (document.getElementById('lazy-css-' + name)) return Promise.resolve();
  return new Promise(function(resolve) {
    var link = document.createElement('link');
    link.id = 'lazy-css-' + name;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = function() { resolve(); };
    link.onerror = function() { resolve(); }; // don't block on CSS error
    document.head.appendChild(link);
  });
};

window.loadLazyModule = function(name, src) {
  return new Promise(function(resolve, reject) {
    if (window._lazyModules[name] === 'loaded') {
      resolve();
      return;
    }
    if (window._lazyModules[name] === 'loading') {
      var check = setInterval(function() {
        if (window._lazyModules[name] === 'loaded') {
          clearInterval(check);
          resolve();
        } else if (window._lazyModules[name] === 'error') {
          clearInterval(check);
          reject(new Error('Failed to load ' + name));
        }
      }, 50);
      return;
    }
    window._lazyModules[name] = 'loading';
    var script = document.createElement('script');
    script.src = src;
    script.onload = function() {
      window._lazyModules[name] = 'loaded';
      resolve();
    };
    script.onerror = function() {
      window._lazyModules[name] = 'error';
      reject(new Error('Failed to load ' + name));
    };
    document.body.appendChild(script);
  });
};

// Question Maker — inject style tags with required IDs (print system depends on them)
window._injectQmkStyles = function() {
  if (document.getElementById('qmkPrintOrientation')) return;
  var orient = document.createElement('style');
  orient.id = 'qmkPrintOrientation';
  orient.textContent = '@page { size: A4 portrait; margin: 12mm; }';
  document.head.appendChild(orient);
  var st = document.createElement('style');
  st.id = 'qmkStyles';
  st.textContent = ".qmk-scope{\n    --qink:#1a1d1a;\n    --qpaper:#fbf8ee;\n    --qpaper-edge:#e9e2c8;\n    --qgreen-900:#0d3d2c;\n    --qgreen-700:#12523a;\n    --qgreen-500:#1c7a52;\n    --qgold-600:#b8892c;\n    --qgold-200:#f1e2b8;\n    --qpanel:#f4f2ea;\n    --qpanel-line:#dcd6c2;\n    --qdanger:#a8402f;\n    --qshadow: 0 10px 30px -12px rgba(13,61,44,0.35);\n  }\n  .qmk-scope{\n    background:\n      radial-gradient(circle at 15% 10%, rgba(184,137,44,0.08), transparent 40%),\n      radial-gradient(circle at 85% 90%, rgba(28,122,82,0.10), transparent 45%),\n      var(--qpanel);\n    font-family:'Tiro Bangla',serif;\n    color:var(--qink);\n    border-radius:14px;\n    padding-bottom:6px;\n    max-width: 100%;\n    overflow: hidden; /* \u09ae\u09cb\u09ac\u09be\u0987\u09b2 \u09b8\u09cd\u0995\u09cd\u09b0\u09bf\u09a8\u09c7\u09b0 \u09ac\u09be\u0987\u09b0\u09c7 \u0995\u09a8\u099f\u09c7\u09a8\u09cd\u099f \u09af\u09be\u0993\u09df\u09be \u09b0\u09cb\u09a7 \u0995\u09b0\u09a4\u09c7 */\n  }\n  .qmk-scope .display{font-family:'Tiro Bangla',serif;}\n\n  /* ===== Action bar (\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3/\u09aa\u09cd\u09b0\u09bf\u09a8\u09cd\u099f) ===== */\n  .qmk-scope .qmk-actionbar{\n    position:sticky; top:0; z-index:20;\n    background:linear-gradient(135deg, var(--qgreen-900), var(--qgreen-700));\n    color:#fdf9ec;\n    padding:12px 18px;\n    border-radius:14px 14px 0 0;\n    display:flex; align-items:center; gap:10px; flex-wrap:wrap;\n    box-shadow:var(--qshadow);\n  }\n  .qmk-scope .qmk-current-label{font-size:12.5px; opacity:.85;}\n  .qmk-scope .qmk-spacer{flex:1;}\n  .qmk-scope .btn{\n    border:none; cursor:pointer; font-family:inherit; font-weight:600;\n    border-radius:9px; padding:9px 16px; font-size:14px; transition:transform .12s ease, box-shadow .12s ease;\n  }\n  .qmk-scope .btn:active{transform:translateY(1px);}\n  .qmk-scope .btn-gold{background:linear-gradient(135deg,#e9c877,var(--qgold-600)); color:#2c1c05;}\n  .qmk-scope .btn-ghost{background:rgba(255,255,255,0.12); color:#fdf9ec; border:1px solid rgba(255,255,255,0.28);}\n  .qmk-scope .btn-ghost:hover{background:rgba(255,255,255,0.2);}\n\n  /* ===== Layout ===== */\n  .qmk-scope .workspace{\n    display:grid;\n    grid-template-columns: 400px 1fr;\n    gap:22px;\n    padding:22px;\n    max-width:1500px;\n    margin:0 auto;\n    align-items:start;\n  }\n  @media (max-width: 980px){\n    .qmk-scope .workspace{\n      grid-template-columns:1fr;\n      padding: 10px; /* \u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u09ab\u09be\u0981\u0995\u09be \u099c\u09be\u09df\u0997\u09be \u0995\u09ae\u09be\u09a4\u09c7 \u09aa\u09cd\u09af\u09be\u09a1\u09bf\u0982 \u0995\u09ae\u09be\u09a8\u09cb \u09b9\u09b2\u09cb */\n    }\n    .qmk-scope .workspace > * {\n      min-width: 0;\n      max-width: 100%; /* \u0997\u09cd\u09b0\u09bf\u09a1 \u099a\u09be\u0987\u09b2\u09cd\u09a1\u09c7\u09b0 \u0986\u0995\u09be\u09b0 \u09af\u09c7\u09a8 \u09b8\u09cd\u0995\u09cd\u09b0\u09bf\u09a8\u09c7\u09b0 \u099a\u09c7\u09df\u09c7 \u09ac\u09dc \u09a8\u09be \u09b9\u09df */\n    }\n  }\n\n  /* ===== Left panel ===== */\n  .qmk-scope .panel{\n    background:#fffdf7;\n    border:1px solid var(--qpanel-line);\n    border-radius:16px;\n    box-shadow:var(--qshadow);\n    overflow:hidden;\n    margin-bottom:18px;\n  }\n  .qmk-scope .panel-head{\n    padding:14px 18px; background:var(--qgold-200);\n    border-bottom:1px solid var(--qpanel-line);\n    font-weight:700; font-size:15px; color:#3a2c07;\n    display:flex; align-items:center; justify-content:space-between; gap:8px;\n  }\n  .qmk-scope .panel-head.collapsible{cursor:pointer; user-select:none;}\n  .qmk-scope .panel-head .chevron{font-size:12px; color:#7a611e;}\n  .qmk-scope .panel-body.collapsed{display:none;}\n  .qmk-scope .panel-body{padding:16px 18px;}\n  .qmk-scope .field{margin-bottom:12px;}\n  .qmk-scope .field label{display:block; font-size:12.5px; font-weight:600; color:#4a5a4f; margin-bottom:4px;}\n  .qmk-scope .field input, .qmk-scope .field select, .qmk-scope .field textarea{\n    width:100%; padding:8px 10px; border:1px solid #cfd6cd; border-radius:8px;\n    font-family:'Tiro Bangla',serif; font-size:14px; background:#fff;\n  }\n  .qmk-scope .field textarea{resize:vertical; min-height:44px;}\n  .qmk-scope .row2{display:grid; grid-template-columns:1fr 1fr; gap:10px;}\n\n  .qmk-scope .check-row{display:flex; align-items:center; gap:9px; margin-bottom:10px; font-size:13.5px; font-weight:600; color:#2f3d33;}\n  .qmk-scope .check-row input{width:17px; height:17px; accent-color:var(--qgreen-500); flex:none;}\n  .qmk-scope .layout-options{display:flex; flex-direction:column; gap:8px; margin-bottom:14px;}\n  .qmk-scope .layout-opt{\n    display:flex; align-items:center; gap:10px; border:1px solid #cfd6cd; border-radius:10px;\n    padding:9px 10px; cursor:pointer; font-size:13px; font-weight:600; color:#33422f;\n  }\n  .qmk-scope .layout-opt.active{border-color:var(--qgreen-500); background:#eef6f0;}\n  .qmk-scope .layout-opt input{accent-color:var(--qgreen-500);}\n\n  .qmk-scope .type-grid{display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;}\n  .qmk-scope .type-btn{\n    border:1px dashed #a9b8ac; background:#f3f7f2; border-radius:10px;\n    padding:10px 8px; font-size:12.5px; font-weight:600; text-align:center; color:var(--qgreen-900);\n    cursor:pointer; transition:.15s;\n  }\n  .qmk-scope .type-btn:hover{background:var(--qgreen-500); color:#fff; border-color:var(--qgreen-500);}\n\n  .qmk-scope #qmkBuilderList{display:flex; flex-direction:column; gap:12px; margin-top:14px;}\n  .qmk-scope .qcard{\n    border:1px solid var(--qpanel-line); border-radius:12px; padding:12px; background:#fbfaf4;\n    position:relative;\n  }\n  .qmk-scope .qcard-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;}\n  .qmk-scope .qcard-tag{\n    font-size:11px; font-weight:700; color:#fff; background:var(--qgreen-500);\n    padding:3px 9px; border-radius:20px;\n  }\n  .qmk-scope .qcard-tools{display:flex; gap:6px;}\n  .qmk-scope .icon-btn{\n    width:26px; height:26px; border-radius:6px; border:1px solid #cfd6cd; background:#fff;\n    cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center;\n  }\n  .qmk-scope .icon-btn:hover{background:#eef2ec;}\n  .qmk-scope .icon-btn.danger{color:var(--qdanger); border-color:#e3bdb4;}\n  .qmk-scope .miniLabel{font-size:11.5px; color:#6b7a70; font-weight:600; margin:6px 0 3px;}\n  .qmk-scope .opt-row{display:flex; gap:6px; margin-bottom:5px; align-items:center;}\n  .qmk-scope .opt-row input[type=text]{flex:1;}\n  .qmk-scope .add-mini{font-size:12px; color:var(--qgreen-700); font-weight:700; cursor:pointer; background:none; border:none; padding:2px 0;}\n  .qmk-scope .empty-hint{padding:22px 14px; text-align:center; color:#7c8a80; font-size:13px; line-height:1.7;}\n\n  /* ===== Right: Paper preview ===== */\n  .qmk-scope .preview-wrap{\n    background:#fffdf7;\n    border-radius:16px;\n    padding:10px;\n    box-shadow:var(--qshadow);\n    display:flex; justify-content:center;\n    overflow-x:auto;\n    overflow-y:visible;\n    max-width: 100%;\n  }\n  \n  .qmk-scope .preview-page{\n    background:var(--qpaper);\n    border:1px solid var(--qpaper-edge);\n    box-shadow: 0 2px 8px rgba(0,0,0,0.12);\n    font-size:13.5px;\n    --q-gap:14px;\n  }\n  .qmk-scope .preview-page.layout-portrait{ width:100%; max-width:760px; padding:34px 38px 46px; min-height:900px;}\n  .qmk-scope .preview-page.layout-landscape-single{\n    width:100%; max-width:1180px; padding:30px 50px 40px;\n    columns:2; column-gap:44px;\n    column-fill:balance;\n  }\n  .qmk-scope .preview-page.layout-landscape-double{ width:100%; max-width:1180px; padding:26px 30px; display:flex; min-height:660px;}\n\n  .qmk-scope .paper-copy{flex:1; min-width:0; padding:0 22px; overflow:hidden;}\n  .qmk-scope .cut-line{\n    flex:none; width:1px; border-left:1px dashed #9a9a86; margin:0 4px;\n    position:relative;\n  }\n  .qmk-scope .cut-line::before{\n    content:'\u2702'; position:absolute; top:-4px; left:50%; transform:translate(-50%,-100%) rotate(90deg);\n    font-size:14px; color:#9a9a86;\n  }\n\n  .qmk-scope .p-institute{\n    text-align:center; font-family:'Tiro Bangla',serif; font-weight:700;\n    font-size:1.48em; color:#111; margin:0;\n  }\n  .qmk-scope .p-examtitle{text-align:center; font-size:1.07em; font-weight:600; color:#111; margin:4px 0 2px;}\n  .qmk-scope .p-classsubject{text-align:center; font-size:1em; font-weight:600; color:#111; margin:0 0 8px;}\n  .qmk-scope .p-rule-solid{border-top:1.5px solid #333; margin:6px 0 10px;}\n  .qmk-scope .p-top-ornament{\n    text-align:center; font-size:0.95em; letter-spacing:3px; color:var(--qgold-600); margin-bottom:6px;\n  }\n  .qmk-scope .p-meta-row{display:flex; justify-content:space-between; font-size:1em; margin-bottom:10px; font-weight:700;}\n  .qmk-scope .p-fillrow{font-size:1em; margin:5px 0; display:flex; gap:6px;}\n  .qmk-scope .p-fillrow .fill{flex:1; border-bottom:1px dotted #8a8a78; min-width:40px; height:1.2em;}\n  .qmk-scope .p-questions{margin-top:4px;}\n  .qmk-scope .p-q{margin-bottom:var(--q-gap, 14px);}\n  .qmk-scope .p-q-head{display:flex; justify-content:space-between; gap:10px; font-size:1.04em; font-weight:600; margin-bottom:4px;}\n  .qmk-scope .p-q-head .marks{white-space:nowrap; font-weight:700; color:var(--qink);}\n  .qmk-scope .p-sub{margin:3px 0 3px 20px; font-size:1em;}\n  .qmk-scope .p-blankline{border-bottom:1px dotted #8a8a78; height:1.5em; margin:4px 0;}\n  .qmk-scope .p-letterbox-row{display:flex; gap:6px; flex-wrap:wrap; margin:6px 0;}\n  .qmk-scope .p-letterbox{\n    width:2.35em; height:2.35em; border:1px solid #999; border-radius:4px;\n    display:flex; align-items:center; justify-content:center; font-size:1.04em; background:#fff;\n  }\n  .qmk-scope .p-blankbox{width:2.35em; height:2.35em; border:1px solid #999; border-radius:4px; background:#fff;}\n  .qmk-scope .p-opts{display:flex; flex-wrap:wrap; gap:14px; margin:4px 0 4px 20px; font-size:1em;}\n  .qmk-scope .p-match-cols{display:flex; gap:26px; margin:4px 0 4px 20px;}\n  .qmk-scope .p-match-col{flex:1;}\n  .qmk-scope .p-match-col div{font-size:1em; margin-bottom:5px;}\n  .qmk-scope .p-note{margin-top:6px; font-size:0.9em; color:#6b5b1c; font-style:italic;}\n  .qmk-scope .p-footer-space{height:6px;}\n\n  /* fractions & math */\n  .qmk-scope .frac{display:inline-flex; flex-direction:column; align-items:center; vertical-align:middle; margin:0 3px; line-height:1.05; font-size:0.95em;}\n  .qmk-scope .frac-num{padding:0 3px;}\n  .qmk-scope .frac-den{border-top:1px solid #222; padding:1px 3px 0;}\n  .qmk-scope .math-col{display:inline-block; font-family:'Courier New', monospace; font-size:1.15em; margin:6px 0 10px 20px; text-align:right;}\n  .qmk-scope .math-col-row{display:flex; justify-content:flex-end; gap:8px; padding:1px 2px;}\n  .qmk-scope .math-op{width:1em; text-align:left; font-weight:700;}\n  .qmk-scope .math-col-line{border-top:2px solid #222; margin-top:3px;}\n  .qmk-scope .math-col-answer{height:1.3em;}\n\n  .qmk-scope .p-arabic-passage{\n    font-family:'Amiri','Scheherazade New','Tiro Bangla',serif;\n    font-size:1.3em; line-height:2.15; margin:6px 0 10px;\n    white-space:normal; word-break:break-word; overflow-wrap:anywhere;\n    display:block; width:100%; box-sizing:border-box;\n    text-align:right; direction:rtl;\n  }\n  .qmk-scope .p-arabic-sub{\n    font-family:'Amiri','Scheherazade New','Tiro Bangla',serif;\n    font-size:1.1em; margin:4px 0 6px 0; line-height:1.9;\n    white-space:normal; word-break:break-word; overflow-wrap:anywhere;\n    display:block; width:100%; box-sizing:border-box;\n    text-align:right;\n  }\n\n  /* \u09ac\u09be\u099c\u09be\u09b0 \u09a4\u09be\u09b2\u09bf\u0995\u09be\u09b0 (bank) \u0995\u09be\u09b0\u09cd\u09a1 */\n  .qmk-scope .qmk-bank-row{border:1px solid var(--qpanel-line); border-radius:10px; padding:8px 10px; cursor:pointer; background:#fff; margin-bottom:8px;}\n  .qmk-scope .qmk-bank-row:hover{background:#f7f5ec;}\n\n  /* print \u2014 \u09aa\u09aa-\u0986\u09aa window \u098f \u09b8\u09b0\u09be\u09b8\u09b0\u09bf print \u09b9\u09ac\u09c7, \u09a4\u09be\u0987 body-level print CSS */\n  @media print{\n    body{ margin:0; padding:0; background:#fff; }\n    .preview-wrap{\n      padding:0 !important; background:none !important;\n      box-shadow:none !important; border-radius:0 !important;\n    }\n    .preview-page{\n      box-shadow:none !important; border:none !important;\n      width:100% !important; max-width:none !important;\n      margin:0 !important;\n    }\n    .preview-page.layout-portrait{\n      padding:14mm 16mm !important;\n      min-height:unset !important;\n    }\n    .preview-page.layout-landscape-double{\n      padding:10mm 12mm !important;\n      min-height:unset !important;\n    }\n    .preview-page.layout-landscape-single{\n      padding:10mm 14mm !important;\n    }\n  }";
  document.head.appendChild(st);
};

window.mountQuestionMakerLazy = async function(targetTabId, role) {
  try {
    if (typeof window.mountQuestionMaker !== 'function') {
      window._injectQmkStyles();
      await window.loadLazyModule('question-maker', 'js/question-maker.js');
    }
    if (typeof window.mountQuestionMaker === 'function') {
      window.mountQuestionMaker(targetTabId, role);
    } else {
      alert('প্রশ্ন মেকার লোড করতে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।');
    }
  } catch (e) {
    console.error(e);
    alert('প্রশ্ন মেকার লোড করতে সমস্যা হয়েছে।');
  }
};

// Private Class
window.pcMountLazy = async function(tabId) {
  try {
    if (typeof window.pcMount !== 'function') {
      await window.loadLazyModule('private-class', 'js/private-class.js');
    }
    if (typeof window.pcMount === 'function') {
      window.pcMount(tabId);
    } else {
      alert('প্রাইভেট ক্লাস লোড করতে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।');
    }
  } catch (e) {
    console.error(e);
    alert('প্রাইভেট ক্লাস লোড করতে সমস্যা হয়েছে।');
  }
};

// Income-Expense
window.ieInitLazy = async function() {
  try {
    if (typeof window.ieInit !== 'function') {
      await window.loadLazyModule('income-expense', 'js/income-expense.js');
    }
    if (typeof window.ieInit === 'function') {
      await window.ieInit();
    } else {
      alert('আয়-ব্যয় মডিউল লোড করতে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।');
    }
  } catch (e) {
    console.error(e);
    alert('আয়-ব্যয় মডিউল লোড করতে সমস্যা হয়েছে।');
  }
};

// NAC (Admit Card) + CSS
window.ensureNacLoaded = async function() {
  if (typeof window.nacPreview === 'function' || typeof window.nacPreviewFromReport === 'function') {
    return;
  }
  await window.loadLazyCSS('nac-admit', 'js/nac-admit.css');
  await window.loadLazyModule('nac-admit', 'js/nac-admit.js');
};

window.nacPreviewFromReportLazy = async function() {
  try {
    await window.ensureNacLoaded();
    if (typeof window.nacPreviewFromReport === 'function') {
      window.nacPreviewFromReport();
    } else {
      alert('প্রবেশপত্র মডিউল লোড করতে সমস্যা হয়েছে।');
    }
  } catch (e) {
    console.error(e);
    alert('প্রবেশপত্র মডিউল লোড করতে সমস্যা হয়েছে।');
  }
};

window.nacDirectPrintFromReportLazy = async function() {
  try {
    await window.ensureNacLoaded();
    if (typeof window.nacDirectPrintFromReport === 'function') {
      window.nacDirectPrintFromReport();
    } else {
      alert('প্রবেশপত্র মডিউল লোড করতে সমস্যা হয়েছে।');
    }
  } catch (e) {
    console.error(e);
    alert('প্রবেশপত্র মডিউল লোড করতে সমস্যা হয়েছে।');
  }
};

window.nacSetPerPage2Lazy = async function(n) {
  try {
    await window.ensureNacLoaded();
    if (typeof window.nacSetPerPage2 === 'function') {
      window.nacSetPerPage2(n);
    }
  } catch (e) {
    console.error(e);
  }
};

window.nacInitSectionLazy = async function() {
  try {
    await window.ensureNacLoaded();
    if (typeof window.nacInitSection === 'function') {
      window.nacInitSection();
    }
  } catch (e) {
    console.error(e);
  }
};
