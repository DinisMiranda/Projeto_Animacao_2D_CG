// ===== MÓDULO: CÉU, SOL, NUVENS, LUA E ESTRELAS =====

// Array com posições e escalas das nuvens
const cloudPositions = [
    {x: 140, y: 100, s: 1.0},
    {x: 360, y: 120, s: 0.95},
    {x: 560, y: 105, s: 1.05},
    {x: 760, y: 130, s: 1.0},
    {x: 980, y: 145, s: 0.9}
];

// Array com posições das estrelas (geradas aleatoriamente)
let starPositions = [];

// Configuração do ciclo dia/noite
const DAY_NIGHT_CYCLE_DURATION = 60000; // 60 segundos para um ciclo completo (30s dia + 30s noite)
const DAY_DURATION = DAY_NIGHT_CYCLE_DURATION / 2; // 30 segundos de dia
const NIGHT_DURATION = DAY_NIGHT_CYCLE_DURATION / 2; // 30 segundos de noite
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
    
    // Mover o sol durante o ciclo (nascer e pôr do sol)
    // timeOfDay já está entre 0 e 1, usar diretamente
    let normalizedPos = timeOfDay;
    if (normalizedPos < 0) normalizedPos = 0;
    if (normalizedPos >= 1) normalizedPos = 0.999999;
    
    let sunX, sunY;
    let sunRadius = 26;
    
    // Calcular posição do sol baseado no ciclo
    if (normalizedPos <= 0.25) {
        // Manhã: sol sobe (0 a 0.25)
        const progress = normalizedPos / 0.25;
        sunX = 200 + (900 - 200) * progress;
        sunY = 420 - (420 - 120) * progress;
        sunRadius = 26 + Math.sin(progress * Math.PI) * 2;
    } else if (normalizedPos <= 0.5) {
        // Meio-dia para tarde: sol desce (0.25 a 0.5)
        const progress = (normalizedPos - 0.25) / 0.25;
        sunX = 900 + (1100 - 900) * progress;
        sunY = 120 + (420 - 120) * progress;
        sunRadius = 26 - Math.sin(progress * Math.PI) * 2;
    } else if (normalizedPos <= 0.75) {
        // Noite: sol está abaixo do horizonte mas ainda podemos desenhar com alpha muito baixo
        // Usar posição abaixo do horizonte
        const progress = (normalizedPos - 0.5) / 0.25;
        sunX = 1100 - (1100 - 200) * progress;
        sunY = 420 + 50; // Abaixo do horizonte
        sunRadius = 20;
    } else {
        // Madrugada: sol nasce (0.75 a 1.0)
        const progress = (normalizedPos - 0.75) / 0.25;
        sunX = 200 - (200 - 0) * (1 - progress);
        sunY = 420 - (420 - 120) * progress;
        sunRadius = 26 + Math.sin(progress * Math.PI) * 2;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, sunAlpha));
    ctx.shadowColor = 'rgba(255, 183, 3, 0.4)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.closePath();

    // Mudar cor do sol durante pôr/nascer do sol
    let sunColor1, sunColor2, sunColor3;
    if (normalizedPos > 0.2 && normalizedPos < 0.3) {
        // Pôr do sol: tons laranja/vermelho
        sunColor1 = '#ff6b35';
        sunColor2 = '#ff8c42';
        sunColor3 = '#ff6b35';
    } else if (normalizedPos > 0.7 && normalizedPos < 0.8) {
        // Nascer do sol: tons laranja/amarelo
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
    
    // Posição da lua no céu (move-se durante a noite)
    // timeOfDay já está entre 0 e 1, usar diretamente
    let normalizedPos = timeOfDay;
    if (normalizedPos < 0) normalizedPos = 0;
    if (normalizedPos >= 1) normalizedPos = 0.999999;
    
    let moonX, moonY;
    const moonRadius = 24;
    
    // Calcular posição da lua baseado no ciclo
    // A lua aparece gradualmente durante a transição e fica visível durante a noite
    if (normalizedPos < 0.2) {
        // Dia completo: lua não visível
        return;
    } else if (normalizedPos <= 0.5) {
        // Transição para noite + primeira metade da noite: lua sobe (0.2 a 0.5)
        const progress = (normalizedPos - 0.2) / 0.3;
        moonX = 1100 - (1100 - 850) * progress;
        moonY = 420 - (420 - 100) * progress;
    } else if (normalizedPos <= 0.8) {
        // Segunda metade da noite: lua desce (0.5 a 0.8)
        const progress = (normalizedPos - 0.5) / 0.3;
        moonX = 850 - (850 - 200) * progress;
        moonY = 100 + (420 - 100) * progress;
    } else {
        // Transição para dia: lua desaparece (0.8 a 1.0)
        // Ainda visível mas desaparecendo gradualmente
        const progress = (normalizedPos - 0.8) / 0.2;
        moonX = 200 - (200 - 0) * progress;
        moonY = 420 + 30; // Abaixo do horizonte
    }
    
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, moonAlpha));

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

    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawAllClouds() {
    // As nuvens são desenhadas individualmente com sua própria transição de alpha
    // Não precisamos verificar aqui, cada nuvem verifica seu próprio alpha
    cloudPositions.forEach(c => drawCloud(c.x, c.y, c.s));
}

