const SVG_NS = "http://www.w3.org/2000/svg";
function el(name, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(node);
  return node;
}
function fmtDuration(sec) {           // 449 -> "7m 29s"
  return Math.floor(sec / 60) + "m " + String(sec % 60).padStart(2, "0") + "s";
}
function fmtYear(y) {                 // astronomical year -> "585 BCE" / "1919 CE"
  return y <= 0 ? (1 - y) + " BCE" : y + " CE";
}
const TYPE_NAME = { T: "Total", A: "Annular", H: "Hybrid", P: "Partial" };
const GLYPH = { T: "●", A: "○", H: "◆", P: "|" };

const tip = document.getElementById("tip");
function showTip(evt, html) {
  tip.innerHTML = html;
  tip.classList.add("show");
  const x = Math.min(evt.clientX + 14, window.innerWidth - 280);
  tip.style.left = x + "px";
  tip.style.top = (evt.clientY + 14) + "px";
}
function hideTip() { tip.classList.remove("show"); }
function attachTip(node, html) {
  node.addEventListener("mousemove", e => showTip(e, html));
  node.addEventListener("mouseleave", hideTip);
  node.addEventListener("focus", () => {
    const r = node.getBoundingClientRect();
    showTip({ clientX: r.left, clientY: r.top }, html);
  });
  node.addEventListener("blur", hideTip);
}

const HERO_ITEMS = [
  { label: "2186 Jul 16 (predicted)", sec: 449 },  // 07m29s  longest total in the catalogue
  { label: "1919 May 29",             sec: 411 },  // 06m51s  NASA catalogue no. 09326
  { label: "2017 Aug 21",             sec: 160 },  // 02m40s  NASA catalogue no. 09546
  { label: "0919 Feb 03",             sec: 9 }     // 00m09s  shortest total in the catalogue
];
(function drawHero() {
  const box = document.getElementById("hero-bars");
  const max = Math.max(...HERO_ITEMS.map(i => i.sec));
  HERO_ITEMS.forEach(item => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.style.setProperty("--w", (item.sec / max * 100) + "%");
    row.innerHTML = '<span>' + item.label + '</span>' +
      '<div class="bar-track"><div class="bar' + (item.sec / max < 0.15 ? ' small' : '') + '"><span>' + fmtDuration(item.sec) + '</span></div></div>';
    box.appendChild(row);
  });
  // start the animation when the bars scroll into view
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) box.querySelectorAll(".bar-row").forEach(r => r.classList.add("in")); });
  }, { threshold: 0.3 });
  io.observe(box);
})();

(function drawShare() {
  const sum = key => CENTURIES.reduce((a, c) => a + c[key], 0);
  const counts = { T: sum("total"), A: sum("annular"), H: sum("hybrid"), P: sum("partial") };
  const all = sum("all_eclipses");
  const box = document.getElementById("type-share");
  ["T", "A", "H", "P"].forEach(t => {
    const pct = counts[t] / all * 100;
    const d = document.createElement("div");
    d.className = t;
    d.style.width = pct + "%";
    d.innerHTML = "<span>" + TYPE_NAME[t] + " " + pct.toFixed(1) + "%</span>";
    box.appendChild(d);
  });
  document.getElementById("share-note").textContent =
    all.toLocaleString("en") + " eclipses in the catalogue, from 2000 BCE to 3000 CE: " +
    counts.P.toLocaleString("en") + " partial, " + counts.A.toLocaleString("en") + " annular, " +
    counts.T.toLocaleString("en") + " total, " + counts.H + " hybrid.";
})();

(function drawStrips() {
  const active = { T: true, A: true, H: true, P: true };
  const W = 1000, PAD = 40;
  const tipHtml = e => "<b>" + TYPE_NAME[e.type] + "</b><br>" + e.date + "<br>Magnitude: " + e.magnitude.toFixed(4) +
    (e.duration_s !== null ? "<br>Central-line totality: " + fmtDuration(e.duration_s) : "");

  // generic dot strip: bands = [{type, y}], xMin/xMax = axis range
  function strip(containerId, types, xMin, xMax, ticks, refLine) {
    const box = document.getElementById(containerId);
    const H = types.length * 62 + 40;
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img" }, box);
    const x = v => PAD + (v - xMin) / (xMax - xMin) * (W - PAD * 2);
    ticks.forEach(t => {
      el("line", { x1: x(t), x2: x(t), y1: 6, y2: H - 26, class: "axis" }, svg);
      const lab = el("text", { x: x(t), y: H - 8, "text-anchor": "middle" }, svg); lab.textContent = t.toFixed(2);
    });
    if (refLine !== undefined) el("line", { x1: x(refLine), x2: x(refLine), y1: 6, y2: H - 26, class: "ref" }, svg);
    types.forEach((t, row) => {
      const yMid = 34 + row * 62;
      const lab = el("text", { x: PAD, y: yMid - 26 }, svg); lab.textContent = TYPE_NAME[t];
      ECLIPSES_21C.filter(e => e.type === t).forEach((e, i) => {
        const jitter = ((i * 37) % 21) - 10;           // deterministic vertical spread so dots do not hide each other
        const cx = x(e.magnitude), cy = yMid + jitter;
        let c;                                             // shape encodes type: T filled circle, A ring, H diamond, P tick
        if (t === "H") c = el("rect", { x: cx - 4, y: cy - 4, width: 8, height: 8, transform: "rotate(45 " + cx + " " + cy + ")", class: "dot H" }, svg);
        else if (t === "P") c = el("line", { x1: cx, x2: cx, y1: cy - 5, y2: cy + 5, class: "dot P" }, svg);
        else c = el("circle", { cx: cx, cy: cy, r: 4.5, class: "dot " + t }, svg);
        c.setAttribute("tabindex", 0); c.setAttribute("data-type", t);
        attachTip(c, tipHtml(e));
      });
    });
  }
  strip("strip-partial", ["P"], 0, 1, [0, 0.25, 0.5, 0.75, 1]);
  strip("strip-central", ["A", "H", "T"], 0.90, 1.10, [0.90, 0.95, 1.00, 1.05, 1.10], 1.0);

  // legend = filter buttons
  const legend = document.getElementById("strip-legend");
  ["T", "A", "H", "P"].forEach(t => {
    const b = document.createElement("button");
    b.textContent = GLYPH[t] + " " + TYPE_NAME[t]; b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", () => {
      active[t] = !active[t];
      b.setAttribute("aria-pressed", String(active[t]));
      document.querySelectorAll('.dot[data-type="' + t + '"]').forEach(d => d.classList.toggle("off", !active[t]));
    });
    legend.appendChild(b);
  });
})();

// centuries that contain the three case studies (astronomical years -584, 1919, 2017)
const MARKS = { "-599": { label: "585 BCE", case: 0 }, "1901": { label: "1919", case: 1 }, "2001": { label: "2017", case: 2 } };

(function drawLedger() {
  const box = document.getElementById("ledger");
  let hybridsOnly = false;

  // headline computed from the data, not typed by hand
  const totals = CENTURIES.map(c => c.total), hybrids = CENTURIES.map(c => c.hybrid);
  document.getElementById("ledger-claim").textContent =
    "In each century, total eclipses number from " + Math.min(...totals) + " to " + Math.max(...totals) +
    ". Hybrid eclipses range from " + Math.min(...hybrids) + " to " + Math.max(...hybrids) + ".";

  function render() {
    box.innerHTML = "";
    const W = 1000, H = 400, PADL = 44, PADB = 36, PADT = 30;
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Stacked bars of eclipse types per century" }, box);
    const order = hybridsOnly ? ["hybrid"] : ["hybrid", "total", "annular", "partial"];   // hybrids at baseline so their height is comparable
    const cls = { hybrid: "H", total: "T", annular: "A", partial: "P" };
    const colour = { H: "url(#pat-H)", T: "#000", A: "url(#pat-A)", P: "url(#pat-P)" };   // black-and-white textures
    const yMax = hybridsOnly ? 25 : 260;
    const y = v => H - PADB - v / yMax * (H - PADB - PADT);
    const bw = (W - PADL) / CENTURIES.length;

    // horizontal grid
    const step = hybridsOnly ? 5 : 50;
    for (let v = 0; v <= yMax; v += step) {
      el("line", { x1: PADL, x2: W, y1: y(v), y2: y(v), class: "axis" }, svg);
      const t = el("text", { x: PADL - 6, y: y(v) + 4, "text-anchor": "end" }, svg); t.textContent = v;
    }
    CENTURIES.forEach((c, i) => {
      const x = PADL + i * bw;
      let base = 0;
      order.forEach(key => {
        const seg = el("rect", { x: x + 1, width: bw - 2, y: y(base + c[key]), height: y(base) - y(base + c[key]), fill: colour[cls[key]], stroke: "#000", "stroke-width": 1, class: "seg" }, svg);
        attachTip(seg, "<b>" + fmtYear(c.century_start) + " – " + fmtYear(c.century_end) + "</b><br>" + TYPE_NAME[cls[key]] + " eclipses: " + c[key] +
                 "<br>All types: " + c.all_eclipses + "<br>Hybrid: " + c.hybrid + " · Total: " + c.total);
        base += c[key];
      });
      if (i % 5 === 0) {
        const t = el("text", { x: x, y: H - 14 }, svg); t.textContent = fmtYear(c.century_start);
      }
      // marks for the case studies
      const m = MARKS[String(c.century_start)];
      if (m) {
        const g = el("g", { class: "mark", tabindex: 0, role: "link", "aria-label": "Go to case: " + m.label }, svg);
        el("path", { d: "M" + (x + bw / 2) + " " + (PADT - 6) + " l-7 -12 h14 z", fill: "var(--ink)" }, g);
        const t = el("text", { x: x + bw / 2, y: PADT - 22, "text-anchor": "middle" }, g); t.textContent = m.label;
        t.style.fill = "var(--ink)";
        const go = () => { showCase(m.case); document.getElementById("s4").scrollIntoView(); };
        g.addEventListener("click", go);
        g.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
      }
    });
    // legend for stacked view
    if (!hybridsOnly) {
      let lx = PADL;
      [["H", "Hybrid"], ["T", "Total"], ["A", "Annular"], ["P", "Partial"]].forEach(([k, name]) => {
        el("rect", { x: lx, y: H - 3, width: 12, height: 12, fill: colour[k], stroke: "#000" }, svg);
        const t = el("text", { x: lx + 14, y: H + 6 }, svg); t.textContent = name; lx += 90;
      });
    }
  }
  render();
  const bAll = document.getElementById("btn-all"), bHyb = document.getElementById("btn-hybrid");
  function setMode(h) {
    hybridsOnly = h; bAll.setAttribute("aria-pressed", String(!h)); bHyb.setAttribute("aria-pressed", String(h)); render();
  }
  bAll.addEventListener("click", () => setMode(false));
  bHyb.addEventListener("click", () => setMode(true));
})();

const CASES = [
  {
    tab: "585 BCE",
    title: "28 May 585 BCE",
    sub: "A battle fell quiet, Herodotus says",
    sec: 364,
        row: [["Type", "Total"], ["Magnitude", "1.0798"], ["Catalogue duration", "6m 04s"],
          ["Greatest-eclipse point", "38°N 45°W"], ["Path width", "271 km"], ["Saros series", "57"], ["Catalogue no.", "03379"]],
        story: "Herodotus, writing later, says daylight vanished during a war between Lydia and Media. The armies stopped fighting and made peace. The eclipse date—28 May 585 BCE—is established; whether the philosopher Thales predicted it remains disputed.",
        caution: "NASA's 6m 04s is measured on the central line, at greatest eclipse in the North Atlantic—not the duration seen by the armies in Anatolia. The date uses the Julian calendar; its astronomical year is −584.",
    status: [["NASA row: verified", ""], ["Story: from a scholarly review", ""]],
    sources: [
      ["NASA catalogue, −0599 to −0500", "https://eclipse.gsfc.nasa.gov/SEcat5/SE-0599--0500.html"],
      ["arXiv 1307.2095 (review of the Thales prediction debate)", "https://arxiv.org/abs/1307.2095"]
    ]
  },
  {
    tab: "1919",
    title: "29 May 1919",
    sub: "An eclipse put Einstein's prediction to the test",
    sec: 411,
        row: [["Type", "Total"], ["Magnitude", "1.0719"], ["Catalogue duration", "6m 51s"],
          ["Greatest-eclipse point", "4°N 17°W"], ["Path width", "244 km"], ["Saros series", "136"], ["Catalogue no.", "09326"]],
        story: "Astronomers Frank Dyson and Arthur Eddington sent teams to Príncipe, off West Africa, and Sobral, Brazil. They set out to test Einstein's prediction that the Sun bends starlight. Their results were announced on 6 November 1919 and published the following year. Historians have since debated how the evidence was weighed.",
        caution: "NASA's 6m 51s is the central-line duration at greatest eclipse, in the Atlantic—not the totality experienced at either expedition site.",
    status: [["NASA row: verified", ""], ["Story: from the published paper and commentary", ""]],
    sources: [
      ["Dyson, Eddington & Davidson (1920), Phil. Trans. R. Soc. A 220, 291 — DOI 10.1098/rsta.1920.0009", "https://doi.org/10.1098/rsta.1920.0009"],
      ["Longair (2015) commentary — DOI 10.1098/rsta.2014.0287", "https://doi.org/10.1098/rsta.2014.0287"],
      ["Kennefick (2009), Physics Today 62, 37–42 (on the bias debate)", ""],
      ["NASA catalogue, 1901 to 2000", "https://eclipse.gsfc.nasa.gov/SEcat5/SE1901-2000.html"]
    ]
  },
  {
    tab: "2017",
    title: "21 August 2017",
    sub: "A century later, the question returns",
    sec: 160,
        row: [["Type", "Total"], ["Magnitude", "1.0306"], ["Catalogue duration", "2m 40s"],
          ["Greatest-eclipse point", "37°N 88°W"], ["Path width", "115 km"], ["Saros series", "145"], ["Catalogue no.", "09546"]],
        story: "A paper published in 2018 is listed as a study of starlight deflection during this eclipse. Its abstract and results have not yet been checked, so this story makes no claim about what it found.",
        caution: "The citation is checked; the paper itself still needs to be read. Its findings are not included here.",
    status: [["NASA row: verified", ""], ["Story: citation checked, paper not yet read", "pending"]],
    sources: [
      ["Bruns (2018), Class. Quantum Grav. 35, 075009", ""],
      ["NASA catalogue, 2001 to 2100", "https://eclipse.gsfc.nasa.gov/SEcat5/SE2001-2100.html"]
    ]
  }
];

function showCase(i) {
  const c = CASES[i];
  document.querySelectorAll("#case-tabs button").forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
  const rows = c.row.map(r => '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join("");
  const badges = c.status.map(s => '<span class="badge ' + s[1] + '">' + s[0] + '</span>').join("");
  const src = c.sources.map(s => s[1] ? '<a href="' + s[1] + '" target="_blank" rel="noopener">' + s[0] + '</a>' : s[0]).join("<br>");
  // comparison line, computed from the data of the three cases
  const other = CASES[i === 1 ? 2 : 1];
  const compare = (i === 1 || i === 2)
    ? '<p class="note">On the central line, the 1919 eclipse lasted ' + (CASES[1].sec / CASES[2].sec).toFixed(1) + ' times as long as the 2017 eclipse (' + fmtDuration(CASES[1].sec) + ' compared with ' + fmtDuration(CASES[2].sec) + ').</p>' : "";
  document.getElementById("case").innerHTML =
    '<h3>' + c.title + '</h3><p class="sub">' + c.sub + '</p>' +
    '<div class="cols"><div>' + rows +
    '<div style="margin-top:14px;height:18px;background:#fff;border:1px solid #000"><div style="height:100%;width:' + (c.sec / 449 * 100) + '%;background:#000"></div></div>' +
    '<p class="note">Bar length shows central-line totality, scaled to the catalogue\'s longest total eclipse (7m 29s).</p></div>' +
    '<div><p>' + c.story + '</p><p class="caution">' + c.caution + '</p>' + compare + '<p>' + badges + '</p></div></div>' +
    '<p class="sources">Sources:<br>' + src + '</p>';
}
(function initCases() {
  const tabs = document.getElementById("case-tabs");
  CASES.forEach((c, i) => {
    const b = document.createElement("button");
    b.textContent = c.tab; b.setAttribute("role", "tab");
    b.addEventListener("click", () => showCase(i));
    tabs.appendChild(b);
  });
  showCase(0);
})();

(function drawAhead() {
  const box = document.getElementById("ahead");
  const TODAY = "2026-09-30";
  const upcoming = ECLIPSES_21C.filter(e => e.type === "T" && e.duration_s !== null && e.date > TODAY);
  const long5 = upcoming.filter(e => e.duration_s >= 300).length;
  const next = upcoming[0];
  document.getElementById("ahead-claim").textContent =
    "The next total eclipse listed is " + next.date + ". Its central-line totality lasts " + fmtDuration(next.duration_s) +
    ". Of " + upcoming.length + " remaining total eclipses with catalogued durations through 2100, only " + long5 + " last five minutes or longer.";

  let ranked = false;
  function render() {
    box.innerHTML = "";
    const W = 1000, H = 320, PADL = 44, PADB = 34, PADT = 14;
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Central-line duration of upcoming total eclipses" }, box);
    const data = ranked ? upcoming.slice().sort((a, b) => b.duration_s - a.duration_s) : upcoming;
    const yMax = 420;                                     // 7 minutes
    const y = v => H - PADB - v / yMax * (H - PADB - PADT);
    for (let m = 0; m <= 7; m++) {
      el("line", { x1: PADL, x2: W, y1: y(m * 60), y2: y(m * 60), class: "axis" }, svg);
      const t = el("text", { x: PADL - 6, y: y(m * 60) + 4, "text-anchor": "end" }, svg); t.textContent = m + " min";
    }
    const bw = (W - PADL) / data.length;
    data.forEach((e, i) => {
      const isNext = e.date === next.date;
      const r = el("rect", { x: PADL + i * bw + 1, width: Math.max(bw - 2, 2), y: y(e.duration_s), height: y(0) - y(e.duration_s),
        fill: isNext ? "url(#pat-H)" : "#000", stroke: "#000", "stroke-width": 1, class: "seg", tabindex: 0 }, svg);
      attachTip(r, "<b>" + e.date + "</b><br>Central-line totality: " + fmtDuration(e.duration_s) + "<br>Magnitude: " + e.magnitude.toFixed(4));
      if (!ranked && i % 6 === 0) { const t = el("text", { x: PADL + i * bw, y: H - 12 }, svg); t.textContent = e.year; }
    });
    if (ranked) { const t = el("text", { x: PADL, y: H - 12 }, svg); t.textContent = "longest → shortest"; }
    const lab = el("text", { x: PADL + 4, y: PADT + 10 }, svg); lab.textContent = "Hatched bar: the next one (" + next.date + ")";
  }
  render();
  const bd = document.getElementById("btn-date"), br = document.getElementById("btn-rank");
  function setMode(r) { ranked = r; bd.setAttribute("aria-pressed", String(!r)); br.setAttribute("aria-pressed", String(r)); render(); }
  bd.addEventListener("click", () => setMode(false));
  br.addEventListener("click", () => setMode(true));
})();
