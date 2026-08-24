
// =======================================================================
// ================= প্রশ্ন মেকার মডিউল (প্রশ্ন ব্যাংক) =================
// মাদ্রাসা ম্যানেজমেন্ট এপের সাথে সম্পূর্ণ ইন্টিগ্রেটেড — একই ফাইলে, একই Firebase
// =======================================================================
(function(){

  const qmkRoot = document.getElementById('qmkRoot');
  if(!qmkRoot) return;

  const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  function toBn(n){ return String(n).split('').map(ch => (ch>='0'&&ch<='9') ? bnDigits[+ch] : ch).join(''); }
  function bnToEn(str){
    return String(str||'').split('').map(ch=>{
      const i = bnDigits.indexOf(ch);
      return i>=0 ? i : ch;
    }).join('');
  }

  let qmkUidCounter = 1;
  function uid(){ return 'q' + (qmkUidCounter++); }

  let state = {
    layout: 'portrait-single',
    showAnswerSpace: true,
    showBismillah: false,
    showStudentInfo: false,
    fontScale: 100,
    gap: 14,
    questions: []
  };

  function defaultForType(type){
    const base = { id: uid(), type, marks: '১০' };
    switch(type){
      case 'arrange':
        return {...base, instruction:'১১ থেকে ৩০ পর্যন্ত ধারাবাহিকভাবে লেখ।', variant:'sequence', boxCount:10, letters:'', blanks:10};
      case 'fillblank':
        return {...base, sentence:'আল্লাহ্‌র নাম ______'};
      case 'mcq':
        return {...base, question:'যেকোনো একটি কবিতার প্রথম দশ লাইন লেখ।', options:['প্রার্থনা','আল আমিন'], marks:'১০'};
      case 'matching':
        return {...base, instruction:'বামের সাথে ডানের মিল করঃ', left:['আলিফ','বা','তা'], right:['১','২','৩'], marks:'১০'};
      case 'short':
        return {...base, question:'হরকত কয় প্রকার ও কি কি?', lines:2, marks:'৫'};
      case 'general':
        return {...base, question:'যে কোন পাঁচটি প্রশ্নের উত্তর লেখ।', subparts:['রাসূল (সাঃ) খালি হাতে বাড়ি গেলেন কেন?','কবি শিশুদের কিসের সাথে তুলনা করেছেন?'], lines:0};
      case 'mcqset':
        return {...base, instruction:'উত্তর লেখ।', marks:'২০', items:[
          {text:'কোনটি ব্যক্তিগত সম্পদ?', options:['বিদ্যালয়','নদী','কৃষকের জমি','রেলগাড়ি']},
          {text:'কোনটি রাষ্ট্রীয় সম্পদ?', options:['রাস্তাঘাট','তাঁতির তাঁত','কৃষকের জমি','জেলের জাল']}
        ]};
      case 'math':
        return {...base, marks:'১০', instruction:'নিচের অংকগুলো কর।', itemsPerRow:3, items:[
          {kind:'column', operator:'+', numbers:['২৪৫','১৩২','৫৬']},
          {kind:'column', operator:'−', numbers:['৯০০','৩৭৫']},
          {kind:'column', operator:'×', numbers:['৪৫','৬']}
        ]};
      case 'arabic':
        return {...base, marks:'১০', arabicHeading:false, instruction:'', passage:'إِنَّ اللَّهَ لَا يَسْتَحْيِي أَنْ يَضْرِبَ مَثَلًا مَّا بَعُوضَةً فَمَا فَوْقَهَا',
          subparts:[
            'ترجم الآيتين الكريمتين ثم اكتب محل إعراب "مثلاً"',
            'اكتب حل لغة "بعوضة" و "ميثاق"',
            'أعرب قوله تعالى: "ما يضل به إلا الفاسقين"',
            'ما معنى "ما" في قوله تعالى: "مثلاً ما"؟'
          ]};
    }
  }

  function typeLabel(t){
    return {arrange:'হরফ সাজাও', fillblank:'শূন্যস্থান পূরণ', mcq:'সঠিক উত্তর', matching:'ম্যাচিং', short:'সংক্ষিপ্ত উত্তর', general:'সাধারণ প্রশ্ন', mcqset:'MCQ সেট', math:'গণিত প্রশ্ন', arabic:'আরবি প্রশ্ন'}[t];
  }

  const arabicLabels = ['أ','ب','ج','د','هـ','و','ز','ح','ط','ي'];
  const arabicOrdinals = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر'];
  function arabicOrdinal(n){
    return arabicOrdinals[n-1] || ('رقم ' + n);
  }

  qmkRoot.querySelectorAll('.panel-head.collapsible').forEach(head=>{
    head.addEventListener('click', ()=>{
      const body = head.nextElementSibling;
      const isCollapsed = body.classList.toggle('collapsed');
      const chevron = head.querySelector('.chevron');
      if(chevron) chevron.textContent = isCollapsed ? '▸' : '▾';
    });
  });

  qmkRoot.querySelectorAll('.type-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      state.questions.push(defaultForType(btn.dataset.type));
      renderBuilder();
      renderPreview();
    });
  });

  ['qmkInstName','qmkExamTitle','qmkTimeAllowed','qmkTotalMarks','qmkExtraNote'].forEach(id=>{
    document.getElementById(id).addEventListener('input', renderPreview);
  });

  function applyPaperStyle(){
    const page = document.getElementById('qmkPreviewPage');
    const baseFontPx = 13.5;
    page.style.fontSize = (baseFontPx * (state.fontScale/100)) + 'px';
    page.style.setProperty('--q-gap', state.gap + 'px');
  }

  qmkRoot.querySelectorAll('#qmkLayoutOptions input[name=qmklayout]').forEach(radio=>{
    radio.addEventListener('change', e=>{
      state.layout = e.target.value;
      qmkRoot.querySelectorAll('.layout-opt').forEach(l=> l.classList.toggle('active', l.dataset.val===state.layout));
      updatePrintOrientation();
      renderPreview();
    });
  });
  qmkRoot.querySelector('.layout-opt[data-val="portrait-single"]').classList.add('active');

  // ফন্ট সাইজ স্লাইডার
  document.getElementById('qmkFontScaleRange').addEventListener('input', function(){
    state.fontScale = parseInt(this.value) || 100;
    document.getElementById('qmkFontScaleLabel').innerText = toBn(state.fontScale) + '%';
    applyPaperStyle();
  });

  // গ্যাপ স্লাইডার
  document.getElementById('qmkGapRange').addEventListener('input', function(){
    state.gap = parseInt(this.value) || 14;
    document.getElementById('qmkGapLabel').innerText = toBn(state.gap) + 'px';
    applyPaperStyle();
  });

  // বিসমিল্লাহ টগল
  document.getElementById('qmkToggleBismillah').addEventListener('change', function(){
    state.showBismillah = this.checked;
    renderPreview();
  });

  // শিক্ষার্থীর নাম/রোল টগল
  document.getElementById('qmkToggleStudentInfo').addEventListener('change', function(){
    state.showStudentInfo = this.checked;
    renderPreview();
  });

  // উত্তরের জায়গা টগল
  document.getElementById('qmkToggleAnswerSpace').addEventListener('change', function(){
    state.showAnswerSpace = this.checked;
    renderPreview();
  });

  function updatePrintOrientation(){
    const tag = document.getElementById('qmkPrintOrientation');
    if(state.layout === 'portrait-single'){
      tag.textContent = '@page { size: A4 portrait; margin: 12mm; }';
    } else {
      tag.textContent = '@page { size: A4 landscape; margin: 10mm; }';
    }
  }

  function moveQuestion(idx, dir){
    const newIdx = idx + dir;
    if(newIdx < 0 || newIdx >= state.questions.length) return;
    const arr = state.questions;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    renderBuilder();
    renderPreview();
  }
  function removeQuestion(idx){
    state.questions.splice(idx,1);
    renderBuilder();
    renderPreview();
  }

  function el(tag, attrs={}, children=[]){
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') e.className = v;
      else if(k==='html') e.innerHTML = v;
      else e.setAttribute(k,v);
    });
    children.forEach(c=> e.appendChild(c));
    return e;
  }

  function renderBuilder(){
    const list = document.getElementById('qmkBuilderList');
    list.innerHTML = '';
    if(state.questions.length === 0){
      list.appendChild(el('div',{class:'empty-hint', html:'উপরের বাটনগুলো থেকে প্রশ্নের ধরন বেছে প্রশ্ন যোগ করুন। ডান পাশে প্রশ্নপত্রের প্রিভিউ দেখতে পাবেন।'}));
      return;
    }
    state.questions.forEach((q, idx)=>{
      const card = el('div',{class:'qcard'});
      const top = el('div',{class:'qcard-top'});
      top.appendChild(el('span',{class:'qcard-tag', html: toBn(idx+1)+'নং &middot; '+typeLabel(q.type)}));
      const tools = el('div',{class:'qcard-tools'});
      const up = el('button',{class:'icon-btn'}); up.innerText='↑'; up.onclick=()=>moveQuestion(idx,-1);
      const down = el('button',{class:'icon-btn'}); down.innerText='↓'; down.onclick=()=>moveQuestion(idx,1);
      const del = el('button',{class:'icon-btn danger'}); del.innerText='✕'; del.onclick=()=>removeQuestion(idx);
      tools.append(up,down,del);
      top.appendChild(tools);
      card.appendChild(top);

      const marksField = el('div',{class:'field'});
      marksField.appendChild(el('label',{html:'নম্বর (মার্কস)'}));
      const marksInput = el('input',{type:'text', value:q.marks});
      marksInput.addEventListener('input', e=>{ q.marks = e.target.value; renderPreview(); });
      marksField.appendChild(marksInput);
      card.appendChild(marksField);

      if(q.type === 'arrange'){
        card.appendChild(labeledTextarea('নির্দেশনা / প্রশ্নের লেখা', q.instruction, v=>{q.instruction=v; renderPreview();}));

        const variantField = el('div',{class:'field'});
        variantField.appendChild(el('label',{html:'বক্সের ধরন'}));
        const variantSel = el('select',{});
        [
          ['sequence','শুধু ফাঁকা ঘর (ধারাবাহিক লেখার জন্য)'],
          ['mixed','একই সারিতে কিছু ঘর পূরণ করা + কিছু ফাঁকা'],
          ['given-below','উপরে শব্দ/সংখ্যা তালিকা + নিচে ফাঁকা ঘর (সাজানোর জন্য)']
        ].forEach(([val,lbl])=>{
          const opt = el('option',{value:val, html:lbl});
          if((q.variant||'sequence')===val) opt.setAttribute('selected','selected');
          variantSel.appendChild(opt);
        });
        variantSel.addEventListener('change', e=>{ q.variant = e.target.value; renderBuilder(); renderPreview(); });
        variantField.appendChild(variantSel);
        card.appendChild(variantField);

        const variant = q.variant || 'sequence';
        if(variant === 'sequence'){
          card.appendChild(labeledInput('মোট ফাঁকা ঘরের সংখ্যা', q.boxCount || q.blanks || 10, v=>{q.boxCount=v; renderPreview();}, 'number'));
        } else if(variant === 'mixed'){
          card.appendChild(labeledTextarea('সারির ঘরগুলো (কমা দিয়ে আলাদা করুন; ফাঁকা রাখতে ঐ জায়গায় কিছু না লিখে শুধু কমা দিন)। যেমনঃ ১১,,,,১৪,,,,,,,১৮', q.rowText || '', v=>{q.rowText=v; renderPreview();}));
        } else {
          card.appendChild(labeledTextarea('শব্দ/হরফ/সংখ্যাগুলো (কমা দিয়ে আলাদা করুন) — উপরে তালিকা আকারে দেখাবে', q.letters, v=>{q.letters=v; renderPreview();}));
          card.appendChild(labeledInput('নিচে ফাঁকা ঘরের সংখ্যা', q.blanks, v=>{q.blanks=v; renderPreview();}, 'number'));
        }
      }
      else if(q.type === 'fillblank'){
        card.appendChild(labeledTextarea('বাক্য (ফাঁকা স্থান বোঝাতে ______ ব্যবহার করুন)', q.sentence, v=>{q.sentence=v; renderPreview();}));
      }
      else if(q.type === 'mcq'){
        card.appendChild(labeledTextarea('প্রশ্ন', q.question, v=>{q.question=v; renderPreview();}));
        card.appendChild(el('div',{class:'miniLabel', html:'অপশনসমূহ'}));
        const optWrap = el('div');
        q.options.forEach((opt, oi)=>{
          const row = el('div',{class:'opt-row'});
          const inp = el('input',{type:'text', value:opt});
          inp.addEventListener('input', e=>{ q.options[oi]=e.target.value; renderPreview(); });
          const rm = el('button',{class:'icon-btn danger'}); rm.innerText='✕';
          rm.onclick=()=>{ q.options.splice(oi,1); renderBuilder(); renderPreview(); };
          row.append(inp, rm);
          optWrap.appendChild(row);
        });
        card.appendChild(optWrap);
        const addOpt = el('button',{class:'add-mini', html:'+ অপশন যোগ করুন'});
        addOpt.onclick=()=>{ q.options.push('নতুন অপশন'); renderBuilder(); renderPreview(); };
        card.appendChild(addOpt);
      }
      else if(q.type === 'matching'){
        card.appendChild(labeledTextarea('নির্দেশনা', q.instruction, v=>{q.instruction=v; renderPreview();}));
        card.appendChild(el('div',{class:'miniLabel', html:'বাম কলাম (এক লাইনে একটি করে)'}));
        const leftTA = el('textarea',{}); leftTA.value = q.left.join('\n');
        leftTA.addEventListener('input', e=>{ q.left = e.target.value.split('\n'); renderPreview(); });
        card.appendChild(leftTA);
        card.appendChild(el('div',{class:'miniLabel', html:'ডান কলাম (এক লাইনে একটি করে)'}));
        const rightTA = el('textarea',{}); rightTA.value = q.right.join('\n');
        rightTA.addEventListener('input', e=>{ q.right = e.target.value.split('\n'); renderPreview(); });
        card.appendChild(rightTA);
      }
      else if(q.type === 'short'){
        card.appendChild(labeledTextarea('প্রশ্ন', q.question, v=>{q.question=v; renderPreview();}));
        card.appendChild(labeledInput('উত্তরের জন্য লাইন সংখ্যা (উত্তর-স্থান চালু থাকলে দেখাবে)', q.lines, v=>{q.lines=v; renderPreview();}, 'number'));
      }
      else if(q.type === 'general'){
        card.appendChild(labeledTextarea('প্রশ্ন / নির্দেশনা', q.question, v=>{q.question=v; renderPreview();}));
        card.appendChild(el('div',{class:'miniLabel', html:'উপ-প্রশ্ন (ক, ১, a ইত্যাদি নিজে লিখে দিন) — ঐচ্ছিক'}));
        const subWrap = el('div');
        q.subparts.forEach((sp, si)=>{
          const row = el('div',{class:'opt-row'});
          const inp = el('input',{type:'text', value:sp});
          inp.addEventListener('input', e=>{ q.subparts[si]=e.target.value; renderPreview(); });
          const rm = el('button',{class:'icon-btn danger'}); rm.innerText='✕';
          rm.onclick=()=>{ q.subparts.splice(si,1); renderBuilder(); renderPreview(); };
          row.append(inp, rm);
          subWrap.appendChild(row);
        });
        card.appendChild(subWrap);
        const addSub = el('button',{class:'add-mini', html:'+ উপ-প্রশ্ন যোগ করুন'});
        addSub.onclick=()=>{ q.subparts.push('নতুন উপ-প্রশ্ন'); renderBuilder(); renderPreview(); };
        card.appendChild(addSub);
        card.appendChild(labeledInput('উত্তরের জন্য লাইন সংখ্যা (০ = নেই, উত্তর-স্থান চালু থাকলে দেখাবে)', q.lines, v=>{q.lines=v; renderPreview();}, 'number'));
      }
      else if(q.type === 'mcqset'){
        card.appendChild(labeledTextarea('নির্দেশনা (যেমনঃ উত্তর লেখ।)', q.instruction, v=>{q.instruction=v; renderPreview();}));
        card.appendChild(el('div',{class:'miniLabel', html:'উপ-প্রশ্নসমূহ (প্রতিটির নিজস্ব অপশন থাকবে)'}));
        const itemsWrap = el('div');
        q.items.forEach((item, ii)=>{
          const itemBox = el('div',{style:'border:1px solid #d8e0d5;border-radius:8px;padding:8px 8px 4px;margin-bottom:8px;background:#fff;'});
          const itemTop = el('div',{style:'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;'});
          itemTop.appendChild(el('span',{style:'font-size:12px; font-weight:700; color:var(--qgreen-700);', html:'উপ-প্রশ্ন '+toBn(ii+1)}));
          const rmItem = el('button',{class:'icon-btn danger'}); rmItem.innerText='✕';
          rmItem.onclick=()=>{ q.items.splice(ii,1); renderBuilder(); renderPreview(); };
          itemTop.appendChild(rmItem);
          itemBox.appendChild(itemTop);

          const textTA = el('textarea',{}); textTA.value = item.text;
          textTA.addEventListener('input', e=>{ item.text = e.target.value; renderPreview(); });
          itemBox.appendChild(textTA);

          itemBox.appendChild(el('div',{class:'miniLabel', html:'অপশনসমূহ'}));
          const optsWrap = el('div');
          item.options.forEach((opt, oi)=>{
            const row = el('div',{class:'opt-row'});
            const inp = el('input',{type:'text', value:opt});
            inp.addEventListener('input', e=>{ item.options[oi] = e.target.value; renderPreview(); });
            const rmOpt = el('button',{class:'icon-btn danger'}); rmOpt.innerText='✕';
            rmOpt.onclick=()=>{ item.options.splice(oi,1); renderBuilder(); renderPreview(); };
            row.append(inp, rmOpt);
            optsWrap.appendChild(row);
          });
          itemBox.appendChild(optsWrap);
          const addOpt = el('button',{class:'add-mini', html:'+ অপশন যোগ করুন'});
          addOpt.onclick=()=>{ item.options.push('নতুন অপশন'); renderBuilder(); renderPreview(); };
          itemBox.appendChild(addOpt);

          itemsWrap.appendChild(itemBox);
        });
        card.appendChild(itemsWrap);
        const addItem = el('button',{class:'add-mini', html:'+ উপ-প্রশ্ন যোগ করুন'});
        addItem.onclick=()=>{ q.items.push({text:'নতুন উপ-প্রশ্ন', options:['অপশন ১','অপশন ২']}); renderBuilder(); renderPreview(); };
        card.appendChild(addItem);
      }
      else if(q.type === 'math'){
        card.appendChild(labeledTextarea('নির্দেশনা', q.instruction, v=>{q.instruction=v; renderPreview();}));
        card.appendChild(labeledInput('এক সারিতে কয়টি অংক পাশাপাশি দেখাবে', q.itemsPerRow || 1, v=>{q.itemsPerRow=v; renderPreview();}, 'number'));
        card.appendChild(el('div',{class:'miniLabel', html:'গণিতের অংশসমূহ'}));
        const mathWrap = el('div');
        q.items.forEach((item, ii)=>{
          const box = el('div',{style:'border:1px solid #d8e0d5;border-radius:8px;padding:8px;margin-bottom:8px;background:#fff;'});
          const topRow = el('div',{style:'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;'});
          topRow.appendChild(el('span',{style:'font-size:12px;font-weight:700;color:var(--qgreen-700);', html:'অংশ '+toBn(ii+1)}));
          const rmItem = el('button',{class:'icon-btn danger'}); rmItem.innerText='✕';
          rmItem.onclick=()=>{ q.items.splice(ii,1); renderBuilder(); renderPreview(); };
          topRow.appendChild(rmItem);
          box.appendChild(topRow);

          const kindSel = el('select',{});
          [['column','কলাম আকারে যোগ/বিয়োগ/গুণ/ভাগ'],['expression','রাশি / ভগ্নাংশ / সরল (টেক্সট)']].forEach(([k,lbl])=>{
            const opt = el('option',{value:k, html:lbl});
            if(item.kind===k) opt.setAttribute('selected','selected');
            kindSel.appendChild(opt);
          });
          kindSel.addEventListener('change', e=>{ item.kind = e.target.value; renderBuilder(); renderPreview(); });
          box.appendChild(kindSel);

          if(item.kind === 'column'){
            box.appendChild(el('div',{class:'miniLabel', html:'চিহ্ন (Operator)'}));
            const opSel = el('select',{});
            ['+','−','×','÷'].forEach(sym=>{
              const opt = el('option',{value:sym, html:sym});
              if(item.operator===sym) opt.setAttribute('selected','selected');
              opSel.appendChild(opt);
            });
            opSel.addEventListener('change', e=>{ item.operator = e.target.value; renderPreview(); });
            box.appendChild(opSel);
            box.appendChild(el('div',{class:'miniLabel', html:'সংখ্যাগুলো (এক লাইনে একটি করে, উপর থেকে নিচে, শেষেরটি উত্তরের ঠিক উপরে বসবে)'}));
            const numTA = el('textarea',{}); numTA.value = (item.numbers||[]).join('\n');
            numTA.addEventListener('input', e=>{ item.numbers = e.target.value.split('\n'); renderPreview(); });
            box.appendChild(numTA);
          } else {
            box.appendChild(el('div',{class:'miniLabel', html:'রাশি/টেক্সট — ভগ্নাংশের জন্য যেমন ৩/৪ লিখুন, এটি স্বয়ংক্রিয়ভাবে উপরে-নিচে দেখাবে'}));
            const exprTA = el('textarea',{}); exprTA.value = item.text || '';
            exprTA.addEventListener('input', e=>{ item.text = e.target.value; renderPreview(); });
            box.appendChild(exprTA);
          }
          mathWrap.appendChild(box);
        });
        card.appendChild(mathWrap);
        const addColBtn = el('button',{class:'add-mini', html:'+ কলাম যোগ/বিয়োগ যোগ করুন'});
        addColBtn.onclick=()=>{ q.items.push({kind:'column', operator:'+', numbers:['','']}); renderBuilder(); renderPreview(); };
        card.appendChild(addColBtn);
        card.appendChild(document.createTextNode('  '));
        const addExprBtn = el('button',{class:'add-mini', html:'+ রাশি/ভগ্নাংশ যোগ করুন'});
        addExprBtn.onclick=()=>{ q.items.push({kind:'expression', text:''}); renderBuilder(); renderPreview(); };
        card.appendChild(addExprBtn);
      }
      else if(q.type === 'arabic'){
        const headingRow = el('label',{class:'check-row'});
        const headingCb = el('input',{type:'checkbox'});
        if(q.arabicHeading) headingCb.setAttribute('checked','checked');
        headingCb.addEventListener('change', e=>{ q.arabicHeading = e.target.checked; renderPreview(); });
        headingRow.appendChild(headingCb);
        headingRow.appendChild(document.createTextNode('আরবি ধাঁচে "السؤال الأول" শিরোনাম দেখান (অফ থাকলে বাংলা "নং প্রশ্ন" দেখাবে)'));
        card.appendChild(headingRow);

        card.appendChild(labeledInputAuto('নং প্রশ্নের পাশে লেখা (ঐচ্ছিক — বাংলা বা আরবি যেকোনোটাই লিখুন)', q.instruction || '', v=>{q.instruction=v; renderPreview();}));

        card.appendChild(labeledTextareaAuto('আরবি/কুরআনের অংশ (Passage) — বাংলা লিখলেও চলবে', q.passage, v=>{q.passage=v; renderPreview();}));
        card.appendChild(el('div',{class:'miniLabel', html:'উপ-প্রশ্ন (أ، ب، ج، د...) — আরবি বা বাংলা, দুটোই লেখা যাবে'}));
        const subWrap = el('div');
        q.subparts.forEach((sp, si)=>{
          const row = el('div',{class:'opt-row'});
          const inp = el('input',{type:'text', value:sp, dir:'auto', style:"font-family:'Amiri','Hind Siliguri',serif;"});
          inp.addEventListener('input', e=>{ q.subparts[si]=e.target.value; renderPreview(); });
          const rm = el('button',{class:'icon-btn danger'}); rm.innerText='✕';
          rm.onclick=()=>{ q.subparts.splice(si,1); renderBuilder(); renderPreview(); };
          row.append(inp, rm);
          subWrap.appendChild(row);
        });
        card.appendChild(subWrap);
        const addSub = el('button',{class:'add-mini', html:'+ উপ-প্রশ্ন যোগ করুন'});
        addSub.onclick=()=>{ q.subparts.push('نص جديد'); renderBuilder(); renderPreview(); };
        card.appendChild(addSub);
      }

      list.appendChild(card);
    });
  }

  function labeledInput(label, value, onchange, type='text'){
    const f = el('div',{class:'field'});
    f.appendChild(el('label',{html:label}));
    const inp = el('input',{type, value});
    inp.addEventListener('input', e=> onchange(e.target.value));
    f.appendChild(inp);
    return f;
  }
  function labeledTextarea(label, value, onchange){
    const f = el('div',{class:'field'});
    f.appendChild(el('label',{html:label}));
    const ta = el('textarea',{}); ta.value = value;
    ta.addEventListener('input', e=> onchange(e.target.value));
    f.appendChild(ta);
    return f;
  }
  function labeledTextareaAuto(label, value, onchange){
    const f = el('div',{class:'field'});
    f.appendChild(el('label',{html:label}));
    const ta = el('textarea',{dir:'auto', style:"font-family:'Amiri','Scheherazade New','Hind Siliguri',serif; font-size:15px; min-height:70px;"});
    ta.value = value;
    ta.addEventListener('input', e=> onchange(e.target.value));
    f.appendChild(ta);
    return f;
  }
  function labeledInputAuto(label, value, onchange){
    const f = el('div',{class:'field'});
    f.appendChild(el('label',{html:label}));
    const inp = el('input',{type:'text', dir:'auto', value, style:"font-family:'Amiri','Hind Siliguri',serif;"});
    inp.addEventListener('input', e=> onchange(e.target.value));
    f.appendChild(inp);
    return f;
  }

  const banglaLabels = ['ক','খ','গ','ঘ','ঙ','চ','ছ','জ'];

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderRich(text){
    let t = escapeHtml(text||'');
    t = t.replace(/([০-৯0-9]+)\/([০-৯0-9]+)/g, '<span class="frac"><span class="frac-num">$1</span><span class="frac-den">$2</span></span>');
    t = t.replace(/_{2,}/g, '<span style="display:inline-block;min-width:60px;border-bottom:1px dotted #444;">&nbsp;</span>');
    return t;
  }

  function qHead(num, text, marks){
    const body = renderRich(text);
    return `<div class="p-q-head"><span>${num} নং প্রশ্ন : ${body}</span><span class="marks">${escapeHtml(marks||'')}</span></div>`;
  }

  function buildPaperInner(){
    const instName = document.getElementById('qmkInstName').value;
    const examTitle = document.getElementById('qmkExamTitle').value;
    const className = document.getElementById('qmkClassName').value;
    const subjectName = document.getElementById('qmkSubjectName').value;
    const timeAllowed = document.getElementById('qmkTimeAllowed').value;
    const totalMarks = document.getElementById('qmkTotalMarks').value;
    const extraNote = document.getElementById('qmkExtraNote').value;

    let html = '';
    if(state.showBismillah){
      html += `<div class="p-top-ornament">۞ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞</div>`;
    }
    html += `<h2 class="p-institute">${escapeHtml(instName)}</h2>`;
    html += `<div class="p-examtitle">${escapeHtml(examTitle)}</div>`;
    html += `<div class="p-classsubject">শ্রেণিঃ ${escapeHtml(className)} | বিষয়ঃ ${escapeHtml(subjectName)}</div>`;
    html += `<div class="p-rule-solid"></div>`;
    html += `<div class="p-meta-row"><span>পূর্ণমান ${escapeHtml(totalMarks)}</span><span>সময় ${escapeHtml(timeAllowed)}</span></div>`;
    if(state.showStudentInfo){
      html += `<div class="p-fillrow"><span>শিক্ষার্থীর নামঃ</span><div class="fill"></div></div>`;
      html += `<div class="p-fillrow"><span>রোল নংঃ</span><div class="fill" style="max-width:90px;"></div><span>মাদরাসাঃ</span><div class="fill"></div></div>`;
    }

    html += `<div class="p-questions">`;
    state.questions.forEach((q, idx)=>{
      const num = toBn(idx+1);
      html += `<div class="p-q">`;
      if(q.type === 'arrange'){
        html += qHead(num, q.instruction, q.marks);
        const variant = q.variant || 'sequence';
        if(variant === 'sequence'){
          const n = parseInt(bnToEn(q.boxCount)) || parseInt(bnToEn(q.blanks)) || 10;
          html += `<div class="p-letterbox-row">` + Array.from({length:n}).map(()=>`<div class="p-blankbox"></div>`).join('') + `</div>`;
        } else if(variant === 'mixed'){
          const cells = (q.rowText||'').split(',').map(s=>s.trim());
          html += `<div class="p-letterbox-row">` + cells.map(c=> c ? `<div class="p-letterbox">${renderRich(c)}</div>` : `<div class="p-blankbox"></div>`).join('') + `</div>`;
        } else {
          const letters = (q.letters||'').split(',').map(s=>s.trim()).filter(Boolean);
          html += `<div style="font-size:1em; margin:2px 0 6px 4px;">${letters.map(l=>renderRich(l)).join(',&nbsp; ')}</div>`;
          const blankCount = parseInt(bnToEn(q.blanks)) || letters.length || 4;
          html += `<div class="p-letterbox-row">` + Array.from({length: blankCount}).map(()=>`<div class="p-blankbox"></div>`).join('') + `</div>`;
        }
      }
      else if(q.type === 'fillblank'){
        html += qHead(num, q.sentence, q.marks);
      }
      else if(q.type === 'mcq'){
        html += qHead(num, q.question, q.marks);
        html += `<div class="p-opts">` + (q.options||[]).map((o,i)=>`<span>(${banglaLabels[i]||i}) ${renderRich(o)}</span>`).join('') + `</div>`;
      }
      else if(q.type === 'matching'){
        html += qHead(num, q.instruction, q.marks);
        const left = q.left||[], right = q.right||[];
        const maxLen = Math.max(left.length, right.length);
        let leftCol = '', rightCol = '';
        for(let i=0;i<maxLen;i++){
          leftCol += `<div>(${banglaLabels[i]||i}) ${renderRich(left[i]||'')}</div>`;
          rightCol += `<div>${toBn(i+1)}. ${renderRich(right[i]||'')}</div>`;
        }
        html += `<div class="p-match-cols"><div class="p-match-col">${leftCol}</div><div class="p-match-col">${rightCol}</div></div>`;
      }
      else if(q.type === 'short'){
        html += qHead(num, q.question, q.marks);
        if(state.showAnswerSpace){
          const lines = parseInt(bnToEn(q.lines)) || 2;
          for(let i=0;i<lines;i++) html += `<div class="p-blankline"></div>`;
        }
      }
      else if(q.type === 'general'){
        html += qHead(num, q.question, q.marks);
        (q.subparts||[]).forEach((sp,si)=>{
          html += `<div class="p-sub">${renderRich(sp)}</div>`;
        });
        if(state.showAnswerSpace){
          const lines = parseInt(bnToEn(q.lines)) || 0;
          for(let i=0;i<lines;i++) html += `<div class="p-blankline"></div>`;
        }
      }
      else if(q.type === 'mcqset'){
        html += qHead(num, q.instruction, q.marks);
        (q.items||[]).forEach((item, ii)=>{
          html += `<div style="break-inside:avoid-column; margin-bottom:4px;">`;
          html += `<div style="font-weight:700; font-size:1em; margin:6px 0 3px 6px;">${toBn(ii+1)}) ${renderRich(item.text)}</div>`;
          html += `<div class="p-opts" style="margin-left:20px;">` + (item.options||[]).map((o,oi)=>`<span>(${banglaLabels[oi]||oi}) ${renderRich(o)}</span>`).join('') + `</div>`;
          html += `</div>`;
        });
      }
      else if(q.type === 'math'){
        html += qHead(num, q.instruction, q.marks);
        const perRow = parseInt(q.itemsPerRow) || 1;
        const gapPx = 22;
        const basis = perRow > 1 ? `calc(${(100/perRow).toFixed(3)}% - ${(gapPx*(perRow-1)/perRow).toFixed(2)}px)` : '100%';
        html += `<div style="display:flex; flex-wrap:wrap; gap:${gapPx}px; margin-top:4px;">`;
        (q.items||[]).forEach(item=>{
          html += `<div style="flex:0 0 ${basis}; max-width:${basis}; break-inside:avoid-column;">`;
          if(item.kind === 'column'){
            const nums = (item.numbers||[]).map(n=>String(n||'').trim()).filter(n=>n!=='');
            html += `<div class="math-col">`;
            nums.forEach((n,i)=>{
              const opChar = (i === nums.length-1) ? escapeHtml(item.operator||'+') : '&nbsp;';
              html += `<div class="math-col-row"><span class="math-op">${opChar}</span><span>${escapeHtml(n)}</span></div>`;
            });
            html += `<div class="math-col-line"></div>`;
            if(state.showAnswerSpace){
              html += `<div class="math-col-row math-col-answer"><span class="math-op">&nbsp;</span><span>&nbsp;</span></div>`;
            }
            html += `</div>`;
          } else {
            html += `<div class="p-sub" style="margin-left:6px;">${renderRich(item.text)}</div>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      }
      else if(q.type === 'arabic'){
        const numLabel = q.arabicHeading ? `السؤال ${arabicOrdinal(idx+1)}` : `${num} নং প্রশ্ন`;
        const headBody = q.instruction ? `${numLabel} : ${renderRich(q.instruction)}` : `${numLabel} :`;
        html += `<div class="p-q-head" dir="auto"><span>${headBody}</span><span class="marks">${escapeHtml(q.marks||'')}</span></div>`;
        html += `<div class="p-arabic-passage" dir="rtl">${escapeHtml(q.passage||'')}</div>`;
        (q.subparts||[]).forEach((sp,si)=>{
          html += `<div class="p-arabic-sub" dir="rtl">‏(${arabicLabels[si]||si}) ${escapeHtml(sp)}</div>`;
        });
      }
      html += `</div>`;
    });
    html += `</div>`;

    if(extraNote){
      html += `<div class="p-note">[ ${escapeHtml(extraNote)} ]</div>`;
    }
    html += `<div class="p-footer-space"></div>`;
    return html;
  }

  function renderPreview(){
    const page = document.getElementById('qmkPreviewPage');
    page.className = 'preview-page layout-' + state.layout;
    const inner = buildPaperInner();

    if(state.layout === 'landscape-double'){
      page.innerHTML =
        `<div class="paper-copy">${inner}</div>` +
        `<div class="cut-line"></div>` +
        `<div class="paper-copy">${inner}</div>`;
    } else {
      page.innerHTML = inner;
    }
    applyPaperStyle();
  }

  document.getElementById('qmkPrintBtn').addEventListener('click', ()=>{
    const styleEl  = document.getElementById('qmkStyles');
    const orientEl = document.getElementById('qmkPrintOrientation');
    const pageEl   = document.getElementById('qmkPreviewPage');
    const styleCSS  = styleEl  ? styleEl.textContent  : '';
    const orientCSS = orientEl ? orientEl.textContent : '';
    const pageHTML  = pageEl   ? pageEl.outerHTML      : '';

    // print এর জন্য complete HTML তৈরি
    const printHtml = `<!DOCTYPE html>
<html lang="bn"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&display=swap" rel="stylesheet">
<style>${orientCSS}</style>
<style>${styleCSS}</style>
<style>
  html,body{margin:0;padding:0;background:#fff;}
  *{font-family:'Tiro Bangla',serif !important;}
  #printBtn{display:block;width:100%;padding:12px;background:#1a5e1a;color:#fff;border:none;font-size:16px;font-weight:bold;cursor:pointer;}
  @media print{#printBtn{display:none!important;}}
  .qmk-scope .preview-wrap{padding:0!important;background:none!important;box-shadow:none!important;border-radius:0!important;display:flex;justify-content:center;}
  .qmk-scope .preview-page{background:#fff!important;box-shadow:none!important;border:none!important;width:100%!important;max-width:none!important;}
  .qmk-scope .paper-copy{background:#fff!important;}
  .qmk-scope .preview-page.layout-portrait{padding:14mm 16mm!important;min-height:unset!important;}
  .qmk-scope .preview-page.layout-landscape-double{padding:10mm 12mm!important;min-height:unset!important;}
  .qmk-scope .preview-page.layout-landscape-single{padding:10mm 14mm!important;}
</style>
</head>
<body>
<button id="printBtn" onclick="window.print()">🖨️ প্রিন্ট / PDF সেভ করুন</button>
<div class="qmk-scope"><div class="preview-wrap">${pageHTML}</div></div>
<script>
</body></html>`;

    // Android WebView — reportViewContent এ content বসিয়ে Android.print() call
    if(typeof Android !== 'undefined' && Android.print){
      const reportContent = document.getElementById('reportViewContent');
      if(reportContent){
        // print CSS যোগ করো
        let printStyleEl = document.getElementById('qmkAndroidPrintStyle');
        if(!printStyleEl){
          printStyleEl = document.createElement('style');
          printStyleEl.id = 'qmkAndroidPrintStyle';
          document.head.appendChild(printStyleEl);
        }
        printStyleEl.textContent = `
          @media print {
            body > *:not(#reportViewModal) { display:none !important; }
            #reportViewModal { display:block !important; position:static !important; background:#fff !important; }
            #reportViewModal .modal-content { max-width:100% !important; width:100% !important; margin:0 !important; box-shadow:none !important; border-radius:0 !important; }
            .modal-header, .modal-footer, .no-print, #printSettingsPanel { display:none !important; }
            #reportViewContent { background:#fff !important; width:100% !important; }
            #reportViewContent .qmk-scope .preview-page {
              background:#fff !important;
              box-shadow:none !important; border:none !important;
              width:100% !important; max-width:none !important;
            }
            #reportViewContent .qmk-scope .paper-copy {
              background:#fff !important;
            }
            #reportViewContent .qmk-scope .preview-wrap {
              width:100% !important; justify-content:center !important;
            }
          }
        `;
        // reportViewContent এ প্রশ্নের HTML বসাও
        // landscape-double হলে modal fullwidth করো
        const modalContent = document.querySelector('#reportViewModal .modal-content');
        const isDouble = pageEl.classList.contains('layout-landscape-double');
        const isLandscape = isDouble || pageEl.classList.contains('layout-landscape-single');
        if(modalContent && isLandscape){
          modalContent._origMaxWidth = modalContent.style.maxWidth;
          modalContent.style.maxWidth = '100%';
          modalContent.style.width = '100%';
        }
        reportContent.innerHTML = `<div class="qmk-scope"><div class="preview-wrap" style="padding:0;background:none;box-shadow:none;display:flex;justify-content:center;width:100%;">${pageHTML}</div></div>`;
        Android.print();

        // প্রিন্ট থেকে ফিরলে reportViewContent পরিষ্কার করো এবং preview পুনরায় render করো
        const qmkRestoreAfterPrint = ()=>{
          if(document.visibilityState === 'visible'){
            document.removeEventListener('visibilitychange', qmkRestoreAfterPrint);
            reportContent.innerHTML = '';
            if(modalContent && isLandscape){
              modalContent.style.maxWidth = modalContent._origMaxWidth || '';
              modalContent.style.width = '';
            }
            const ps = document.getElementById('qmkAndroidPrintStyle');
            if(ps) ps.textContent = '';
            // state অক্ষুণ্ণ রেখে শুধু preview পুনরায় render
            if(state.questions && state.questions.length > 0){
              renderPreview();
            }
          }
        };
        document.addEventListener('visibilitychange', qmkRestoreAfterPrint);

        setTimeout(()=>{
          document.removeEventListener('visibilitychange', qmkRestoreAfterPrint);
          reportContent.innerHTML = '';
          if(modalContent && isLandscape){
            modalContent.style.maxWidth = modalContent._origMaxWidth || '';
            modalContent.style.width = '';
          }
          if(state.questions && state.questions.length > 0){
            renderPreview();
          }
        }, 5000);
        return;
      }
    }

    // Browser / সাধারণ ব্রাউজার — Blob URL দিয়ে নতুন tab
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 3000);
  });

  // =====================================================================
  // ============ মাদ্রাসা ম্যানেজমেন্ট এপের সাথে Firestore ইন্টিগ্রেশন ============
  // (একই db, একই currentUserData/currentMadrasaId ব্যবহার করা হচ্ছে — কোনো
  //  আলাদা Firebase init বা আলাদা ফাইল দরকার নেই)
  // =====================================================================
  let qmkCtx = { role:'teacher', uid:'', uname:'', madrasaId:'', instName:'', year:'', classes:[], subjects:[] };
  let qmkEditingDocId = null;

  const qmkBankClassFilter = document.getElementById('qmkBankClassFilter');
  const qmkBankListEl = document.getElementById('qmkBankList');
  const qmkBankStatus = document.getElementById('qmkBankStatus');
  const qmkCurrentPaperLabel = document.getElementById('qmkCurrentPaperLabel');
  const qmkClassSelect = document.getElementById('qmkClassName');
  const qmkSubjectInput = document.getElementById('qmkSubjectName');
  const qmkSubjectDatalist = document.getElementById('qmkSubjectDatalist');

  function qmkSetLabel(text){ qmkCurrentPaperLabel.textContent = text || ''; }

  function qmkPopulateClassSelect(){
    qmkClassSelect.innerHTML = '<option value="">-- ক্লাস নির্বাচন করুন --</option>';
    qmkCtx.classes.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c.name; opt.dataset.id = c.id; opt.textContent = c.name;
      qmkClassSelect.appendChild(opt);
    });
  }
  function qmkCurrentClassId(){
    const opt = qmkClassSelect.selectedOptions && qmkClassSelect.selectedOptions[0];
    return opt ? (opt.dataset.id || '') : '';
  }
  function qmkPopulateSubjectDatalist(){
    const clsId = qmkCurrentClassId();
    qmkSubjectDatalist.innerHTML = '';
    qmkCtx.subjects.filter(s=> !clsId || s.classId === clsId).forEach(s=>{
      const opt = document.createElement('option');
      opt.value = s.name;
      qmkSubjectDatalist.appendChild(opt);
    });
  }
  qmkClassSelect.addEventListener('change', ()=>{ qmkPopulateSubjectDatalist(); renderPreview(); });
  qmkSubjectInput.addEventListener('input', renderPreview);

  function qmkPopulateBankClassFilter(){
    qmkBankClassFilter.innerHTML = '';
    // সবার জন্য প্রথমে placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— একটি ক্লাস নির্ধারণ করুন —';
    placeholder.disabled = true;
    placeholder.selected = true;
    qmkBankClassFilter.appendChild(placeholder);
    qmkCtx.classes.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name;
      qmkBankClassFilter.appendChild(opt);
    });
  }
  function qmkClassNameById(id){
    const c = qmkCtx.classes.find(c=>c.id===id);
    return c ? c.name : (id || '');
  }

  let qmkLoading = false;
  async function qmkLoadPaper(docId){
    if(qmkLoading) return;
    qmkLoading = true;
    qmkBankStatus.textContent = 'লোড হচ্ছে...';
    try{
      const doc = await db.collection('questionPapers').doc(docId).get();
      if(!doc.exists){ alert('প্রশ্নপত্রটি পাওয়া যায়নি।'); qmkBankStatus.textContent=''; qmkLoading=false; return; }
      const data = doc.data();
      qmkEditingDocId = docId;

      document.getElementById('qmkInstName').value = data.instName || qmkCtx.instName || '';
      document.getElementById('qmkExamTitle').value = data.examTitle || '';
      document.getElementById('qmkTimeAllowed').value = data.timeAllowed || '';
      document.getElementById('qmkTotalMarks').value = data.totalMarks || '';
      document.getElementById('qmkExtraNote').value = data.extraNote || '';

      qmkClassSelect.value = data.className || '';
      if(qmkClassSelect.value !== (data.className||'')){
        const opt = document.createElement('option');
        opt.value = data.className || ''; opt.dataset.id = data.classId || ''; opt.textContent = data.className || '';
        qmkClassSelect.appendChild(opt);
        qmkClassSelect.value = data.className || '';
      }
      qmkPopulateSubjectDatalist();
      qmkSubjectInput.value = data.subjectName || '';

      const settings = data.settings || {};
      state.layout        = settings.layout        || 'portrait-single';
      state.showAnswerSpace = settings.showAnswerSpace !== undefined ? !!settings.showAnswerSpace : true;
      state.showBismillah   = !!settings.showBismillah;
      state.showStudentInfo = !!settings.showStudentInfo;
      state.fontScale     = settings.fontScale || 100;
      state.gap           = settings.gap       || 14;

      const radio = qmkRoot.querySelector(`#qmkLayoutOptions input[value="${state.layout}"]`);
      if(radio) radio.checked = true;
      qmkRoot.querySelectorAll('.layout-opt').forEach(l=> l.classList.toggle('active', l.dataset.val===state.layout));
      document.getElementById('qmkToggleAnswerSpace').checked = state.showAnswerSpace;
      document.getElementById('qmkToggleBismillah').checked   = state.showBismillah;
      document.getElementById('qmkToggleStudentInfo').checked = state.showStudentInfo;
      document.getElementById('qmkFontScaleRange').value      = state.fontScale;
      document.getElementById('qmkFontScaleLabel').innerText  = toBn(state.fontScale) + '%';
      document.getElementById('qmkGapRange').value            = state.gap;
      document.getElementById('qmkGapLabel').innerText        = toBn(state.gap) + 'px';

      state.questions = data.questions || [];
      updatePrintOrientation();
      applyPaperStyle();
      renderBuilder();
      renderPreview();
      qmkSetLabel('📝 সম্পাদনাঃ ' + (data.examTitle || ''));
      qmkBankStatus.textContent = '';
    }catch(err){
      console.error(err);
      qmkBankStatus.textContent = '';
      alert('প্রশ্নপত্র লোড করতে সমস্যা হয়েছে।');
    } finally {
      qmkLoading = false;
    }
  }

  async function qmkDeletePaper(docId, ev){
    if(ev) ev.stopPropagation();
    if(!confirm('আপনি কি নিশ্চিতভাবে এই প্রশ্নপত্রটি মুছে ফেলতে চান?')) return;
    try{
      await db.collection('questionPapers').doc(docId).delete();
      if(qmkEditingDocId === docId){ qmkNewPaper(); }
      qmkRefreshBankList();
    }catch(err){
      console.error(err);
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    }
  }
  // ─── অনুমতি ব্যবস্থাপনা ───
  async function qmkOpenShareModal(paperId, ev) {
    if(ev) ev.stopPropagation();
    const modal = document.getElementById('qmkShareModal');
    modal.dataset.paperId = paperId;
    const doc = await db.collection('questionPapers').doc(paperId).get();
    const data = doc.data() || {};
    const sharedWith = data.sharedWith || [];
    const teacherList = teachers.filter(t => t.status !== 'inactive');
    const listEl = document.getElementById('qmkShareTeacherList');
    listEl.innerHTML = teacherList.length === 0
      ? '<div style="color:#aaa;text-align:center;padding:12px;">কোনো শিক্ষক নেই।</div>'
      : teacherList.map(t => `
        <label style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #f0f0f0;cursor:pointer;">
          <input type="checkbox" value="${t.id}" ${sharedWith.includes(t.id) ? 'checked' : ''}
            style="width:16px;height:16px;accent-color:var(--qprimary);">
          <span style="font-size:13px;">${escapeHtml(t.name)}</span>
          ${sharedWith.includes(t.id) ? '<span style="font-size:11px;background:#e8f5e9;color:#1a5e1a;padding:1px 7px;border-radius:10px;margin-left:auto;">অনুমতি আছে</span>' : ''}
        </label>`).join('');
    modal.style.display = 'flex';
  }

  async function qmkSaveSharePermission() {
    const modal = document.getElementById('qmkShareModal');
    const paperId = modal.dataset.paperId;
    const checked = [...document.querySelectorAll('#qmkShareTeacherList input[type=checkbox]:checked')].map(c => c.value);
    try {
      await db.collection('questionPapers').doc(paperId).update({ sharedWith: checked });
      modal.style.display = 'none';
      alert('অনুমতি সংরক্ষিত হয়েছে ✅');
      qmkRefreshBankList();
    } catch(e) {
      alert('সমস্যা হয়েছে: ' + e.message);
    }
  }

  if (!document.getElementById('qmkShareModal')) {
    const sm = document.createElement('div');
    sm.id = 'qmkShareModal';
    sm.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;align-items:center;justify-content:center;';
    sm.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:24px;width:340px;max-width:95vw;max-height:80vh;display:flex;flex-direction:column;gap:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
        <div style="font-weight:700;font-size:15px;color:#333;">📋 এডিট অনুমতি দিন</div>
        <div style="font-size:12px;color:#888;">যে শিক্ষকদের টিক দেবেন তারা এই প্রশ্নটি এডিট করতে পারবে। টিক তুলে দিলে অনুমতি বাতিল হবে।</div>
        <div id="qmkShareTeacherList" style="overflow-y:auto;max-height:280px;border:1px solid #eee;border-radius:8px;padding:4px 8px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="document.getElementById('qmkShareModal').style.display='none'"
            style="padding:8px 18px;border:1px solid #ddd;border-radius:7px;background:#f5f5f5;cursor:pointer;">বাতিল</button>
          <button onclick="qmkSaveSharePermission()"
            style="padding:8px 18px;border:none;border-radius:7px;background:#2e7d32;color:#fff;font-weight:600;cursor:pointer;">সংরক্ষণ করুন</button>
        </div>
      </div>`;
    document.body.appendChild(sm);
  }
  window.qmkSaveSharePermission = qmkSaveSharePermission;
  window.qmkOpenShareModal = qmkOpenShareModal;

  async function qmkRefreshBankList(){
    qmkBankListEl.innerHTML = '<div class="empty-hint">লোড হচ্ছে...</div>';
    try{
      const snap = await db.collection('questionPapers')
        .where('madrasaId', '==', qmkCtx.madrasaId)
        .get();
      let papers = snap.docs.map(d=> ({id: d.id, ...d.data()}));

      // শিক্ষক: নিজের তৈরি + অনুমতিপ্রাপ্ত প্রশ্ন দেখতে পাবে
      if(qmkCtx.role === 'teacher'){
        papers = papers.filter(p =>
          p.createdBy === qmkCtx.uid ||
          (Array.isArray(p.sharedWith) && p.sharedWith.includes(qmkCtx.uid))
        );
      }

      const selectedClassId = qmkBankClassFilter.value;
      if(!selectedClassId){
        qmkBankListEl.innerHTML = '<div class="empty-hint">একটি ক্লাস নির্ধারণ করুন।</div>';
        return;
      }
      papers = papers.filter(p => p.classId === selectedClassId);

      papers.sort((a,b)=>{
        const ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0;
        const tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0;
        return tb - ta;
      });

      if(papers.length === 0){
        qmkBankListEl.innerHTML = '<div class="empty-hint">কোনো সংরক্ষিত প্রশ্নপত্র নেই। নতুন তৈরি করুন।</div>';
        return;
      }

      qmkBankListEl.innerHTML = '';
      papers.forEach(p=>{
        const isOwner = p.createdBy === qmkCtx.uid;
        const isShared = Array.isArray(p.sharedWith) && p.sharedWith.includes(qmkCtx.uid);
        const canDelete = qmkCtx.role === 'admin' || isOwner;

        const row = document.createElement('div');
        row.className = 'qmk-bank-row';

        let metaLine = '';
        if(qmkCtx.role === 'admin' && p.createdByName)
          metaLine += `<span style="font-size:11px;color:#8a8a78;">তৈরি করেছেনঃ ${escapeHtml(p.createdByName)}</span> `;
        if(isShared)
          metaLine += `<span style="font-size:11px;background:#fff3e0;color:#e65100;padding:1px 7px;border-radius:10px;">✏️ অনুমতিপ্রাপ্ত</span>`;
        if(qmkCtx.role === 'admin' && Array.isArray(p.sharedWith) && p.sharedWith.length > 0)
          metaLine += `<span style="font-size:11px;background:#e3f2fd;color:#1565c0;padding:1px 7px;border-radius:10px;margin-left:4px;">👥 ${p.sharedWith.length} জন অনুমতিপ্রাপ্ত</span>`;

        const shareBtn = qmkCtx.role==='admin' ? `<button class="icon-btn share-btn" title="অনুমতি দিন" style="font-size:13px;background:#e8f5e9;border-radius:6px;padding:4px 8px;border:1px solid #c8e6c9;cursor:pointer;">👥</button>` : '';
        const deleteBtn = canDelete ? `<button class="icon-btn danger delete-btn" title="মুছে ফেলুন" style="flex:none;">✕</button>` : '';

        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:start;gap:6px;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13.5px;">${escapeHtml(p.examTitle||'শিরোনামহীন')}</div>
              <div style="font-size:12px;color:#556;">${escapeHtml(qmkClassNameById(p.classId)||p.className||'')}${p.subjectName?' · '+escapeHtml(p.subjectName):''}</div>
              ${metaLine ? `<div style="margin-top:3px;">${metaLine}</div>` : ''}
            </div>
            <div style="display:flex;gap:5px;flex:none;">${shareBtn}${deleteBtn}</div>
          </div>`;

        row.querySelector('.share-btn')?.addEventListener('click', (ev) => qmkOpenShareModal(p.id, ev));
        row.querySelector('.delete-btn')?.addEventListener('click', (ev) => qmkDeletePaper(p.id, ev));
        row.addEventListener('click', ()=> qmkLoadPaper(p.id));
        qmkBankListEl.appendChild(row);
      });
    }catch(err){
      console.error(err);
      qmkBankListEl.innerHTML = '<div class="empty-hint" style="color:var(--qdanger);">তালিকা আনতে সমস্যা হয়েছে।</div>';
    }
  }
  qmkBankClassFilter.addEventListener('change', qmkRefreshBankList);

  function qmkNewPaper(){
    if(qmkLoading) return;
    qmkEditingDocId = null;
    document.getElementById('qmkExamTitle').value = '';
    document.getElementById('qmkTimeAllowed').value = '২:৩০ ঘন্টা';
    document.getElementById('qmkTotalMarks').value = '১০০';
    document.getElementById('qmkExtraNote').value = '';
    qmkSubjectInput.value = '';
    qmkClassSelect.value = '';
    state.questions = [];
    state.layout = 'portrait-single';
    state.showAnswerSpace = true;
    state.showBismillah = false;
    state.showStudentInfo = false;
    state.fontScale = 100;
    state.gap = 14;
    const radio = qmkRoot.querySelector(`#qmkLayoutOptions input[value="portrait-single"]`);
    if(radio) radio.checked = true;
    qmkRoot.querySelectorAll('.layout-opt').forEach(l=> l.classList.toggle('active', l.dataset.val==='portrait-single'));
    document.getElementById('qmkToggleAnswerSpace').checked = true;
    document.getElementById('qmkToggleBismillah').checked = false;
    document.getElementById('qmkToggleStudentInfo').checked = false;
    document.getElementById('qmkFontScaleRange').value = 100;
    document.getElementById('qmkFontScaleLabel').innerText = '১০০%';
    document.getElementById('qmkGapRange').value = 14;
    document.getElementById('qmkGapLabel').innerText = '১৪px';
    updatePrintOrientation();
    applyPaperStyle();
    renderBuilder();
    renderPreview();
    qmkSetLabel('🆕 নতুন প্রশ্নপত্র');
  }
  document.getElementById('qmkNewPaperBtn').addEventListener('click', qmkNewPaper);

  document.getElementById('qmkSaveBtn').addEventListener('click', async ()=>{
    const className = qmkClassSelect.value;
    const classId = qmkCurrentClassId();
    if(!className){ alert('অনুগ্রহ করে একটি ক্লাস/জামাত নির্বাচন করুন।'); return; }
    if(!document.getElementById('qmkExamTitle').value.trim()){ alert('অনুগ্রহ করে পরীক্ষার নাম লিখুন।'); return; }

    const btn = document.getElementById('qmkSaveBtn');
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে...';
    try{
      const payload = {
        madrasaId: qmkCtx.madrasaId,
        year: qmkCtx.year,
        instName: document.getElementById('qmkInstName').value,
        examTitle: document.getElementById('qmkExamTitle').value,
        classId: classId,
        className: className,
        subjectName: qmkSubjectInput.value,
        timeAllowed: document.getElementById('qmkTimeAllowed').value,
        totalMarks: document.getElementById('qmkTotalMarks').value,
        extraNote: document.getElementById('qmkExtraNote').value,
        settings: {
          layout: state.layout,
          showAnswerSpace: state.showAnswerSpace,
          showBismillah: state.showBismillah,
          showStudentInfo: state.showStudentInfo,
          fontScale: state.fontScale,
          gap: state.gap
        },
        questions: state.questions,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: qmkCtx.uid,
        updatedByName: qmkCtx.uname,
      };

      if(qmkEditingDocId){
        // এডিট মোডে createdBy ও createdByName পরিবর্তন করা হবে না
        // শুধু content আপডেট হবে — মূল শিক্ষকের ownership থাকবে
        await db.collection('questionPapers').doc(qmkEditingDocId).update(payload);
      } else {
        // নতুন প্রশ্ন — createdBy সেট করা হচ্ছে
        payload.createdBy = qmkCtx.uid;
        payload.createdByName = qmkCtx.uname;
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const ref = await db.collection('questionPapers').add(payload);
        qmkEditingDocId = ref.id;
      }
      qmkSetLabel('📝 সম্পাদনাঃ ' + payload.examTitle);
      alert('প্রশ্নপত্র সংরক্ষিত হয়েছে ✅');
      qmkRefreshBankList();
    }catch(err){
      console.error(err);
      alert('সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }finally{
      btn.disabled = false; btn.textContent = originalText;
    }
  });

  // --- মূল অ্যাপ থেকে ডাকা হবে যখন "প্রশ্ন ব্যাংক" ট্যাব খোলা হবে ---
  let qmkLastSignature = null;
  window.mountQuestionMaker = function(targetTabId, role){
    const target = document.getElementById(targetTabId);
    if(!target) return;
    if(qmkRoot.parentElement !== target){
      target.appendChild(qmkRoot);
    }
    qmkRoot.style.display = 'block';

    const yr = currentYear;
    let classList;
    if(role === 'teacher'){
      const assignedIds = teacherClassAssignments
        .filter(a => a.teacherId === currentUserData.id && a.year === yr)
        .map(a => a.classId);
      classList = classes.filter(c => c.year === yr && assignedIds.includes(c.id));
    } else {
      classList = classes.filter(c => c.year === yr);
    }
    const subjectList = subjects.filter(s => s.year === yr);
    const uidVal = role === 'teacher' ? currentUserData.id : 'admin';
    const unameVal = role === 'teacher' ? (currentUserData.name || 'শিক্ষক') : 'অ্যাডমিন';
    const signature = role + '|' + uidVal + '|' + yr;

    qmkCtx = {
      role, uid: uidVal, uname: unameVal,
      madrasaId: currentMadrasaId, instName: currentMadrasaName, year: yr,
      classes: classList.map(c=>({id:c.id, name:c.name})),
      subjects: subjectList.map(s=>({id:s.id, name:s.name, classId:s.classId}))
    };

    if(signature !== qmkLastSignature){
      qmkLastSignature = signature;
      qmkPopulateClassSelect();
      qmkPopulateBankClassFilter();
      if(role === 'teacher' && qmkCtx.classes.length){
        qmkClassSelect.value = qmkCtx.classes[0].name;
      }
      qmkPopulateSubjectDatalist();
      if(!document.getElementById('qmkInstName').value){
        document.getElementById('qmkInstName').value = qmkCtx.instName || '';
      }
      qmkNewPaper();
    }
    qmkRefreshBankList();
  };

  // অ্যাপ প্রথমে খালি অবস্থায় শুরু হবে
  renderBuilder();
  renderPreview();

})();

