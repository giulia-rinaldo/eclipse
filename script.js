const SVG_NS = "http://www.w3.org/2000/svg";

function el(name, attributes, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const key in attributes) {
    node.setAttribute(key, attributes[key]);
  }
  if (parent) {
    parent.appendChild(node);
  }
  return node;
}

const TYPE_NAME = { T: "Total", A: "Annular", H: "Hybrid", P: "Partial" };
const TYPE_ORDER = ["T", "H", "A", "P"];
const LONGEST_SECONDS = 449;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmtDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes + "m " + String(rest).padStart(2, "0") + "s";
}

function words(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  let text = "";
  if (minutes > 0) {
    text = minutes + (minutes === 1 ? " minute " : " minutes ");
  }
  return text + rest + (rest === 1 ? " second" : " seconds");
}

function numberWord(n) {
  const names = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  return n < names.length ? names[n] : String(n);
}

function fmtYear(year) {
  if (year <= 0) {
    return (1 - year) + " BCE";
  }
  return year + " CE";
}

function dateText(date) {
  const day = Number(date.slice(8, 10));
  const month = MONTHS[Number(date.slice(5, 7)) - 1];
  return day + " " + month + " " + date.slice(0, 4);
}

function sumOf(key) {
  let sum = 0;
  for (let i = 0; i < CENTURIES.length; i++) {
    sum = sum + CENTURIES[i][key];
  }
  return sum;
}

const tip = document.getElementById("tip");

function showTip(event, html) {
  tip.innerHTML = html;
  tip.classList.add("show");
  tip.style.left = Math.min(event.clientX + 14, window.innerWidth - 280) + "px";
  tip.style.top = (event.clientY + 14) + "px";
}

function hideTip() {
  tip.classList.remove("show");
}

function attachTip(node, html) {
  node.addEventListener("mousemove", (event) => showTip(event, html));
  node.addEventListener("mouseleave", hideTip);
  node.addEventListener("focus", () => {
    const box = node.getBoundingClientRect();
    showTip({ clientX: box.left, clientY: box.top }, html);
  });
  node.addEventListener("blur", hideTip);
}

function drawSun(parent, cx, cy, radius, small) {
  const sun = el("g", {}, parent);
  const count = radius > 20 ? 60 : 16;
  const rays = el("g", { class: "rays" }, sun);
  for (let n = 0; n < count; n++) {
    const angle = n / count * 2 * Math.PI;
    const start = small ? radius : radius * 1.08;
    const end = start + radius * (small ? (n % 2 === 0 ? 0.75 : 0.45) : (n % 2 === 0 ? 0.26 : 0.12));
    el("line", {
      x1: cx + Math.cos(angle) * start, y1: cy + Math.sin(angle) * start,
      x2: cx + Math.cos(angle) * end, y2: cy + Math.sin(angle) * end, class: "ray"
    }, rays);
  }
  el("circle", { cx: cx, cy: cy, r: radius, class: "sun" }, sun);
  return sun;
}

function drawDialTicks(parent, cx, cy, radius) {
  const ticks = el("g", {}, parent);
  for (let n = 0; n < 60; n++) {
    const angle = n / 60 * 2 * Math.PI;
    const isLong = n % 5 === 0;
    const inner = radius * 1.08;
    const outer = radius * (isLong ? 1.2 : 1.14);
    el("line", {
      x1: cx + Math.sin(angle) * inner, y1: cy - Math.cos(angle) * inner,
      x2: cx + Math.sin(angle) * outer, y2: cy - Math.cos(angle) * outer,
      class: isLong ? "dial-tick long" : "dial-tick"
    }, ticks);
  }
  return ticks;
}

function drawEclipseIcon(parent, type) {
  const g = el("g", { class: "icon" }, parent);
  drawSun(g, 0, 0, 6.5, true);
  if (type === "T") {
    el("circle", { r: 7, class: "moon" }, g);
  } else if (type === "A") {
    el("circle", { r: 4.3, class: "moon" }, g);
  } else if (type === "H") {

    el("path", { d: "M0 -7 A7 7 0 0 1 0 7 L0 4.3 A4.3 4.3 0 0 1 0 -4.3 Z", class: "moon" }, g);
  } else {
    el("circle", { cx: 4.3, cy: -2.9, r: 5.8, class: "moon" }, g);
  }
  return g;
}

function eclipseIcon(type, size) {
  const svg = el("svg", { viewBox: "-13 -13 26 26", width: size, height: size, class: "icon-svg", "aria-hidden": "true" }, null);
  drawEclipseIcon(svg, type);
  return svg;
}

function clockFace(seconds) {
  const svg = el("svg", { viewBox: "0 0 100 100", class: "clock", "aria-hidden": "true" }, null);
  const fraction = Math.min(seconds / LONGEST_SECONDS, 1);
  const r = 33;

  el("circle", { cx: 50, cy: 50, r: r, class: "clock-face" }, svg);

  for (let n = 0; n < 60; n++) {
    const angle = n / 60 * 2 * Math.PI;
    const isLong = n % 5 === 0;
    const inner = r * 1.08, outer = r * (isLong ? 1.3 : 1.2);
    el("line", {
      x1: 50 + Math.sin(angle) * inner, y1: 50 - Math.cos(angle) * inner,
      x2: 50 + Math.sin(angle) * outer, y2: 50 - Math.cos(angle) * outer,
      class: isLong ? "clock-tick long" : "clock-tick"
    }, svg);
  }

  let d = "";
  if (fraction >= 1) {
    d = "M50 " + (50 - r) + " A" + r + " " + r + " 0 1 1 50 " + (50 + r) + " A" + r + " " + r + " 0 1 1 50 " + (50 - r);
  } else {
    const angle = fraction * 2 * Math.PI;
    d = "M50 " + (50 - r) + " A" + r + " " + r + " 0 " + (fraction > 0.5 ? 1 : 0) + " 1 " + (50 + Math.sin(angle) * r) + " " + (50 - Math.cos(angle) * r);
  }
  el("path", { d: d, class: "clock-arc" }, svg);

  return svg;
}

function addTypeFilter(legendId, containers) {
  const legend = document.getElementById(legendId);
  TYPE_ORDER.forEach((type) => {
    const button = document.createElement("button");
    button.className = "type-button";
    button.setAttribute("aria-pressed", "true");
    button.append(eclipseIcon(type, 20), TYPE_NAME[type]);
    button.addEventListener("click", () => {
      const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      containers.forEach((box) => {
        const marks = box.querySelectorAll('.mark[data-type="' + type + '"]');
        marks.forEach((mark) => mark.classList.toggle("off", !on));
      });
    });
    legend.appendChild(button);
  });
}

function eclipseTip(e) {
  let html = "<b>" + TYPE_NAME[e.type] + "</b><br>" + dateText(e.date) + "<br>Magnitude: " + e.magnitude.toFixed(4);
  if (e.duration_s !== null) {
    html = html + "<br>Central-line totality: " + fmtDuration(e.duration_s);
  }
  return html;
}

const facts = {};

function calculateFacts() {
  facts.counts = { T: sumOf("total"), A: sumOf("annular"), H: sumOf("hybrid"), P: sumOf("partial") };
  facts.all = sumOf("all_eclipses");
  facts.years = 5000;

  facts.century = [];
  for (let i = 0; i < ECLIPSES_21C.length; i++) {
    const e = ECLIPSES_21C[i];
    if (e.type === "T" && e.duration_s !== null) {
      facts.century.push(e);
    }
  }
  const byDuration = facts.century.slice();
  byDuration.sort((a, b) => b.duration_s - a.duration_s);
  facts.centuryLongest = byDuration[0];

  const today = new Date().toISOString().slice(0, 10);
  facts.today = today;
  facts.upcoming = [];
  for (let i = 0; i < facts.century.length; i++) {
    if (facts.century[i].date > today) {
      facts.upcoming.push(facts.century[i]);
    }
  }
  facts.next = facts.upcoming[0];
}

function drawIntro() {
  const intro = document.getElementById("intro");
  const stage = document.getElementById("stage");
  const svg = document.getElementById("scene");
  const sunRadius = 340;
  const moonRadius = sunRadius;
  const moonStart = 660;

  const scene = el("g", {}, svg);
  el("circle", { cx: 0, cy: 0, r: sunRadius, class: "sun dial-sun" }, scene);
  const moon = el("g", {}, scene);
  el("circle", { cx: 0, cy: 0, r: moonRadius, class: "moon" }, moon);

  const clock = el("g", { class: "intro-clock" }, scene);
  drawDialTicks(clock, 0, 0, moonRadius);
  const arc = el("path", { class: "intro-arc" }, clock);
  const time = el("text", { x: 0, y: 4, class: "intro-time" }, clock);

  el("text", { x: 0, y: 46, class: "intro-label" }, clock).textContent = "the longest total eclipse";

  const caption = [
    " On 16 July 2186, NASA's records say that over the Atlantic Ocean,",
    " the Moon will cover the Sun for 7 minutes and 29 seconds.",
  ];
  caption.forEach((line, i) => {
    el("text", { x: 0, y: 96 + i * 22, class: "intro-small" }, clock).textContent = line;
  });

  function update() {

    const room = intro.offsetHeight - window.innerHeight;
    let progress = -intro.getBoundingClientRect().top / room;
    progress = Math.max(0, Math.min(1, progress));

    const arrival = Math.min(progress / 0.7, 1);
    const eased = arrival * arrival * (3 - 2 * arrival);
    moon.setAttribute("transform", "translate(0 " + moonStart * (1 - eased) + ")");

    const width = window.innerWidth;
    let move = "translate(0 260)";
    if (width > 1300) { move = "translate(420 0)"; }
    else if (width > 1100) { move = "translate(340 0)"; }
    else if (width > 760) { move = "translate(220 0)"; }
    scene.setAttribute("transform", move);

    const total = arrival >= 1;
    stage.classList.toggle("total", total);

    let seconds = 0;
    if (total) {
      seconds = Math.round(Math.min((progress - 0.7) / 0.3, 1) * LONGEST_SECONDS);
    }
    const fraction = seconds / LONGEST_SECONDS;
    const angle = fraction * 2 * Math.PI;
    const r = moonRadius;
    let d = "";
    if (fraction >= 1) {
      d = "M0 " + (-r) + " A" + r + " " + r + " 0 1 1 0 " + r + " A" + r + " " + r + " 0 1 1 0 " + (-r);
    } else if (fraction > 0) {
      d = "M0 " + (-r) + " A" + r + " " + r + " 0 " + (fraction > 0.5 ? 1 : 0) + " 1 " + (Math.sin(angle) * r) + " " + (-Math.cos(angle) * r);
    }
    arc.setAttribute("d", d);
    time.textContent = fmtDuration(seconds);
  }

  window.addEventListener("scroll", update);
  window.addEventListener("resize", update);
  update();
}

function drawScrubber() {
  const box = document.getElementById("scrubber");
  const magnitude = 1.0306;
  const sunRadius = 130;
  const moonRadius = sunRadius * magnitude;
  const reach = sunRadius + moonRadius;
  const width = 1000, height = 370, cx = 500, cy = 185;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = el("svg", { viewBox: "0 0 " + width + " " + height, "aria-hidden": "true" }, box);

  drawSun(svg, cx, cy, sunRadius);
  const moon = el("circle", { cx: cx, cy: cy, r: moonRadius, class: "moon" }, svg);

  const totalPart = (moonRadius - sunRadius) / reach;
  const line = el("g", { class: "central-line" }, svg);
  el("line", { x1: cx - reach, x2: cx + reach, y1: cy, y2: cy, class: "line-dotted" }, line);
  const star = el("path", { d: "M-10 0 L10 0 M0 -10 L0 10 M-7 -7 L7 7 M7 -7 L-7 7", class: "mark-star" }, line);

  const control = document.createElement("div");
  control.className = "scrubber-control";
  control.style.marginLeft = "calc(" + (cx - reach) / width * 100 + "% - 9px)";
  control.style.width = "calc(" + 2 * reach / width * 100 + "% + 18px)";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = -1000;
  slider.max = 1000;
  slider.step = 5;
  slider.value = -1000;
  slider.setAttribute("aria-label", "Position of the Moon, from the start of the eclipse to the end");
  control.append(slider);
  control.insertAdjacentHTML("afterbegin", "<span class='control-start'>start</span>");
  control.insertAdjacentHTML("beforeend", "<span class='control-end'>end</span>");
  box.appendChild(control);

  const sentence = document.createElement("p");
  sentence.className = "scrubber-sentence";
  sentence.setAttribute("aria-live", "polite");
  box.appendChild(sentence);

  function update() {
    const k = slider.value / 1000;
    moon.setAttribute("cx", cx + k * reach);
    star.setAttribute("transform", "translate(" + (cx + k * reach) + " " + cy + ")");
    let text = "Most of the Sun is hidden, but a thin edge is still bright.";
    if (Math.abs(k) <= totalPart) {
      text = "A total eclipse. This is the brief moment people travel to see.";
    } else if (Math.abs(k) > 0.97) {
      text = "The Moon is just touching the Sun.";
    } else if (Math.abs(k) > 0.5) {
      text = "A small bite is missing from the Sun. This is a partial eclipse.";
    }
    sentence.textContent = text;
    slider.setAttribute("aria-valuetext", text);
  }

  // The figure is pinned to the screen while the page scrolls past it. The page does not stop:
  // an invisible stretch of extra height (the "track") keeps the figure in place, and how far
  // we are through that stretch decides where the Moon is. A long track makes the Moon slow.
  // The pinned group is the opening paragraph, the figure and the hairline under it.
  const figure = box.closest("figure");
  const intro = document.querySelector("p.prose.first");
  const rule = figure.nextElementSibling;
  const track = document.createElement("div");
  track.className = "scrub-track";
  const pin = document.createElement("div");
  pin.className = "scrub-pin";
  intro.parentNode.insertBefore(track, intro);
  track.appendChild(pin);
  pin.append(intro, figure, rule);

  function sizeTrack() {
    if (reduceMotion) { return; }
    // centred vertically; if the group is taller than the window it sits at the top
    pin.style.top = Math.max(8, (window.innerHeight - pin.offsetHeight) / 2) + "px";
    track.style.height = (pin.offsetHeight + window.innerHeight * 2.5) + "px";
  }
  function followPage() {
    if (reduceMotion) { return; }
    const distance = track.offsetHeight - pin.offsetHeight;
    const travelled = -track.getBoundingClientRect().top + parseFloat(pin.style.top || 0);
    const progress = Math.max(0, Math.min(1, travelled / distance));
    slider.value = Math.round((progress * 2 - 1) * 200) * 5;
    update();
  }

  // The slider can move the Moon by hand; the next scroll (down or up) takes it again.
  slider.addEventListener("input", update);
  window.addEventListener("scroll", followPage);
  window.addEventListener("resize", () => { sizeTrack(); followPage(); });
  if (reduceMotion) { slider.value = -700; }
  sizeTrack();
  update();
  followPage();
}

function drawTypeCards() {
  const box = document.getElementById("type-cards");
  const sunX = 60, sunR = 46, moonR = 22, distance = 170, earthR = 48;
  const moonX = sunX + distance;
  const umbraTip = moonX + moonR * distance / (sunR - moonR);
  const cross = sunX + distance * sunR / (sunR + moonR);
  const umbraSlope = moonR / Math.sqrt((umbraTip - moonX) ** 2 - moonR ** 2);
  const penumbraSlope = moonR / Math.sqrt((moonX - cross) ** 2 - moonR ** 2);
  function umbraHalf(x) { return umbraSlope * Math.abs(umbraTip - x); }
  function penumbraHalf(x) { return penumbraSlope * (x - cross); }

  const types = [
    { type: "T", earthX: umbraTip - 30, earthY: 0,
      text: "A total solar eclipse happens when the Moon passes between the Sun and Earth. People located in the center of the Moon's shadow when it hits Earth will experience a total eclipse." },
    { type: "H", earthX: umbraTip, earthY: 0,
      text: "Because Earth's surface is curved, sometimes an eclipse can shift between annular and total as the Moon's shadow moves across the globe. This is called a hybrid solar eclipse." },
    { type: "A", earthX: umbraTip + 50, earthY: 0,
      text: "An annular solar eclipse happens when the Moon passes between the Sun and Earth. Because the Moon is farther away from Earth, the Moon appears as a dark disk on top of a larger, bright disk, creating what looks like a ring around the Moon." },
    { type: "P", earthX: umbraTip + 10, earthY: 88,
      text: "A partial solar eclipse happens when the Moon passes between the Sun and Earth but the Sun, Moon, and Earth are not perfectly lined up. Only a part of the Sun will appear to be covered, giving it a crescent shape. During a total or annular solar eclipse, people outside the area covered by the Moon's inner shadow see a partial solar eclipse." }
  ];

  function points(list) {
    return list.map((p) => p[0] + "," + p[1]).join(" ");
  }

  function label(parent, x, y, text) {
    const width = text.length * 7.6 + 10;
    el("rect", { x: x - width / 2, y: y - 12, width: width, height: 17, class: "label-box" }, parent);
    el("text", { x: x, y: y, class: "shadow-label", "text-anchor": "middle" }, parent).textContent = text;
  }

  function drawGeometry(t, index) {
    const svg = el("svg", { viewBox: "-10 -125 540 250", role: "img", "aria-label": "Side view of the Sun, the Moon and Earth for a " + TYPE_NAME[t.type].toLowerCase() + " eclipse" }, null);
    const defs = el("defs", {}, svg);
    const earthX = t.earthX + earthR;

    const penumbra = [[moonX, -penumbraHalf(moonX)], [earthX, -penumbraHalf(earthX)], [earthX, penumbraHalf(earthX)], [moonX, penumbraHalf(moonX)]];
    const umbraEnd = Math.min(umbraTip, earthX);
    const umbra = [[moonX, -umbraHalf(moonX)], [umbraEnd, -umbraHalf(umbraEnd)], [umbraEnd, umbraHalf(umbraEnd)], [moonX, umbraHalf(moonX)]];
    const antumbra = [[umbraTip, 0], [earthX, -umbraHalf(earthX)], [earthX, umbraHalf(earthX)]];
    el("polygon", { points: points(penumbra), class: "shadow-penumbra" }, svg);

    el("polygon", { points: points(penumbra) }, el("clipPath", { id: "dots-" + index }, defs));
    const dots = el("g", { "clip-path": "url(#dots-" + index + ")" }, svg);
    for (let x = moonX; x <= earthX; x += 5) {
      for (let y = -penumbraHalf(earthX); y <= penumbraHalf(earthX); y += 5) {
        el("circle", { cx: x, cy: y, r: 1, class: "penumbra-dot" }, dots);
      }
    }
    if (t.type === "A") { el("polygon", { points: points(antumbra), class: "shadow-antumbra" }, svg); }
    el("polygon", { points: points(umbra), class: "shadow-umbra" }, svg);

    el("line", { x1: sunX, y1: -sunR, x2: umbraTip, y2: 0, class: "shadow-ray" }, svg);
    el("line", { x1: sunX, y1: sunR, x2: umbraTip, y2: 0, class: "shadow-ray" }, svg);
    drawSun(svg, sunX, 0, sunR);
    el("circle", { cx: moonX, cy: 0, r: moonR, class: "moon" }, svg);
    el("circle", { cx: earthX, cy: t.earthY, r: earthR, class: "shadow-earth" }, svg);

    const umbraLabelX = (moonX + umbraTip) / 2;
    label(svg, umbraLabelX, 112, "UMBRA");
    el("line", { x1: umbraLabelX, y1: 100, x2: umbraLabelX, y2: umbraHalf(umbraLabelX) + 2, class: "shadow-leader" }, svg);
    label(svg, moonX + 60, -108, "PENUMBRA");
    el("line", { x1: moonX + 60, y1: -98, x2: moonX + 60, y2: -penumbraHalf(moonX + 60) - 3, class: "shadow-leader" }, svg);
    if (t.type === "A") {
      label(svg, umbraTip + 40, 112, "ANTUMBRA");
      el("line", { x1: umbraTip + 40, y1: 100, x2: umbraTip + 40, y2: umbraHalf(umbraTip + 40) + 2, class: "shadow-leader" }, svg);
    }
    return svg;
  }

  function drawView(t) {
    const svg = el("svg", { viewBox: "0 0 300 220", role: "img", "aria-label": "The Sun as seen during a " + TYPE_NAME[t.type].toLowerCase() + " eclipse" }, null);

    function total(cx, cy, r) {
      for (let n = 0; n < 40; n++) {
        const angle = n / 40 * 2 * Math.PI;
        const length = n % 2 === 0 ? 20 : 9;
        el("line", {
          x1: cx + Math.cos(angle) * (r + 6), y1: cy + Math.sin(angle) * (r + 6),
          x2: cx + Math.cos(angle) * (r + 6 + length), y2: cy + Math.sin(angle) * (r + 6 + length),
          class: "shadow-corona"
        }, svg);
      }
      el("circle", { cx: cx, cy: cy, r: r, class: "moon" }, svg);
    }

    function ring(cx, cy, r) {
      drawSun(svg, cx, cy, r + 7);
      el("circle", { cx: cx, cy: cy, r: r, class: "moon" }, svg);
    }

    if (t.type === "T") { total(150, 105, 46); }
    if (t.type === "A") { ring(150, 105, 62); }
    if (t.type === "H") { total(85, 105, 34); ring(215, 105, 46); }
    if (t.type === "P") {
      drawSun(svg, 130, 115, 64);
      el("circle", { cx: 180, cy: 80, r: 62, class: "moon" }, svg);
    }
    return svg;
  }

  types.forEach((t, index) => {
    const card = document.createElement("div");
    card.className = "type-card";

    const head = document.createElement("div");
    head.className = "type-head";
    head.appendChild(eclipseIcon(t.type, 40));
    head.insertAdjacentHTML("beforeend", "<h3>" + TYPE_NAME[t.type] + "</h3><p>" + t.text + "</p>");

    const panels = document.createElement("div");
    panels.className = "type-panels";
    const panelList = [[drawGeometry(t, index), "The geometry"], [drawView(t), "The Sun from inside it"]];
    panelList.forEach((panel, i) => {
      const figure = document.createElement("div");
      figure.className = "type-panel";
      figure.appendChild(panel[0]);
      figure.insertAdjacentHTML("beforeend", "<p>" + (i + 1) + ". " + panel[1] + "</p>");
      panels.appendChild(figure);
    });

    card.append(head, panels);
    box.appendChild(card);
  });
}

function drawStrips() {
  const width = 1000, left = 40, diagramHeight = 100;

  function drawSunAndMoon(svg, x, magnitude, isPartial) {
    const r = 34;
    let moonR = r * magnitude;
    let shift = 0;
    if (isPartial) {
      moonR = r;
      shift = 2 * r * (1 - magnitude);
    }
    drawSun(svg, x, 40, r);
    el("circle", { cx: x + shift, cy: 40, r: moonR, class: "moon" }, svg);
    if (isPartial || magnitude >= 1) {
      el("circle", { cx: x, cy: 40, r: r, class: "sun-edge" }, svg);
    }
  }

  function drawStrip(boxId, rows, min, max, ticks, referenceLine, isPartial) {
    const box = document.getElementById(boxId);
    const height = diagramHeight + rows.length * 66 + 34;
    const label = isPartial ? "Magnitude of partial eclipses, 2001 to 2100" : "Magnitude of total, hybrid and annular eclipses, 2001 to 2100";
    const svg = el("svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": label }, box);
    const x = (value) => left + (value - min) / (max - min) * (width - left * 2);

    ticks.forEach((tick) => {
      drawSunAndMoon(svg, x(tick), tick, isPartial);
      el("line", { x1: x(tick), x2: x(tick), y1: diagramHeight, y2: height - 26, class: "axis" }, svg);
      el("text", { x: x(tick), y: height - 8, "text-anchor": "middle" }, svg).textContent = tick.toFixed(2);
    });
    if (referenceLine !== null) {
      el("line", { x1: x(referenceLine), x2: x(referenceLine), y1: diagramHeight, y2: height - 26, class: "reference" }, svg);
    }

    rows.forEach((type, row) => {
      const y = diagramHeight + 38 + row * 66;

      let count = 0;
      for (let i = 0; i < ECLIPSES_21C.length; i++) {
        const e = ECLIPSES_21C[i];
        if (e.type !== type) { continue; }
        const spread = ((count * 37) % 25) - 12;
        count = count + 1;
        const mark = el("g", { class: "mark", "data-type": type, tabindex: 0, transform: "translate(" + x(e.magnitude) + " " + (y + spread) + ") scale(.85)" }, svg);
        drawEclipseIcon(mark, type);
        attachTip(mark, eclipseTip(e));
      }
    });
  }

  drawStrip("strip-central", ["T", "H", "A"], 0.90, 1.10, [0.90, 0.95, 1.00, 1.05, 1.10], 1.0, false);
  drawStrip("strip-partial", ["P"], 0, 1, [0, 0.25, 0.5, 0.75, 1], null, true);
  addTypeFilter("strip-legend", [document.getElementById("strip-central"), document.getElementById("strip-partial")]);
}

// The base map (sea, graticule, continents), shared by the town map and the "ahead" map.
// Returns the svg and the two functions that turn longitude and latitude into screen coordinates.
function makeWorldMap(box, label) {
  const width = 1000, margin = 14;

  function project(lon, lat) {
    const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
    const theta = Math.asin(Math.sqrt(3) / 2 * Math.sin(lat * Math.PI / 180));
    const t2 = theta * theta;
    const t6 = t2 * t2 * t2;
    const x = 2 * Math.sqrt(3) * (lon * Math.PI / 180) * Math.cos(theta) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1));
    const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
    return [x, y];
  }
  const fullWidth = project(180, 0)[0] * 2;
  const fullHeight = project(0, 90)[1] * 2;
  const scale = (width - margin * 2) / fullWidth;
  const height = Math.round(fullHeight * scale + margin * 2);
  function screenX(lon, lat) { return margin + (project(lon, lat)[0] + fullWidth / 2) * scale; }
  function screenY(lon, lat) { return margin + (fullHeight / 2 - project(lon, lat)[1]) * scale; }

  function pathOf(list) {
    let d = "";
    for (let i = 0; i < list.length; i++) {
      d = d + (i === 0 ? "M" : "L") + screenX(list[i][0], list[i][1]).toFixed(1) + " " + screenY(list[i][0], list[i][1]).toFixed(1);
    }
    return d;
  }

  const svg = el("svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": label }, box);

  const edge = [];
  for (let lat = -90; lat <= 90; lat += 5) { edge.push([180, lat]); }
  for (let lat = 90; lat >= -90; lat -= 5) { edge.push([-180, lat]); }
  el("path", { d: pathOf(edge) + "Z", class: "map-sea" }, svg);
  for (let lon = -150; lon <= 150; lon += 30) {
    const meridian = [];
    for (let lat = -90; lat <= 90; lat += 5) { meridian.push([lon, lat]); }
    el("path", { d: pathOf(meridian), class: "map-grid" }, svg);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    el("path", { d: pathOf([[-180, lat], [0, lat], [180, lat]]), class: "map-grid" }, svg);
  }
  let land = "";
  for (let i = 0; i < LAND.length; i++) { land = land + pathOf(LAND[i]) + "Z"; }
  el("path", { d: land, class: "map-land" }, svg);

  return { svg: svg, width: width, height: height, screenX: screenX, screenY: screenY };
}

function drawWorld() {
  const box = document.getElementById("world-map");
  const map = makeWorldMap(box, "World map: every town of 15,000 people or more, bigger dot for an earlier next total eclipse");
  const svg = map.svg, width = map.width, height = map.height, screenX = map.screenX, screenY = map.screenY;

  const towns = [];
  TOWNS.split("\n").forEach((line) => {
    const part = line.split("|");
    const town = { name: part[0], lat: Number(part[1]), lon: Number(part[2]), code: part[3], eclipse: part[4] === "" ? -1 : Number(part[4]) };
    town.x = screenX(town.lon, town.lat);
    town.y = screenY(town.lon, town.lat);
    town.years = town.eclipse < 0 ? -1 : yearsUntil(TOWN_ECLIPSES[town.eclipse]);
    towns.push(town);
  });

  const groups = [
    { label: "up to 10 years", radius: 3.4, d: "" },
    { label: "11 to 25 years", radius: 2.6, d: "" },
    { label: "26 to 50 years", radius: 1.9, d: "" },
    { label: "51 to 75 years", radius: 1.3, d: "" },
    { label: "none before 2101", radius: 0.6, d: "" }
  ];
  function groupOf(years) {
    if (years < 0) { return 4; }
    if (years <= 10) { return 0; }
    if (years <= 25) { return 1; }
    if (years <= 50) { return 2; }
    return 3;
  }
  let onPath = 0, nextEclipseTowns = 0;
  towns.forEach((town) => {
    groups[groupOf(town.years)].d += "M" + town.x.toFixed(1) + " " + town.y.toFixed(1) + "h0";
    if (town.eclipse >= 0) { onPath = onPath + 1; }
    if (town.eclipse === 0) { nextEclipseTowns = nextEclipseTowns + 1; }
  });
  for (let g = 4; g >= 0; g--) {
    el("path", { d: groups[g].d, class: "town-dots", "stroke-width": groups[g].radius * 2 }, svg);
  }

  const named = [
    { name: "Reykjavík", code: "IS", dx: -10, dy: -14, anchor: "end" },
    { name: "Moscow", code: "RU", dx: 12, dy: -12, anchor: "start" },
    { name: "London", code: "GB", dx: -12, dy: 2, anchor: "end" },
    { name: "New York City", code: "US", dx: 12, dy: 8, anchor: "start" },
    { name: "Los Angeles", code: "US", dx: -12, dy: -2, anchor: "end" },
    { name: "Mexico City", code: "MX", dx: -12, dy: 14, anchor: "end" },
    { name: "São Paulo", code: "BR", dx: 12, dy: 8, anchor: "start" },
    { name: "Dubai", code: "AE", dx: 12, dy: 6, anchor: "start" },
    { name: "Shanghai", code: "CN", dx: 12, dy: -2, anchor: "start" },
    { name: "Bangkok", code: "TH", dx: 12, dy: 12, anchor: "start" },
    { name: "Sydney", code: "AU", dx: -12, dy: 4, anchor: "end" }
  ];
  named.forEach((item) => {
    const town = towns.find((t) => t.name === item.name && t.code === item.code);
    if (!town) { return; }
    el("circle", { cx: town.x, cy: town.y, r: 5.5, class: "town-ring" }, svg);
    el("text", { x: town.x + item.dx, y: town.y + item.dy, "text-anchor": item.anchor, class: "town-name" }, svg).textContent = town.name;
    el("text", { x: town.x + item.dx, y: town.y + item.dy + 14, "text-anchor": item.anchor, class: "town-years" }, svg).textContent = yearsInWords(town);
  });

  svg.addEventListener("mousemove", (event) => {
    const rect = svg.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / rect.width * width;
    const mouseY = (event.clientY - rect.top) / rect.height * height;
    let best = null, bestDistance = 64;
    towns.forEach((town) => {
      const dx = town.x - mouseX, dy = town.y - mouseY;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) { best = town; bestDistance = distance; }
    });
    if (best) { showTip(event, townText(best)); } else { hideTip(); }
  });
  svg.addEventListener("mouseleave", hideTip);

  const search = document.getElementById("town-search");
  const result = document.getElementById("town-result");
  const marker = el("circle", { cx: 0, cy: 0, r: 9, class: "town-found", display: "none" }, svg);
  search.addEventListener("input", () => {
    const text = search.value.trim().toLowerCase();
    let found = null;
    if (text.length > 1) {
      found = towns.find((t) => t.name.toLowerCase().startsWith(text));
    }
    if (found) {
      marker.setAttribute("cx", found.x);
      marker.setAttribute("cy", found.y);
      marker.setAttribute("display", "inline");
      result.textContent = found.name + ", " + COUNTRY_NAMES[found.code] + ": " + yearsInWords(found) + (found.eclipse >= 0 ? ", on " + dateText(TOWN_ECLIPSES[found.eclipse]) + "." : ".");
    } else {
      marker.setAttribute("display", "none");
      result.textContent = text.length > 1 ? "No town of 15,000 people or more starts with that." : "";
    }
  });

  const legend = document.getElementById("map-legend");
  groups.forEach((group) => {
    const item = document.createElement("span");
    const dot = el("svg", { viewBox: "-5 -5 10 10", width: 14, height: 14, "aria-hidden": "true" }, null);
    el("circle", { r: group.radius * 1.2, class: "town-key" }, dot);
    item.append(dot, group.label);
    legend.appendChild(item);
  });

  document.getElementById("world-lead").textContent =
    "Of the " + towns.length.toLocaleString("en") + " towns with 15,000 people or more, " + onPath.toLocaleString("en") + " (" + Math.round(onPath / towns.length * 100) +
    "%) lie on the path of at least one of the " + TOWN_ECLIPSES.length + " total eclipses still to come before 2101. The next one, on " + dateText(TOWN_ECLIPSES[0]) +
    ", crosses " + nextEclipseTowns + " of them. For the other " + (100 - Math.round(onPath / towns.length * 100)) + "% no total eclipse arrives before 2101.";
}

function yearsUntil(date) {
  return Math.round((new Date(date) - new Date(facts.today)) / (365.25 * 24 * 3600 * 1000));
}

function yearsInWords(town) {
  if (town.eclipse < 0) { return "none before 2101"; }
  if (town.years <= 0) { return "this year"; }
  return town.years === 1 ? "in 1 year" : "in " + town.years + " years";
}

function townText(town) {
  let html = "<b>" + town.name + "</b><br>" + COUNTRY_NAMES[town.code] + "<br>" + yearsInWords(town);
  if (town.eclipse >= 0) {
    html = html + "<br>Next total: " + dateText(TOWN_ECLIPSES[town.eclipse]);
  }
  return html;
}

function drawCases() {
  const box = document.getElementById("cases");

  CASES.forEach((c, i) => {
    let paragraphs = "";
    c.paragraphs.forEach((text) => { paragraphs = paragraphs + "<p class='prose'>" + text + "</p>"; });

    const card = document.createElement("div");
    card.className = "type-card case";
    card.id = "case-" + i;

    const head = document.createElement("div");
    head.className = "type-head";
    head.appendChild(eclipseIcon("T", 40));
    head.insertAdjacentHTML("beforeend", "<h3>" + c.title + "</h3><p>" + c.subtitle + "</p>");

    const panels = document.createElement("div");
    panels.className = "type-panels";
    const numbers = document.createElement("div");
    numbers.className = "type-panel";
    numbers.innerHTML = "<div class='facts-table'><p><span>Magnitude</span><b>" + c.magnitude + "</b></p><p><span>Greatest eclipse at</span><b>" + c.greatest +
      "</b></p><p><span>Path width</span><b>" + c.pathWidth + "</b></p><p><span>Duration on the central line</span><b>" + c.duration + "</b></p><p><span>Catalogue no. · Saros</span><b>" +
      c.catalogueNo + " · " + c.saros + "</b></p></div>";
    const map = document.createElement("div");
    map.className = "type-panel";
    map.innerHTML = "<img src='" + c.map + "' alt='" + c.mapAlt + "' loading='lazy'>";
    panels.append(map, numbers);

    card.append(head, panels);
    card.insertAdjacentHTML("beforeend", paragraphs);
    box.appendChild(card);
  });
}

function drawAhead() {
  const box = document.getElementById("ahead");
  let byDate = true;

  let atLeastFive = 0;
  let shortest = facts.upcoming[0];
  let nextIsLongest = true;
  facts.upcoming.forEach((e) => {
    if (e.duration_s >= 300) { atLeastFive = atLeastFive + 1; }
    if (e.duration_s < shortest.duration_s) { shortest = e; }
    if (e.duration_s > facts.next.duration_s) { nextIsLongest = false; }
  });
  let longPart = numberWord(atLeastFive) + " will last five minutes or longer";
  if (nextIsLongest) {
    longPart = longPart + ", including the next eclipse, which will be the longest of the remaining events";
  }
  document.getElementById("ahead-claim").textContent =
    "Between now and 2100, " + facts.upcoming.length + " total solar eclipses with catalogued durations remain. " + longPart + ". " +
    "The shortest, on " + dateText(shortest.date) + ", will last just " + words(shortest.duration_s) + ".";

  // How many of the towns on the town map (towns.js) each coming eclipse crosses
  const townCount = {};
  TOWNS.split("\n").forEach((line) => {
    const index = line.split("|")[4];
    if (index !== "") { townCount[TOWN_ECLIPSES[Number(index)]] = (townCount[TOWN_ECLIPSES[Number(index)]] || 0) + 1; }
  });

  // The map: the central line of each coming total eclipse, from NASA's path tables (tracks.js).
  const map = makeWorldMap(document.getElementById("ahead-map"), "World map: the central line of each total eclipse still to come before 2101");
  map.svg.classList.add("tracks-active");
  const lines = {};
  facts.upcoming.forEach((e) => {
    const points = TRACKS[e.date];
    if (!points) { return; }
    // A line that crosses the date line (longitude 180) is cut in two so it does not run across the whole map.
    let d = "";
    for (let i = 0; i < points.length; i++) {
      const jump = i > 0 && Math.abs(points[i][0] - points[i - 1][0]) > 180;
      d = d + (i === 0 || jump ? "M" : "L") + map.screenX(points[i][0], points[i][1]).toFixed(1) + " " + map.screenY(points[i][0], points[i][1]).toFixed(1);
    }
    lines[e.date] = el("path", { d: d, class: "track" }, map.svg);
    const hit = el("path", { d: d, class: "track-hit" }, map.svg);
    hit.addEventListener("mouseenter", () => show(e.date));
    hit.addEventListener("mouseleave", () => show(chosen));
    hit.addEventListener("click", () => select(e.date));
  });

  // The detail under the map follows the mouse (a preview); a click keeps an eclipse there.
  const detail = document.getElementById("ahead-detail");
  let chosen = facts.upcoming[0].date;

  function select(date) {
    chosen = date;
    show(date);
  }

  function show(date) {
    const position = facts.upcoming.findIndex((e) => e.date === date);
    const e = facts.upcoming[position];
    Object.keys(lines).forEach((key) => lines[key].classList.toggle("on", key === date));
    if (lines[date]) { map.svg.appendChild(lines[date]); }

    const towns = townCount[date] || 0;
    detail.innerHTML = "";
    const main = document.createElement("div");
    main.className = "detail-main";
    main.appendChild(clockFace(e.duration_s));
    main.insertAdjacentHTML("beforeend",
      "<div class='detail-text'><b>" + dateText(e.date) + "</b>" +
      "<span>" + fmtDuration(e.duration_s) + " of totality on the central line</span>" +
      "<span>Magnitude " + e.magnitude.toFixed(4) + "</span>" +
      "<span>Crosses " + towns.toLocaleString("en") + " of the " + TOWNS.split("\n").length.toLocaleString("en") + " towns of 15,000 people or more</span></div>");
    detail.appendChild(main);

    const buttons = document.createElement("div");
    buttons.className = "detail-buttons";
    const earlier = document.createElement("button");
    earlier.textContent = "← Earlier";
    earlier.disabled = position === 0;
    earlier.addEventListener("click", () => select(facts.upcoming[position - 1].date));
    earlier.addEventListener("mouseleave", () => show(chosen));
    const later = document.createElement("button");
    later.textContent = "Later →";
    later.disabled = position === facts.upcoming.length - 1;
    later.addEventListener("click", () => select(facts.upcoming[position + 1].date));
    buttons.append(earlier, later);
    detail.appendChild(buttons);
  }

  function render() {
    box.innerHTML = "";
    const list = facts.upcoming.slice();
    if (!byDate) {
      list.sort((a, b) => b.duration_s - a.duration_s);
    }
    list.forEach((e) => {
      const item = document.createElement("div");
      item.className = "clock-item";
      item.setAttribute("tabindex", 0);
      item.dataset.date = e.date;
      item.appendChild(clockFace(e.duration_s));
      item.insertAdjacentHTML("beforeend", "<span class='clock-time'>" + fmtDuration(e.duration_s) + "</span><span class='clock-date'>" + dateText(e.date) + "</span>");
      attachTip(item, eclipseTip(e));
      box.appendChild(item);
    });
  }
  select(chosen);

  function setMode(sortByDate) {
    byDate = sortByDate;
    document.getElementById("button-date").setAttribute("aria-pressed", String(sortByDate));
    document.getElementById("button-longest").setAttribute("aria-pressed", String(!sortByDate));
    render();
  }
  document.getElementById("button-date").addEventListener("click", () => setMode(true));
  document.getElementById("button-longest").addEventListener("click", () => setMode(false));
  render();
}

function fillText() {

  const types = { P: 0, A: 0, T: 0, H: 0 };
  ECLIPSES_21C.forEach((e) => { types[e.type] = types[e.type] + 1; });

  const values = {
    all: facts.all.toLocaleString("en"),
    total: facts.counts.T.toLocaleString("en"),
    longest: words(LONGEST_SECONDS),
    shortest: words(9),
    intervalAll: Math.round(facts.years * 12 / facts.all) + " months",
    intervalTotal: Math.round(facts.years * 12 / facts.counts.T) + " months",
    perYear: (facts.all / facts.years).toFixed(1),
    path2017: CASES[2].pathWidth,
    time2017: words(CASES[2].seconds),
    nextDate: dateText(facts.next.date),
    nextTime: words(facts.next.duration_s),
    centuryLongestDate: dateText(facts.centuryLongest.date),
    centuryLongestTime: words(facts.centuryLongest.duration_s),
    catalogueP: facts.counts.P.toLocaleString("en"),
    catalogueA: facts.counts.A.toLocaleString("en"),
    catalogueH: facts.counts.H.toLocaleString("en"),
    catalogueT: facts.counts.T.toLocaleString("en"),
    oneInTotal: Math.round(facts.all / facts.counts.T),
    count21: ECLIPSES_21C.length,
    count21P: types.P,
    count21A: types.A,
    count21T: types.T,
    count21H: types.H,
    upcomingCount: facts.upcoming.length,
    townCount: TOWNS.split("\n").length.toLocaleString("en")
  };

  document.querySelectorAll("[data-fill]").forEach((span) => {
    span.textContent = values[span.dataset.fill];
  });
}

calculateFacts();
drawIntro();
drawScrubber();
drawTypeCards();
drawStrips();
drawWorld();
drawCases();
drawAhead();
fillText();
