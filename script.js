
// ══════════════════════════════════════════════
//  PARTICLE BACKGROUND
// ══════════════════════════════════════════════
const pCanvas = document.getElementById('particle-canvas');
const pCtx = pCanvas.getContext('2d');
let mouse = { x: window.innerWidth/2, y: window.innerHeight/2 };
let particles = [];

function resizeCanvas() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * pCanvas.width;
    this.y = Math.random() * pCanvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.life = Math.random();
    this.color = Math.random() > 0.6 ? '#00f5ff' : Math.random() > 0.5 ? '#ff00ff' : '#39ff14';
    this.alpha = Math.random() * 0.5 + 0.1;
    this.isPixel = Math.random() > 0.7;
  }
  update() {
    const dx = mouse.x - this.x, dy = mouse.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 120) {
      this.x -= (dx/dist) * 0.8;
      this.y -= (dy/dist) * 0.8;
    }
    this.x += this.speedX; this.y += this.speedY;
    if (this.x < 0 || this.x > pCanvas.width || this.y < 0 || this.y > pCanvas.height) this.reset();
  }
  draw() {
    pCtx.save();
    pCtx.globalAlpha = this.alpha;
    pCtx.fillStyle = this.color;
    if (this.isPixel) {
      pCtx.fillRect(this.x, this.y, this.size*2, this.size*2);
    } else {
      pCtx.shadowColor = this.color;
      pCtx.shadowBlur = 6;
      pCtx.beginPath();
      pCtx.arc(this.x, this.y, this.size, 0, Math.PI*2);
      pCtx.fill();
    }
    pCtx.restore();
  }
}

for (let i = 0; i < 180; i++) particles.push(new Particle());

function animateParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ══════════════════════════════════════════════
//  FLOATING PIXEL CUBES
// ══════════════════════════════════════════════
const cubesContainer = document.getElementById('cubes-container');
for (let i = 0; i < 18; i++) {
  const cube = document.createElement('div');
  cube.className = 'pixel-cube';
  const size = Math.random() * 30 + 8;
  cube.style.cssText = `
    width:${size}px; height:${size}px;
    left:${Math.random()*100}%;
    animation-duration:${Math.random()*15+10}s;
    animation-delay:${Math.random()*-20}s;
    border-color:${Math.random()>0.5?'rgba(0,245,255,0.4)':'rgba(255,0,255,0.3)'};
    background:${Math.random()>0.5?'rgba(0,245,255,0.05)':'rgba(255,0,255,0.04)'};
  `;
  cubesContainer.appendChild(cube);
}

// ══════════════════════════════════════════════
//  SCROLL OBSERVER
// ══════════════════════════════════════════════
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-section').forEach(el => observer.observe(el));

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function showToast(msg, color='var(--neon-green)') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = color;
  t.style.color = color;
  t.style.boxShadow = `0 0 30px ${color}40`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════
//  PALETTES
// ══════════════════════════════════════════════
const PALETTES = {
  '8bit': ['#000000','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#ffffff','#800000','#008000','#000080','#808000','#800080','#008080','#c0c0c0','#ff8800'],
  '16bit': ['#000000','#1c1c1c','#444444','#848484','#b8b8b8','#f8f8f8','#f83800','#e40058','#a80020','#e45c10','#fca044','#fce0a8','#287800','#78f800','#b8f818','#005800','#7c7c7c','#00b800'],
  'gameboy': ['#0f380f','#306230','#8bac0f','#9bbc0f'],
  'nes': ['#7c7c7c','#0000fc','#0000bc','#4428bc','#940084','#a80020','#a81000','#881400','#503000','#007800','#006800','#005800','#004058','#000000','#bcbcbc','#0078f8'],
  'minecraft': ['#7d9a4d','#5c7a3e','#3d5c2c','#8b6332','#6b4423','#4a2d14','#9c9c9c','#7d7d7d','#5e5e5e','#3f3f3f','#ff0000','#00aa00','#0000ff','#ffaa00','#ffffff','#000000'],
  'anime': ['#ff6b9d','#ff9ed2','#c084fc','#818cf8','#38bdf8','#86efac','#fde68a','#fed7aa','#fca5a5','#e0e7ff','#000000','#1e1b4b','#ffffff','#fbbf24','#ef4444','#10b981']
};

let currentPalette = '8bit';
let currentFilter = 'none';
let currentAiStyle = null;
let pixelSize = 8;
let zoom = 1;
let showGrid = false;
let editorMode = false;
let editColor = '#00f5ff';
let sourceImage = null;
let pixelData = null; // stored pixel grid for editor

function renderSwatches() {
  const row = document.getElementById('swatch-row');
  row.innerHTML = '';
  PALETTES[currentPalette].slice(0,12).forEach(c => {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.style.background = c;
    s.title = c;
    s.onclick = () => { document.getElementById('edit-color').value = c; editColor = c; };
    row.appendChild(s);
  });
}
renderSwatches();

// ══════════════════════════════════════════════
//  PALETTE BUTTONS
// ══════════════════════════════════════════════
document.querySelectorAll('.palette-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPalette = btn.dataset.palette;
    renderSwatches();
    if (sourceImage) generatePixelArt();
  });
});

// ══════════════════════════════════════════════
//  PIXEL SLIDER
// ══════════════════════════════════════════════
const slider = document.getElementById('pixel-slider');
const pixelVal = document.getElementById('pixel-val');
slider.addEventListener('input', () => {
  pixelSize = parseInt(slider.value);
  pixelVal.textContent = pixelSize + 'px';
  if (sourceImage) generatePixelArt();
});

// ══════════════════════════════════════════════
//  FILTER
// ══════════════════════════════════════════════
document.getElementById('filter-select').addEventListener('change', function() {
  currentFilter = this.value;
  if (sourceImage) generatePixelArt();
});

// ══════════════════════════════════════════════
//  AI STYLE BUTTONS
// ══════════════════════════════════════════════
document.querySelectorAll('.ai-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      currentAiStyle = null;
    } else {
      document.querySelectorAll('.ai-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAiStyle = btn.dataset.style;
    }
    if (sourceImage) generatePixelArt();
  });
});

// ══════════════════════════════════════════════
//  UPLOAD
// ══════════════════════════════════════════════
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

function loadFile(file) {
  if (!file.type.startsWith('image/')) { showToast('⚠ Invalid file type', 'var(--neon-orange)'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      showStudio();
      generatePixelArt();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showStudio() {
  document.getElementById('studio').classList.add('visible');
  document.getElementById('studio').style.display = 'flex';
  setTimeout(() => document.getElementById('studio').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

// ══════════════════════════════════════════════
//  CORE PIXEL ART ENGINE
// ══════════════════════════════════════════════
function findClosestColor(r, g, b, palette) {
  let minDist = Infinity, closest = palette[0];
  for (const hex of palette) {
    const pr = parseInt(hex.slice(1,3),16);
    const pg = parseInt(hex.slice(3,5),16);
    const pb = parseInt(hex.slice(5,7),16);
    const dist = (r-pr)**2 + (g-pg)**2 + (b-pb)**2;
    if (dist < minDist) { minDist = dist; closest = hex; }
  }
  return closest;
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function applyAiStyle(offCtx, w, h, style) {
  const id = offCtx.getImageData(0, 0, w, h);
  const d = id.data;
  
  if (style === 'portrait') {
    // High contrast portrait
    for (let i = 0; i < d.length; i+=4) {
      const gray = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
      d[i] = d[i+1] = d[i+2] = contrasted;
    }
  } else if (style === 'avatar') {
    // Posterize
    for (let i = 0; i < d.length; i+=4) {
      d[i]   = Math.round(d[i]   / 64) * 64;
      d[i+1] = Math.round(d[i+1] / 64) * 64;
      d[i+2] = Math.round(d[i+2] / 64) * 64;
    }
  } else if (style === 'retro') {
    // Saturate
    for (let i = 0; i < d.length; i+=4) {
      const avg = (d[i] + d[i+1] + d[i+2]) / 3;
      d[i]   = Math.min(255, avg + (d[i]   - avg) * 2);
      d[i+1] = Math.min(255, avg + (d[i+1] - avg) * 2);
      d[i+2] = Math.min(255, avg + (d[i+2] - avg) * 2);
    }
  } else if (style === 'minecraft') {
    // Warm tone
    for (let i = 0; i < d.length; i+=4) {
      d[i]   = Math.min(255, d[i]   * 1.15);
      d[i+1] = Math.min(255, d[i+1] * 1.05);
      d[i+2] = Math.min(255, d[i+2] * 0.85);
    }
  }
  
  offCtx.putImageData(id, 0, 0);
}

function applyFilter(ctx, w, h, filter) {
  if (filter === 'none') return;
  
  if (filter === 'scanlines') {
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, y, w, 1);
    }
  } else if (filter === 'crt') {
    const gradient = ctx.createRadialGradient(w/2, h/2, h*0.4, w/2, h/2, h*0.8);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  } else if (filter === 'outline') {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const gridSz = Math.max(2, pixelSize);
    for (let y = 0; y < h; y += gridSz) {
      for (let x = 0; x < w; x += gridSz) {
        ctx.strokeRect(x + 0.5, y + 0.5, gridSz, gridSz);
      }
    }
  } else if (filter === 'shadow') {
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  } else if (filter === 'dither') {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const noise = ((x + y) % 2 === 0) ? 20 : -20;
        d[i]   = Math.min(255, Math.max(0, d[i]   + noise));
        d[i+1] = Math.min(255, Math.max(0, d[i+1] + noise));
        d[i+2] = Math.min(255, Math.max(0, d[i+2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

function generatePixelArt() {
  if (!sourceImage) return;
  showLoading(true);
  
  const steps = ['DOWNSCALING IMAGE…','MAPPING PALETTE…','RENDERING PIXELS…','APPLYING FILTER…','FINALIZING…'];
  let step = 0;
  const lt = document.getElementById('loading-text');
  const stepInterval = setInterval(() => {
    if (step < steps.length) { lt.textContent = steps[step++]; }
  }, 200);
  
  setTimeout(() => {
    clearInterval(stepInterval);
    _doGenerate();
    showLoading(false);
    document.getElementById('status-text').textContent = 'PIXEL ART GENERATED';
    document.getElementById('canvas-info').textContent = `${pixelSize}px · ${currentPalette.toUpperCase()} · ${PALETTES[currentPalette].length} COLORS`;
  }, 1200);
}

function _doGenerate() {
  const canvas = document.getElementById('output-canvas');
  const ctx = canvas.getContext('2d');
  const placeholder = document.getElementById('canvas-placeholder');
  
  // Calculate dimensions
  const maxDim = 512;
  let w = sourceImage.width, h = sourceImage.height;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.floor(w * scale); h = Math.floor(h * scale);
  }
  
  // Downscale
  const small = Math.max(2, pixelSize);
  const cols = Math.floor(w / small);
  const rows = Math.floor(h / small);
  
  // Draw source to offscreen small canvas
  const off = document.createElement('canvas');
  off.width = cols; off.height = rows;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(sourceImage, 0, 0, cols, rows);
  
  // Apply AI style pre-processing
  if (currentAiStyle) applyAiStyle(offCtx, cols, rows, currentAiStyle);
  
  const srcData = offCtx.getImageData(0, 0, cols, rows);
  const palette = PALETTES[currentPalette];
  
  // Build pixel data
  pixelData = [];
  for (let row = 0; row < rows; row++) {
    pixelData.push([]);
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4;
      const r = srcData.data[idx], g = srcData.data[idx+1], b = srcData.data[idx+2];
      const closestHex = findClosestColor(r, g, b, palette);
      pixelData[row].push(closestHex);
    }
  }
  
  // Render to output canvas
  canvas.width = cols * small;
  canvas.height = rows * small;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = pixelData[row][col];
      ctx.fillRect(col * small, row * small, small, small);
    }
  }
  
  // Apply filter
  applyFilter(ctx, canvas.width, canvas.height, currentFilter);
  
  // Grid overlay
  if (showGrid) drawGridOverlay(ctx, canvas.width, canvas.height, small);
  
  placeholder.style.display = 'none';
  canvas.style.display = 'block';
  canvas.style.width = (canvas.width * zoom) + 'px';
  canvas.style.height = (canvas.height * zoom) + 'px';
  
  showToast('✓ PIXEL ART GENERATED');
}

function drawGridOverlay(ctx, w, h, size) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += size) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function showLoading(show) {
  document.getElementById('loading-overlay').classList[show ? 'add' : 'remove']('active');
}

// ══════════════════════════════════════════════
//  GENERATE BUTTON
// ══════════════════════════════════════════════
document.getElementById('generate-btn').addEventListener('click', () => {
  if (!sourceImage) { showToast('⚠ Upload an image first', 'var(--neon-orange)'); return; }
  generatePixelArt();
});

// ══════════════════════════════════════════════
//  TOOLBAR
// ══════════════════════════════════════════════
document.getElementById('btn-preview').addEventListener('click', () => {
  document.querySelectorAll('.canvas-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-preview').classList.add('active');
  if (sourceImage) generatePixelArt();
});

document.getElementById('btn-original').addEventListener('click', () => {
  const canvas = document.getElementById('output-canvas');
  const ctx = canvas.getContext('2d');
  if (!sourceImage) return;
  const maxDim = 512;
  let w = sourceImage.width, h = sourceImage.height;
  if (w > maxDim || h > maxDim) { const s = maxDim/Math.max(w,h); w=Math.floor(w*s); h=Math.floor(h*s); }
  canvas.width = w; canvas.height = h;
  ctx.drawImage(sourceImage, 0, 0, w, h);
  canvas.style.display = 'block';
  document.getElementById('canvas-placeholder').style.display = 'none';
  document.getElementById('status-text').textContent = 'SHOWING ORIGINAL';
});

document.getElementById('btn-grid').addEventListener('click', function() {
  showGrid = !showGrid;
  this.classList.toggle('active', showGrid);
  if (sourceImage) generatePixelArt();
});

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  zoom = Math.min(zoom * 1.5, 8);
  updateZoom();
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
  zoom = Math.max(zoom / 1.5, 0.25);
  updateZoom();
});

function updateZoom() {
  const canvas = document.getElementById('output-canvas');
  canvas.style.width = (canvas.width * zoom) + 'px';
  canvas.style.height = (canvas.height * zoom) + 'px';
  document.getElementById('zoom-display').textContent = Math.round(zoom * 100) + '%';
}

// ══════════════════════════════════════════════
//  PIXEL EDITOR
// ══════════════════════════════════════════════
document.getElementById('editor-toggle').addEventListener('click', function() {
  editorMode = !editorMode;
  this.classList.toggle('active', editorMode);
  document.getElementById('canvas-container').classList.toggle('editor-mode', editorMode);
  document.getElementById('status-text').textContent = editorMode ? 'EDITOR MODE — CLICK PIXELS' : 'PREVIEW MODE';
});

document.getElementById('edit-color').addEventListener('change', function() {
  editColor = this.value;
});

document.getElementById('output-canvas').addEventListener('click', function(e) {
  if (!editorMode || !pixelData) return;
  const rect = this.getBoundingClientRect();
  const scaleX = this.width / rect.width;
  const scaleY = this.height / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;
  const small = Math.max(2, pixelSize);
  const col = Math.floor(cx / small);
  const row = Math.floor(cy / small);
  if (row >= 0 && row < pixelData.length && col >= 0 && col < pixelData[0].length) {
    pixelData[row][col] = editColor;
    const ctx = this.getContext('2d');
    ctx.fillStyle = editColor;
    ctx.fillRect(col * small, row * small, small, small);
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(col * small + 0.5, row * small + 0.5, small - 1, small - 1);
    }
  }
});

// ══════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════
document.getElementById('export-png').addEventListener('click', () => {
  const canvas = document.getElementById('output-canvas');
  if (canvas.style.display === 'none') { showToast('⚠ Generate pixel art first', 'var(--neon-orange)'); return; }
  const a = document.createElement('a');
  a.download = 'pixelforge-export.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('✓ PNG EXPORTED');
});

document.getElementById('export-svg').addEventListener('click', () => {
  if (!pixelData) { showToast('⚠ Generate pixel art first', 'var(--neon-orange)'); return; }
  const small = Math.max(2, pixelSize);
  const rows = pixelData.length, cols = pixelData[0].length;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols*small}" height="${rows*small}" shape-rendering="crispEdges">`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      svg += `<rect x="${c*small}" y="${r*small}" width="${small}" height="${small}" fill="${pixelData[r][c]}"/>`;
    }
  }
  svg += `</svg>`;
  const blob = new Blob([svg], {type:'image/svg+xml'});
  const a = document.createElement('a');
  a.download = 'pixelforge-export.svg';
  a.href = URL.createObjectURL(blob);
  a.click();
  showToast('✓ SVG EXPORTED');
});

document.getElementById('export-pdf').addEventListener('click', () => {
  if (!pixelData) { showToast('⚠ Generate pixel art first', 'var(--neon-orange)'); return; }
  // Create a printable HTML page for PDF
  const small = Math.max(2, pixelSize);
  const rows = pixelData.length, cols = pixelData[0].length;
  let gridHTML = `<table style="border-collapse:collapse;margin:auto;">`;
  for (let r = 0; r < rows; r++) {
    gridHTML += '<tr>';
    for (let c = 0; c < cols; c++) {
      gridHTML += `<td style="width:${small}px;height:${small}px;background:${pixelData[r][c]};border:0.5px solid rgba(0,0,0,0.15);"></td>`;
    }
    gridHTML += '</tr>';
  }
  gridHTML += '</table>';
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>PixelForge Grid Template</title>
    <style>body{margin:20px;font-family:monospace;background:#fff;}h1{font-size:14px;color:#333;margin-bottom:16px;}</style>
    </head><body><h1>PixelForge AI — Pixel Grid Template | ${cols}×${rows} | Pixel Size: ${small}px</h1>${gridHTML}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 300);
  showToast('✓ PDF GRID OPENED');
});

// ══════════════════════════════════════════════
//  SMOOTH INERTIA SCROLL
// ══════════════════════════════════════════════
let currentY = window.scrollY, targetY = window.scrollY;
let isScrolling = false;

window.addEventListener('wheel', e => {
  targetY = Math.max(0, Math.min(document.body.scrollHeight - window.innerHeight, targetY + e.deltaY * 0.8));
  if (!isScrolling) smoothScroll();
}, { passive: true });

function smoothScroll() {
  isScrolling = true;
  const diff = targetY - currentY;
  if (Math.abs(diff) < 0.5) {
    isScrolling = false;
    return;
  }
  currentY += diff * 0.12;
  window.scrollTo(0, currentY);
  requestAnimationFrame(smoothScroll);
}

// Status bar live time
setInterval(() => {
  const now = new Date();
  const t = now.toTimeString().slice(0,8);
  // just keep it subtle
}, 1000);

// ══════════════════════════════════════════════
//  PARALLAX ON SCROLL
// ══════════════════════════════════════════════
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  document.querySelectorAll('.floating-cubes').forEach(el => {
    el.style.transform = `translateY(${scrolled * 0.3}px)`;
  });
  document.querySelector('.grid-bg').style.transform = `translateY(${scrolled * 0.1}px)`;
});
