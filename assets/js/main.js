/* =====================================================================
   TRENDY SKY — Landing page v2 interactions
   Vanilla JS. Uses Bootstrap's bundle only for offcanvas / modal / accordion.
   ===================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  root.classList.replace("no-js", "js");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesk = () => matchMedia("(min-width: 992px)").matches;
  const money = n => "GH₵ " + Number(n).toLocaleString("en-GH");
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } }
  };

  /* ---------- graceful image fallback ---------- */
  $$("img").forEach(img => {
    const fail = () => img.classList.add("is-missing");
    if (img.complete && img.naturalWidth === 0 && img.src) fail();
    img.addEventListener("error", fail, { once: true });
  });

  $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));

  /* footer link groups start collapsed on phones */
  if (!matchMedia("(min-width: 768px)").matches) $$(".ftr__col").forEach(d => d.removeAttribute("open"));

  /* ---------- toast ---------- */
  const toastEl = $("[data-toast]");
  let toastT;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("on"), 2600);
  };

  /* ---------- offer strip rotator ---------- */
  const strip = $("[data-rotator]");
  if (strip) {
    const items = $$("p", strip);
    let i = 0;
    setInterval(() => {
      const cur = items[i];
      cur.classList.replace("is-active", "is-out");
      setTimeout(() => cur.classList.remove("is-out"), 700);
      i = (i + 1) % items.length;
      items[i].classList.add("is-active");
    }, 4000);
  }

  /* ---------- header: border when stuck, hide on scroll down ---------- */
  const hdr = $("[data-header]");
  const dock = $("[data-dock]");
  const offers = $("#offers");
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle("is-stuck", y > 10);
    hdr.classList.toggle("is-up", y > 600 && y > lastY + 2 && !document.body.classList.contains("modal-open"));
    if (y < lastY - 2) hdr.classList.remove("is-up");
    // promo dock: show after the hero, hide while the offers section itself is on screen
    if (dock && offers) {
      const r = offers.getBoundingClientRect();
      const offersVisible = r.top < innerHeight && r.bottom > 0;
      dock.classList.toggle("is-on", y > innerHeight * 0.8 && !offersVisible);
    }
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- split headings into words ---------- */
  const split = (node, c) => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const f = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) return f.append(" ");
          const w = document.createElement("span"); w.className = "w";
          const s = document.createElement("span"); s.textContent = p; s.style.setProperty("--i", c.n++);
          w.append(s); f.append(w);
        });
        ch.replaceWith(f);
      } else if (ch.nodeType === 1) split(ch, c);
    });
  };
  $$(".split").forEach(el => split(el, { n: 0 }));

  /* ---------- reveal on scroll ---------- */
  const targets = $$(".rv, .rv-img, .split");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add("in"));

  /* ---------- hero stories slider ---------- */
  const st = $("[data-stories]");
  if (st) {
    const slides = $$(".story", st);
    const bars = $$(".stories__bars span", st);
    const DUR = 6000;
    let idx = 0, start = performance.now(), paused = false, pauseAt = 0;

    const go = n => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle("is-active", k === idx);
        s.setAttribute("aria-hidden", k === idx ? "false" : "true");
        const img = $("img", s);
        if (k === idx && img.loading === "lazy") img.loading = "eager";
      });
      bars.forEach((b, k) => b.style.setProperty("--p", k < idx ? 1 : 0));
      start = performance.now();
    };
    const tick = now => {
      if (!paused) {
        const p = Math.min(1, (now - start) / DUR);
        bars[idx].style.setProperty("--p", p);
        if (p >= 1 && !reduce) go(idx + 1);
      }
      requestAnimationFrame(tick);
    };
    $(".stories__tap--next", st).addEventListener("click", () => go(idx + 1));
    $(".stories__tap--prev", st).addEventListener("click", () => go(idx - 1));

    // swipe
    let sx = 0, sy = 0;
    st.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; paused = true; pauseAt = performance.now(); }, { passive: true });
    st.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      start += performance.now() - pauseAt; paused = false;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    // pause on hover (desktop) and when hidden
    st.addEventListener("mouseenter", () => { paused = true; pauseAt = performance.now(); });
    st.addEventListener("mouseleave", () => { start += performance.now() - pauseAt; paused = false; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { paused = true; pauseAt = performance.now(); }
      else { start += performance.now() - pauseAt; paused = false; }
    });
    go(0);
    requestAnimationFrame(tick);
  }

  /* ---------- countdown (edit data-end on .coupon) ---------- */
  const cdBox = $("[data-countdown]");
  if (cdBox) {
    const end = new Date(cdBox.dataset.end).getTime();
    const el = { d: $("[data-d]", cdBox), h: $("[data-h]", cdBox), m: $("[data-m]", cdBox), s: $("[data-s]", cdBox) };
    const inline = $("[data-cd-inline]"), dockT = $("[data-cd-dock]");
    const pad = n => String(n).padStart(2, "0");
    const put = (node, v) => { if (node.textContent !== v) { node.textContent = v; node.classList.remove("flip"); void node.offsetWidth; node.classList.add("flip"); } };
    const run = () => {
      const t = Math.max(0, end - Date.now());
      const d = Math.floor(t / 864e5), h = Math.floor(t / 36e5) % 24, m = Math.floor(t / 6e4) % 60, s = Math.floor(t / 1e3) % 60;
      put(el.d, pad(d)); put(el.h, pad(h)); put(el.m, pad(m)); put(el.s, pad(s));
      const short = t > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : "ended";
      if (inline) inline.textContent = t > 0 ? `Ends in ${short}` : "Offer ended";
      if (dockT) dockT.textContent = short;
      if (!t) clearInterval(timer);
    };
    const timer = setInterval(run, 1000);
    run();
  }

  /* ---------- copy promo code ---------- */
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    const code = b.dataset.copy;
    try { await navigator.clipboard.writeText(code); toast(`Code ${code} copied — use it at checkout`); }
    catch { toast(`Your code: ${code}`); }
  }));

  /* ---------- product filter ---------- */
  $$("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    $$("[data-filter]").forEach(b => { const on = b === btn; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
    const f = btn.dataset.filter;
    $$("[data-grid] .pc").forEach((card, i) => {
      const show = f === "all" || card.dataset.cat === f;
      card.hidden = !show;
      if (show) { card.classList.remove("pop-in"); void card.offsetWidth; card.style.animationDelay = `${i * 40}ms`; card.classList.add("pop-in", "in"); }
    });
  }));

  /* ---------- wishlist ---------- */
  let wish = store.get("ts_wish", []);
  const wishCount = $("[data-wish-count]");
  const paintWish = () => { if (wishCount) { wishCount.textContent = wish.length; wishCount.hidden = !wish.length; } };
  $$("[data-wish]").forEach(b => {
    const name = b.closest(".pc").querySelector("h3").textContent.trim();
    b.classList.toggle("is-on", wish.includes(name));
    b.addEventListener("click", () => {
      const on = b.classList.toggle("is-on");
      wish = on ? [...new Set([...wish, name])] : wish.filter(n => n !== name);
      store.set("ts_wish", wish); paintWish();
      toast(on ? `Saved ${name}` : `Removed ${name}`);
    });
  });
  paintWish();

  /* ---------- bag (demo — connect to your real cart) ---------- */
  let bag = store.get("ts_bag", []);
  const bagList = $("[data-bag]"), bagEmpty = $("[data-bag-empty]"), bagTotal = $("[data-bag-total]");
  const cartCount = $("[data-cart-count]"), cartN = $("[data-cart-n]");
  const meter = $("[data-meter]");
  const paintBag = () => {
    const total = bag.reduce((a, i) => a + i.price * i.qty, 0);
    const qty = bag.reduce((a, i) => a + i.qty, 0);
    cartCount.textContent = qty;
    cartN.textContent = qty ? `(${qty})` : "";
    bagTotal.textContent = money(total);
    bagEmpty.hidden = bag.length > 0;
    bagList.innerHTML = "";
    bag.forEach((it, k) => {
      const li = document.createElement("li");
      li.style.animationDelay = `${k * 50}ms`;
      li.innerHTML = `<img alt="" width="64" height="80"><div><h4></h4><small></small></div><button type="button">Remove</button>`;
      $("img", li).src = it.img;
      $("h4", li).textContent = it.name;
      $("small", li).textContent = `Size ${it.size} · Qty ${it.qty} · ${money(it.price)}`;
      $("button", li).addEventListener("click", () => { bag.splice(k, 1); store.set("ts_bag", bag); paintBag(); });
      bagList.append(li);
    });
    if (meter) {
      const th = +meter.dataset.threshold, left = Math.max(0, th - total);
      $("[data-meter-txt]", meter).innerHTML = left ? `You're <b>${money(left)}</b> away from free Accra delivery` : `<b>You've unlocked free Accra delivery</b>`;
      $(".meter__bar span", meter).style.width = `${Math.min(100, total / th * 100)}%`;
    }
  };
  paintBag();

  /* ---------- quick add bottom sheet (size picker) ---------- */
  const qaEl = $("#quick");
  let qaItem = null, qaSize = null, qaSheet = null;
  const qaBtn = $("[data-qa-add]");
  const openQuick = item => {
    qaItem = item; qaSize = item.sizes.length === 1 ? item.sizes[0] : null;
    $("[data-qa-img]").src = item.img;
    $("[data-qa-name]").textContent = item.name;
    $("[data-qa-price]").innerHTML = money(item.price) + (item.old ? `<del>${money(item.old)}</del>` : "");
    const box = $("[data-qa-sizes]"); box.innerHTML = "";
    item.sizes.forEach(sz => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = sz; b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", sz === qaSize);
      b.addEventListener("click", () => {
        qaSize = sz;
        $$("button", box).forEach(x => x.setAttribute("aria-checked", x === b));
        syncQaBtn();
      });
      box.append(b);
    });
    syncQaBtn();
    qaSheet = qaSheet || bootstrap.Offcanvas.getOrCreateInstance(qaEl);
    qaSheet.show();
  };
  const syncQaBtn = () => {
    qaBtn.disabled = !qaSize;
    $("span", qaBtn).textContent = qaSize ? `Add to bag — ${money(qaItem.price)}` : "Select a size";
  };
  qaBtn?.addEventListener("click", () => {
    if (!qaItem || !qaSize) return;
    const hit = bag.find(i => i.name === qaItem.name && i.size === qaSize);
    hit ? hit.qty++ : bag.push({ name: qaItem.name, price: qaItem.price, img: qaItem.img, size: qaSize, qty: 1 });
    store.set("ts_bag", bag); paintBag();
    cartCount.classList.remove("pop"); void cartCount.offsetWidth; cartCount.classList.add("pop");
    qaSheet.hide();
    toast(`${qaItem.name} (${qaSize}) added to your bag`);
  });
  $$("[data-quick]").forEach(b => b.addEventListener("click", () => {
    if (!window.bootstrap) return;
    openQuick(JSON.parse(b.dataset.quick));
  }));

  /* ---------- manifesto: words light up as you scroll ---------- */
  const lit = $("[data-lit]");
  if (lit) {
    const gold = /^(Kumasi|Korle|Bu|Osu|care\.?|taller\.?)/;
    lit.innerHTML = lit.textContent.split(/\s+/).map(w => `<span class="wd${gold.test(w) ? " g" : ""}">${w}</span>`).join(" ");
    const words = $$(".wd", lit);
    const paint = () => {
      const r = lit.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    };
    if (reduce) words.forEach(w => w.classList.add("on"));
    else { addEventListener("scroll", () => requestAnimationFrame(paint), { passive: true }); paint(); }
  }

  /* ---------- lookbook: vertical scroll drives horizontal track (desktop) ---------- */
  const hs = $("[data-hscroll]"), track = $("[data-htrack]");
  if (hs && track) {
    const size = () => {
      if (!isDesk() || reduce) { hs.style.removeProperty("--look-h"); track.style.transform = ""; return; }
      const dist = track.scrollWidth - innerWidth + 80;
      hs.style.setProperty("--look-h", `${innerHeight + Math.max(0, dist)}px`);
      move();
    };
    const move = () => {
      if (!isDesk() || reduce) return;
      const r = hs.getBoundingClientRect();
      const max = hs.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / (max || 1)));
      const dist = track.scrollWidth - innerWidth + 80;
      track.style.transform = `translate3d(${-p * Math.max(0, dist)}px,0,0)`;
    };
    addEventListener("scroll", () => requestAnimationFrame(move), { passive: true });
    addEventListener("resize", size);
    addEventListener("load", size);
    size();
  }

  /* ---------- reviews arrows ---------- */
  const rev = $("[data-revtrack]");
  $$("[data-rev]").forEach(b => b.addEventListener("click", () => {
    const card = rev.firstElementChild;
    const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(rev).columnGap || 0);
    const atEnd = rev.scrollLeft + rev.clientWidth >= rev.scrollWidth - 4;
    if (+b.dataset.rev > 0 && atEnd) rev.scrollTo({ left: 0, behavior: "smooth" });
    else rev.scrollBy({ left: step * +b.dataset.rev, behavior: "smooth" });
  }));

  /* ---------- search ---------- */
  const search = $("[data-search]");
  const openS = () => { search.hidden = false; requestAnimationFrame(() => search.classList.add("is-open")); setTimeout(() => $("input", search).focus(), 60); };
  const closeS = () => { search.classList.remove("is-open"); setTimeout(() => (search.hidden = true), 350); };
  $$("[data-search-open]").forEach(b => b.addEventListener("click", openS));
  $("[data-search-close]").addEventListener("click", closeS);
  addEventListener("keydown", e => {
    if (e.key === "Escape" && !search.hidden) closeS();
    if (e.key === "/" && search.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openS(); }
  });

  /* ---------- newsletter (front-end only; connect to your email provider) ---------- */
  const nl = $("[data-newsletter]");
  nl?.addEventListener("submit", e => {
    e.preventDefault();
    const inp = $("input", nl), msg = $(".club__msg", nl);
    if (!inp.checkValidity()) { msg.textContent = "Please enter a valid email address."; inp.focus(); return; }
    msg.textContent = "Akwaaba! Your 10% code is on its way.";
    nl.reset();
  });

  /* ---------- welcome offer: once per session, after 15s ---------- */
  addEventListener("load", () => {
    let seen = false;
    try { seen = sessionStorage.getItem("ts_welcome") === "1"; } catch { /* ignore */ }
    if (seen || !window.bootstrap) return;
    setTimeout(() => {
      if (document.body.classList.contains("modal-open") || $(".offcanvas.show") || !search.hidden) return;
      bootstrap.Modal.getOrCreateInstance("#welcome").show();
      try { sessionStorage.setItem("ts_welcome", "1"); } catch { /* ignore */ }
    }, 15000);
  });
})();
