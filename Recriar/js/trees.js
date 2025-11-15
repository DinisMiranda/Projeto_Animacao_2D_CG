// ===== MÓDULO: ÁRVORES E FLORES =====
// As plantas crescem conforme a poluição diminui (totalMitigation aumenta)

const groundY = 420;

// Variável para rastrear o tamanho atual das plantas (para animação gradual)
let currentPlantGrowthFactor = 0.1;

// Velocidade de transição (quanto maior, mais rápido)
const growthTransitionSpeed = 0.035; // Aumentado para resposta mais rápida (0.01 = lento, 0.05 = rápido)

// Função para calcular o tamanho desejado das plantas baseado na mitigação
// totalMitigation varia de 0 a 0.4, então normalizamos para 0-1
function getTargetPlantGrowthFactor() {
    // Normaliza totalMitigation (0-0.4) para (0-1)
    // Usar Math.min para garantir que não ultrapasse 1.0 devido a problemas de precisão
    // Adicionar pequena tolerância para garantir que 0.4 seja tratado como 1.0
    const normalizedMitigation = Math.min(1.0, (totalMitigation + 0.0001) / 0.4);
    // Mínimo de 0.1 para que as plantas sempre apareçam um pouco
    // Se totalMitigation >= 0.4 (ou muito próximo), garantir que retorne 1.0
    if (totalMitigation >= 0.399) {
        return 1.0;
    }
    return Math.max(0.1, normalizedMitigation);
}

// Atualiza o fator de crescimento gradualmente (deve ser chamado a cada frame)
function updatePlantGrowth(dtMs) {
    const targetGrowth = getTargetPlantGrowthFactor();
    
    // Limitar dtMs para evitar aceleração quando há saltos grandes no delta time
    // Isso garante que mesmo se dtMs for muito grande, a animação não acelere
    const safeDtMs = Math.min(16.67, dtMs); // Máximo de 1 frame a 60fps
    const dt = safeDtMs / 16.67; // Normalizar para frames a 60fps
    
    // Interpolação suave (lerp) entre o valor atual e o desejado
    const diff = targetGrowth - currentPlantGrowthFactor;
    
    // Se a diferença for muito pequena (menos de 0.001), definir diretamente para o alvo
    // Isso evita problemas quando o valor alvo está muito próximo do atual
    if (Math.abs(diff) < 0.001) {
        currentPlantGrowthFactor = targetGrowth;
    } else {
        const step = diff * growthTransitionSpeed * dt;
        currentPlantGrowthFactor += step;
    }
    
    // Garantir que não ultrapasse os limites
    currentPlantGrowthFactor = Math.max(0.1, Math.min(1.0, currentPlantGrowthFactor));
}

// Retorna o fator de crescimento atual (para uso no desenho)
function getPlantGrowthFactor() {
    return currentPlantGrowthFactor;
}

// Desenha uma árvore melhorada com mais detalhes
function drawTree(x, y, scale) {
    const baseY = y;
    const trunkHeight = 45 * scale; // Aumentado de 30 para 45
    const trunkWidth = 8 * scale; // Aumentado de 6 para 8 - tronco mais grosso
    const crownRadius = 28 * scale; // Aumentado de 22 para 28
    const crownY = baseY - trunkHeight;
    
    ctx.save();
    
    // Sombra da árvore no chão
    ctx.globalAlpha = 0.15 * scale;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, baseY + 2, crownRadius * 0.8, crownRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Tronco com gradiente
    const trunkGradient = ctx.createLinearGradient(x - trunkWidth / 2, crownY, x + trunkWidth / 2, baseY);
    trunkGradient.addColorStop(0, '#6b5a4a');
    trunkGradient.addColorStop(0.5, '#5a4a3a');
    trunkGradient.addColorStop(1, '#4a3a2a');
    ctx.fillStyle = trunkGradient;
    ctx.fillRect(x - trunkWidth / 2, crownY, trunkWidth, trunkHeight);
    
    // Detalhes do tronco (linhas)
    ctx.strokeStyle = '#4a3a2a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x - trunkWidth / 2 + 1, crownY);
    ctx.lineTo(x - trunkWidth / 2 + 1, baseY);
    ctx.moveTo(x + trunkWidth / 2 - 1, crownY);
    ctx.lineTo(x + trunkWidth / 2 - 1, baseY);
    ctx.stroke();
    
    // Copa da árvore - camada de folhas mais realista
    // Camada de trás (mais escura)
    ctx.fillStyle = '#3a6b4a';
    ctx.beginPath();
    ctx.arc(x - crownRadius * 0.2, crownY - crownRadius * 0.4, crownRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    
    // Camada principal (média)
    ctx.fillStyle = '#4a7c59';
    ctx.beginPath();
    ctx.arc(x, crownY - crownRadius * 0.2, crownRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Camada superior esquerda
    ctx.fillStyle = '#5a8c69';
    ctx.beginPath();
    ctx.arc(x - crownRadius * 0.35, crownY - crownRadius * 0.5, crownRadius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    
    // Camada superior direita
    ctx.beginPath();
    ctx.arc(x + crownRadius * 0.35, crownY - crownRadius * 0.5, crownRadius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    
    // Camada frontal (mais clara para dar profundidade)
    ctx.fillStyle = '#6a9c79';
    ctx.beginPath();
    ctx.arc(x + crownRadius * 0.15, crownY - crownRadius * 0.3, crownRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Pequenos detalhes de folhas (pontos) - valores determinísticos
    ctx.fillStyle = '#7aac89';
    const seed = Math.floor(x * 13 + y * 17); // Seed determinístico baseado na posição
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        // Usar seed determinístico para evitar flickering
        const distVariation = ((seed + i * 7) % 30) / 100; // 0 a 0.3
        const dist = crownRadius * (0.6 + distVariation);
        const leafX = x + Math.cos(angle) * dist;
        const leafY = crownY - crownRadius * 0.2 + Math.sin(angle) * dist * 0.5;
        ctx.beginPath();
        ctx.arc(leafX, leafY, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Desenha uma flor pequena
function drawFlower(x, y, scale) {
    const stemHeight = 8 * scale;
    const petalSize = 3 * scale;
    
    // Caule
    ctx.strokeStyle = '#4a7c59';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - stemHeight);
    ctx.stroke();
    
    // Pétalas (círculos coloridos)
    const colors = ['#ff6b9d', '#ffb347', '#87ceeb', '#ffd700'];
    const color = colors[Math.floor(x) % colors.length];
    
    ctx.fillStyle = color;
    // Pétala superior
    ctx.beginPath();
    ctx.arc(x, y - stemHeight - petalSize, petalSize, 0, Math.PI * 2);
    ctx.fill();
    // Pétala inferior
    ctx.beginPath();
    ctx.arc(x, y - stemHeight + petalSize, petalSize, 0, Math.PI * 2);
    ctx.fill();
    // Pétala esquerda
    ctx.beginPath();
    ctx.arc(x - petalSize, y - stemHeight, petalSize, 0, Math.PI * 2);
    ctx.fill();
    // Pétala direita
    ctx.beginPath();
    ctx.arc(x + petalSize, y - stemHeight, petalSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Centro da flor
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y - stemHeight, petalSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

// Desenha um mini jardim (várias flores pequenas)
function drawMiniGarden(x, y, width, scale) {
    const numFlowers = Math.floor(3 + scale * 5); // 3-8 flores dependendo da escala
    const spacing = width / (numFlowers + 1);
    
    // Usar valores determinísticos baseados na posição para evitar flickering
    const seed = Math.floor(x * 7 + y * 11);
    
    for (let i = 1; i <= numFlowers; i++) {
        // Gerar offset determinístico baseado no índice e seed
        const offsetX = ((seed + i * 13) % 8 - 4) * scale;
        const offsetY = ((seed + i * 17) % 6 - 3) * scale;
        const flowerX = x + spacing * i + offsetX;
        const flowerY = y + offsetY;
        drawFlower(flowerX, flowerY, scale);
    }
}

// Desenha todas as árvores entre as casas
function drawTreesBetweenHouses() {
    const growthFactor = getPlantGrowthFactor();
    
    // Árvore entre cada par de casas
    for (let i = 0; i < buildings.length - 1; i++) {
        const currentBuilding = buildings[i];
        const nextBuilding = buildings[i + 1];
        
        // Posição da árvore: no meio entre as duas casas
        const treeX = currentBuilding.x + currentBuilding.w + (nextBuilding.x - (currentBuilding.x + currentBuilding.w)) / 2;
        drawTree(treeX, groundY, growthFactor);
    }
    
    // Árvore antes da primeira casa (se houver espaço)
    if (buildings.length > 0 && buildings[0].x > 50) {
        const firstTreeX = buildings[0].x / 2;
        drawTree(firstTreeX, groundY, growthFactor);
    }
    
    // Árvore depois da última casa (se houver espaço antes das fábricas)
    if (buildings.length > 0) {
        const lastBuilding = buildings[buildings.length - 1];
        const spaceBeforeFactories = factoriesData.length > 0 ? factoriesData[0].x : canvas.width;
        if (lastBuilding.x + lastBuilding.w < spaceBeforeFactories - 50) {
            const lastTreeX = lastBuilding.x + lastBuilding.w + (spaceBeforeFactories - (lastBuilding.x + lastBuilding.w)) / 2;
            drawTree(lastTreeX, groundY, growthFactor);
        }
    }
}

// Desenha árvores e jardins na frente das fábricas
function drawFactoryGardens() {
    const growthFactor = getPlantGrowthFactor();
    
    factoriesData.forEach((factory, idx) => {
        // Árvores na frente da fábrica
        const numTrees = Math.floor(2 + growthFactor * 2); // 2-4 árvores dependendo do crescimento
        const treeSpacing = Math.max(35, factory.w / (numTrees + 1));
        const startX = factory.x - 45;
        
        for (let i = 0; i < numTrees; i++) {
            const treeX = startX + treeSpacing * (i + 1) + (idx * 7); // Pequeno offset por fábrica
            drawTree(treeX, groundY, growthFactor * 0.9); // Árvores um pouco menores
        }
        
        // Mini jardim de flores na frente (mais próximo da fábrica)
        const gardenX = factory.x - 25;
        const gardenY = groundY - 5;
        const gardenWidth = Math.min(35, factory.w * 0.4);
        
        drawMiniGarden(gardenX, gardenY, gardenWidth, growthFactor);
    });
}

// Função principal para desenhar plantas (exceto árvores entre casas)
function drawPlants() {
    drawFactoryGardens();
}

// Função separada para desenhar árvores entre casas (chamada depois dos edifícios)
function drawTreesBetweenHousesFront() {
    drawTreesBetweenHouses();
}

// Reseta o crescimento das plantas
function resetPlants() {
    currentPlantGrowthFactor = 0.1;
}

