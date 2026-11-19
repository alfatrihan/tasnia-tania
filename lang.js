/* ===== Language toggle: English <-> Bangla ===== */
(function () {
  const KEY = 'tania-lang';

  /* ---------- 1. Page text in Bangla ----------
     sel      : CSS selector of the element(s) to translate
     html     : Bangla text (HTML allowed). Use an array when the selector matches
                several elements: one value per element, in page order.
     keepSvg  : keep the icon inside the element and change only its text
     split    : split into words so the scroll "light up" effect still works */
  const STATIC = [
    { sel: '.brand', html: 'তানিয়া', keepSvg: true },
    { sel: '#nav a', html: ['স্বাগত', 'যাত্রা', 'তার জগৎ', 'খেলাঘর', 'যোগাযোগ'] },

    { sel: '#c1', html: 'যে নীরবে ফোটে, তার জন্য' },
    { sel: '#c2 .eyebrow', html: 'যত্ন করে বানানো একটা ছোট উপহার' },
    { sel: '#c2 h1', html: 'তাসনিয়া আক্তার <em>তানিয়া</em>' },
    { sel: '#c2 .sub', html: 'কিছু মানুষকে এক লাইনে বোঝানো যায় না। তাই তার জন্য রইল একটা পুরো জায়গা।' },
    { sel: '#cue', html: 'আস্তে আস্তে নিচে স্ক্রল করুন<br><span style="letter-spacing:2px;text-transform:none">যেকোনো জায়গায় ট্যাপ করুন, ফুল ফুটবে</span>' },

    { sel: '#about h2', html: 'তার সম্পর্কে' },
    { sel: '#about .card small', html: ['থেকে', 'পড়ছে', 'কলেজ'] },
    { sel: '#about .card h3', html: ['বগুড়া', 'অর্থনীতি', 'গভর্নমেন্ট আজিজুল হক কলেজ'] },
    { sel: '#about .words', split: true, html: 'এখানে একটা ছোট, উষ্ণ পরিচয় লিখুন। সে কেমন মানুষ, তোমাদের পরিচয় কীভাবে হলো, আর প্রথম কোন বিষয়টা মনে হয়েছিল: এই মানুষটা আলাদা। স্ক্রল করার সাথে সাথে প্রতিটি শব্দ আস্তে আস্তে আলো হয়ে ওঠে।' },
    { sel: '#outro .words', split: true, html: 'কিছু মানুষ আলোর মঞ্চ চায় না, তবু সাধারণ দিনগুলোকে নিঃশব্দে একটু বেশি উষ্ণ করে তোলে। তানিয়া তাদেরই একজন।' },
    { sel: '#outro .outro-tag', html: 'স্ক্রল শেষ হলেও ফুলগুলো ফুটতেই থাকে।' },

    { sel: '#vibe h2', html: 'তার ভাইব' },
    { sel: '#vibe .ph', html: ['ছবি ১', 'ছবি ২', 'ছবি ৩', 'ছবি ৪', 'ছবি ৫', 'ছবি ৬', 'ছবি ৭', 'ছবি ৮', 'ছবি ৯', 'ছবি ১০'] },
    { sel: '#vibe .fr b', html: ['একটু অবসর', 'সবুজের মাঝে', 'তৈরি হচ্ছি', 'রোদেলা মুহূর্ত', 'একটু হাঁটাহাঁটি', 'নীল সাজ', 'গোলাপি দিন', 'একটু ঘোরাঘুরি', 'একটু বিরতি', 'ফুলের পাশে'] },
    { sel: '#vibe .bk p', html: ['দিনের মাঝে একটু নিরিবিলি সময় কাটাচ্ছিলাম। এরপর অন্যদিকে যাওয়ার আগে কয়েকটা ছবি তোলা হলো।', 'সবুজ ঘাসের ওপর কিছুক্ষণ বসে সময় কাটাচ্ছিলাম। সেই বিরতির সময়ই ছবিটা তোলা।', 'বাইরে যাওয়ার আগে আয়নার সামনে কানের দুল ঠিক করছিলাম। তৈরি হওয়ার সময়ই ছবিটা তোলা।', 'বাইরে সবুজের মাঝে কিছুটা সময় কাটানোর সময় ছবিটা তোলা হয়েছিল।', 'ফিরে যাওয়ার আগে বাগানে কয়েকটা ছবি তোলা হলো। আবহাওয়া আর চারপাশের সবুজ পরিবেশটা বেশ ভালো লাগছিল।', 'ফুলগাছের পাশে একটু থেমে এই পোশাকে ছবিটা তোলা হয়েছিল।', 'বাইরে কিছুটা সময় কাটাচ্ছিলাম, ফুলের পাশে কয়েকটা ছবিও তোলা হলো।', 'বাগানের পাশের পথ ধরে হাঁটার সময় ছবিটা তোলা। জায়গাটা ছবি তোলার জন্য বেশ সুন্দর ছিল।', 'একটু বিরতি নিতে টেবিলের পাশে বসেছিলাম। আবার কাজে ফেরার আগে ছবিটা তোলা হলো।', 'ফুলের পাশে কিছুক্ষণ বসে ছিলাম। বিকেলের আলোতে কয়েকটা ছবি তোলা হলো।'] },
    { sel: '#vibe .tap', html: 'ছবিতে ট্যাপ করে উল্টে দেখুন' },

    { sel: '#social h2', html: 'সোশ্যাল প্ল্যাটফর্ম' },
    { sel: '#social .tap', html: 'সোয়াইপ করে তার প্রোফাইল দেখুন, তারপর ভিজিট চাপুন' },
    { sel: '.soc-btn-fb span', html: 'ফেসবুকে ভিজিট করুন' },
    { sel: '.soc-btn-ig', html: 'ইনস্টাগ্রামে ভিজিট করুন' },
    { sel: '#says h2', html: 'তার কথাগুলো' },
    { sel: '#says .tap', html: 'একটা পাপড়ি বেছে নিন' },
    { sel: '#says .meter h3', html: 'তানিয়ার জেদ-মিটার' },
    { sel: '#says .note', html: '...তবে মন সব সময় ভালো।' },

    { sel: '#why h2', html: 'সে কেন বিশেষ' },
    { sel: '#why .ic h3', html: ['দাবি ছাড়াই ভালো ব্যবহার', 'মানুষের পাশে থাকে', 'জেদি, কিন্তু ভালো মনের', 'সৎ আর আন্তরিক', 'সাধারণ দিনকেও উষ্ণ করে'] },
    { sel: '#why .bk p', html: ['তার সাহায্য করার একটা আসল মুহূর্ত লিখুন।', 'বিপদে আপনার পাশে থাকার একটা সময় লিখুন।', 'তার জেদ নিয়ে একটা মজার গল্প লিখুন।', 'তার সত্যি কথা বলার একটা মুহূর্ত লিখুন।', 'তার ছোট একটা অভ্যাস যা সবাইকে ভালো লাগায়।'] },
    { sel: '#why .tap', html: 'কার্ডে ট্যাপ করে কারণটা পড়ুন' },

    { sel: '#time h2', html: 'তানিয়ার সময়রেখা' },


    { sel: '.dev-pill-trigger span', html: 'ডেভেলপার তথ্য' },
    { sel: '#devModal .eyebrow', html: 'নির্মাতার পরিচয়' },
    { sel: '#devModalTitle', html: 'ডেভেলপার তথ্য <span>&#10022;</span>' },
    { sel: '.dev-purpose', html: 'কিছু উপহার কাগজে মোড়ানো থাকে না; কিছু বোনা হয় কোডের লাইন, গভীর রাতের ভাবনা আর আপনাকে হাসানোর ইচ্ছে দিয়ে!' },
    { sel: '.dev-edu', html: 'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিংয়ে বি.এসসি (CSE), নর্থ সাউথ ইউনিভার্সিটি' },
    { sel: '.dev-quote', html: '“যুক্তি স্ক্রিন বানায়, কিন্তু বন্ধুত্ব তাকে প্রাণ দেয়।”' },
    { sel: '.dev-name', html: 'আলফাত রিহান' },
    { sel: '#footerWords', html: 'এতদূর স্ক্রল করে এখানে আসার জন্য আপনাকে অনেক ধন্যবাদ!', split: true }
  ];

  /* ---------- 2. Text created by the page script (quotes and meter label) ----------
     Each pair is: [English, Bangla]. Add a pair here if you change the quotes in script.js */
  const DYN = [
    ['Each petal holds something she once said.', 'প্রতিটি পাপড়িতে তার বলা একটা কথা লুকিয়ে আছে।'],
    ['"I am not angry. I am just right, loudly."', '"আমি রাগ করিনি। আমি শুধু জোরে জোরে ঠিক।"'],
    ['"Add something she always says."', '"তার সবসময় বলা একটা কথা এখানে যোগ করুন।"'],
    ['"Tears are just drops of something I feel deeply."', '"চোখের জল আসলে সেই অনুভূতিরই ফোঁটা, যা আমি গভীরে অনুভব করি।"'],
    ['"Add another of her sayings here."', '"তার আরেকটা কথা এখানে যোগ করুন।"'],
    ['"Add her funniest line here."', '"তার সবচেয়ে মজার কথাটা এখানে যোগ করুন।"'],
    ['Calm as a lake', 'হ্রদের মতো শান্ত'],
    ['Slightly stubborn', 'একটু জেদি'],
    ['Fully committed to being right', 'নিজে ঠিক হওয়ার ব্যাপারে পুরোপুরি অনড়'],
    ['Immovable, like a mountain', 'পাহাড়ের মতো অটল']
  ];
  const TO_BN = new Map(DYN);
  const TO_EN = new Map(DYN.map(([en, bn]) => [bn, en]));

  const saved = new WeakMap();          // remembers each element's English HTML
  const btn = document.getElementById('langBtn');
  let lang = 'en';

  function applyStatic(l) {
    STATIC.forEach(item => {
      document.querySelectorAll(item.sel).forEach((el, i) => {
        if (!saved.has(el)) saved.set(el, el.innerHTML);
        if (l === 'en') { el.innerHTML = saved.get(el); return; }

        const value = Array.isArray(item.html) ? item.html[i] : item.html;
        if (value === undefined) return;

        if (item.keepSvg) {
          const textNode = [...el.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
          if (textNode) textNode.nodeValue = value;
        } else if (item.split) {
          el.innerHTML = value.split(/\s+/).map(w => '<span class="w">' + w + ' </span>').join('');
        } else {
          el.innerHTML = value;
        }
      });
    });
  }

  function applyDyn(l) {
    document.querySelectorAll('#qbox span, #mlabel').forEach(el => {
      const current = el.textContent.trim();
      const next = l === 'bn' ? TO_BN.get(current) : TO_EN.get(current);
      if (next && next !== current) el.textContent = next;
    });
  }

  function setLang(l) {
    lang = l;
    document.documentElement.lang = l;
    applyStatic(l);
    applyDyn(l);
    btn.textContent = l === 'bn' ? 'English' : 'বাংলা';
    btn.setAttribute('aria-label', l === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন');
    try { localStorage.setItem(KEY, l); } catch (e) { }
  }

  // Keep up with text the page writes later (quote tapped, meter moved)
  ['#qbox', '#mlabel'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) new MutationObserver(() => applyDyn(lang))
      .observe(el, { childList: true, subtree: true, characterData: true });
  });

  btn.onclick = () => setLang(lang === 'en' ? 'bn' : 'en');

  // Always start in English. The visitor can still switch to Bangla with the button.
  setLang('en');
})();