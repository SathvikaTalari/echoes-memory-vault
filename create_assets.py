import os

os.makedirs('frontend/public/sample_photos', exist_ok=True)
os.makedirs('frontend/public/sample_offerings', exist_ok=True)

portrait_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="pGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#451a03" />
      <stop offset="70%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </radialGradient>
    <linearGradient id="warmSkin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4a373" />
      <stop offset="100%" stop-color="#bc6c25" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#pGrad)" />
  <ellipse cx="200" cy="200" rx="160" ry="180" fill="none" stroke="#d97706" stroke-width="4" stroke-dasharray="8 4" opacity="0.5" />
  <path d="M100 380 Q 200 240 300 380 Z" fill="#7f1d1d" />
  <path d="M120 380 Q 200 260 280 380 Z" fill="#991b1b" />
  <circle cx="200" cy="180" r="70" fill="#e5e7eb" opacity="0.9" />
  <circle cx="200" cy="190" r="55" fill="url(#warmSkin)" />
  <ellipse cx="200" cy="145" rx="55" ry="25" fill="#d1d5db" />
  <circle cx="170" cy="140" r="12" fill="#ea580c" />
  <circle cx="200" cy="135" r="14" fill="#f59e0b" />
  <circle cx="230" cy="140" r="12" fill="#ea580c" />
  <path d="M185 215 Q 200 228 215 215" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
  <circle cx="185" cy="185" r="15" fill="none" stroke="#f59e0b" stroke-width="2.5" />
  <circle cx="215" cy="185" r="15" fill="none" stroke="#f59e0b" stroke-width="2.5" />
  <line x1="200" y1="185" x2="200" y2="185" stroke="#f59e0b" stroke-width="2.5" />
  <rect x="10" y="10" width="380" height="380" rx="20" fill="none" stroke="#b45309" stroke-width="3" />
</svg>"""

wedding_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1c1917" />
  <rect x="40" y="180" width="320" height="120" fill="#292524" />
  <line x1="40" y1="220" x2="360" y2="220" stroke="#44403c" stroke-width="2" />
  <line x1="40" y1="260" x2="360" y2="260" stroke="#44403c" stroke-width="2" />
  <circle cx="165" cy="110" r="28" fill="#fde68a" opacity="0.9" />
  <path d="M130 240 Q 165 140 200 240 Z" fill="#fef3c7" opacity="0.95" />
  <circle cx="235" cy="105" r="28" fill="#fde68a" opacity="0.9" />
  <rect x="215" y="135" width="40" height="105" rx="6" fill="#1c1917" stroke="#78716c" stroke-width="2" />
  <path d="M140 100 Q 110 180 135 230" fill="none" stroke="#fef9c3" stroke-width="3" stroke-dasharray="3 3" />
  <rect x="8" y="8" width="384" height="284" fill="none" stroke="#d97706" stroke-width="2" opacity="0.6" />
  <text x="200" y="285" fill="#f59e0b" font-size="13" font-family="Georgia" text-anchor="middle">October 22, 1958 • Oaxaca</text>
</svg>"""

marigold_garden_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <radialGradient id="sunGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="100%" stop-color="#1c1917" />
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="url(#sunGrad)" />
  <g fill="#ea580c">
    <circle cx="80" cy="150" r="25" />
    <circle cx="140" cy="120" r="30" fill="#f59e0b" />
    <circle cx="200" cy="140" r="35" />
    <circle cx="260" cy="110" r="28" fill="#f59e0b" />
    <circle cx="320" cy="150" r="25" />
  </g>
  <line x1="80" y1="150" x2="80" y2="220" stroke="#15803d" stroke-width="4" />
  <line x1="140" y1="120" x2="140" y2="220" stroke="#15803d" stroke-width="4" />
  <line x1="200" y1="140" x2="200" y2="220" stroke="#15803d" stroke-width="4" />
  <line x1="260" y1="110" x2="260" y2="220" stroke="#15803d" stroke-width="4" />
  <line x1="320" y1="150" x2="320" y2="220" stroke="#15803d" stroke-width="4" />
  <path d="M50 220 L110 220 L100 270 L60 270 Z" fill="#9a3412" />
  <path d="M170 220 L230 220 L220 270 L180 270 Z" fill="#c2410c" />
  <path d="M290 220 L350 220 L340 270 L300 270 Z" fill="#9a3412" />
</svg>"""

with open('frontend/public/sample_photos/abuela_portrait.jpg', 'w', encoding='utf-8') as f:
    f.write(portrait_svg)
with open('frontend/public/sample_photos/wedding_1958.jpg', 'w', encoding='utf-8') as f:
    f.write(wedding_svg)
with open('frontend/public/sample_photos/marigold_garden.jpg', 'w', encoding='utf-8') as f:
    f.write(marigold_garden_svg)

print('Sample visual assets generated in frontend/public/!')
