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
    if (!toastEl) return;
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
    if (!hdr) return; // pages without the main header (e.g. register)
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
    const card = b.closest(".pc"); if (!card) return;
    const name = card.querySelector("h3").textContent.trim();
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
    if (!bagList || !cartCount) return; // pages without the bag drawer
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
    bag = store.get("ts_bag", []);
    const hit = bag.find(i => i.name === qaItem.name && i.size === qaSize);
    hit ? hit.qty++ : bag.push({ name: qaItem.name, price: qaItem.price, img: qaItem.img, size: qaSize, qty: 1 });
    store.set("ts_bag", bag); paintBag();
    document.dispatchEvent(new CustomEvent("bag:change"));
    if (cartCount) { cartCount.classList.remove("pop"); void cartCount.offsetWidth; cartCount.classList.add("pop"); }
    qaSheet.hide();
    toast(`${qaItem.name} (${qaSize}) added to your bag`);
  });
  $$("[data-quick]").forEach(b => b.addEventListener("click", () => {
    if (!window.bootstrap || !qaEl) return;
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
  if (rev) $$("[data-rev]").forEach(b => b.addEventListener("click", () => {
    const card = rev.firstElementChild;
    const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(rev).columnGap || 0);
    const atEnd = rev.scrollLeft + rev.clientWidth >= rev.scrollWidth - 4;
    if (+b.dataset.rev > 0 && atEnd) rev.scrollTo({ left: 0, behavior: "smooth" });
    else rev.scrollBy({ left: step * +b.dataset.rev, behavior: "smooth" });
  }));

  /* ---------- search ---------- */
  const search = $("[data-search]");
  if (search) {
  const openS = () => { search.hidden = false; requestAnimationFrame(() => search.classList.add("is-open")); setTimeout(() => $("input", search).focus(), 60); };
  const closeS = () => { search.classList.remove("is-open"); setTimeout(() => (search.hidden = true), 350); };
  $$("[data-search-open]").forEach(b => b.addEventListener("click", openS));
  $("[data-search-close]").addEventListener("click", closeS);
  addEventListener("keydown", e => {
    if (e.key === "Escape" && !search.hidden) closeS();
    if (e.key === "/" && search.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openS(); }
  });
  }

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
    if (seen || !window.bootstrap || !$("#welcome")) return;
    setTimeout(() => {
      if (document.body.classList.contains("modal-open") || $(".offcanvas.show") || (search && !search.hidden)) return;
      bootstrap.Modal.getOrCreateInstance("#welcome").show();
      try { sessionStorage.setItem("ts_welcome", "1"); } catch { /* ignore */ }
    }, 15000);
  });
})();



/* =====================================================================
   TRENDY SKY — Auth pages (register / login)
   Front-end validation only: the form submits normally once valid,
   so connect action="" to your backend endpoint.
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const form = $("[data-auth-form]");
  if (!form) return;

  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const check = input => {
    const field = input.closest(".f-field");
    const err = $(".f-error", field);
    const v = input.value;
    let msg = "";
    if (input.required && !v.trim()) msg = input.dataset.msg || "This field is required.";
    else if (input.type === "email" && !emailOk(v)) msg = input.dataset.msg;
    else if (input.minLength > 0 && v.length < input.minLength) msg = input.dataset.msg;
    field.classList.toggle("is-invalid", !!msg);
    field.classList.toggle("is-valid", !msg && !!v);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; input.setAttribute("aria-describedby", err.id); }
    return !msg;
  };

  const inputs = $$(".f-input", form);
  inputs.forEach(inp => {
    inp.addEventListener("blur", () => { if (inp.value) check(inp); });
    inp.addEventListener("input", () => { if (inp.closest(".f-field").classList.contains("is-invalid")) check(inp); });
  });

  /* show / hide password */
  $$("[data-toggle-pw]", form).forEach(btn => btn.addEventListener("click", () => {
    const inp = document.getElementById(btn.getAttribute("aria-controls"));
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    $("i", btn).className = show ? "bi bi-eye-slash" : "bi bi-eye";
    inp.focus();
  }));

  /* password strength */
  const pw = $("[data-strength]", form);
  const meter = $(".pw-meter", form), hint = $("[data-pw-hint]", form);
  if (pw && meter) {
    const words = ["", "Weak — add more characters", "Fair — add a number or symbol", "Good — almost there", "Strong password"];
    pw.addEventListener("input", () => {
      const v = pw.value;
      let s = 0;
      if (v.length >= 8) s++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
      if (v.length && v.length < 8) s = 1;
      meter.dataset.level = v ? Math.max(1, s) : 0;
      if (hint) hint.textContent = v ? words[Math.max(1, s)] : "Use 8+ characters with a mix of letters and numbers.";
    });
  }

  /* submit */
  form.addEventListener("submit", e => {
    const bad = inputs.filter(inp => !check(inp));
    if (bad.length) {
      e.preventDefault();
      const f = bad[0].closest(".f-field");
      f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
      bad[0].focus();
      return;
    }
    const btn = $("[data-submit]", form);
    if (btn) {
      btn.classList.add("is-loading");
      $("span", btn).textContent = btn.dataset.loading || "Creating account…";
      $("i", btn).className = "bi bi-arrow-repeat";
    }
    // Demo only: while action="#" there is no backend, so show a success state.
    if (form.getAttribute("action") === "#") {
      e.preventDefault();
      setTimeout(() => {
        const name = ($("#first_name", form)?.value || "").trim();
        const msg = form.dataset.mode === "login"
          ? `<h2>Welcome back!</h2><p>You're signed in. Your orders and wishlist are ready.</p>`
          : `<h2>Akwaaba${name ? ", " + name.replace(/[<>&"]/g, "") : ""}!</h2><p>Your account is ready. Use code <b>SKY10</b> for 10% off your first order.</p>`;
        form.outerHTML = `<div class="auth-success" role="status"><i class="bi bi-check2"></i>${msg}<a class="btn-x btn-x--ink mt-2" href="index.html"><span>Start shopping</span><i class="bi bi-arrow-right"></i></a></div>`;
      }, 900);
    }
  });
})();



/* =====================================================================
   TRENDY SKY — Cart page (cart.html)
   Reads/writes the same saved bag ("ts_bag") as the home page bag drawer.
   ===================================================================== */
(() => {
  "use strict";
  const page = document.querySelector("[data-cart-page]");
  if (!page) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const money = n => { n = Number(n); return "GH₵ " + n.toLocaleString("en-GH", Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const esc = t => String(t).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

  /* ---- settings: edit these to match your store ---- */
  const FREE_OVER = Number($("[data-ship]")?.dataset.threshold || 500);
  const PROMOS = { SKY10: { pct: 10, label: "10% off first order" } }; // add more codes here
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const MAX_QTY = 10;

  let bag = get("ts_bag", []);
  let promo = get("ts_promo", null);
  let delivery = get("ts_delivery", "accra");

  /* demo items so the page can be previewed — remove data-demo-seed from <main> when live */
  if (!bag.length && page.hasAttribute("data-demo-seed")) {
    let seeded = false;
    try { seeded = sessionStorage.getItem("ts_seeded") === "1"; sessionStorage.setItem("ts_seeded", "1"); } catch { /* ignore */ }
    if (!seeded) {
      bag = [
        { name: "NS White Uniform", price: 339, img: "assets/images/product-1.jpg", size: "M", qty: 1 },
        { name: "Males Scrub Blueblack", price: 260, img: "assets/images/product-2.jpg", size: "L", qty: 2 }
      ];
      set("ts_bag", bag);
    }
  }

  const list = $("[data-cart-list]");
  const filled = $("[data-cart-filled]"), empty = $("[data-cart-empty]"), bar = $("[data-cart-bar]");
  const toastEl = $("[data-toast]");
  let toastT, undo = null;

  const toast = (msg, action) => {
    if (!toastEl) return;
    toastEl.innerHTML = "";
    toastEl.append(document.createTextNode(msg));
    toastEl.classList.toggle("has-action", !!action);
    if (action) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = action.label;
      b.addEventListener("click", () => { action.run(); toastEl.classList.remove("on"); });
      toastEl.append(b);
    }
    toastEl.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("on"), action ? 5000 : 2600);
  };

  const save = () => { set("ts_bag", bag); render(); };

  const totals = () => {
    const sub = bag.reduce((a, i) => a + i.price * i.qty, 0);
    const disc = promo && PROMOS[promo] ? Math.round(sub * PROMOS[promo].pct) / 100 : 0;
    const opt = $(`input[name="delivery"][value="${delivery}"]`) || $('input[name="delivery"]');
    let fee = Number(opt?.dataset.fee || 0);
    if (delivery === "accra" && sub >= FREE_OVER) fee = 0;
    return { sub, disc, fee, total: Math.max(0, sub - disc) + (bag.length ? fee : 0) };
  };

  const itemHTML = (it, k) => {
    const sizes = it.size === "One size" ? ["One size"] : SIZES;
    return `
      <li class="ci" data-k="${k}" style="animation-delay:${k * 60}ms">
        <a class="ci__img" href="#"><img src="${esc(it.img)}" alt="${esc(it.name)}" width="120" height="150" loading="lazy"></a>
        <div class="ci__info">
          <h3 class="ci__name"><a href="#">${esc(it.name)}</a></h3>
          <p class="ci__unit">${money(it.price)}</p>
          <label class="ci__size">Size
            <select data-size aria-label="Size for ${esc(it.name)}">
              ${sizes.map(s => `<option${s === it.size ? " selected" : ""}>${s}</option>`).join("")}
            </select>
          </label>
          <div class="ci__links">
            <button type="button" data-later><i class="bi bi-heart"></i> Save for later</button>
            <button type="button" data-remove><i class="bi bi-x-lg"></i> Remove</button>
          </div>
        </div>
        <div class="ci__qty">
          <div class="qty" role="group" aria-label="Quantity for ${esc(it.name)}">
            <button type="button" data-step="-1" aria-label="Decrease quantity"${it.qty <= 1 ? " disabled" : ""}><i class="bi bi-dash"></i></button>
            <input type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="${it.qty}" data-qty aria-label="Quantity">
            <button type="button" data-step="1" aria-label="Increase quantity"${it.qty >= MAX_QTY ? " disabled" : ""}><i class="bi bi-plus"></i></button>
          </div>
        </div>
        <p class="ci__total">${money(it.price * it.qty)}</p>
      </li>`;
  };

  function render() {
    const has = bag.length > 0;
    filled.hidden = !has;
    empty.hidden = has;
    if (bar) bar.hidden = !has;
    document.body.classList.toggle("cart-is-empty", !has);

    list.innerHTML = bag.map(itemHTML).join("");

    const qty = bag.reduce((a, i) => a + i.qty, 0);
    $$("[data-cart-count]").forEach(c => (c.textContent = qty));
    const n = $("[data-cart-title-n]"); if (n) n.textContent = qty ? `(${qty})` : "";

    const t = totals();
    $("[data-sum-sub]").textContent = money(t.sub);
    $("[data-sum-ship]").textContent = !has ? "—" : t.fee ? money(t.fee) : "Free";
    $("[data-sum-total]").textContent = money(t.total);
    const bt = $("[data-bar-total]"); if (bt) bt.textContent = money(t.total);
    const accraLbl = $('[data-fee-label="accra"]'); if (accraLbl) accraLbl.textContent = t.sub >= FREE_OVER ? "Free" : "GH₵ 30";

    const dRow = $("[data-sum-disc-row]");
    dRow.hidden = !t.disc;
    $("[data-sum-disc]").textContent = "− " + money(t.disc);
    $("[data-sum-code]").textContent = promo ? `(${promo})` : "";

    // free delivery meter
    const ship = $("[data-ship]");
    if (ship) {
      const left = Math.max(0, FREE_OVER - t.sub);
      $("[data-ship-txt]", ship).innerHTML = left
        ? `You're <b>${money(left)}</b> away from <b>free Accra delivery</b>`
        : `<b>You've unlocked free Accra delivery</b> 🎉`;
      $(".ship__bar span", ship).style.width = `${Math.min(100, (t.sub / FREE_OVER) * 100)}%`;
      ship.classList.toggle("is-done", !left);
    }
  }

  /* ---- item events (delegated) ---- */
  list.addEventListener("click", e => {
    const li = e.target.closest(".ci"); if (!li) return;
    const k = +li.dataset.k, it = bag[k];
    const step = e.target.closest("[data-step]");
    if (step) { it.qty = Math.min(MAX_QTY, Math.max(1, it.qty + +step.dataset.step)); return save(); }

    if (e.target.closest("[data-remove]") || e.target.closest("[data-later]")) {
      const later = !!e.target.closest("[data-later]");
      li.classList.add("is-leaving");
      setTimeout(() => {
        const removed = bag.splice(k, 1)[0];
        if (later) { const w = get("ts_wish", []); if (!w.includes(removed.name)) set("ts_wish", [...w, removed.name]); }
        save();
        undo = () => { bag.splice(Math.min(k, bag.length), 0, removed); if (later) set("ts_wish", get("ts_wish", []).filter(n => n !== removed.name)); save(); };
        toast(later ? `${removed.name} saved for later` : `${removed.name} removed`, { label: "Undo", run: () => undo && undo() });
      }, 280);
    }
  });
  list.addEventListener("change", e => {
    const li = e.target.closest(".ci"); if (!li) return;
    const k = +li.dataset.k, it = bag[k];
    if (e.target.matches("[data-qty]")) {
      it.qty = Math.min(MAX_QTY, Math.max(1, parseInt(e.target.value, 10) || 1));
      save();
    }
    if (e.target.matches("[data-size]")) {
      const size = e.target.value;
      const dup = bag.findIndex((x, i) => i !== k && x.name === it.name && x.size === size);
      if (dup > -1) { bag[dup].qty = Math.min(MAX_QTY, bag[dup].qty + it.qty); bag.splice(k, 1); toast("Merged with the same item in your bag"); }
      else it.size = size;
      save();
    }
  });

  /* ---- clear bag ---- */
  $("[data-cart-clear]")?.addEventListener("click", () => {
    if (!bag.length) return;
    const old = bag.slice();
    bag = []; save();
    toast("Your bag was cleared", { label: "Undo", run: () => { bag = old; save(); } });
  });

  /* ---- promo code ---- */
  const promoForm = $("[data-promo]");
  const promoMsg = $("[data-promo-msg]");
  const paintPromo = () => {
    if (!promoForm) return;
    const inp = $("input", promoForm), btn = $("button", promoForm);
    if (promo && PROMOS[promo]) {
      inp.value = promo; inp.disabled = true;
      btn.textContent = "Remove";
      promoMsg.className = "promo__msg is-ok";
      promoMsg.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${PROMOS[promo].label} applied`;
    } else {
      inp.disabled = false; btn.textContent = "Apply";
    }
  };
  promoForm?.addEventListener("submit", e => {
    e.preventDefault();
    const inp = $("input", promoForm);
    if (promo) { promo = null; set("ts_promo", null); inp.value = ""; promoMsg.textContent = ""; paintPromo(); render(); inp.focus(); return; }
    const code = inp.value.trim().toUpperCase();
    if (!code) { promoMsg.className = "promo__msg is-bad"; promoMsg.textContent = "Please enter a code."; return; }
    if (!PROMOS[code]) {
      promoMsg.className = "promo__msg is-bad"; promoMsg.textContent = `“${code}” isn't a valid code.`;
      promoForm.classList.remove("shake"); void promoForm.offsetWidth; promoForm.classList.add("shake");
      return;
    }
    promo = code; set("ts_promo", promo); paintPromo(); render();
  });

  /* ---- delivery ---- */
  $$('input[name="delivery"]').forEach(r => {
    r.checked = r.value === delivery;
    r.addEventListener("change", () => { delivery = r.value; set("ts_delivery", delivery); render(); });
  });

  /* ---- order note ---- */
  const note = $("[data-order-note]"), noteCount = $("[data-note-count]");
  if (note) {
    note.value = get("ts_note", "");
    const upd = () => { if (noteCount) noteCount.textContent = note.value.length; set("ts_note", note.value); };
    note.addEventListener("input", upd); upd();
    if (note.value) note.closest("details").open = true;
  }

  /* ---- keep in sync with quick add & other tabs ---- */
  document.addEventListener("bag:change", () => { bag = get("ts_bag", []); render(); });
  addEventListener("storage", e => { if (e.key === "ts_bag") { bag = get("ts_bag", []); render(); } });

  paintPromo();
  render();
})();



/* =====================================================================
   TRENDY SKY — Checkout page (checkout.html)
   Uses the bag, promo code, delivery choice and note saved on the cart page.
   ===================================================================== */
(() => {
  "use strict";
  const page = document.querySelector("[data-checkout-page]");
  if (!page) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const money = n => { n = Number(n); return "GH₵ " + n.toLocaleString("en-GH", Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const esc = t => String(t).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

  /* ---- settings: keep these the same as the cart page ---- */
  const FREE_OVER = 500;
  const PROMOS = { SKY10: { pct: 10 } };
  const DELIVERY = {
    accra:  { name: "Accra delivery", note: "1–2 working days", fee: 30, freeOver: FREE_OVER },
    region: { name: "Other regions",  note: "Kumasi, Takoradi, Tamale & more · 2–4 days", fee: 60 },
    pickup: { name: "Store pickup",   note: "Accra or Techiman · ready same day", fee: 0 }
  };

  let bag = get("ts_bag", []);
  if (!bag.length && page.hasAttribute("data-demo-seed")) {
    bag = [
      { name: "NS White Uniform", price: 339, img: "assets/images/product-1.jpg", size: "M", qty: 1 },
      { name: "Males Scrub Ash", price: 260, img: "assets/images/product-3.jpg", size: "L", qty: 1 }
    ];
  }
  const promo = get("ts_promo", null);
  const dKey = DELIVERY[get("ts_delivery", "accra")] ? get("ts_delivery", "accra") : "accra";
  const d = DELIVERY[dKey];

  /* ---- empty bag ---- */
  const filled = $("[data-co-filled]"), empty = $("[data-co-empty]");
  if (!bag.length) { filled.hidden = true; empty.hidden = false; return; }

  /* ---- totals ---- */
  const sub = bag.reduce((a, i) => a + i.price * i.qty, 0);
  const disc = promo && PROMOS[promo] ? Math.round(sub * PROMOS[promo].pct) / 100 : 0;
  const fee = d.freeOver && sub >= d.freeOver ? 0 : d.fee;
  const total = Math.max(0, sub - disc) + fee;

  /* ---- render summary ---- */
  $("[data-co-items]").innerHTML = bag.map(it => `
    <li class="co-item">
      <span class="co-item__img"><img src="${esc(it.img)}" alt="${esc(it.name)}" width="72" height="90" loading="lazy"><b>${it.qty}</b></span>
      <span class="co-item__info">
        <span class="co-item__name">${esc(it.name)}</span>
        <span class="co-item__meta">Size: ${esc(it.size)} <i>/</i> Qty: ${it.qty}</span>
      </span>
      <span class="co-item__price">${money(it.price * it.qty)}</span>
    </li>`).join("");
  $("[data-co-ship-name]").textContent = d.name;
  $("[data-co-ship-note]").textContent = d.note;
  $("[data-co-sub]").textContent = money(sub);
  $("[data-co-fee]").textContent = fee ? money(fee) : "Free";
  $("[data-co-grand]").textContent = money(total);
  $$("[data-co-total], [data-co-btn-total]").forEach(el => (el.textContent = money(total)));
  if (disc) {
    $("[data-co-disc-row]").hidden = false;
    $("[data-co-disc]").textContent = "− " + money(disc);
    $("[data-co-code]").textContent = `(${promo})`;
  }

  /* ---- mobile summary toggle ---- */
  const tgl = $("[data-co-toggle]"), sumBox = $("#co-summary");
  tgl?.addEventListener("click", () => {
    const open = tgl.getAttribute("aria-expanded") !== "true";
    tgl.setAttribute("aria-expanded", open);
    sumBox.classList.toggle("is-open", open);
    $("[data-co-toggle-txt]").textContent = open ? "Hide order summary" : "Show order summary";
  });

  /* ---- prefill: note from the cart page, contact details from last time ---- */
  const form = $("[data-checkout-form]");
  const note = $("[data-co-note]");
  if (note && !note.value) note.value = get("ts_note", "");
  const saved = get("ts_contact", {});
  ["full_name", "phone", "location"].forEach(n => { if (saved[n] && form.elements[n]) form.elements[n].value = saved[n]; });

  /* ---- validation ---- */
  const phoneOk = v => {
    const digits = v.replace(/[\s\-()]/g, "");
    return /^(\+?233|0)\d{9}$/.test(digits); // 0241234567 or +233241234567
  };
  const check = input => {
    const field = input.closest(".f-field");
    const err = $(".f-error", field);
    const v = input.value.trim();
    let msg = "";
    if (input.required && !v) msg = input.dataset.msg;
    else if (input.hasAttribute("data-phone") && !phoneOk(v)) msg = input.dataset.msg;
    else if (input.name === "full_name" && v.length < 3) msg = input.dataset.msg;
    field.classList.toggle("is-invalid", !!msg);
    field.classList.toggle("is-valid", !msg && !!v);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; input.setAttribute("aria-describedby", err.id); }
    return !msg;
  };
  const inputs = $$(".f-input[required]", form);
  inputs.forEach(inp => {
    inp.addEventListener("blur", () => { if (inp.value) check(inp); });
    inp.addEventListener("input", () => { if (inp.closest(".f-field").classList.contains("is-invalid")) check(inp); });
  });

  const agree = $("[data-co-agree]"), notice = $("[data-co-notice]"), agreeErr = $("#agree-err");
  const checkAgree = () => {
    const ok = agree.checked;
    notice.classList.toggle("is-invalid", !ok);
    notice.classList.toggle("is-ok", ok);
    agreeErr.textContent = ok ? "" : "Please confirm you have checked your order.";
    return ok;
  };
  agree.addEventListener("change", checkAgree);

  form.addEventListener("submit", e => {
    const bad = inputs.filter(inp => !check(inp));
    const agreed = checkAgree();
    if (bad.length || !agreed) {
      e.preventDefault();
      const first = bad[0] || agree;
      const box = bad[0] ? bad[0].closest(".f-field") : notice;
      box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
      first.focus({ preventScroll: true });
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // remember contact details for next time + send the order data with the form
    set("ts_contact", { full_name: form.elements.full_name.value.trim(), phone: form.elements.phone.value.trim(), location: form.elements.location.value.trim() });
    $("[data-co-cart]").value = JSON.stringify(bag.map(({ name, price, size, qty }) => ({ name, price, size, qty })));
    $("[data-co-delivery]").value = dKey;
    $("[data-co-promo]").value = disc ? promo : "";
    $("[data-co-total-input]").value = total;

    const btn = $("[data-submit]", form);
    btn.classList.add("is-loading");
    $("span", btn).textContent = "Placing order…";
    $("i", btn).className = "bi bi-arrow-repeat";

    // Demo only: while action="#" there is no backend, so show a confirmation here.
    if (form.getAttribute("action") === "#") {
      e.preventDefault();
      setTimeout(() => {
        const ref = "TS-" + Math.floor(10000 + Math.random() * 90000);
        const first = form.elements.full_name.value.trim().split(" ")[0];
        set("ts_bag", []); set("ts_promo", null); set("ts_note", "");
        $$("[data-cart-count]").forEach(c => (c.textContent = 0));
        form.closest(".co-card").innerHTML = `
          <div class="co-done" role="status">
            <span class="co-done__icon"><i class="bi bi-check2"></i></span>
            <p class="kicker">Order ${ref}</p>
            <h1 class="co-title">Medaase, <em>${esc(first)}</em>!</h1>
            <p>Your order has been placed. We'll call or WhatsApp you on <b>${esc(form.elements.phone.value.trim())}</b> to confirm delivery to <b>${esc(form.elements.location.value.trim())}</b>.</p>
            <p class="co-done__total">Total: <b>${money(total)}</b></p>
            <a class="btn-x btn-x--ink" href="index.html"><span>Continue shopping</span><i class="bi bi-arrow-right"></i></a>
          </div>`;
        scrollTo({ top: 0, behavior: "smooth" });
      }, 1000);
    }
  });
})();