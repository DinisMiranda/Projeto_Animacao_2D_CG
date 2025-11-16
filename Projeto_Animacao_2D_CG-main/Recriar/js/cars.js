// ============================================================================
// MÓDULO: CARROS E AUTOCARRO
// ============================================================================
// Gerencia carros normais e o autocarro que circulam na estrada
// ============================================================================

// ============================================================================
// VARIÁVEIS GLOBAIS E CONSTANTES
// ============================================================================

const cars = [];                    // Array com todos os carros na estrada
let nextCarSpawnTs = 0;            // Timestamp para próximo spawn de carro
const baseExhaustInterval = 120;    // Intervalo base para gerar fumo dos carros

let bus = null;                     // Objeto do autocarro
const BUS_WRAP_MARGIN = 80;         // Margem para wrap do autocarro na tela

// ============================================================================
// FUNÇÕES DA ESTRADA (Chão e Estrada)
// ============================================================================

/**
 * Desenha o chão (grama/terra) abaixo da estrada
 */
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

/**
 * Desenha a estrada com linha central tracejada
 */
function drawRoad() {
    // Corpo da estrada
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.lineTo(canvas.width, 470);
    ctx.lineTo(canvas.width, 530);
    ctx.lineTo(0, 530);
    ctx.closePath();
    ctx.fillStyle = '#444c5a';
    ctx.fill();

    // Linha central tracejada
    ctx.strokeStyle = '#cfd7e6';
    ctx.setLineDash([18, 14]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(canvas.width, 500);
    ctx.stroke();
    ctx.setLineDash([]);
}

/**
 * Retorna as coordenadas Y da estrada (topo e fundo)
 * @returns {Object} {y1: topo, y2: fundo}
 */
function getRoadRect() {
    return { y1: 470, y2: 530 };
}

// ============================================================================
// SEÇÃO: CARROS NORMAIS
// ============================================================================

/**
 * Cria um novo carro na estrada
 * Verifica distância mínima para evitar sobreposição
 * @param {number} ts - Timestamp atual
 */
function spawnCar(ts) {
    const lane = Math.random() < 0.5 ? 0 : 1;  // Escolhe lane aleatória
    const minDistance = 150;  // Distância mínima entre carros (px)
    
    // Verificar se há carros muito próximos na mesma lane
    let canSpawn = true;
    const spawnX = lane === 0 ? -120 : canvas.width + 120;
    const spawnY = lane === 0 ? 488 : 512;
    
    for (let existingCar of cars) {
        const sameLane = (lane === 0 && existingCar.y < 500) || (lane === 1 && existingCar.y >= 500);
        if (sameLane) {
            const distance = Math.abs(existingCar.x - spawnX);
            if (distance < minDistance) {
                canSpawn = false;
                break;
            }
        }
    }
    
    // Se não pode spawnar, aguardar um pouco mais
    if (!canSpawn) {
        nextCarSpawnTs = ts + 200;
        return;
    }
    
    // Criar carro na lane superior (vai para direita)
    if (lane === 0) {
        cars.push({
            x: -120,
            y: 488,
            w: 46, h: 16,
            color: '#e74c3c',
            speed: 0.18 + Math.random() * 0.10,
            dir: 1,  // Direção: direita
            lastSmoke: ts
        });
    } 
    // Criar carro na lane inferior (vai para esquerda)
    else {
        cars.push({
            x: canvas.width + 120,
            y: 512,
            w: 52, h: 18,
            color: '#3498db',
            speed: 0.16 + Math.random() * 0.10,
            dir: -1,  // Direção: esquerda
            lastSmoke: ts
        });
    }
}

/**
 * Atualiza posições dos carros e desenha eles
 * Também gerencia spawn de novos carros
 * @param {number} dtMs - Delta time em milissegundos
 * @param {number} ts - Timestamp atual
 */
function updateAndDrawCars(dtMs, ts) {
    // ===== SPAWN DE NOVOS CARROS =====
    if (ts >= nextCarSpawnTs) {
        spawnCar(ts);
        
        // Calcular intervalo até próximo spawn
        const baseGap = 900 + Math.random() * 1400;
        let spawnFactor = 1 + totalMitigation * 1.0;
        
        // Mais carros se autocarro estiver na estrada
        if (showBusCheckbox && showBusCheckbox.checked && bus && bus.placedOnRoad) {
            spawnFactor *= 1.25;
        }
        
        // Reduzir tráfego durante a noite
        const nightFactor = typeof getNightFactor === 'function' ? getNightFactor() : 0;
        if (nightFactor > 0) {
            spawnFactor *= (1 + nightFactor * 2);  // Noite completa = 3x menos carros
        }
        
        nextCarSpawnTs = ts + baseGap * spawnFactor;
    }

    // ===== ATUALIZAR POSIÇÕES E DETECTAR COLISÕES =====
    for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        
        // Mover carro
        c.x += c.speed * c.dir * dtMs;
        
        // Verificar colisão com outros carros na mesma lane
        for (let j = 0; j < cars.length; j++) {
            if (i === j) continue;
            const other = cars[j];
            const sameLane = Math.abs(c.y - other.y) < 10;
            
            if (sameLane && c.dir === other.dir) {
                const distance = Math.abs(c.x - other.x);
                const minSeparation = (c.w + other.w) * 0.5 + 10;
                
                // Ajustar posição para evitar sobreposição
                if (distance < minSeparation) {
                    if (c.dir > 0) {
                        c.x = Math.min(c.x, other.x - minSeparation);
                    } else {
                        c.x = Math.max(c.x, other.x + minSeparation);
                    }
                }
            }
        }
        
        // Remover carros que saíram da tela
        if ((c.dir > 0 && c.x - c.w > canvas.width + 40) || 
            (c.dir < 0 && c.x + c.w < -40)) {
            cars.splice(i, 1);
            continue;
        }

        // Gerar fumo dos carros periodicamente
        const exhaustInterval = baseExhaustInterval * (1 + totalMitigation * 3.0);
        if (ts - c.lastSmoke > exhaustInterval) {
            const exhaustX = c.dir > 0 ? c.x - c.w * 0.5 - 4 : c.x + c.w * 0.5 + 4;
            const exhaustY = c.y + c.h * 0.25;
            spawnCarSmoke(exhaustX, exhaustY, c.dir);
            c.lastSmoke = ts;
        }
    }

    // ===== DESENHAR TODOS OS CARROS =====
    cars.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.dir, 1);  // Espelhar se for para esquerda
        
        // Corpo do carro
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h, 4);
        ctx.fill();
        
        // Janelas
        ctx.fillStyle = '#cfe8ff';
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.2, -c.h * 0.6, c.w * 0.35, c.h * 0.55, 3);
        ctx.fill();
        
        // Rodas
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-c.w * 0.25, c.h * 0.5, 5, 0, Math.PI * 2);
        ctx.arc(c.w * 0.25, c.h * 0.5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

/**
 * Reseta todos os carros (limpa array e reseta spawn timer)
 */
function resetCars() {
    cars.length = 0;
    nextCarSpawnTs = 0;
}

// ============================================================================
// SEÇÃO: AUTOCARRO
// ============================================================================

/**
 * Inicializa o objeto autocarro com propriedades padrão
 */
function initBus() {
    bus = {
        x: 80,
        y: canvas.height - 90,
        w: 120,  // Largura
        h: 30,   // Altura
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        placedOnRoad: false,  // Se está colocado na estrada
        visible: false,
        dir: 1,  // Direção: 1 = direita, -1 = esquerda
        speed: 0.18,
        lane: 0,  // Lane atual (0 = cima, 1 = baixo)
        targetLaneY: canvas.height - 90,  // Y alvo da lane
        autoDrive: false  // Se está em modo automático
    };
}

/**
 * Retorna os centros Y das duas lanes do autocarro
 * @returns {Array} [lane0Y, lane1Y]
 */
function getBusLaneCenters() {
    const r = getRoadRect();
    const laneHeight = (r.y2 - r.y1) / 2;
    return [
        r.y1 + laneHeight * 0.5,   // Lane 0 (cima)
        r.y1 + laneHeight * 1.3     // Lane 1 (baixo) - ajustado para não ficar em cima do passeio
    ];
}

/**
 * Alinha o autocarro à lane mais próxima baseado na posição Y
 * @param {number} referenceY - Posição Y de referência
 */
function alignBusToLane(referenceY) {
    if (!bus) return;
    const r = getRoadRect();
    const laneCenters = getBusLaneCenters();
    const midRoad = (r.y1 + r.y2) * 0.5;
    
    // Escolher lane baseado na posição
    const useTopLane = referenceY <= midRoad;
    bus.lane = useTopLane ? 0 : 1;
    bus.dir = useTopLane ? 1 : -1;  // Lane de cima vai para direita
    bus.targetLaneY = laneCenters[bus.lane];
    bus.y = bus.targetLaneY;
}

/**
 * Atualiza posição do autocarro quando em modo automático
 * @param {number} dtMs - Delta time em milissegundos
 */
function updateBus(dtMs) {
    if (!bus || !bus.visible || bus.isDragging || !bus.placedOnRoad || !bus.autoDrive) {
        return;
    }
    
    // Mover autocarro
    bus.x += bus.speed * bus.dir * dtMs;
    
    // Wrap na tela (teleportar para o outro lado quando sai)
    if (bus.dir > 0 && bus.x - bus.w * 0.5 > canvas.width + BUS_WRAP_MARGIN) {
        bus.x = -BUS_WRAP_MARGIN;
    } else if (bus.dir < 0 && bus.x + bus.w * 0.5 < -BUS_WRAP_MARGIN) {
        bus.x = canvas.width + BUS_WRAP_MARGIN;
    }
    
    // Suavizar movimento para lane alvo
    if (typeof bus.targetLaneY === 'number') {
        bus.y += (bus.targetLaneY - bus.y) * 0.2;
    }
}

/**
 * Desenha o autocarro na tela
 * @param {Object} obj - Objeto do autocarro
 */
function drawBus(obj) {
    if (!obj || !obj.visible) return;
    
    ctx.save();
    ctx.translate(obj.x, obj.y);
    
    // Corpo do autocarro (amarelo)
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.roundRect(-obj.w * 0.5, -obj.h * 0.5, obj.w, obj.h, 6);
    ctx.fill();
    
    // Janelas
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
    
    // Rodas
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-obj.w * 0.35, obj.h * 0.5, 7, 0, Math.PI * 2);
    ctx.arc(obj.w * 0.35, obj.h * 0.5, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

/**
 * Verifica se um ponto (x, y) está dentro do autocarro
 * Usado para detecção de clique/arraste
 * @param {number} x - Coordenada X do ponto
 * @param {number} y - Coordenada Y do ponto
 * @param {Object} obj - Objeto do autocarro
 * @returns {boolean} true se o ponto está dentro
 */
function isPointInBus(x, y, obj) {
    if (!obj || !obj.visible) return false;
    return x >= obj.x - obj.w * 0.5 && x <= obj.x + obj.w * 0.5 &&
           y >= obj.y - obj.h * 0.5 && y <= obj.y + obj.h * 0.5;
}
