/**
 * MÓDULO: RECICLAGEM
 * Sistema de contentores de reciclagem que podem ser colocados na frente dos edifícios
 * Segue a mesma lógica dos painéis solares
 */

// Array com os contentores de reciclagem (um para cada edifício)
let recyclingBins = [];

/**
 * Inicializa os contentores de reciclagem (apenas 1 conjunto de 3 contentores)
 * Cada conjunto tem 3 contentores: verde, amarelo e azul
 */
function initRecyclingBins() {
    const singleBinWidth = 30;  // Largura de um contentor individual
    const binSpacing = 5;        // Espaçamento entre contentores
    const totalWidth = (singleBinWidth * 3) + (binSpacing * 2); // Largura total dos 3 contentores
    const binHeight = 40;
    const startX = 150;
    const startY = canvas.height - 50;

    // Cria apenas 1 conjunto de contentores
    recyclingBins = [{
        x: startX,
        y: startY,
        width: totalWidth,        // Largura total do conjunto
        height: binHeight,
        singleBinWidth: singleBinWidth,
        binSpacing: binSpacing,
        buildingIndex: -1,        // Não está associado a nenhum edifício inicialmente
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        isPlacedCorrectly: false
    }];
}

// Variável para controle de drag
let draggedBin = null;

/**
 * Obtém a zona de colocação para um contentor de reciclagem
 * A zona está entre o segundo e terceiro edifício
 * @returns {Object} - Objeto com x, y, w, h da zona de colocação
 */
function getRecyclingZoneRect() {
    const groundY = 420;
    
    // Segundo edifício (índice 1)
    const secondBuilding = buildings[1];
    // Terceiro edifício (índice 2)
    const thirdBuilding = buildings[2];
    
    // Calcula o espaço entre os dois edifícios
    const spaceStart = secondBuilding.x + secondBuilding.w; // Fim do segundo edifício
    const spaceEnd = thirdBuilding.x; // Início do terceiro edifício
    const spaceWidth = spaceEnd - spaceStart;
    
    const zoneWidth = 100; // Largura da zona (suficiente para os 3 contentores)
    const zoneHeight = 20; // Altura da zona de colocação
    
    // Zona centralizada no espaço entre os edifícios
    const zoneX = spaceStart + (spaceWidth / 2) - (zoneWidth / 2);
    
    return {
        x: zoneX,
        y: groundY - zoneHeight,
        w: zoneWidth,
        h: zoneHeight
    };
}

/**
 * Verifica se um contentor está corretamente posicionado na zona entre o segundo e terceiro edifício
 * @param {Object} bin - Objeto do contentor
 * @returns {boolean} - true se estiver na posição correta
 */
function isBinCorrectlyPlaced(bin) {
    const zone = getRecyclingZoneRect();
    const centerX = bin.x + bin.width / 2;
    const centerY = bin.y + bin.height / 2;
    
    // Verifica se o centro do contentor está na zona OU se qualquer parte está na zona
    const inZone = (centerX >= zone.x && centerX <= zone.x + zone.w &&
                    centerY >= zone.y && centerY <= zone.y + zone.h) ||
                   (bin.x < zone.x + zone.w && bin.x + bin.width > zone.x &&
                    bin.y < zone.y + zone.h && bin.y + bin.height > zone.y);
    
    return inZone;
}

/**
 * Desenha um contentor individual (verde, amarelo ou azul)
 * @param {number} x - Posição X do contentor
 * @param {number} y - Posição Y do contentor
 * @param {number} width - Largura do contentor
 * @param {number} height - Altura do contentor
 * @param {string} color - Cor do contentor ('green', 'yellow', 'blue')
 */
function drawSingleBin(x, y, width, height, color) {
    // Cores para cada tipo de contentor
    const colors = {
        green: {
            base: '#2d7a4d',
            light: '#4a9c6b',
            dark: '#1a5a3a',
            lid: '#3a8c5d'
        },
        yellow: {
            base: '#d4a017',
            light: '#f4c430',
            dark: '#b48a07',
            lid: '#e4b427'
        },
        blue: {
            base: '#1e5a8a',
            light: '#3a7ca5',
            dark: '#0e3a5a',
            lid: '#2d6a9a'
        }
    };
    
    const col = colors[color] || colors.green;
    
    ctx.save();
    
    // Corpo principal do contentor
    ctx.fillStyle = col.base;
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 5, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 5, y);
    ctx.arc(x + width - 5, y + 5, 5, Math.PI * 1.5, 0);
    ctx.lineTo(x + width, y + height - 5);
    ctx.arc(x + width - 5, y + height - 5, 5, 0, Math.PI * 0.5);
    ctx.lineTo(x + 5, y + height);
    ctx.arc(x + 5, y + height - 5, 5, Math.PI * 0.5, Math.PI);
    ctx.closePath();
    ctx.fill();
    
    // Borda do contentor
    ctx.strokeStyle = col.dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Tampa do contentor (parte superior)
    ctx.fillStyle = col.lid;
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 5, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 5, y);
    ctx.arc(x + width - 5, y + 5, 5, Math.PI * 1.5, 0);
    ctx.lineTo(x + width - 5, y + 8);
    ctx.lineTo(x + 5, y + 8);
    ctx.closePath();
    ctx.fill();
    
    // Símbolo de reciclagem (setas circulares)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Seta 1 (superior)
    ctx.moveTo(x + width / 2, y + 12);
    ctx.lineTo(x + width / 2 - 4, y + 18);
    ctx.lineTo(x + width / 2 + 2, y + 18);
    ctx.lineTo(x + width / 2, y + 12);
    
    // Seta 2 (direita)
    ctx.moveTo(x + width / 2 + 2, y + 20);
    ctx.lineTo(x + width / 2 + 8, y + 20);
    ctx.lineTo(x + width / 2 + 6, y + 26);
    ctx.lineTo(x + width / 2 + 2, y + 20);
    
    // Seta 3 (esquerda)
    ctx.moveTo(x + width / 2 - 2, y + 28);
    ctx.lineTo(x + width / 2 - 8, y + 28);
    ctx.lineTo(x + width / 2 - 6, y + 34);
    ctx.lineTo(x + width / 2 - 2, y + 28);
    
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Desenha um conjunto de 3 contentores de reciclagem (verde, amarelo, azul)
 * @param {Object} bin - Objeto do conjunto de contentores
 */
function drawRecyclingBin(bin) {
    const { x, y, singleBinWidth, binSpacing, height } = bin;
    
    ctx.save();
    
    // Desenha os 3 contentores lado a lado
    // Contentor verde (esquerda)
    drawSingleBin(x, y, singleBinWidth, height, 'green');
    
    // Contentor amarelo (centro)
    drawSingleBin(x + singleBinWidth + binSpacing, y, singleBinWidth, height, 'yellow');
    
    // Contentor azul (direita)
    drawSingleBin(x + (singleBinWidth + binSpacing) * 2, y, singleBinWidth, height, 'blue');
    
    // Destaque se estiver corretamente posicionado
    if (bin.isPlacedCorrectly) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.rect(x - 2, y - 2, bin.width + 4, height + 4);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

/**
 * Desenha a zona verde de highlight onde o contentor deve ser colocado
 * A zona está entre o segundo e terceiro edifício
 * @param {number} elapsedMs - Tempo decorrido para animação
 */
function drawRecyclingZoneHighlight(elapsedMs) {
    const zone = getRecyclingZoneRect();
    
    const t = (elapsedMs || 0) / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);
    
    // Gradiente verde para a zona
    const grad = ctx.createLinearGradient(zone.x, zone.y, zone.x, zone.y + zone.h);
    grad.addColorStop(0, `rgba(0, 200, 100, ${0.15 + 0.10 * pulse})`);
    grad.addColorStop(1, `rgba(0, 255, 150, ${0.25 + 0.15 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    
    // Borda tracejada verde
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 150, ${0.8})`;
    ctx.lineWidth = 2 + pulse;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.rect(zone.x + 1, zone.y + 1, zone.w - 2, zone.h - 2);
    ctx.stroke();
    ctx.restore();
}

/**
 * Verifica se um ponto está dentro de um contentor
 * @param {number} x - Posição X do ponto
 * @param {number} y - Posição Y do ponto
 * @param {Object} bin - Objeto do contentor
 * @returns {boolean} - true se o ponto estiver dentro
 */
function isPointInBin(x, y, bin) {
    return x >= bin.x && x <= bin.x + bin.width &&
           y >= bin.y && y <= bin.y + bin.height;
}

/**
 * Reseta os contentores de reciclagem para o estado inicial
 */
function resetRecyclingBins() {
    initRecyclingBins();
    draggedBin = null;
    recyclingBins.forEach(b => b.isPlacedCorrectly = false);
}

