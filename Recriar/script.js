// Obtém referências ao canvas e seu contexto 2D
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const showPanelsCheckbox = document.getElementById('showPanels');
const showBusCheckbox = document.getElementById('showBus');

// Array com dados dos edifícios (posição x, largura, altura)
const buildings = [
    {x: 80,  w: 120, h: 180},
    {x: 230, w: 100, h: 220},
    {x: 380, w: 160, h: 200},
    {x: 560, w: 130, h: 240}
];

// Array com cores para os edifícios (alterna entre 3 cores)
const colors = ['#445066', '#384356', '#2f3848'];

// Array com posições e escalas das nuvens
const cloudPositions = [
    {x: 140, y: 100, s: 1.0},
    {x: 360, y: 120, s: 0.95},
    {x: 560, y: 105, s: 1.05},
    {x: 760, y: 130, s: 1.0},
    {x: 980, y: 145, s: 0.9}
];

// Criar painéis solares (um para cada edifício)
// Inicialmente posicionados na parte inferior do canvas
const solarPanels = buildings.map((building, i) => {
    const panelWidth = building.w * 0.8;
    const panelHeight = 40;
    const startX = 100 + i * 200;
    const startY = canvas.height - 30;

    return {
        x: startX,
        y: startY,
        width: panelWidth,
        height: panelHeight,
        buildingIndex: i,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0
    };
});

// Variáveis para controle de drag
let draggedPanel = null;

// ===== CONTROLO DO HIGHLIGHT NO TOPO DOS PRÉDIOS =====
let highlightedBuildingIndex = null;
let highlightPinned = false;
let animationActive = false;
let animationStartTs = null;
let dashOffset = 0;

// ===== VARIÁVEIS DE ANIMAÇÃO CONTÍNUA =====
let lastFrameTs = 0;
const smokeParticles = [];
const cars = [];
let nextCarSpawnTs = 0;

// ===== MITIGAÇÃO (paineis solares reduzem levemente o fumo) =====
let mitigationFromPanels = 0;
let extraMitigation = 0;
let totalMitigation = 0;
const baseExhaustInterval = 120;

// ===== AUTOCARRO (drag-and-drop para a estrada) =====
const bus = {
    x: 80,
    y: canvas.height - 90,
    w: 120,
    h: 30,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    placedOnRoad: false,
    visible: false
};

// ===== DADOS DAS FÁBRICAS (EXPOSTOS PARA FUMO) =====
const factoriesBaseY = 408;
const factoriesData = [
    { x: 760,  w: 120, h: 62, chimneys: [ {xOff: 18, w: 14, h: 54} ] },
    { x: 910,  w: 150, h: 70, chimneys: [ {xOff: 24, w: 16, h: 60}, {xOff: 80, w: 14, h: 50} ] },
    { x: 1080, w: 120, h: 60, chimneys: [ {xOff: 22, w: 14, h: 52} ] }
];
let factoryChimneyOutlets = [];

function startHighlightAnimation() {
    if (!animationActive) {
        animationActive = true;
        animationStartTs = null;
        requestAnimationFrame(animationLoop);
    }
}

function stopHighlightAnimationIfIdle() {
}

function animationLoop(ts) {
    if (animationStartTs === null) animationStartTs = ts;
    const elapsed = ts - animationStartTs;
    dashOffset = (elapsed / 16) % 100;

    const shouldKeepAnimating = (highlightedBuildingIndex !== null && showPanelsCheckbox.checked) || (draggedPanel && draggedPanel.isDragging);
    if (shouldKeepAnimating) {
        drawScene(elapsed);
        requestAnimationFrame(animationLoop);
    } else {
        animationActive = false;
        animationStartTs = null;
        drawScene();
    }
}

function drawSky() {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, 420);
    ctx.lineTo(0, 420);
    ctx.closePath();

    const grd = ctx.createLinearGradient(0, 0, 0, 420);
    grd.addColorStop(0, '#78b7ff');
    grd.addColorStop(1, '#c6e0ff');
    ctx.fillStyle = grd;
    ctx.fill();
}

function drawSun() {
    const sunX = 900, sunY = 120, sunRadius = 26;

    ctx.shadowColor = 'rgba(255, 183, 3, 0.4)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.closePath();

    const sunGradient = ctx.createRadialGradient(sunX - 8, sunY - 8, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, '#ffeb3b');
    sunGradient.addColorStop(0.7, '#ffb703');
    sunGradient.addColorStop(1, '#ff8f00');

    ctx.fillStyle = sunGradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(sunX - 8, sunY - 8, sunRadius * 0.4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
}

function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 12;

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.arc(28, -2, 18, 0, Math.PI * 2);
    ctx.arc(52, 2, 22, 0, Math.PI * 2);
    ctx.arc(18, -14, 16, 0, Math.PI * 2);
    ctx.arc(40, -16, 15, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(20, -14, 10, 0, Math.PI * 2);
    ctx.arc(38, -16, 9, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawFactories() {
    const baseY = factoriesBaseY;
    ctx.save();

    const silhouette = '#6a7a88';
    const darker = '#5f6c78';
    ctx.globalAlpha = 0.7;

    const factories = factoriesData;
    factoryChimneyOutlets = [];

    factories.forEach((f, idx) => {
        ctx.beginPath();
        ctx.moveTo(f.x, baseY);
        ctx.lineTo(f.x + f.w, baseY);
        ctx.lineTo(f.x + f.w, baseY - f.h);
        ctx.lineTo(f.x, baseY - f.h);
        ctx.closePath();
        ctx.fillStyle = idx % 2 === 0 ? silhouette : darker;
        ctx.fill();

        f.chimneys.forEach((c) => {
            const cx = f.x + c.xOff;
            const ch = c.h;
            ctx.beginPath();
            ctx.moveTo(cx, baseY - f.h);
            ctx.lineTo(cx + c.w, baseY - f.h);
            ctx.lineTo(cx + c.w, baseY - f.h - ch);
            ctx.lineTo(cx, baseY - f.h - ch);
            ctx.closePath();
            ctx.fillStyle = darker;
            ctx.fill();

            const smokeBaseX = cx + c.w * 0.5;
            const smokeBaseY = baseY - f.h - ch - 6;
            factoryChimneyOutlets.push({ x: smokeBaseX, y: smokeBaseY });
        });

        ctx.beginPath();
        ctx.moveTo(f.x, baseY);
        ctx.lineTo(f.x + f.w, baseY);
        ctx.lineTo(f.x + f.w, baseY + 1);
        ctx.lineTo(f.x, baseY + 1);
        ctx.closePath();
        ctx.fillStyle = '#6a7680';
        ctx.fill();

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 1;
        ctx.fillRect(f.x, baseY - 1, f.w, 5);
        ctx.restore();
    });

    const groundGrad = ctx.createLinearGradient(0, baseY, 0, 420);
    groundGrad.addColorStop(0, 'rgba(100, 115, 125, 0.45)');
    groundGrad.addColorStop(1, 'rgba(100, 115, 125, 0.0)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(720, baseY, canvas.width - 720, 420 - baseY);

    const hazeTop = baseY - 12;
    const hazeBottom = 420;
    const hazeGrad = ctx.createLinearGradient(0, hazeTop, 0, hazeBottom);
    hazeGrad.addColorStop(0, 'rgba(200, 220, 235, 0.08)');
    hazeGrad.addColorStop(1, 'rgba(200, 220, 235, 0)');
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(720, hazeTop, canvas.width - 720, hazeBottom - hazeTop);

    ctx.restore();
}

function spawnFactorySmoke(dtMs) {
    const spawnPerSecondBase = 2.5;
    const spawnPerSecond = spawnPerSecondBase * Math.max(0.2, (1 - totalMitigation));
    const prob = Math.max(0, spawnPerSecond) * (dtMs / 1000);
    factoryChimneyOutlets.forEach((o) => {
        if (Math.random() < prob) {
            const sizeFactor = Math.max(0.4, (1 - totalMitigation * 0.7));
            const growthFactor = Math.max(0.5, (1 - totalMitigation * 0.6));
            smokeParticles.push({
                kind: 'factory',
                x: o.x + (Math.random() * 4 - 2),
                y: o.y + (Math.random() * 2 - 1),
                vx: (Math.random() * 0.15 - 0.075),
                vy: -(0.25 + Math.random() * 0.35),
                radius: (6 + Math.random() * 6) * sizeFactor,
                growth: (0.015 + Math.random() * 0.02) * growthFactor,
                alpha: 0.35 * (1 - totalMitigation * 0.8),
                fade: 0.04 * (1 + totalMitigation * 0.6),
            });
        }
    });
}

function spawnCarSmoke(x, y, dir) {
    const sizeFactor = Math.max(0.5, (1 - totalMitigation * 0.7));
    const growthFactor = Math.max(0.6, (1 - totalMitigation * 0.6));
    smokeParticles.push({
        kind: 'car',
        x: x,
        y: y,
        vx: (dir > 0 ? -0.12 : 0.12) + (Math.random() * 0.12 - 0.06),
        vy: -(0.05 + Math.random() * 0.1),
        radius: (2.5 + Math.random() * 2) * sizeFactor,
        growth: (0.02 + Math.random() * 0.02) * growthFactor,
        alpha: 0.5 * (1 - totalMitigation * 0.8),
        fade: 0.10 * (1 + totalMitigation * 0.7),
    });
}

function updateAndDrawSmoke(dtMs) {
    const dt = dtMs / 16.67;
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.x += p.vx * dtMs;
        p.y += p.vy * dtMs;
        p.radius += p.growth * dtMs;
        p.alpha -= p.fade * (dtMs / 1000);
        if (p.alpha <= 0 || p.radius <= 0 || p.y + p.radius < 0) {
            smokeParticles.splice(i, 1);
            continue;
        }
    }

    smokeParticles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.kind === 'factory' ? 'rgba(220, 225, 230, 1)' : 'rgba(200, 205, 210, 1)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function spawnCar(ts) {
    const lane = Math.random() < 0.5 ? 0 : 1;
    if (lane === 0) {
        cars.push({
            x: -120,
            y: 488,
            w: 46, h: 16,
            color: '#e74c3c',
            speed: 0.18 + Math.random() * 0.10,
            dir: 1,
            lastSmoke: ts
        });
    } else {
        cars.push({
            x: canvas.width + 120,
            y: 512,
            w: 52, h: 18,
            color: '#3498db',
            speed: 0.16 + Math.random() * 0.10,
            dir: -1,
            lastSmoke: ts
        });
    }
}

function updateAndDrawCars(dtMs, ts) {
    if (ts >= nextCarSpawnTs) {
        spawnCar(ts);
        const baseGap = 900 + Math.random() * 1400;
        let spawnFactor = 1 + totalMitigation * 1.0;
        if (showBusCheckbox.checked && bus.placedOnRoad) spawnFactor *= 1.25;
        nextCarSpawnTs = ts + baseGap * spawnFactor;
    }

    for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        c.x += c.speed * c.dir * dtMs;
        if ((c.dir > 0 && c.x - c.w > canvas.width + 40) || (c.dir < 0 && c.x + c.w < -40)) {
            cars.splice(i, 1);
            continue;
        }

        const exhaustInterval = baseExhaustInterval * (1 + totalMitigation * 3.0);
        if (ts - c.lastSmoke > exhaustInterval) {
            const exhaustX = c.dir > 0 ? c.x - c.w * 0.5 - 4 : c.x + c.w * 0.5 + 4;
            const exhaustY = c.y + c.h * 0.25;
            spawnCarSmoke(exhaustX, exhaustY, c.dir);
            c.lastSmoke = ts;
        }
    }

    cars.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.dir, 1);
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h, 4);
        ctx.fill();
        ctx.fillStyle = '#cfe8ff';
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.2, -c.h * 0.6, c.w * 0.35, c.h * 0.55, 3);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-c.w * 0.25, c.h * 0.5, 5, 0, Math.PI * 2);
        ctx.arc(c.w * 0.25, c.h * 0.5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(canvas.width, 420);
    ctx.lineTo(canvas.width, 545);
    ctx.lineTo(0, 545);
    ctx.closePath();
    ctx.fillStyle = '#7a8a99';
    ctx.fill();
}

function drawRoad() {
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.lineTo(canvas.width, 470);
    ctx.lineTo(canvas.width, 530);
    ctx.lineTo(0, 530);
    ctx.closePath();
    ctx.fillStyle = '#444c5a';
    ctx.fill();

    ctx.strokeStyle = '#cfd7e6';
    ctx.setLineDash([18, 14]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(canvas.width, 500);
    ctx.stroke();
    ctx.setLineDash([]);
}

function getRoadRect() {
    return { y1: 470, y2: 530 };
}

function drawBus(obj) {
    if (!obj.visible) return;
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.roundRect(-obj.w * 0.5, -obj.h * 0.5, obj.w, obj.h, 6);
    ctx.fill();
    ctx.fillStyle = '#dff2ff';
    const winY = -obj.h * 0.22;
    const winH = obj.h * 0.44;
    const cols = 5;
    for (let i = 0; i < cols; i++) {
        const t = (i + 0.5) / cols;
        const wx = -obj.w * 0.36 + t * obj.w * 0.72;
        ctx.beginPath();
        ctx.roundRect(wx - 10, winY, 20, winH, 3);
        ctx.fill();
    }
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-obj.w * 0.35, obj.h * 0.5, 7, 0, Math.PI * 2);
    ctx.arc(obj.w * 0.35, obj.h * 0.5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawWindow(x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 2, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 2, y);
    ctx.arc(x + width - 2, y + 2, 2, Math.PI * 1.5, 0);
    ctx.lineTo(x + width, y + height - 2);
    ctx.arc(x + width - 2, y + height - 2, 2, 0, Math.PI * 0.5);
    ctx.lineTo(x + 2, y + height);
    ctx.arc(x + 2, y + height - 2, 2, Math.PI * 0.5, Math.PI);
    ctx.closePath();

    const windowGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    windowGradient.addColorStop(0, '#87ceeb');
    windowGradient.addColorStop(0.5, '#5ba3d1');
    windowGradient.addColorStop(1, '#3a7ca5');
    ctx.fillStyle = windowGradient;
    ctx.fill();

    ctx.strokeStyle = '#2d4a5f';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.strokeStyle = '#2d4a5f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width * 0.7, y + height * 0.3, 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
}

function drawDoor(x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x + 3, y + 3, 3, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 3, y);
    ctx.arc(x + width - 3, y + 3, 3, Math.PI * 1.5, 0);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y);
    ctx.closePath();

    const doorGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    doorGradient.addColorStop(0, '#4a3a2a');
    doorGradient.addColorStop(0.5, '#3d2f21');
    doorGradient.addColorStop(1, '#2a1f15');
    ctx.fillStyle = doorGradient;
    ctx.fill();

    ctx.strokeStyle = '#1a1510';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width * 0.85, y + height * 0.5, 3, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width * 0.3, y + height * 0.3, 6, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
}

function drawBuildings() {
    buildings.forEach((building, i) => {
        ctx.beginPath();
        ctx.moveTo(building.x, 420);
        ctx.lineTo(building.x + building.w, 420);
        ctx.lineTo(building.x + building.w, 420 - building.h);
        ctx.lineTo(building.x, 420 - building.h);
        ctx.closePath();
        ctx.fillStyle = colors[i % 3];
        ctx.fill();

        const windowWidth = 18;
        const windowHeight = 24;
        const windowSpacing = 8;
        const windowsPerRow = Math.floor((building.w - 20) / (windowWidth + windowSpacing));
        const numRows = Math.floor((building.h - 60) / (windowHeight + windowSpacing));

        const totalWindowsWidth = windowsPerRow * windowWidth + (windowsPerRow - 1) * windowSpacing;
        const startX = building.x + (building.w - totalWindowsWidth) / 2;
        const totalWindowsHeight = numRows * windowHeight + (numRows - 1) * windowSpacing;
        const startY = 420 - building.h + 20;

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < windowsPerRow; col++) {
                const windowX = startX + col * (windowWidth + windowSpacing);
                const windowY = startY + row * (windowHeight + windowSpacing);
                drawWindow(windowX, windowY, windowWidth, windowHeight);
            }
        }

        const doorWidth = 24;
        const doorHeight = 40;
        const doorX = building.x + (building.w - doorWidth) / 2;
        const doorY = 419 - doorHeight;
        drawDoor(doorX, doorY, doorWidth, doorHeight);
    });
}

function drawRoofHighlight(building, elapsedMs) {
    const roofY = 420 - building.h;
    const paddingX = 8;
    const zoneHeight = 18;
    const x = building.x + paddingX;
    const y = roofY - zoneHeight - 4;
    const w = building.w - paddingX * 2;
    const h = zoneHeight;

    const t = (elapsedMs || 0) / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, `rgba(0, 200, 255, ${0.10 + 0.10 * pulse})`);
    grad.addColorStop(1, `rgba(0, 255, 170, ${0.18 + 0.12 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 200, ${0.8})`;
    ctx.lineWidth = 2 + pulse;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = `rgba(0, 240, 180, ${0.15 + 0.15 * pulse})`;
    ctx.lineWidth = 6;
    const stripeSpacing = 16;
    const offset = (dashOffset % stripeSpacing);
    for (let sx = x - h; sx < x + w + h; sx += stripeSpacing) {
        ctx.beginPath();
        ctx.moveTo(sx + offset, y);
        ctx.lineTo(sx + h + offset, y + h);
        ctx.stroke();
    }
    ctx.restore();
}

function getRoofTargetRect(building) {
    const roofY = 420 - building.h;
    const paddingX = 8;
    const zoneHeight = 18;
    const x = building.x + paddingX;
    const y = roofY - zoneHeight - 4;
    const w = building.w - paddingX * 2;
    const h = zoneHeight;
    return { x, y, w, h };
}

function isPanelCorrectlyPlaced(panel) {
    const b = buildings[panel.buildingIndex];
    if (!b) return false;
    const r = getRoofTargetRect(b);
    const centerX = panel.x + panel.width / 2;
    const centerY = panel.y + panel.height / 2;
    return centerX >= r.x && centerX <= r.x + r.w && centerY >= r.y && centerY <= r.y + r.h;
}

function recalcMitigation() {
    const placedCount = solarPanels.reduce((acc, p) => acc + (p.isPlacedCorrectly ? 1 : 0), 0);
    mitigationFromPanels = placedCount * 0.15;
    totalMitigation = Math.min(0.75, mitigationFromPanels + extraMitigation);
}

function drawSolarPanel(panel) {
    const { x, y, width, height } = panel;

    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 5, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 5, y);
    ctx.arc(x + width - 5, y + 5, 5, Math.PI * 1.5, 0);
    ctx.lineTo(x + width, y + height - 5);
    ctx.arc(x + width - 5, y + height - 5, 5, 0, Math.PI * 0.5);
    ctx.lineTo(x + 5, y + height);
    ctx.arc(x + 5, y + height - 5, 5, Math.PI * 0.5, Math.PI);
    ctx.closePath();

    ctx.fillStyle = '#1a3a52';
    ctx.fill();

    ctx.strokeStyle = '#2d4a5f';
    ctx.lineWidth = 2;
    ctx.stroke();

    const cellRows = 4;
    const cellCols = Math.floor(width / 30);
    const cellWidth = (width - 20) / cellCols;
    const cellHeight = (height - 20) / cellRows;

    for (let row = 0; row < cellRows; row++) {
        for (let col = 0; col < cellCols; col++) {
            const cellX = x + 10 + col * cellWidth;
            const cellY = y + 10 + row * cellHeight;

            ctx.beginPath();
            ctx.arc(cellX + 2, cellY + 2, 2, Math.PI, Math.PI * 1.5);
            ctx.lineTo(cellX + cellWidth - 2, cellY);
            ctx.arc(cellX + cellWidth - 2, cellY + 2, 2, Math.PI * 1.5, 0);
            ctx.lineTo(cellX + cellWidth, cellY + cellHeight - 2);
            ctx.arc(cellX + cellWidth - 2, cellY + cellHeight - 2, 2, 0, Math.PI * 0.5);
            ctx.lineTo(cellX + 2, cellY + cellHeight);
            ctx.arc(cellX + 2, cellY + cellHeight - 2, 2, Math.PI * 0.5, Math.PI);
            ctx.closePath();

            const cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellWidth, cellY + cellHeight);
            cellGradient.addColorStop(0, '#2c5282');
            cellGradient.addColorStop(0.5, '#1e3a5f');
            cellGradient.addColorStop(1, '#0f1e2f');
            ctx.fillStyle = cellGradient;
            ctx.fill();

            ctx.strokeStyle = '#0f1e2f';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cellX + 4, cellY + 4, 3, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
        }
    }

    ctx.beginPath();
    ctx.arc(x + width * 0.25, y + height, 3, Math.PI, 0);
    ctx.lineTo(x + width * 0.25 + 6, y + height);
    ctx.moveTo(x + width * 0.75, y + height);
    ctx.arc(x + width * 0.75, y + height, 3, Math.PI, 0);
    ctx.lineTo(x + width * 0.75 + 6, y + height);
    ctx.closePath();
    ctx.fillStyle = '#3a4a5a';
    ctx.fill();
}

function drawScene(elapsedMs) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSky();
    drawSun();
    cloudPositions.forEach(c => drawCloud(c.x, c.y, c.s));
    drawFactories();
    if (elapsedMs !== undefined && lastFrameTs !== 0) {
    }
    drawGround();
    drawRoad();
    drawBus(bus);
    drawBuildings();

    if (showPanelsCheckbox.checked && highlightedBuildingIndex !== null) {
        const b = buildings[highlightedBuildingIndex];
        if (b) drawRoofHighlight(b, elapsedMs || 0);
    }

    if (showPanelsCheckbox.checked) {
        solarPanels.forEach(panel => drawSolarPanel(panel));
    }
}

function mainLoop(ts) {
    if (!lastFrameTs) lastFrameTs = ts;
    const dtMs = Math.min(50, ts - lastFrameTs);
    lastFrameTs = ts;

    if (animationStartTs === null) animationStartTs = ts;
    const elapsed = ts - animationStartTs;
    dashOffset = (elapsed / 16) % 100;

    spawnFactorySmoke(dtMs);
    drawScene(elapsed);
    updateAndDrawCars(dtMs, ts);
    updateAndDrawSmoke(dtMs);
    requestAnimationFrame(mainLoop);
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function isPointInPanel(x, y, panel) {
    return x >= panel.x && x <= panel.x + panel.width &&
           y >= panel.y && y <= panel.y + panel.height;
}

function isPointInBus(x, y, obj) {
    if (!obj.visible) return false;
    return x >= obj.x - obj.w * 0.5 && x <= obj.x + obj.w * 0.5 &&
           y >= obj.y - obj.h * 0.5 && y <= obj.y + obj.h * 0.5;
}

canvas.addEventListener('mousedown', (e) => {
    const mousePos = getMousePos(e);

    if (showPanelsCheckbox.checked) {
        for (let panel of solarPanels) {
            if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
                draggedPanel = panel;
                panel.isDragging = true;
                panel.dragOffsetX = mousePos.x - panel.x;
                panel.dragOffsetY = mousePos.y - panel.y;
                canvas.style.cursor = 'grabbing';
                highlightedBuildingIndex = panel.buildingIndex;
                if (!animationActive) startHighlightAnimation();
                return;
            }
        }
    }

    if (showBusCheckbox.checked && isPointInBus(mousePos.x, mousePos.y, bus)) {
        bus.isDragging = true;
        bus.dragOffsetX = mousePos.x - bus.x;
        bus.dragOffsetY = mousePos.y - bus.y;
        canvas.style.cursor = 'grabbing';
        return;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const mousePos = getMousePos(e);

    if (draggedPanel && draggedPanel.isDragging) {
        draggedPanel.x = mousePos.x - draggedPanel.dragOffsetX;
        draggedPanel.y = mousePos.y - draggedPanel.dragOffsetY;
        drawScene();
    } else if (bus.isDragging) {
        bus.x = mousePos.x - bus.dragOffsetX;
        bus.y = mousePos.y - bus.dragOffsetY;
        drawScene();
    } else if (showPanelsCheckbox.checked || showBusCheckbox.checked) {
        let overPanel = false;
        for (let panel of solarPanels) {
            if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
                overPanel = true;
                break;
            }
        }
        const overBus = isPointInBus(mousePos.x, mousePos.y, bus);
        canvas.style.cursor = (overPanel || overBus) ? 'grab' : 'default';
    }
});

canvas.addEventListener('mouseup', () => {
    if (draggedPanel) {
        draggedPanel.isDragging = false;
        draggedPanel = null;
        canvas.style.cursor = 'default';
        if (!highlightPinned) {
            highlightedBuildingIndex = null;
        }
        solarPanels.forEach(p => {
            p.isPlacedCorrectly = isPanelCorrectlyPlaced(p);
        });
        recalcMitigation();
        if (!animationActive) stopHighlightAnimationIfIdle();
        drawScene();
    }

    if (bus.isDragging) {
        bus.isDragging = false;
        canvas.style.cursor = 'default';
        const r = getRoadRect();
        const centerY = bus.y;
        const onRoad = centerY >= r.y1 && centerY <= r.y2;
        bus.placedOnRoad = onRoad;
        if (onRoad) {
            bus.y = (r.y1 + r.y2) / 2 - 5;
        }
        extraMitigation = (showBusCheckbox.checked && bus.placedOnRoad) ? 0.15 : 0.0;
        recalcMitigation();
        drawScene();
    }
});

canvas.addEventListener('mouseleave', () => {
    if (draggedPanel) {
        draggedPanel.isDragging = false;
        draggedPanel = null;
        canvas.style.cursor = 'default';
    }
});

showPanelsCheckbox.addEventListener('change', () => {
    if (!showPanelsCheckbox.checked) {
        highlightedBuildingIndex = null;
        highlightPinned = false;
        solarPanels.forEach(p => p.isPlacedCorrectly = false);
        recalcMitigation();
    }
    drawScene();
});

showBusCheckbox.addEventListener('change', () => {
    bus.visible = showBusCheckbox.checked;
    if (!bus.visible) {
        bus.isDragging = false;
        bus.placedOnRoad = false;
        extraMitigation = 0.0;
        recalcMitigation();
    } else {
        bus.x = 120;
        bus.y = canvas.height - 90;
    }
    drawScene();
});

canvas.addEventListener('click', (e) => {
    if (!showPanelsCheckbox.checked) return;
    const mousePos = getMousePos(e);
    let clickedPanel = null;
    for (let panel of solarPanels) {
        if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
            clickedPanel = panel;
            break;
        }
    }
    if (clickedPanel) {
        if (highlightedBuildingIndex === clickedPanel.buildingIndex && highlightPinned) {
            highlightedBuildingIndex = null;
            highlightPinned = false;
        } else {
            highlightedBuildingIndex = clickedPanel.buildingIndex;
            highlightPinned = true;
            startHighlightAnimation();
        }
        drawScene();
    }
});

requestAnimationFrame(mainLoop);

