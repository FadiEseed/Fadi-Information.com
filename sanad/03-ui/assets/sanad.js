/* Sanad GSM — UI v1 behaviour.
   Security rules for this file: no innerHTML / eval / inline handlers; DOM text via textContent only. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Mobile menu / sidebar toggle
  $$('[data-toggle]').forEach(btn => {
    const target = document.getElementById(btn.dataset.toggle);
    if (!target) return;
    btn.addEventListener('click', () => {
      const open = target.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // Hero search -> services page with query
  const heroSearch = $('#hero-search');
  if (heroSearch) {
    heroSearch.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('input', heroSearch).value.trim();
      window.location.href = 'services.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
  }

  // Services filter (search + category chips)
  const list = $('#svc-list');
  if (list) {
    const cards = $$('.svc', list);
    const input = $('#svc-q');
    const chips = $$('.chip[data-cat]');
    const empty = $('#svc-empty');
    const count = $('#svc-count');
    let cat = 'all';
    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const apply = () => {
      const q = norm(input.value);
      let shown = 0;
      cards.forEach(c => {
        const okCat = cat === 'all' || c.dataset.cat === cat;
        const okQ = !q || norm(c.dataset.search + ' ' + c.textContent).includes(q);
        c.hidden = !(okCat && okQ);
        if (!c.hidden) shown++;
      });
      empty.hidden = shown !== 0;
      count.textContent = String(shown);
    };
    chips.forEach(ch => ch.addEventListener('click', () => {
      chips.forEach(x => x.setAttribute('aria-pressed', 'false'));
      ch.setAttribute('aria-pressed', 'true');
      cat = ch.dataset.cat;
      apply();
    }));
    input.addEventListener('input', apply);
    const q = new URLSearchParams(location.search).get('q');
    if (q) input.value = q.slice(0, 80);
    apply();
  }

  // Copy-to-clipboard
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const old = btn.textContent;
        btn.textContent = 'تم النسخ';
        btn.classList.add('done');
        setTimeout(() => { btn.textContent = old; btn.classList.remove('done'); }, 1600);
      } catch (_) { /* clipboard blocked: user can select manually */ }
    });
  });

  // Order tabs (dashboard)
  const tabs = $$('.tab[data-filter]');
  if (tabs.length) {
    const rows = $$('#orders tbody tr');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.setAttribute('aria-selected', 'false'));
      t.setAttribute('aria-selected', 'true');
      const f = t.dataset.filter;
      rows.forEach(r => { r.hidden = f !== 'all' && r.dataset.status !== f; });
    }));
  }

  // Login -> 2FA step (prototype only; real flow is server-side)
  const loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      $('#step-login').hidden = true;
      $('#step-2fa').hidden = false;
      const first = $('.otp input');
      if (first) first.focus();
    });
  }
  const otp = $$('.otp input');
  otp.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      if (inp.value && otp[i + 1]) otp[i + 1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && otp[i - 1]) otp[i - 1].focus();
    });
    inp.addEventListener('paste', e => {
      const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, otp.length);
      if (!d) return;
      e.preventDefault();
      d.split('').forEach((ch, j) => { otp[j].value = ch; });
      otp[Math.min(d.length, otp.length) - 1].focus();
    });
  });

  // Top-up: payment method panels + amount presets + summary
  const methods = $$('input[name="method"]');
  if (methods.length) {
    const panels = $$('[data-panel]');
    const amount = $('#amount');
    const sumMethod = $('#sum-method');
    const sumAmount = $('#sum-amount');
    const sumTotal = $('#sum-total');
    const fees = { usdt: 0, wallet: 0, bank: 0, cash: 0 };
    const update = () => {
      const m = $('input[name="method"]:checked');
      panels.forEach(p => { p.hidden = p.dataset.panel !== m.value; });
      sumMethod.textContent = m.dataset.label;
      const v = Math.max(0, Math.min(10000, Number(amount.value) || 0));
      sumAmount.textContent = '$' + v.toFixed(2);
      sumTotal.textContent = '$' + (v + (fees[m.value] || 0)).toFixed(2);
    };
    methods.forEach(m => m.addEventListener('change', update));
    amount.addEventListener('input', update);
    $$('[data-amount]').forEach(b => b.addEventListener('click', () => { amount.value = b.dataset.amount; update(); }));
    update();
  }
})();
