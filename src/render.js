const sharp = require("sharp");

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, maxChars = 38) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

async function renderCard({ title, body, template, studioName }) {
  const W = 1200, H = 675;
  const titleLines = wrap(title || "UKIYO STUDIO", 25);
  const bodyLines = wrap(body || "", 48);
  const titleSvg = titleLines.map((line, i) =>
    `<text x="86" y="${245 + i * 68}" class="title">${esc(line)}</text>`).join("");
  const bodyStart = 440;
  const bodySvg = bodyLines.map((line, i) =>
    `<text x="90" y="${bodyStart + i * 37}" class="body">${esc(line)}</text>`).join("");
  const svg = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#21172f"/><stop offset="1" stop-color="#49304f"/>
      </linearGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0H0V32" fill="none" stroke="#bda3c8" stroke-opacity=".10" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="675" rx="38" fill="url(#bg)"/>
    <rect width="1200" height="675" rx="38" fill="url(#grid)"/>
    <rect x="40" y="40" width="1120" height="595" rx="25" fill="none" stroke="#dcb7d8" stroke-opacity=".35" stroke-width="2"/>
    <text x="86" y="105" class="eyebrow">${esc(studioName || "UKIYO STUDIO")}  /  ${esc(template.eyebrow)}</text>
    <rect x="86" y="132" width="300" height="42" rx="21" fill="#243b3b"/>
    <text x="108" y="160" class="status">● COMMISSIONS / ONLINE</text>
    ${titleSvg}
    <rect x="86" y="390" width="1028" height="1" fill="#dcb7d8" opacity=".35"/>
    <text x="90" y="425" class="accent">${esc(template.accent)}</text>
    ${bodySvg}
    <text x="90" y="605" class="footer">UKIYO NETWORK  •  RETRO DIGITAL ARCHIVE  •  001</text>
    <text x="1075" y="605" class="mark">⌗</text>
    <style>
      .eyebrow{font: bold 19px Arial,sans-serif;letter-spacing:3px;fill:#d9bfdc}
      .status{font:bold 17px Arial,sans-serif;letter-spacing:1px;fill:#a9f0c7}
      .title{font:bold 58px Arial,sans-serif;letter-spacing:1px;fill:#ffe6f5}
      .accent{font:bold 18px Arial,sans-serif;letter-spacing:3px;fill:#e8b6d8}
      .body{font: 25px Arial,sans-serif;fill:#e6d2e4}
      .footer{font:bold 15px Arial,sans-serif;letter-spacing:2px;fill:#bda6c8}
      .mark{font:bold 44px Arial,sans-serif;fill:#f1c9e6}
    </style>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function makeText({ title, body, template, studioName }) {
  const safe = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<b>⌗ ${safe(studioName || "UKIYO STUDIO")} / ${safe(template.eyebrow)}</b>\n\n` +
    `<b>${safe(title || template.headline)}</b>\n\n` +
    `${safe(body || template.body)}\n\n` +
    `<i>✦ LET'S CREATE SOMETHING.  •  TRANSMISSION END</i>`;
}

module.exports = { renderCard, makeText };
