const CK = "sa_contacts", HK = "sa_history", TK = "sa_timer";
const $ = (id) => document.getElementById(id);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nowStr = () => new Date().toLocaleString("en-IN");
const intl = (p) => "91" + p;

// ---------- Tabs ----------
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $(b.dataset.tab).classList.add("active");
    renderContacts(); renderHistory();
  })
);

// ---------- Siren ----------
let audio = null, sirenTimer = null;
function startSiren() {
  stopSiren();
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audio = new AC();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sawtooth"; gain.gain.value = 0.25;
    osc.connect(gain); gain.connect(audio.destination);
    osc.start();
    let high = false;
    sirenTimer = setInterval(() => { high = !high; osc.frequency.value = high ? 950 : 600; }, 400);
    osc.frequency.value = 600;
    audio._osc = osc;
  } catch (e) { /* audio not supported */ }
}
function stopSiren() {
  if (sirenTimer) clearInterval(sirenTimer);
  sirenTimer = null;
  if (audio) { try { audio._osc.stop(); audio.close(); } catch (e) {} audio = null; }
}

// ---------- Location ----------
function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
const mapLink = (l) => `https://www.google.com/maps?q=${l.lat},${l.lng}`;

// ---------- Alert ----------
function buildMessage(reason, loc) {
  const where = loc ? `My live location: ${mapLink(loc)}` : "I could not get my location. Please call me immediately.";
  return `🚨 EMERGENCY! I need help. (${reason})\n${where}\nTime: ${nowStr()}`;
}

function renderActions(msg) {
  const contacts = load(CK, []);
  const enc = encodeURIComponent(msg);
  $("contactActions").innerHTML = contacts.length
    ? contacts.map((c) => `<div class="contact-act"><strong>${esc(c.name)}</strong>
        <a class="btn-link wa" target="_blank" rel="noopener" href="https://wa.me/${intl(c.phone)}?text=${enc}">WhatsApp</a>
        <a class="btn-link sms" href="sms:+${intl(c.phone)}?body=${enc}">SMS</a>
        <a class="btn-link cl" href="tel:+${intl(c.phone)}">Call</a></div>`).join("")
    : '<p class="error">No emergency contacts saved. Add contacts in the Contacts tab. You can still call 112.</p>';
}

async function triggerAlert(reason) {
  if ($("sirenOn").checked) startSiren();
  if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  document.querySelector('[data-tab="sos"]').click();
  $("alertBox").hidden = false;
  $("locStatus").textContent = "Getting your location...";
  $("alertMsg").value = buildMessage(reason, null);
  renderActions($("alertMsg").value);

  const loc = await getLocation();
  const msg = buildMessage(reason, loc);
  $("alertMsg").value = msg;
  $("locStatus").textContent = loc ? "📍 Location found. Tap a contact button below to send." : "⚠ Location not available (allow location permission). Message prepared without it.";
  renderActions(msg);

  const h = load(HK, []);
  h.unshift({ time: nowStr(), type: reason, loc });
  save(HK, h.slice(0, 50));
}

$("sosBtn").addEventListener("click", () => triggerAlert("SOS button pressed"));
$("stopSiren").addEventListener("click", stopSiren);
$("safeBtn").addEventListener("click", () => { stopSiren(); $("alertBox").hidden = true; });
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("alertMsg").value); $("copyBtn").textContent = "Copied ✔"; }
  catch (e) { $("alertMsg").select(); document.execCommand("copy"); }
  setTimeout(() => ($("copyBtn").textContent = "Copy message"), 1500);
});
$("shareBtn").addEventListener("click", () => {
  if (navigator.share) navigator.share({ title: "Emergency alert", text: $("alertMsg").value }).catch(() => {});
  else $("copyBtn").click();
});

// ---------- Contacts ----------
function renderContacts() {
  const list = load(CK, []);
  $("contactList").innerHTML = list.length
    ? list.map((c, i) => `<div class="contact">
        <div><strong>${esc(c.name)}</strong><small>${esc(c.relation || "Contact")} • ${esc(c.phone)}</small></div>
        <div><a class="btn-link cl" href="tel:+${intl(c.phone)}">Call</a>
        <button class="del" data-i="${i}">Delete</button></div></div>`).join("")
    : '<p class="muted">No contacts yet. Add up to 5 trusted people.</p>';
}
$("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target), list = load(CK, []), msg = $("contactMsg");
  msg.textContent = "";
  if (list.length >= 5) { msg.textContent = "You can save up to 5 contacts."; return; }
  const phone = f.get("phone").trim();
  if (list.some((c) => c.phone === phone)) { msg.textContent = "This number is already saved."; return; }
  list.push({ name: f.get("name").trim(), phone, relation: f.get("relation").trim() });
  save(CK, list);
  e.target.reset(); renderContacts();
});
$("contactList").addEventListener("click", (e) => {
  if (!e.target.classList.contains("del")) return;
  const list = load(CK, []); list.splice(+e.target.dataset.i, 1);
  save(CK, list); renderContacts();
});

// ---------- Safe timer ----------
let tick = null;
function showTimer() {
  const t = load(TK, null);
  clearInterval(tick);
  if (!t) { $("timerRun").hidden = true; $("timerForm").hidden = false; return; }
  $("timerForm").hidden = true; $("timerRun").hidden = false;
  $("timerInfo").textContent = t.label ? `Going to: ${t.label}` : "Timer running";
  const update = () => {
    const left = Math.max(0, Math.round((t.end - Date.now()) / 1000));
    $("clock").textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
    if (left <= 0) {
      clearInterval(tick); localStorage.removeItem(TK); showTimer();
      triggerAlert("Safe timer expired" + (t.label ? " (going to " + t.label + ")" : ""));
    }
  };
  update(); tick = setInterval(update, 1000);
}
$("timerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  save(TK, { end: Date.now() + parseInt($("timerMin").value, 10) * 60000, label: $("timerLabel").value.trim() });
  showTimer();
});
$("timerSafe").addEventListener("click", () => { localStorage.removeItem(TK); showTimer(); });

// ---------- History ----------
function renderHistory() {
  const h = load(HK, []);
  $("histEmpty").style.display = h.length ? "none" : "block";
  $("histBody").innerHTML = h.map((x) => `<tr><td>${esc(x.time)}</td><td>${esc(x.type)}</td>
    <td>${x.loc ? `<a href="${mapLink(x.loc)}" target="_blank" rel="noopener">View on map</a>` : "Not available"}</td></tr>`).join("");
}
$("clearHist").addEventListener("click", () => { if (confirm("Clear all history?")) { localStorage.removeItem(HK); renderHistory(); } });

// ---------- Fake call ----------
let callTimer = null, callSec = 0, ringer = null;
$("fakeCallBtn").addEventListener("click", () => {
  $("fakeCallBtn").textContent = "Call coming in 5 sec...";
  setTimeout(() => {
    $("fakeCallBtn").textContent = "Start Fake Call";
    $("callName").textContent = $("callerName").value.trim() || "Amma";
    $("callState").textContent = "mobile";
    $("callScreen").hidden = false;
    $("acceptCall").hidden = false;
    ringer = setInterval(() => navigator.vibrate && navigator.vibrate([600, 400]), 1000);
  }, 5000);
});
function endCall() {
  clearInterval(ringer); clearInterval(callTimer);
  if (navigator.vibrate) navigator.vibrate(0);
  $("callScreen").hidden = true;
}
$("declineCall").addEventListener("click", endCall);
$("acceptCall").addEventListener("click", () => {
  clearInterval(ringer); $("acceptCall").hidden = true; callSec = 0;
  callTimer = setInterval(() => {
    callSec++;
    $("callState").textContent = "On call " + String(Math.floor(callSec / 60)).padStart(2, "0") + ":" + String(callSec % 60).padStart(2, "0");
  }, 1000);
});

renderContacts(); renderHistory(); showTimer();
