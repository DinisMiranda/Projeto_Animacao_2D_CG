// ===== MÓDULO: CÉU, SOL, NUVENS, LUA E ESTRELAS =====

// Array com posições, escalas e velocidades das nuvens
// Cada nuvem tem: x (posição X), y (posição Y), s (escala), vx (velocidade horizontal)
const cloudPositions = [
    {x: 140, y: 100, s: 1.0, vx: 0.25},   // Nuvem 1: velocidade 0.25 pixels/frame
    {x: 360, y: 120, s: 0.95, vx: 0.20},  // Nuvem 2: velocidade 0.20 pixels/frame (mais lenta)
    {x: 560, y: 105, s: 1.05, vx: 0.28},  // Nuvem 3: velocidade 0.28 pixels/frame (mais rápida)
    {x: 760, y: 130, s: 1.0, vx: 0.22},   // Nuvem 4: velocidade 0.22 pixels/frame
    {x: 980, y: 145, s: 0.9, vx: 0.21}    // Nuvem 5: velocidade 0.21 pixels/frame
];

// Array com posições das estrelas (geradas aleatoriamente)
let starPositions = [];

// Configuração geométrica do céu
const SKY_HORIZON_Y = 420;
const SUN_DRAW_RADIUS = 26;
const MOON_DRAW_RADIUS = 24;
const skyOrbitConfig = computeSkyOrbitConfig();

// Configuração do ciclo dia/noite
const DAY_NIGHT_CYCLE_DURATION = 120000; // 120 segundos para um ciclo completo (60s dia + 60s noite)
const DAY_DURATION = DAY_NIGHT_CYCLE_DURATION / 2; // 60 segundos de dia
const NIGHT_DURATION = DAY_NIGHT_CYCLE_DURATION / 2; // 60 segundos de noite
const TRANSITION_DURATION = 3000; // 3 segundos de transição entre dia e noite

// Variável para controlar se é noite (calculada dinamicamente)
let isNight = false;
let timeOfDay = 0; // 0 a 1, onde 0 = meio dia, 0.5 = meia-noite

// Função para atualizar o ciclo dia/noite baseado no tempo
function updateDayNightCycle(elapsedTime) {
    // Garantir que elapsedTime é um número válido
    if (typeof elapsedTime !== 'number' || isNaN(elapsedTime) || elapsedTime < 0) {
        elapsedTime = 0;
    }
    
    // Calcular a posição no ciclo (0 a 1)
    // Usar módulo para garantir que o ciclo se repete suavemente
    let cyclePosition = (elapsedTime % DAY_NIGHT_CYCLE_DURATION) / DAY_NIGHT_CYCLE_DURATION;
    
    // Garantir que cyclePosition está exatamente entre 0 e 1 (sem valores negativos ou > 1)
    if (cyclePosition < 0) cyclePosition = 0;
    if (cyclePosition >= 1) cyclePosition = 0.999999; // Evitar exatamente 1 para não causar problemas
    
    // Calcular o tempo do dia (0 a 1, onde 0 = início do dia, 0.5 = meia-noite)
    timeOfDay = cyclePosition;
    
    // Determinar se é noite (0.25 a 0.75 do ciclo = noite)
    // Usar uma margem pequena para evitar flickering
    isNight = cyclePosition > 0.25 && cyclePosition < 0.75;
}

// Função para obter o fator de transição suave entre dia e noite (0 = dia, 1 = noite)
function getNightFactor() {
    // Garantir que timeOfDay está inicializado
    if (typeof timeOfDay === 'undefined' || timeOfDay === null) return 0;
    
    // timeOfDay já está entre 0 e 1, usar diretamente (sem Math.floor)
    let normalizedPos = timeOfDay;
    if (normalizedPos < 0) normalizedPos = 0;
    if (normalizedPos >= 1) normalizedPos = 0.999999;
    
    // Transição suave ao longo de todo o ciclo
    // 0.0-0.25: Dia completo (0)
    // 0.25-0.5: Transição para noite (0 a 1)
    // 0.5-0.75: Noite completa (1)
    // 0.75-1.0: Transição para dia (1 a 0)
    
    if (normalizedPos < 0.25) {
        // Dia completo (0 a 0.25)
        return 0;
    } else if (normalizedPos < 0.5) {
        // Transição pôr do sol: 0.25 a 0.5 = transição de 0 a 1
        const transitionProgress = (normalizedPos - 0.25) / 0.25;
        // Usar uma curva suave (ease-in-out)
        return smoothStep(transitionProgress);
    } else if (normalizedPos < 0.75) {
        // Noite completa (0.5 a 0.75)
        return 1;
    } else {
        // Transição nascer do sol: 0.75 a 1.0 = transição de 1 a 0
        const transitionProgress = (normalizedPos - 0.75) / 0.25;
        // Usar uma curva suave (ease-in-out)
        return 1 - smoothStep(transitionProgress);
    }
}

// Função para criar transição suave (ease-in-out)
function smoothStep(t) {
    // Clamp t entre 0 e 1
    t = Math.max(0, Math.min(1, t));
    // Curva suave: 3t² - 2t³
    return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function computeSkyOrbitConfig() {
    const horizonY = SKY_HORIZON_Y;
    const hasBuildings = typeof buildings !== 'undefined' && Array.isArray(buildings) && buildings.length > 0;
    const leftMostX = hasBuildings ? buildings.reduce((min, b) => Math.min(min, b.x), buildings[0].x) : 80;
    const sunriseX = clamp(leftMostX - 40, 30, (canvas ? canvas.width : 1100) * 0.2);
    const canvasWidth = canvas ? canvas.width : 1100;
    const sunsetX = Math.max(sunriseX + 220, canvasWidth - 60);
    const centerX = (sunriseX + sunsetX) / 2;
    const halfWidth = (sunsetX - sunriseX) / 2;
    const maxSunArc = horizonY - 110; // garante topo do sol próximo das nuvens
    const sunArcHeight = Math.min(halfWidth * 0.7, maxSunArc);
    const moonArcHeight = sunArcHeight * 0.85;
    return { horizonY, sunriseX, sunsetX, centerX, halfWidth, sunArcHeight, moonArcHeight };
}

function computeSunAngle(normalizedPos) {
    if (normalizedPos < 0.5) {
        const dayProgress = normalizedPos / 0.5; // 0 = nascer, 1 = pôr do sol
        return Math.PI * (1 - dayProgress);
    }
    const nightProgress = (normalizedPos - 0.5) / 0.5; // 0 = pôr do sol, 1 = madrugada
    return -Math.PI * nightProgress;
}

function wrapAngle(angle) {
    const twoPi = Math.PI * 2;
    angle = angle % twoPi;
    if (angle <= -Math.PI) angle += twoPi;
    if (angle > Math.PI) angle -= twoPi;
    return angle;
}

// Função para gerar posições das estrelas
function generateStars() {
    if (!canvas) return; // Aguardar até o canvas estar disponível
    starPositions = [];
    for (let i = 0; i < 80; i++) {
        starPositions.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 420,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.5 + 0.5
        });
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
    const nightFactor = getNightFactor();
    
    // Interpolar entre cores do dia e da noite
    function lerpColor(color1, color2, t) {
        // Converter hex para RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        // Converter RGB para hex
        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
        }
        
        const c1 = hexToRgb(color1);
        const c2 = hexToRgb(color2);
        if (!c1 || !c2) return color1;
        
        const r = c1.r + (c2.r - c1.r) * t;
        const g = c1.g + (c2.g - c1.g) * t;
        const b = c1.b + (c2.b - c1.b) * t;
        
        return rgbToHex(r, g, b);
    }
    
    // Cores do dia
    const dayTop = '#78b7ff';
    const dayBottom = '#c6e0ff';
    
    // Cores da noite
    const nightTop = '#1a1a2e';
    const nightMiddle = '#16213e';
    const nightBottom = '#0f1419';
    
    // Interpolar cores
    const topColor = lerpColor(dayTop, nightTop, nightFactor);
    const middleColor = lerpColor(dayBottom, nightMiddle, nightFactor);
    const bottomColor = lerpColor(dayBottom, nightBottom, nightFactor);
    
    grd.addColorStop(0, topColor);
    if (nightFactor > 0.5) {
        grd.addColorStop(0.5, middleColor);
    }
    grd.addColorStop(1, bottomColor);
    
    ctx.fillStyle = grd;
    ctx.fill();
}

function drawSun() {
    const nightFactor = getNightFactor();
    
    // Alpha do sol baseado no fator de noite (transição suave)
    // Quando nightFactor = 0 (dia), alpha = 1
    // Quando nightFactor = 1 (noite), alpha = 0
    const sunAlpha = 1 - nightFactor;
    
    // Se alpha é muito baixo, não desenhar
    if (sunAlpha < 0.05) return;
    
    // Garantir que timeOfDay está definido
    if (typeof timeOfDay === 'undefined') return;
    
    const normalizedPos = clamp(timeOfDay, 0, 0.999999);
    const { centerX, halfWidth, sunArcHeight, horizonY } = skyOrbitConfig;
    
    const sunAngle = computeSunAngle(normalizedPos);
    const sunCos = Math.cos(sunAngle);
    const sunSin = Math.sin(sunAngle);
    
    const sunX = centerX + sunCos * halfWidth;
    const sunElevation = Math.max(sunSin, 0);
    if (sunElevation <= 0 && sunAlpha <= 0.2) {
        return;
    }
    const sunY = horizonY - sunElevation * sunArcHeight;
    const sunRadius = SUN_DRAW_RADIUS;
    
    const elevation = clamp(sunElevation, 0, 1);
    const isSunset = sunCos > 0 && elevation < 0.6;

    ctx.save();
    ctx.globalAlpha = clamp(sunAlpha, 0, 1);
    ctx.shadowColor = 'rgba(255, 183, 3, 0.4)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.closePath();

    // Mudar cor do sol durante pôr/nascer do sol
    let sunColor1, sunColor2, sunColor3;
    if (elevation < 0.25) {
        if (isSunset) {
            sunColor1 = '#ff6b35';
            sunColor2 = '#ff8c42';
            sunColor3 = '#ff6b35';
        } else {
            sunColor1 = '#ff8c42';
            sunColor2 = '#ffb703';
            sunColor3 = '#ff8f00';
        }
    } else if (elevation < 0.6) {
        // Sol a meia altura: misto quente
        sunColor1 = '#ff8c42';
        sunColor2 = '#ffb703';
        sunColor3 = '#ff8f00';
    } else {
        // Meio-dia: amarelo brilhante
        sunColor1 = '#ffeb3b';
        sunColor2 = '#ffb703';
        sunColor3 = '#ff8f00';
    }

    const sunGradient = ctx.createRadialGradient(sunX - 8, sunY - 8, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, sunColor1);
    sunGradient.addColorStop(0.7, sunColor2);
    sunGradient.addColorStop(1, sunColor3);

    ctx.fillStyle = sunGradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(sunX - 8, sunY - 8, sunRadius * 0.4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
    ctx.restore();
}

function drawMoon() {
    const nightFactor = getNightFactor();
    
    // Alpha da lua baseado no fator de noite (transição suave)
    // Quando nightFactor = 0 (dia), alpha = 0
    // Quando nightFactor = 1 (noite), alpha = 1
    const moonAlpha = nightFactor;
    
    // Se alpha é muito baixo, não desenhar
    if (moonAlpha < 0.05) return;
    
    // Garantir que timeOfDay está definido
    if (typeof timeOfDay === 'undefined') return;
    
    const normalizedPos = clamp(timeOfDay, 0, 0.999999);
    const { centerX, halfWidth, moonArcHeight, horizonY } = skyOrbitConfig;
    
    const sunAngle = computeSunAngle(normalizedPos);
    const moonAngle = wrapAngle(sunAngle - Math.PI);
    const moonCos = Math.cos(moonAngle);
    const moonSin = Math.sin(moonAngle);
    const moonElevation = Math.max(moonSin, 0);
    
    if (moonElevation <= 0 && moonAlpha <= 0.2) {
        return;
    }
    
    const moonX = centerX + moonCos * halfWidth;
    const moonY = horizonY - moonElevation * moonArcHeight;
    const moonRadius = MOON_DRAW_RADIUS;
    
    ctx.save();
    ctx.globalAlpha = clamp(moonAlpha, 0, 1);

    // Halo suave ao redor da lua
    ctx.save();
    const haloGradient = ctx.createRadialGradient(moonX, moonY, moonRadius, moonX, moonY, moonRadius + 15);
    haloGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    haloGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    haloGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = haloGradient;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Corpo principal da lua (branco amarelado com gradiente)
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.closePath();

    const moonGradient = ctx.createRadialGradient(moonX - 6, moonY - 6, 0, moonX, moonY, moonRadius);
    moonGradient.addColorStop(0, '#f5f5dc');
    moonGradient.addColorStop(0.5, '#e8e8d3');
    moonGradient.addColorStop(1, '#c8c8b8');

    ctx.fillStyle = moonGradient;
    ctx.fill();

    // Crateras da lua (círculos escuros para dar textura)
    ctx.fillStyle = 'rgba(140, 140, 120, 0.5)';
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(moonX + 6, moonY + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(moonX - 2, moonY + 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX + 4, moonY - 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX - 5, moonY + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Brilho central da lua (reflexo do sol)
    ctx.beginPath();
    ctx.arc(moonX - 6, moonY - 6, moonRadius * 0.35, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    // Brilho mais intenso no ponto de reflexo máximo
    ctx.beginPath();
    ctx.arc(moonX - 7, moonY - 7, moonRadius * 0.15, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.restore();
}

function drawStars() {
    const nightFactor = getNightFactor();
    
    // Alpha das estrelas baseado no fator de noite (transição suave)
    // As estrelas aparecem gradualmente à medida que fica noite
    const starAlpha = nightFactor;
    
    // Se alpha é muito baixo, não desenhar
    if (starAlpha < 0.05) return;
    
    // Se as estrelas não foram geradas ainda, gerá-las
    if (starPositions.length === 0) {
        generateStars();
    }

    ctx.save();
    starPositions.forEach(star => {
        // Combinar brilho da estrela com o fator de noite
        const finalAlpha = star.brightness * starAlpha;
        ctx.globalAlpha = Math.max(0, Math.min(1, finalAlpha));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Adicionar um pequeno brilho às estrelas maiores
        if (star.size > 1.5 && finalAlpha > 0.1) {
            ctx.globalAlpha = finalAlpha * 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}

/**
 * Desenha uma nuvem fofa e realista usando múltiplas camadas de círculos
 * @param {number} x - Posição X da nuvem
 * @param {number} y - Posição Y da nuvem
 * @param {number} scale - Escala da nuvem
 */
function drawCloud(x, y, scale) {
    const nightFactor = getNightFactor();
    
    // Alpha das nuvens baseado no fator de noite (transição suave)
    // Quando nightFactor = 0 (dia), alpha = 1
    // Quando nightFactor = 1 (noite), alpha = 0
    const cloudAlpha = 1 - nightFactor;
    
    // Se alpha é muito baixo, não desenhar
    if (cloudAlpha < 0.05) return;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    // Aplicar alpha às nuvens
    ctx.globalAlpha = cloudAlpha;

    // === CAMADA BASE DA NUVEM (círculos principais) ===
    // Sombra suave para dar profundidade
    ctx.shadowColor = 'rgba(200, 200, 200, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Cor branca principal da nuvem
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    
    // Desenha cada círculo da base separadamente para evitar problemas de composição
    // Círculo central (maior)
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo direito
    ctx.beginPath();
    ctx.arc(30, -3, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo direito extremo
    ctx.beginPath();
    ctx.arc(55, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo esquerdo superior
    ctx.beginPath();
    ctx.arc(15, -18, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo direito superior
    ctx.beginPath();
    ctx.arc(42, -20, 17, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo esquerdo
    ctx.beginPath();
    ctx.arc(-25, 2, 19, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo inferior esquerdo
    ctx.beginPath();
    ctx.arc(10, 15, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo inferior direito
    ctx.beginPath();
    ctx.arc(35, 12, 15, 0, Math.PI * 2);
    ctx.fill();

    // Remove sombra para as camadas seguintes
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // === CAMADA DE BRILHO (círculos menores e mais claros) ===
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    // Brilho superior esquerdo
    ctx.beginPath();
    ctx.arc(18, -16, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho superior direito
    ctx.beginPath();
    ctx.arc(40, -18, 11, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho central
    ctx.beginPath();
    ctx.arc(28, -8, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho esquerdo
    ctx.beginPath();
    ctx.arc(-8, -5, 9, 0, Math.PI * 2);
    ctx.fill();

    // === CAMADA DE DESTAQUE (pontos de luz mais intensos) ===
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    
    // Destaque superior esquerdo
    ctx.beginPath();
    ctx.arc(20, -17, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Destaque superior direito
    ctx.beginPath();
    ctx.arc(42, -19, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Destaque central
    ctx.beginPath();
    ctx.arc(30, -10, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
}

/**
 * Atualiza as posições das nuvens para criar movimento contínuo
 * As nuvens se movem da esquerda para a direita e reaparecem do lado esquerdo
 * @param {number} dtMs - Delta time em milissegundos desde o último frame
 */
function updateClouds(dtMs) {
    // Converte delta time para um fator de movimento (normaliza para 60fps)
    // dtMs / 16.67 converte milissegundos para frames (assumindo 60fps)
    const frameFactor = dtMs / 16.67;
    
    // Largura do canvas para detectar quando a nuvem sai da tela
    const canvasWidth = canvas.width;
    
    // Atualiza cada nuvem
    cloudPositions.forEach(cloud => {
        // Move a nuvem para a direita baseado na sua velocidade
        // Multiplica pela escala de frames para movimento suave independente do FPS
        cloud.x += cloud.vx * frameFactor;
        
        // Se a nuvem saiu completamente da tela pela direita, reposiciona à esquerda
        // Considera a largura aproximada da nuvem (cerca de 80 pixels com escala)
        const cloudWidth = 80 * cloud.s;
        if (cloud.x > canvasWidth + cloudWidth) {
            // Reposiciona a nuvem do lado esquerdo (um pouco antes de aparecer)
            cloud.x = -cloudWidth;
        }
    });
}

/**
 * Desenha todas as nuvens na tela
 * As nuvens são desenhadas individualmente com sua própria transição de alpha
 */
function drawAllClouds() {
    // Itera sobre cada nuvem e a desenha
    cloudPositions.forEach(c => drawCloud(c.x, c.y, c.s));
}

