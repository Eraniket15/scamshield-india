const $ = id => document.getElementById(id);
let lang = 'en', last = null;

// ---------- UI text (English / Hindi) ----------
const T = {
  en: { title: 'Got a suspicious message? Check it here.', sub: 'Paste an SMS, WhatsApp or email text. We tell you if it looks like a scam and what to do.',
    placeholder: 'Paste the message here...', try: 'Try:', check: 'Check Message', clear: 'Clear',
    why: 'Why we think so', links: 'Links found', todo: 'What you should do',
    disc: 'This tool spots common scam patterns. It cannot be 100% accurate. When in doubt, do not click, do not pay.',
    helpT: 'If you are cheated', h1: 'National Cyber Crime Helpline. Call immediately if money is lost.', h2: 'File an online complaint', h3: 'Report fraud calls/SMS (Chakshu)',
    privacy: 'Your message is checked in your browser only. Nothing is sent anywhere.',
    low: 'Low risk', mid: 'Suspicious', high: 'High risk: likely a scam', score: 'Risk score', none: 'No common scam patterns found.',
    empty: 'Please paste a message first.', linkOk: 'No warning signs in this link.', lang: 'हिंदी' },
  hi: { title: 'कोई शक वाला मैसेज आया है? यहाँ जाँचें।', sub: 'SMS, WhatsApp या ईमेल का मैसेज पेस्ट करें। हम बताएँगे कि यह स्कैम लगता है या नहीं और क्या करना है।',
    placeholder: 'मैसेज यहाँ पेस्ट करें...', try: 'आज़माएँ:', check: 'मैसेज जाँचें', clear: 'साफ़ करें',
    why: 'हमें ऐसा क्यों लगा', links: 'मैसेज में मिले लिंक', todo: 'आपको क्या करना चाहिए',
    disc: 'यह टूल आम स्कैम पैटर्न पहचानता है, 100% सही नहीं है। शक हो तो न लिंक खोलें, न पैसे भेजें।',
    helpT: 'अगर ठगी हो गई', h1: 'राष्ट्रीय साइबर क्राइम हेल्पलाइन। पैसे कटे हों तो तुरंत कॉल करें।', h2: 'ऑनलाइन शिकायत दर्ज करें', h3: 'फ़्रॉड कॉल/SMS की रिपोर्ट (चक्षु)',
    privacy: 'आपका मैसेज सिर्फ़ आपके ब्राउज़र में जाँचा जाता है। कहीं भेजा नहीं जाता।',
    low: 'कम ख़तरा', mid: 'शक वाला', high: 'ज़्यादा ख़तरा: स्कैम हो सकता है', score: 'ख़तरे का स्कोर', none: 'कोई आम स्कैम पैटर्न नहीं मिला।',
    empty: 'पहले मैसेज पेस्ट करें।', linkOk: 'इस लिंक में कोई चेतावनी नहीं मिली।', lang: 'English' }
};

// ---------- Detection rules ----------
const RULES = [
  { w: 40, re: /(share|send|tell|give|enter|bata\w*|bhej\w*|dijiye)\s+(your\s+|the\s+|apna\s+|aapka\s+)?(otp|pin|cvv|password|upi pin)/i,
    en: 'Asks you to share OTP, PIN or password. Real banks never ask for this.', hi: 'OTP, PIN या पासवर्ड माँगा जा रहा है। असली बैंक कभी नहीं माँगता।' },
  { w: 35, re: /(collect request|approve (the )?request|enter (your )?upi pin to receive|pin (dal|daal)\w* (kar )?(ke )?paise (lene|paane))/i,
    en: 'Asks you to approve a payment request or enter UPI PIN to "receive" money. PIN is only for sending money.', hi: 'पैसे "पाने" के लिए UPI PIN या रिक्वेस्ट अप्रूव करने को कहा गया। PIN सिर्फ़ पैसे भेजने के लिए होता है।' },
  { w: 35, re: /(anydesk|teamviewer|quick ?support|screen ?share|rustdesk)/i,
    en: 'Asks you to install a remote access app. Scammers use it to control your phone.', hi: 'रिमोट एक्सेस ऐप इंस्टॉल करने को कहा गया। ठग इससे आपका फ़ोन कंट्रोल कर लेते हैं।' },
  { w: 30, re: /\.apk\b|install .{0,30}(app|apk) (from|using) (this )?link/i,
    en: 'Asks you to install an app outside the Play Store (APK). It can steal your data.', hi: 'Play Store के बाहर से ऐप (APK) इंस्टॉल करने को कहा गया। इससे डेटा चोरी हो सकता है।' },
  { w: 30, re: /(lottery|lucky draw|you (have |ve )?won|jackpot|prize|inaam|jeet\w*|kbc|congratulations)/i,
    en: 'Claims you won a prize or lottery you never entered.', hi: 'ऐसा इनाम या लॉटरी जीतने का दावा, जिसमें आपने हिस्सा ही नहीं लिया।' },
  { w: 30, re: /(arrest|police|cbi|customs|court|warrant|legal action|jail|giraftar|\bfir\b|narcotics|digital arrest)/i,
    en: 'Uses fear of arrest, police or legal action. Real agencies do not demand money on calls or messages.', hi: 'गिरफ़्तारी, पुलिस या क़ानूनी कार्रवाई का डर दिखाया गया। असली एजेंसी मैसेज या कॉल पर पैसे नहीं माँगती।' },
  { w: 30, re: /(work from home|part[- ]time job|registration fee|security deposit|earn\s*(rs\.?|₹)?\s*\d+.{0,25}(daily|per day|a day)|youtube.{0,20}like)/i,
    en: 'Offers an easy job or high earnings and may ask for a fee first.', hi: 'आसान नौकरी या ज़्यादा कमाई का लालच, और पहले फ़ीस माँग सकते हैं।' },
  { w: 25, re: /(kyc|pan|aadhaar|aadhar).{0,40}(update|expire|block|suspend|verify|band)|account.{0,30}(block|suspend|freeze|deactivat|band)/i,
    en: 'Threatens to block your account or asks for urgent KYC update.', hi: 'अकाउंट बंद करने की धमकी या अचानक KYC अपडेट की माँग।' },
  { w: 25, re: /(electricity|bijli|power|bill).{0,50}(disconnect|cut|kat|tonight|night|band)/i,
    en: 'Says your electricity/bill will be cut tonight. A common fake-bill scam.', hi: 'कहा गया कि आज रात बिजली/कनेक्शन कट जाएगा। यह आम फ़र्ज़ी बिल स्कैम है।' },
  { w: 25, re: /((send|pay|transfer|deposit)\W.{0,25}(₹|rs\.?|inr)\s*\d+|processing fee|claim fee|clearance fee|refundable)/i,
    en: 'Asks you to pay a fee or send money first.', hi: 'पहले फ़ीस या पैसे भेजने को कहा गया।' },
  { w: 15, re: /(urgent|immediately|within \d+ ?(hours?|hrs|minutes?|mins?)|today only|last chance|expires? (today|soon)|turant|abhi|jaldi|24 ghante)/i,
    en: 'Creates false urgency so you act without thinking.', hi: 'जल्दबाज़ी का दबाव बनाया गया ताकि आप सोचे बिना काम करें।' },
  { w: 15, re: /(refund|cashback|reward points|redeem)/i,
    en: 'Offers a refund, cashback or reward points. Often used as bait.', hi: 'रिफ़ंड, कैशबैक या रिवॉर्ड पॉइंट का लालच। यह अक्सर चारा होता है।' },
  { w: 10, re: /(call|contact|whatsapp)\s*(us\s*)?(on|at|now)?\s*:?\s*\+?\d[\d\s-]{9,}/i,
    en: 'Asks you to call or WhatsApp an unknown number.', hi: 'किसी अनजान नंबर पर कॉल या WhatsApp करने को कहा गया।' }
];

// ---------- Link checks ----------
const OFFICIAL = ['sbi.co.in', 'onlinesbi.sbi', 'hdfcbank.com', 'icicibank.com', 'axisbank.com', 'pnbindia.in', 'paytm.com', 'phonepe.com',
  'amazon.in', 'amazon.com', 'flipkart.com', 'airtel.in', 'jio.com', 'gov.in', 'nic.in', 'npci.org.in', 'incometax.gov.in', 'uidai.gov.in'];
const BRANDS = ['sbi', 'hdfc', 'icici', 'axis', 'pnb', 'paytm', 'phonepe', 'gpay', 'amazon', 'flipkart', 'airtel', 'jio', 'kotak', 'aadhaar', 'uidai', 'incometax'];
const SHORT = ['bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'cutt.ly', 'is.gd', 'goo.gl', 'shorturl.at', 'tiny.cc'];
const BAD_TLD = ['xyz', 'top', 'click', 'live', 'icu', 'site', 'online', 'cc', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'vip', 'work', 'support'];

function checkLink(raw) {
  const flags = [];
  let host = raw.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].toLowerCase();
  const isOfficial = OFFICIAL.some(o => host === o || host.endsWith('.' + o));
  if (/^http:\/\//i.test(raw)) flags.push([10, 'Not secure (http, no https).', 'सुरक्षित नहीं है (http, https नहीं)।']);
  if (/^\d{1,3}(\.\d{1,3}){3}/.test(host)) flags.push([25, 'Uses a raw IP address instead of a website name.', 'वेबसाइट नाम की जगह IP एड्रेस है।']);
  if (SHORT.includes(host)) flags.push([20, 'Shortened link hides the real destination.', 'छोटा लिंक असली वेबसाइट छुपा देता है।']);
  if (BAD_TLD.includes(host.split('.').pop())) flags.push([20, 'Uses a domain ending often seen in scam sites.', 'ऐसा डोमेन जो स्कैम साइटों में ज़्यादा दिखता है।']);
  if (!isOfficial && BRANDS.some(b => host.includes(b))) flags.push([30, 'Looks like a bank/brand site but is not the official domain.', 'बैंक/ब्रांड जैसा दिखता है पर असली वेबसाइट नहीं है।']);
  if ((host.match(/-/g) || []).length >= 2) flags.push([10, 'Many hyphens in the domain name.', 'डोमेन नाम में कई हाइफ़न (-) हैं।']);
  return { raw, flags };
}

// ---------- Analyse ----------
function analyse(text) {
  // Ignore safe-advice sentences like "Do not share OTP with anyone"
  const clean = text.replace(/(do not|don't|never|kabhi na|mat)\s+share[^.\n]*/gi, '').replace(/share\s+na\s+kar[^.\n]*/gi, '');
  const hits = RULES.filter(r => r.re.test(clean));
  const urls = (text.match(/\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) || []).map(u => u.replace(/[.,)]+$/, '')).map(checkLink);
  let score = hits.reduce((s, r) => s + r.w, 0) + urls.reduce((s, u) => s + u.flags.reduce((a, f) => a + f[0], 0), 0);
  if (hits.length >= 3) score += 10;
  return { hits, urls, score: Math.min(score, 100) };
}

// ---------- Render ----------
function render() {
  if (!last) return;
  const t = T[lang], { hits, urls, score } = last;
  const lvl = score >= 60 ? ['high', 'var(--red)'] : score >= 25 ? ['mid', 'var(--amber)'] : ['low', 'var(--green)'];
  $('badge').textContent = t[lvl[0]];
  $('badge').style.background = lvl[1];
  $('fill').style.width = Math.max(score, 4) + '%';
  $('fill').style.background = lvl[1];
  $('score').textContent = `${t.score}: ${score}/100`;
  const li = (txt, cls = '') => `<li class="${cls}">${txt}</li>`;
  $('reasons').innerHTML = hits.length ? hits.map(h => li(h[lang], 'bad')).join('') : li(t.none);
  $('linksBox').hidden = !urls.length;
  $('linkList').innerHTML = urls.map(u => li(`<span class="link"><strong>${u.raw.replace(/</g, '&lt;')}</strong></span>` +
    (u.flags.length ? '<br>' + u.flags.map(f => '⚠️ ' + f[lang === 'en' ? 1 : 2]).join('<br>') : '<br>' + t.linkOk))).join('');
  $('actions').innerHTML = ACTIONS[lang][lvl[0]].map(a => li(a)).join('');
}

const ACTIONS = {
  en: {
    high: ['Do NOT click any link, call the number, or install anything.', 'Never share OTP, PIN, CVV or passwords with anyone.', 'Block the sender and delete the message.', 'Report on cybercrime.gov.in or forward the SMS to your bank.', 'If you already paid or shared details, call 1930 immediately and inform your bank.'],
    mid: ['Do not click links yet. Open your bank or company app directly instead.', 'Call the official customer care number from their website, not from the message.', 'Ask a family member before doing anything.', 'If it turns out to be fake, block and report the sender.'],
    low: ['No major warning signs, but stay careful.', 'Never share OTP or PIN with anyone.', 'Prefer opening apps or websites directly instead of clicking links.'] },
  hi: {
    high: ['कोई लिंक न खोलें, नंबर पर कॉल न करें, कुछ इंस्टॉल न करें।', 'OTP, PIN, CVV या पासवर्ड किसी को न बताएँ।', 'भेजने वाले को ब्लॉक करें और मैसेज डिलीट करें।', 'cybercrime.gov.in पर रिपोर्ट करें या SMS अपने बैंक को फ़ॉरवर्ड करें।', 'अगर पैसे भेज दिए या जानकारी दे दी, तो तुरंत 1930 पर कॉल करें और बैंक को बताएँ।'],
    mid: ['अभी लिंक न खोलें। बैंक या कंपनी का ऐप सीधे खोलकर देखें।', 'मैसेज वाला नहीं, वेबसाइट पर दिया आधिकारिक कस्टमर केयर नंबर लगाएँ।', 'कुछ करने से पहले घर के किसी सदस्य से पूछ लें।', 'फ़र्ज़ी निकले तो भेजने वाले को ब्लॉक और रिपोर्ट करें।'],
    low: ['बड़ी चेतावनी नहीं मिली, फिर भी सावधान रहें।', 'OTP या PIN किसी को न बताएँ।', 'लिंक क्लिक करने की जगह ऐप या वेबसाइट सीधे खोलें।'] }
};

const SAMPLES = [
  'Dear customer, your SBI account will be blocked today. Update KYC immediately: http://sbi-kyc-update.xyz/login. Share OTP to verify.',
  'Congratulations! You have won Rs 25,00,000 in KBC lucky draw. Pay Rs 5000 processing fee to claim prize. Call +91 9876543210',
  'Dear consumer, your electricity bill is unpaid and power will be disconnected tonight 9:30 PM. Contact officer now: bit.ly/bijli-pay',
  'Part time job! Work from home and earn Rs 5000 per day by liking YouTube videos. Registration fee Rs 500. Join on WhatsApp now.',
  'Rs 2,500 debited from A/c XX1234 on 12-Sep via UPI. If not you, call the number on the back of your card. Do not share OTP with anyone. -HDFC Bank'
];

// ---------- Events ----------
function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i]').forEach(e => e.textContent = t[e.dataset.i]);
  document.querySelectorAll('[data-ip]').forEach(e => e.placeholder = t[e.dataset.ip]);
  $('langBtn').textContent = t.lang;
  render();
}
$('langBtn').onclick = () => { lang = lang === 'en' ? 'hi' : 'en'; applyLang(); };
$('checkBtn').onclick = () => {
  const text = $('msg').value.trim();
  if (!text) return alert(T[lang].empty);
  last = analyse(text);
  $('result').hidden = false;
  render();
  $('result').scrollIntoView({ behavior: 'smooth' });
};
$('clearBtn').onclick = () => { $('msg').value = ''; $('result').hidden = true; last = null; };
document.querySelectorAll('.chip').forEach(c => c.onclick = () => { $('msg').value = SAMPLES[c.dataset.s]; $('checkBtn').click(); });
applyLang();
