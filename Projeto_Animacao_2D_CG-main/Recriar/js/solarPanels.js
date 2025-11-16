// ============================================================================
// MÓDULO: PAINÉIS SOLARES
// ============================================================================
// Gerencia painéis solares que podem ser arrastados para os telhados dos edifícios
// Cada painel colocado corretamente reduz a poluição em 10%
// ============================================================================

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let solarPanels = [];           // Array com todos os painéis solares
let draggedPanel = null;         // Painel sendo arrastado atualmente

// Controle do highlight (destaque) nos edifícios
let highlightedBuildingIndex = null;  // Índice do edifício destacado
let highlightPinned = false;          // Se o highlight está fixado

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

/**
 * Inicializa os painéis solares (um para cada edifício)
 * Cria painéis na parte inferior da tela, prontos para serem arrastados
 */
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
            buildingIndex: i,           // Edifício associado
            isDragging: false,          // Se está sendo arrastado
            dragOffsetX: 0,             // Offset X do arraste
            dragOffsetY: 0,             // Offset Y do arraste
            isPlacedCorrectly: false    // Se está na posição correta (telhado)
        };
    });
}

/**
 * Reseta todos os painéis para o estado inicial
 */
function resetSolarPanels() {
    initSolarPanels();
    highlightedBuildingIndex = null;
    highlightPinned = false;
    draggedPanel = null;
    solarPanels.forEach(p => p.isPlacedCorrectly = false);
}

// ============================================================================
// VERIFICAÇÃO DE POSICIONAMENTO
// ============================================================================

/**
 * Verifica se um painel está corretamente posicionado no telhado do edifício
 * @param {Object} panel - Objeto do painel
 * @returns {boolean} true se estiver na posição correta
 */
function isPanelCorrectlyPlaced(panel) {
    const b = buildings[panel.buildingIndex];
    if (!b) return false;
    
    const r = getRoofTargetRect(b);
    const centerX = panel.x + panel.width / 2;
    const centerY = panel.y + panel.height / 2;
    
    // Verifica se o centro está na zona OU se qualquer parte do painel está na zona
    const panelInZone = (centerX >= r.x && centerX <= r.x + r.w && 
                         centerY >= r.y && centerY <= r.y + r.h) ||
                        (panel.x < r.x + r.w && panel.x + panel.width > r.x && 
                         panel.y < r.y + r.h && panel.y + panel.height > r.y);
    return panelInZone;
}

/**
 * Verifica se um ponto (x, y) está dentro de um painel
 * Usado para detecção de clique/arraste
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 * @param {Object} panel - Objeto do painel
 * @returns {boolean} true se o ponto está dentro
 */
function isPointInPanel(x, y, panel) {
    return x >= panel.x && x <= panel.x + panel.width &&
           y >= panel.y && y <= panel.y + panel.height;
}

// ============================================================================
// DESENHO
// ============================================================================

/**
 * Desenha o highlight (destaque) no telhado do edifício
 * Mostra onde o painel deve ser colocado
 * @param {Object} building - Objeto do edifício
 * @param {number} elapsedMs - Tempo decorrido para animação
 */
function drawRoofHighlight(building, elapsedMs) {
    const roofY = 420 - building.h;
    const paddingX = 8;
    const zoneHeight = 30;
    const x = building.x + paddingX;
    const y = roofY - zoneHeight - 4;
    const w = building.w - paddingX * 2;
    const h = zoneHeight;

    // Animação de pulso
    const t = (elapsedMs || 0) / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);

    // Gradiente animado
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, `rgba(0, 200, 255, ${0.10 + 0.10 * pulse})`);
    grad.addColorStop(1, `rgba(0, 255, 170, ${0.18 + 0.12 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Borda tracejada animada
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 200, ${0.8})`;
    ctx.lineWidth = 2 + pulse;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.stroke();
    ctx.restore();

    // Listras diagonais animadas
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

/**
 * Desenha um painel solar individual
 * @param {Object} panel - Objeto do painel
 */
function drawSolarPanel(panel) {
    const { x, y, width, height } = panel;

    // Corpo principal do painel (retângulo com cantos arredondados)
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

    // Células solares (grid de células)
    const cellRows = 4;
    const cellCols = Math.floor(width / 30);
    const cellWidth = (width - 20) / cellCols;
    const cellHeight = (height - 20) / cellRows;

    for (let row = 0; row < cellRows; row++) {
        for (let col = 0; col < cellCols; col++) {
            const cellX = x + 10 + col * cellWidth;
            const cellY = y + 10 + row * cellHeight;

            // Célula individual
            ctx.beginPath();
            ctx.arc(cellX + 2, cellY + 2, 2, Math.PI, Math.PI * 1.5);
            ctx.lineTo(cellX + cellWidth - 2, cellY);
            ctx.arc(cellX + cellWidth - 2, cellY + 2, 2, Math.PI * 1.5, 0);
            ctx.lineTo(cellX + cellWidth, cellY + cellHeight - 2);
            ctx.arc(cellX + cellWidth - 2, cellY + cellHeight - 2, 2, 0, Math.PI * 0.5);
            ctx.lineTo(cellX + 2, cellY + cellHeight);
            ctx.arc(cellX + 2, cellY + cellHeight - 2, 2, Math.PI * 0.5, Math.PI);
            ctx.closePath();

            // Gradiente na célula
            const cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellWidth, cellY + cellHeight);
            cellGradient.addColorStop(0, '#2c5282');
            cellGradient.addColorStop(0.5, '#1e3a5f');
            cellGradient.addColorStop(1, '#0f1e2f');
            ctx.fillStyle = cellGradient;
            ctx.fill();
            ctx.strokeStyle = '#0f1e2f';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Brilho na célula
            ctx.beginPath();
            ctx.arc(cellX + 4, cellY + 4, 3, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
        }
    }

    // Suportes do painel (pés)
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
