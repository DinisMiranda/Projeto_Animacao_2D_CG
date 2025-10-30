/* Cidade Sustentável – Canvas Animation (CG 2025/26) */

(function init() {
  const canvas = document.getElementById('cityCanvas');
  const ctx = canvas.getContext('2d');

  const state = {
    time: 0,
    solar: false,
    recycling: false,
    publicTransport: false,
    muted: false,
    cloudOffsets: [0, 150, 320],
    trafficOffset: 0,
  };

  const ui = {
    chkSolar: document.getElementById('chkSolar'),
    chkRecycling: document.getElementById('chkRecycling'),
    chkTransit: document.getElementById('chkTransit'),
    chkMute: document.getElementById('chkMute'),
    btnReset: document.getElementById('btnReset'),
    intro: document.getElementById('intro'),
    startBtn: document.getElementById('startBtn'),
  };

  // Basic audio stubs; kept simple and optional
  const audio = {
    mode: 'urban',
    setMode(nextMode) {
      if (this.mode === nextMode) return;
      this.mode = nextMode;
      // Placeholders for future WebAudio or file-based ambience
      if (!state.muted) console.log(`[audio] ambiente -> ${nextMode}`);
    }
  };

  function handleResize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssWidth = Math.min(window.innerWidth * 0.96, 1100);
    const cssHeight = Math.min(window.innerHeight * 0.70, 680);
    // preserve 16:9
    const targetWidth = 960;
    const targetHeight = 540;
    let width = targetWidth;
    let height = targetHeight;
    const scaleByWidth = cssWidth / targetWidth;
    const scaleByHeight = cssHeight / targetHeight;
    const scale = Math.max(1, Math.min(2, Math.min(scaleByWidth, scaleByHeight)));
    width = Math.round(targetWidth * dpr);
    height = Math.round(targetHeight * dpr);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${Math.round(targetWidth * scale)}px`;
    canvas.style.height = `${Math.round(targetHeight * scale)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // UI wiring
  ui.chkSolar.addEventListener('change', () => { state.solar = ui.chkSolar.checked; });
  ui.chkRecycling.addEventListener('change', () => { state.recycling = ui.chkRecycling.checked; });
  ui.chkTransit.addEventListener('change', () => { state.publicTransport = ui.chkTransit.checked; });
  ui.chkMute.addEventListener('change', () => { state.muted = ui.chkMute.checked; });
  ui.btnReset.addEventListener('click', () => {
    state.solar = false;
    state.recycling = false;
    state.publicTransport = false;
    state.muted = false;
    ui.chkSolar.checked = false;
    ui.chkRecycling.checked = false;
    ui.chkTransit.checked = false;
    ui.chkMute.checked = false;
  });

  if (ui.startBtn) {
    ui.startBtn.addEventListener('click', () => ui.intro.classList.remove('visible'));
  }

  // Drawing helpers
  function clear() {
    // Sky color changes with sustainability
    const skyPollution = 1 - sustainabilityScore();
    const top = lerpColor('#78b7ff', '#9be7ff', 1 - skyPollution * 0.6);
    const bottom = lerpColor('#c6e0ff', '#e9f7ff', 1 - skyPollution * 0.6);
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, top);
    grd.addColorStop(1, bottom);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function sustainabilityScore() {
    let score = 0;
    if (state.solar) score += 0.35;
    if (state.recycling) score += 0.35;
    if (state.publicTransport) score += 0.30;
    return Math.min(1, score);
  }

  function drawSunAndClouds() {
    const score = sustainabilityScore();
    const sunX = 820 + Math.sin(state.time * 0.0003) * 20;
    const sunY = 90 + (1 - score) * 25;
    const sunColor = state.solar ? '#ffd166' : '#ffb703';
    ctx.shadowColor = 'rgba(255, 209, 102, 0.6)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = sunColor;
    circle(sunX, sunY, 26 + score * 6);
    ctx.shadowBlur = 0;

    // Clouds drift; fewer and lighter with higher score
    const cloudCount = 5 - Math.floor(score * 3);
    const opacity = 0.75 - score * 0.4;
    for (let i = 0; i < cloudCount; i++) {
      const baseX = (state.cloudOffsets[i % state.cloudOffsets.length] + state.time * (0.02 + i * 0.005)) % 1200;
      const baseY = 60 + i * 22;
      drawCloud(baseX - 200, baseY, opacity);
    }
  }

  function drawCloud(x, y, alpha) {
    ctx.globalAlpha = Math.max(0.15, alpha);
    ctx.fillStyle = '#ffffff';
    circle(x, y, 22);
    circle(x + 28, y - 8, 18);
    circle(x + 54, y, 24);
    circle(x + 78, y + 6, 16);
    ctx.globalAlpha = 1;
  }

  function drawGround() {
    const score = sustainabilityScore();
    const ground = lerpColor('#7a8a99', '#7acb92', score);
    ctx.fillStyle = ground;
    ctx.fillRect(0, 420, canvas.width, 120);
    // Road
    ctx.fillStyle = '#444c5a';
    ctx.fillRect(0, 440, canvas.width, 60);
    // Lane dashes
    ctx.strokeStyle = '#cfd7e6';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.moveTo(-((state.time / 8) % 32), 470);
    ctx.lineTo(canvas.width, 470);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawBuildings() {
    const score = sustainabilityScore();
    const basePollution = 1 - score;
    const buildingColors = [
      lerpColor('#445066', '#5a7aa0', score * 0.6),
      lerpColor('#384356', '#547094', score * 0.6),
      lerpColor('#2f3848', '#496384', score * 0.6)
    ];
    const positions = [
      { x: 60, w: 120, h: 180 },
      { x: 210, w: 90, h: 220 },
      { x: 320, w: 150, h: 200 },
      { x: 500, w: 110, h: 230 },
      { x: 650, w: 140, h: 190 }
    ];
    positions.forEach((b, idx) => {
      ctx.fillStyle = buildingColors[idx % buildingColors.length];
      ctx.fillRect(b.x, 420 - b.h, b.w, b.h);
      drawWindows(b.x, 420 - b.h, b.w, b.h, basePollution);
      if (state.solar) drawSolarPanels(b.x, 420 - b.h, b.w);
    });
  }

  function drawWindows(x, y, w, h, pollution) {
    const cols = Math.floor(w / 18);
    const rows = Math.floor(h / 22);
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const wx = x + c * 14;
        const wy = y + r * 18;
        const lit = Math.random() > 0.75 - pollution * 0.5;
        ctx.fillStyle = lit ? '#ffe08a' : '#2a3344';
        ctx.fillRect(wx, wy, 8, 10);
      }
    }
  }

  function drawSolarPanels(x, y, w) {
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(x + 8, y - 10, w - 16, 6);
    ctx.fillStyle = '#74c69d';
    for (let i = 0; i < Math.floor((w - 16) / 18); i++) {
      ctx.fillRect(x + 10 + i * 18, y - 9, 14, 4);
    }
  }

  function drawFactory() {
    // Factory on the right, emits more smoke when sustainability is low
    const baseX = 770, baseY = 420;
    ctx.fillStyle = '#555b6e';
    ctx.fillRect(baseX, baseY - 120, 140, 120);
    ctx.fillStyle = '#4a5164';
    ctx.fillRect(baseX + 100, baseY - 160, 26, 160);
    ctx.fillRect(baseX + 118, baseY - 140, 22, 140);
    drawSmoke(baseX + 111, baseY - 160);
  }

  function drawSmoke(x, y) {
    const score = sustainabilityScore();
    const intensity = 1 - score; // more smoke with less sustainability
    const puffs = Math.round(6 + intensity * 16);
    for (let i = 0; i < puffs; i++) {
      const t = (state.time * 0.0009 + i * 0.12) % 1;
      const px = x + Math.sin(t * Math.PI * 2) * (12 + intensity * 18);
      const py = y - t * (90 + intensity * 120);
      const size = 6 + (1 - t) * (18 + intensity * 22);
      const alpha = 0.18 + (1 - t) * (0.35 + intensity * 0.25);
      ctx.fillStyle = `rgba(${Math.round(120 + 40 * intensity)},${Math.round(120 + 40 * intensity)},${Math.round(120 + 40 * intensity)},${alpha})`;
      circle(px, py, size);
    }
  }

  function drawTreesAndParks() {
    const score = sustainabilityScore();
    const treeCount = 6 + Math.round(score * 12);
    for (let i = 0; i < treeCount; i++) {
      const x = 40 + i * (820 / treeCount) + Math.sin(i * 12.3) * 10;
      drawTree(x, 420, score);
    }
    if (state.recycling) drawRecycleBins();
  }

  function drawTree(x, groundY, score) {
    const h = 40 + (score * 14);
    ctx.fillStyle = '#6b4f2a';
    ctx.fillRect(x - 3, groundY - h, 6, h);
    ctx.fillStyle = lerpColor('#3a5a40', '#2dc653', score);
    circle(x, groundY - h - 8, 16 + score * 4);
    circle(x - 12, groundY - h + 2, 14 + score * 2);
    circle(x + 12, groundY - h + 4, 14 + score * 2);
  }

  function drawRecycleBins() {
    const bins = [
      { x: 140, color: '#2d6cdf' }, // paper
      { x: 180, color: '#f5cb5c' }, // plastic/metal
      { x: 220, color: '#3cb371' }, // glass
    ];
    bins.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, 408, 22, 26);
      ctx.fillStyle = '#0c111a';
      ctx.fillRect(b.x + 4, 404, 14, 6);
    });
  }

  function drawTraffic() {
    const score = sustainabilityScore();
    const baseCars = 7 - Math.round(score * 4);
    state.trafficOffset = (state.trafficOffset + 2 + (1 - score) * 2) % (canvas.width + 200);
    for (let i = 0; i < baseCars; i++) {
      const x = (i * 180 + state.trafficOffset) % (canvas.width + 200) - 100;
      drawCar(x, 480, i % 2 === 0 ? '#ff6b6b' : '#4dabf7');
    }
    if (state.publicTransport) {
      const busX = (canvas.width + 200 - (state.trafficOffset * 0.7 % (canvas.width + 200)));
      drawBus(busX - 120, 458);
    }
  }

  function drawCar(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 16, 42, 16);
    ctx.fillRect(x + 6, y - 24, 26, 10);
    ctx.fillStyle = '#263241';
    circle(x + 10, y, 6);
    circle(x + 34, y, 6);
  }

  function drawBus(x, y) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x, y - 22, 120, 22);
    ctx.fillRect(x + 18, y - 34, 84, 14);
    // windows
    ctx.fillStyle = '#142034';
    for (let i = 0; i < 5; i++) ctx.fillRect(x + 22 + i * 16, y - 30, 12, 9);
    // wheels
    ctx.fillStyle = '#1a2633';
    circle(x + 20, y, 8);
    circle(x + 92, y, 8);
  }

  // primitives
  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function lerpColor(a, b, t) {
    const ca = hexToRgb(a), cb = hexToRgb(b);
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function updateAudioMode() {
    const score = sustainabilityScore();
    const mode = score > 0.55 ? 'nature' : 'urban';
    audio.setMode(mode);
  }

  // main loop
  let lastTs = 0;
  function frame(ts) {
    const dt = Math.min(32, ts - lastTs);
    lastTs = ts;
    state.time += dt;

    clear();
    drawSunAndClouds();
    drawBuildings();
    drawFactory();
    drawTreesAndParks();
    drawGround();
    drawTraffic();
    updateAudioMode();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();


