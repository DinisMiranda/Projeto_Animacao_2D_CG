// ===== MÓDULO: PAINÉIS SOLARES =====

// Criar painéis solares (um para cada edifício)
let solarPanels = [];

function initSolarPanels() {
    solarPanels = buildings.map((building, i) => {
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
            dragOffsetY: 0,
            isPlacedCorrectly: false
        };
    });
}

// Variáveis para controle de drag
let draggedPanel = null;

// ===== CONTROLO DO HIGHLIGHT NO TOPO DOS PRÉDIOS =====
let highlightedBuildingIndex = null;
let highlightPinned = false;

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

function isPanelCorrectlyPlaced(panel) {
    const b = buildings[panel.buildingIndex];
    if (!b) return false;
    const r = getRoofTargetRect(b);
    const centerX = panel.x + panel.width / 2;
    const centerY = panel.y + panel.height / 2;
    return centerX >= r.x && centerX <= r.x + r.w && centerY >= r.y && centerY <= r.y + r.h;
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

function isPointInPanel(x, y, panel) {
    return x >= panel.x && x <= panel.x + panel.width &&
           y >= panel.y && y <= panel.y + panel.height;
}

