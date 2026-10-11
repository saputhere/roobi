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

/* ---------- 5. Roobi AI (only when hosted in Claude, where window.claude exists) ---------- */
const PROFILE = `You are "Roobi AI", a friendly assistant on Sapumal "Roobi" Wijesinghe's personal website.
Answer ONLY using the facts below. If something is not covered, say so and suggest contacting Sapumal.
Keep answers short (2-4 sentences). Speak about Sapumal in the third person.

FACTS:
- Name: Sapumal "Roobi" Wijesinghe. Innovator, Software Engineer and Full-Stack Developer. Available for new builds.
- Skills: C#, .NET, ASP.NET Core, Blazor, PHP, JavaScript, HTML5, CSS3, Python, REST APIs; Power Platform, Power Apps, Power Automate, Power BI, SharePoint, Azure; SQL Server, MySQL, Git, CI/CD; AI Automation, IoT; Figma, Adobe Photoshop, Adobe Illustrator, CorelDRAW; Premiere Pro, After Effects, Blender, video editing; Cubase, Adobe Audition, audio engineering, voice over.
- Projects: Image to Base64 Converter (browser-based developer tool, github.com/saputhere/base64covertor); Printfactory API Printing Solution; SharePoint Migration Tool; Cascada ERP Solution; POS System; Shopflow System (Power Apps for the RMW to FGW process); Digital Workflow Automation Suite (Power Apps/Automate/SharePoint for a multi-site manufacturing operation); SecureNet Client Portal (C#/.NET, audit logging, 2FA, JWT); MediaCore CMS (PHP/MySQL for a broadcast media house); Insight Dashboard (Power BI/Fabric plant analytics).
- Education: PL-900 Microsoft Certified (2026); BSc Software Engineering, ESOFT Metro Campus (2023); Advanced Certificate in Cyber Security and Ethical Hacking, University of Kelaniya (2022); Advanced Certificate in Industrial Engineering, AIMS (2022); HND Computer Science, IIAC Sri Lanka (2015-2017).
- Experience: Associate Power Platform Engineer, TechOne Global (2024-present); Digital Evangelist, MAS Holdings (2022-2024); Executive, Ceylon Mines and Minerals Holdings (2019-2021); Software Engineer, Capital Media Core (2015-2022); ICT Instructor & Lecturer, Nenasala Computer Education Centres (2014-present); Editor/Presenter, Shraddha Media Network (2013-2014).
- Contact: phone +94 777 243 309; LinkedIn linkedin.com/in/sapumalwi; Facebook facebook.com/roobi.sapumal; GitHub github.com/saputhere.`;

(function () {
  const section = document.getElementById('ai');
  const navLink = document.getElementById('navAi');
  const log = document.getElementById('log');
  const form = document.getElementById('form');
  const input = document.getElementById('q');
  const send = document.getElementById('send');
  const history = [];
  let sample = null;

  if (!section || !log || !form) return;

  function addMsg(role, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  async function ask(q) {
    if (!sample || !q.trim()) return;
    addMsg('user', q);
    history.push({ role: 'user', content: q });

    const bubble = addMsg('bot', '');
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    send.disabled = true;

    try {
      // The API is memoryless, so send the instructions and the conversation each time.
      const messages = [{ role: 'user', content: PROFILE + '\n\nConversation so far is below. Reply to the last user message.' }];
      for (const m of history) messages.push(m);

      const res = await sample(messages, {
        modelTier: 'quick',
        onText: ({ text }) => { bubble.textContent = text; log.scrollTop = log.scrollHeight; }
      });
      const answer = (res && res.text) || bubble.textContent || 'Sorry, I could not answer that. Could you try again?';
      bubble.textContent = answer;
      history.push({ role: 'assistant', content: answer });
    } catch (err) {
      bubble.textContent = 'AI answers are unavailable right now. You can reach Sapumal directly in the contact section.';
      history.pop();
    } finally {
      send.disabled = false;
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

  // Show the AI section only if the viewer's environment grants the Claude capability.
  (async function () {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const s = await window.claude.use('sample');
      if (!s) return;
      sample = s;
      section.hidden = false;
      if (navLink) navLink.hidden = false;
      addMsg('bot', "Hi! I'm Roobi AI. Ask me about Sapumal's projects, skills, experience, CI/CD, or how to get in touch.");
    } catch (e) { /* stays hidden */ }
  })();
})();
