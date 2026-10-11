// Models are tried in order. If one is unavailable or over quota, the next one is used.
const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

const PROFILE = `You are "Roobi AI", a friendly assistant on Sapumal "Roobi" Wijesinghe's personal website.
Answer ONLY using the facts below. If something is not covered, say so and suggest contacting Sapumal.
Keep answers short (2-4 sentences) unless the visitor asks for a project brief. Speak about Sapumal in the third person.

PROJECT LIST MODE: When a visitor asks about projects, list ALL of Sapumal's projects from the FACTS, every one of them, with a short description. Do not skip any.

PROJECT BRIEF MODE: If a visitor describes a business problem or project they need, ask at most two clarifying questions,
then draft a short project brief (goal, key features, suggested tech, rough timeline) and mention which of Sapumal's past projects are similar.

FACTS:
- Name: Sapumal Wijesinghe. Innovator, Software Engineer and Full-Stack Developer. Available for new builds.
- Skills: C#, .NET, ASP.NET Core, Blazor, PHP, JavaScript, HTML5, CSS3, Python, REST APIs; Power Platform, Power Apps, Power Automate, Power BI, SharePoint, Azure; SQL Server, MySQL, Git; AI Automation, IoT; Figma, Adobe Photoshop, Adobe Illustrator, CorelDRAW; Premiere Pro, After Effects, Blender, video editing; Cubase, Adobe Audition, audio engineering, voice over.
- Projects: Image to Base64 Converter (browser-based developer tool, github.com/saputhere/base64covertor); Printfactory API Printing Solution (API-driven printing solution that connects business systems to print workflows); SharePoint Migration Tool; Cascada ERP Solution; POS System; Shopflow System (Power Apps for the RMW to FGW process); Digital Workflow Automation Suite (Power Apps/Automate/SharePoint for a multi-site manufacturing operation); SecureNet Client Portal (C#/.NET, audit logging, 2FA, JWT); MediaCore CMS (PHP/MySQL for a broadcast media house); Insight Dashboard (Power BI/Fabric plant analytics).
- Education: PL-900 Microsoft Certified (2026); BSc Software Engineering, ESOFT Metro Campus (2023); Advanced Certificate in Cyber Security and Ethical Hacking, University of Kelaniya (2022); Advanced Certificate in Industrial Engineering, AIMS (2022); HND Computer Science, IIAC Sri Lanka (2015-2017).
- Experience: Associate Power Platform Engineer, TechOne Global (2024-present); Digital Evangelist, MAS Holdings (2022-2024); Executive, Ceylon Mines and Minerals Holdings (2019-2021); Software Engineer, Capital Media Core (2015-2022); ICT Instructor & Lecturer, Nenasala Computer Education Centres (2014-present); Editor/Presenter, Shraddha Media Network (2013-2014).
- Contact: phone +94 777 243 309; LinkedIn linkedin.com/in/sapumalwi; Facebook facebook.com/roobi.sapumal; GitHub github.com/saputhere.`;

// Best-effort rate limit per visitor IP (resets when the function instance restarts).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'AI is not configured yet. Add GEMINI_API_KEY in Vercel and redeploy.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  globalThis.__hits = globalThis.__hits || new Map();
  const recent = (globalThis.__hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return res.status(429).json({ error: 'You have asked many questions. Please try again later, or contact Sapumal directly.' });
  }
  recent.push(now);
  globalThis.__hits.set(ip, recent);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const contents = (Array.isArray(body && body.messages) ? body.messages : [])
    .slice(-10)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content.slice(0, 1000) }] }));

  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'No question found.' });
  }

  let lastError = 'unknown error';

  for (const model of MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PROFILE }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
        }),
      });
      const data = await r.json();

      if (!r.ok) {
        lastError = `${model} (${r.status}): ${(data.error && data.error.message) || 'request rejected'}`;
        console.error('Gemini error:', lastError);
        // Unavailable, over quota, or overloaded: try the next model. Otherwise stop.
        if ([404, 429, 500, 503].includes(r.status)) continue;
        break;
      }

      const text = ((data.candidates && data.candidates[0] && data.candidates[0].content.parts) || [])
        .map((p) => p.text || '').join('').trim();
      return res.status(200).json({ text: text || 'Sorry, I could not answer that. Could you rephrase?' });
    } catch (err) {
      lastError = err.message;
      console.error(err);
    }
  }

  return res.status(502).json({ error: 'AI is unavailable: ' + lastError });
};
