/* =========================================================
   Roobi — Personal Site
   js/main.js
   ========================================================= */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 0. Hero background video ---------- */
(function () {
  const video = document.querySelector('.hero-video');
  if (!video) return;
  if (reduceMotion) { video.pause(); video.removeAttribute('autoplay'); return; }
  const play = video.play();
  if (play && play.catch) play.catch(() => { /* autoplay blocked; poster stays visible */ });
})();

/* ---------- 1. Mouse-reactive particle background ---------- */
(function () {
  const canvas = document.getElementById('bg');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, pts = [], mouse = null;
  const count = () => (innerWidth < 640 ? 45 : 95);

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    pts = [];
    for (let i = 0; i < count(); i++) {
      pts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .3 * dpr, vy: (Math.random() - .5) * .3 * dpr,
        r: (Math.random() * 1.2 + 0.8) * dpr
      });
    }
  }

  addEventListener('pointermove', (e) => {
    mouse = { x: e.clientX * dpr, y: e.clientY * dpr };
    const spot = document.getElementById('spot');
    if (spot) {
      spot.style.setProperty('--x', e.clientX + 'px');
      spot.style.setProperty('--y', e.clientY + 'px');
    }
  }, { passive: true });
  addEventListener('pointerleave', () => { mouse = null; });

  function frame() {
    ctx.clearRect(0, 0, w, h);
    const link = 150 * dpr, pull = 170 * dpr;

    for (const p of pts) {
      if (mouse) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        if (d < pull && d > 0) { p.vx += (dx / d) * 0.02 * dpr; p.vy += (dy / d) * 0.02 * dpr; }
      }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      if (mouse) {
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < pull * 1.2) {
          ctx.strokeStyle = `rgba(255,92,112,${(1 - dm / (pull * 1.2)) * 0.6})`;
          ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = `rgba(215,38,61,${(1 - d / link) * 0.35})`;
          ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(255,120,135,0.85)';
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  resize();
  frame();
  addEventListener('resize', resize);
})();

/* ---------- 1b. Profile photo tilts toward the cursor ---------- */
(function () {
  const el = document.getElementById('portrait');
  if (!el || reduceMotion) return;
  const max = 12; // degrees
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
})();

/* ---------- 2. Card spotlight follows the cursor ---------- */
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});

/* ---------- 3. Typewriter: "a Innovator" ---------- */
(function () {
  const word = 'a Innovator';
  const el = document.getElementById('typed');
  if (!el) return;
  if (reduceMotion) { el.textContent = word; return; }
  let i = 0;
  (function type() {
    el.textContent = word.slice(0, ++i);
    if (i < word.length) setTimeout(type, 110);
  })();
})();

/* ---------- 4. Reveal on scroll ---------- */
(function () {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

/* ---------- 5. Roobi AI: chat through the /api/chat serverless function ---------- */
(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('form');
  const input = document.getElementById('q');
  const send = document.getElementById('send');
  if (!log || !form) return;

  const history = [];

  function addMsg(role, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  async function ask(q) {
    if (!q.trim()) return;
    addMsg('user', q);
    history.push({ role: 'user', content: q });

    const bubble = addMsg('bot', '');
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    send.disabled = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      bubble.textContent = data.text;
      history.push({ role: 'assistant', content: data.text });
    } catch (err) {
      bubble.textContent = err.message && err.message !== 'Failed to fetch'
        ? err.message
        : 'AI is unavailable right now. You can reach Sapumal directly in the contact section.';
      history.pop(); // drop the unanswered question so the next try starts clean
    } finally {
      send.disabled = false;
      log.scrollTop = log.scrollHeight;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });

  document.querySelectorAll('.chip').forEach((b) => {
    b.addEventListener('click', () => ask(b.dataset.q));
  });

  const fab = document.getElementById('aiFab');
  if (fab) fab.addEventListener('click', () => setTimeout(() => input.focus({ preventScroll: true }), 700));

  addMsg('bot', "Hi! I'm Roobi AI. Ask me about Sapumal's projects, skills, or experience. You can also describe a project you need, and I'll draft a short brief.");
})();

/* ---------- 6. Block right-click and common developer shortcuts ---------- */
(function () {
  // Right-click menu (including "Inspect")
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Keyboard shortcuts: F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U (view source), Ctrl/Cmd+S (save page)
  document.addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (
      e.key === 'F12' ||
      (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
      (mod && ['u', 's'].includes(k))
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Stop drag-and-drop of images and text selection copying of the page
  document.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('copy', (e) => e.preventDefault());
})();
