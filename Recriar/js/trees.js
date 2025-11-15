/**
 * SISTEMA DE ÁRVORES E FLORES
 * 
 * Este módulo gerencia o crescimento das plantas baseado no nível de poluição:
 * - Quando a poluição diminui (totalMitigation aumenta), as plantas crescem
 * - Quando a poluição aumenta, as plantas encolhem
 * - O crescimento é gradual e suave (não instantâneo)
 * 
 * Elementos desenhados:
 * - Árvores entre as casas (desenhadas na frente dos edifícios)
 * - Árvores e jardins na frente das fábricas
 */

// Constantes
const groundY = 420;  // Posição Y do chão (onde as plantas são plantadas)

// Variáveis de controle de crescimento
let currentPlantGrowthFactor = 0.1;      // Fator de crescimento atual (0.1 = 10%, 1.0 = 100%)
const growthTransitionSpeed = 0.035;     // Velocidade de transição (quanto maior, mais rápido)

/**
 * Calcula o tamanho desejado das plantas baseado na mitigação
 * totalMitigation varia de 0 a 0.4, normalizado para 0-1
 * Retorna um valor entre 0.1 (mínimo) e 1.0 (máximo)
 */
function getTargetPlantGrowthFactor() {
    // Normaliza totalMitigation (0-0.4) para (0-1) com pequena tolerância
    const normalizedMitigation = Math.min(1.0, (totalMitigation + 0.0001) / 0.4);
    
    // Se estiver muito próximo do máximo, retorna 1.0 diretamente
    if (totalMitigation >= 0.399) {
        return 1.0;
    }
    
    // Mínimo de 0.1 para que as plantas sempre apareçam um pouco
    return Math.max(0.1, normalizedMitigation);
}

/**
 * Atualiza o crescimento das plantas gradualmente
 * Usa interpolação suave (lerp) para transição gradual entre tamanhos
 * Limita dtMs para evitar aceleração quando há saltos no delta time
 */
function updatePlantGrowth(dtMs) {
    const targetGrowth = getTargetPlantGrowthFactor();
    
    // Limita dtMs para evitar aceleração (máximo 1 frame a 60fps)
    const safeDtMs = Math.min(16.67, dtMs);
    const dt = safeDtMs / 16.67;  // Normaliza para frames
    
    // Calcula diferença entre tamanho atual e desejado
    const diff = targetGrowth - currentPlantGrowthFactor;
    
    // Se a diferença for muito pequena, define diretamente
    if (Math.abs(diff) < 0.001) {
        currentPlantGrowthFactor = targetGrowth;
    } else {
        // Interpola suavemente em direção ao tamanho desejado
        const step = diff * growthTransitionSpeed * dt;
        currentPlantGrowthFactor += step;
    }
    
    // Garante que fica dentro dos limites (0.1 a 1.0)
    currentPlantGrowthFactor = Math.max(0.1, Math.min(1.0, currentPlantGrowthFactor));
}

/**
 * Retorna o fator de crescimento atual para uso no desenho
 */
function getPlantGrowthFactor() {
    return currentPlantGrowthFactor;
}

/**
 * Desenha uma árvore na posição especificada
 * @param {number} x - Posição X da árvore
 * @param {number} y - Posição Y da base da árvore (no chão)
 * @param {number} scale - Escala de crescimento (0.1 a 1.0)
 */
function drawTree(x, y, scale) {
    // Guarda a posição Y da base da árvore (no chão)
    const baseY = y;
    
    // Calcula a altura do tronco multiplicando 45 pixels pela escala (45px quando scale=1.0)
    const trunkHeight = 45 * scale;
    
    // Calcula a largura do tronco multiplicando 8 pixels pela escala
    const trunkWidth = 8 * scale;
    
    // Calcula o raio da copa da árvore multiplicando 28 pixels pela escala
    const crownRadius = 28 * scale;
    
    // Calcula a posição Y do topo do tronco (onde começa a copa)
    const crownY = baseY - trunkHeight;
    
    // Salva o estado atual do contexto (cores, transformações, etc.)
    ctx.save();
    
    // === DESENHA A SOMBRA DA ÁRVORE NO CHÃO ===
    // Define a opacidade da sombra (15% multiplicado pela escala para sombra menor em árvores pequenas)
    ctx.globalAlpha = 0.15 * scale;
    
    // Define a cor da sombra (preto)
    ctx.fillStyle = '#000000';
    
    // Inicia um novo caminho para desenhar a sombra
    ctx.beginPath();
    
    // Desenha uma elipse (sombra oval) no chão
    // Posição: x (centro), baseY + 2 (2 pixels abaixo do chão)
    // Raio horizontal: 80% do raio da copa
    // Raio vertical: 40% do raio da copa (sombra mais achatada)
    // Rotação: 0, ângulos: 0 a 2π (círculo completo)
    ctx.ellipse(x, baseY + 2, crownRadius * 0.8, crownRadius * 0.4, 0, 0, Math.PI * 2);
    
    // Preenche a sombra
    ctx.fill();
    
    // Restaura a opacidade para 100% (opaco)
    ctx.globalAlpha = 1.0;
    
    // === DESENHA O TRONCO COM GRADIENTE ===
    // Cria um gradiente linear vertical do topo do tronco até a base
    const trunkGradient = ctx.createLinearGradient(x - trunkWidth / 2, crownY, x + trunkWidth / 2, baseY);
    
    // Define cor no início do gradiente (topo - marrom claro)
    trunkGradient.addColorStop(0, '#6b5a4a');
    
    // Define cor no meio do gradiente (marrom médio)
    trunkGradient.addColorStop(0.5, '#5a4a3a');
    
    // Define cor no final do gradiente (base - marrom escuro)
    trunkGradient.addColorStop(1, '#4a3a2a');
    
    // Aplica o gradiente como cor de preenchimento
    ctx.fillStyle = trunkGradient;
    
    // Desenha um retângulo para o tronco
    // Posição X: centro - metade da largura (centralizado)
    // Posição Y: topo do tronco (crownY)
    // Largura: trunkWidth, Altura: trunkHeight
    ctx.fillRect(x - trunkWidth / 2, crownY, trunkWidth, trunkHeight);
    
    // === DESENHA DETALHES DO TRONCO (LINHAS VERTICAIS) ===
    // Define a cor das linhas de detalhe (marrom escuro)
    ctx.strokeStyle = '#4a3a2a';
    
    // Define a espessura das linhas (0.5 pixels - muito finas)
    ctx.lineWidth = 0.5;
    
    // Inicia um novo caminho para as linhas
    ctx.beginPath();
    
    // Linha vertical esquerda (1 pixel da borda esquerda)
    ctx.moveTo(x - trunkWidth / 2 + 1, crownY);
    ctx.lineTo(x - trunkWidth / 2 + 1, baseY);
    
    // Move para o início da linha direita (sem desenhar)
    ctx.moveTo(x + trunkWidth / 2 - 1, crownY);
    
    // Linha vertical direita (1 pixel da borda direita)
    ctx.lineTo(x + trunkWidth / 2 - 1, baseY);
    
    // Desenha as linhas
    ctx.stroke();
    
    // === DESENHA A COPA DA ÁRVORE (MÚLTIPLAS CAMADAS PARA PROFUNDIDADE) ===
    
    // Camada de trás (mais escura - verde muito escuro)
    ctx.fillStyle = '#3a6b4a';
    
    // Inicia um novo caminho
    ctx.beginPath();
    
    // Desenha um círculo atrás e um pouco acima (simula folhas de trás)
    // Posição X: ligeiramente à esquerda do centro
    // Posição Y: acima do topo do tronco
    // Raio: 90% do raio da copa
    ctx.arc(x - crownRadius * 0.2, crownY - crownRadius * 0.4, crownRadius * 0.9, 0, Math.PI * 2);
    
    // Preenche a camada de trás
    ctx.fill();
    
    // Camada principal (verde médio)
    ctx.fillStyle = '#4a7c59';
    
    // Inicia um novo caminho
    ctx.beginPath();
    
    // Desenha o círculo principal da copa (centrado)
    ctx.arc(x, crownY - crownRadius * 0.2, crownRadius, 0, Math.PI * 2);
    
    // Preenche a camada principal
    ctx.fill();
    
    // Camada superior esquerda (verde claro)
    ctx.fillStyle = '#5a8c69';
    
    // Inicia um novo caminho
    ctx.beginPath();
    
    // Desenha um círculo no topo esquerdo (85% do raio)
    ctx.arc(x - crownRadius * 0.35, crownY - crownRadius * 0.5, crownRadius * 0.85, 0, Math.PI * 2);
    
    // Preenche a camada superior esquerda
    ctx.fill();
    
    // Camada superior direita (usa a mesma cor verde claro)
    // Inicia um novo caminho
    ctx.beginPath();
    
    // Desenha um círculo no topo direito (85% do raio)
    ctx.arc(x + crownRadius * 0.35, crownY - crownRadius * 0.5, crownRadius * 0.85, 0, Math.PI * 2);
    
    // Preenche a camada superior direita
    ctx.fill();
    
    // Camada frontal (mais clara - verde mais claro para dar profundidade)
    ctx.fillStyle = '#6a9c79';
    
    // Inicia um novo caminho
    ctx.beginPath();
    
    // Desenha um círculo na frente (70% do raio, posicionado à direita)
    ctx.arc(x + crownRadius * 0.15, crownY - crownRadius * 0.3, crownRadius * 0.7, 0, Math.PI * 2);
    
    // Preenche a camada frontal
    ctx.fill();
    
    // === DESENHA PEQUENOS DETALHES DE FOLHAS (PONTOS) ===
    // Define cor verde muito claro para os detalhes
    ctx.fillStyle = '#7aac89';
    
    // Gera um seed determinístico baseado na posição da árvore
    // Isso garante que a mesma árvore sempre tenha os mesmos detalhes (evita flickering)
    const seed = Math.floor(x * 13 + y * 17);
    
    // Loop para desenhar 8 pontos de folhas ao redor da copa
    for (let i = 0; i < 8; i++) {
        // Calcula o ângulo em radianos (distribui os 8 pontos uniformemente em 360°)
        const angle = (i / 8) * Math.PI * 2;
        
        // Gera uma variação de distância determinística baseada no seed e índice
        // Usa módulo 30 para obter um valor entre 0 e 29, depois divide por 100 para 0 a 0.29
        const distVariation = ((seed + i * 7) % 30) / 100;
        
        // Calcula a distância do centro (60% a 90% do raio da copa)
        const dist = crownRadius * (0.6 + distVariation);
        
        // Calcula a posição X do ponto usando trigonometria (coseno)
        const leafX = x + Math.cos(angle) * dist;
        
        // Calcula a posição Y do ponto usando trigonometria (seno)
        // Multiplica dist por 0.5 para achatamento vertical (elipse)
        const leafY = crownY - crownRadius * 0.2 + Math.sin(angle) * dist * 0.5;
        
        // Inicia um novo caminho para cada ponto
        ctx.beginPath();
        
        // Desenha um círculo pequeno (raio de 2 pixels multiplicado pela escala)
        ctx.arc(leafX, leafY, 2 * scale, 0, Math.PI * 2);
        
        // Preenche o ponto
        ctx.fill();
    }
    
    // Restaura o estado do contexto salvo anteriormente
    ctx.restore();
}

/**
 * Desenha uma flor pequena
 * @param {number} x - Posição X da flor
 * @param {number} y - Posição Y da base da flor (no chão)
 * @param {number} scale - Escala de crescimento (0.1 a 1.0)
 */
function drawFlower(x, y, scale) {
    // Calcula a altura do caule multiplicando 8 pixels pela escala
    const stemHeight = 8 * scale;
    
    // Calcula o tamanho das pétalas multiplicando 3 pixels pela escala
    const petalSize = 3 * scale;
    
    // === DESENHA O CAULE ===
    // Define a cor do caule (verde)
    ctx.strokeStyle = '#4a7c59';
    
    // Define a espessura do caule (1.5 pixels multiplicado pela escala)
    ctx.lineWidth = 1.5 * scale;
    
    // Inicia um novo caminho para desenhar o caule
    ctx.beginPath();
    
    // Move para a base da flor (no chão)
    ctx.moveTo(x, y);
    
    // Desenha uma linha vertical até o topo do caule
    ctx.lineTo(x, y - stemHeight);
    
    // Desenha o caule
    ctx.stroke();
    
    // === DESENHA AS PÉTALAS ===
    // Array com 4 cores diferentes para as flores (rosa, laranja, azul, amarelo)
    const colors = ['#ff6b9d', '#ffb347', '#87ceeb', '#ffd700'];
    
    // Seleciona uma cor baseada na posição X da flor (determinístico)
    // Math.floor(x) converte para inteiro, % colors.length garante índice válido (0-3)
    const color = colors[Math.floor(x) % colors.length];
    
    // Aplica a cor selecionada como cor de preenchimento
    ctx.fillStyle = color;
    
    // Pétala superior (acima do centro da flor)
    ctx.beginPath();
    
    // Desenha um círculo acima do centro (posição Y: centro - tamanho da pétala)
    ctx.arc(x, y - stemHeight - petalSize, petalSize, 0, Math.PI * 2);
    
    // Preenche a pétala superior
    ctx.fill();
    
    // Pétala inferior (abaixo do centro da flor)
    ctx.beginPath();
    
    // Desenha um círculo abaixo do centro (posição Y: centro + tamanho da pétala)
    ctx.arc(x, y - stemHeight + petalSize, petalSize, 0, Math.PI * 2);
    
    // Preenche a pétala inferior
    ctx.fill();
    
    // Pétala esquerda (à esquerda do centro da flor)
    ctx.beginPath();
    
    // Desenha um círculo à esquerda do centro (posição X: centro - tamanho da pétala)
    ctx.arc(x - petalSize, y - stemHeight, petalSize, 0, Math.PI * 2);
    
    // Preenche a pétala esquerda
    ctx.fill();
    
    // Pétala direita (à direita do centro da flor)
    ctx.beginPath();
    
    // Desenha um círculo à direita do centro (posição X: centro + tamanho da pétala)
    ctx.arc(x + petalSize, y - stemHeight, petalSize, 0, Math.PI * 2);
    
    // Preenche a pétala direita
    ctx.fill();
    
    // === DESENHA O CENTRO DA FLOR ===
    // Define cor dourada para o centro
    ctx.fillStyle = '#ffd700';
    
    // Inicia um novo caminho para o centro
    ctx.beginPath();
    
    // Desenha um círculo pequeno no centro da flor (60% do tamanho da pétala)
    ctx.arc(x, y - stemHeight, petalSize * 0.6, 0, Math.PI * 2);
    
    // Preenche o centro da flor
    ctx.fill();
}

/**
 * Desenha um mini jardim com várias flores
 * @param {number} x - Posição X inicial do jardim
 * @param {number} y - Posição Y do jardim
 * @param {number} width - Largura do jardim
 * @param {number} scale - Escala de crescimento (0.1 a 1.0)
 */
function drawMiniGarden(x, y, width, scale) {
    // Número de flores varia de 3 a 8 dependendo da escala
    const numFlowers = Math.floor(3 + scale * 5);
    const spacing = width / (numFlowers + 1);
    
    // Usa valores determinísticos baseados na posição para evitar flickering
    const seed = Math.floor(x * 7 + y * 11);
    
    for (let i = 1; i <= numFlowers; i++) {
        // Gera offset determinístico para posicionamento natural
        const offsetX = ((seed + i * 13) % 8 - 4) * scale;
        const offsetY = ((seed + i * 17) % 6 - 3) * scale;
        const flowerX = x + spacing * i + offsetX;
        const flowerY = y + offsetY;
        drawFlower(flowerX, flowerY, scale);
    }
}

/**
 * Desenha árvores entre as casas
 * Coloca uma árvore entre cada par de casas, antes da primeira e depois da última
 */
function drawTreesBetweenHouses() {
    const growthFactor = getPlantGrowthFactor();
    
    // Árvore entre cada par de casas
    for (let i = 0; i < buildings.length - 1; i++) {
        const currentBuilding = buildings[i];
        const nextBuilding = buildings[i + 1];
        
        // Calcula posição no meio entre as duas casas
        const treeX = currentBuilding.x + currentBuilding.w + (nextBuilding.x - (currentBuilding.x + currentBuilding.w)) / 2;
        drawTree(treeX, groundY, growthFactor);
    }
    
    // Árvore antes da primeira casa (se houver espaço suficiente)
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

/**
 * Desenha árvores e jardins na frente das fábricas
 * O número de árvores e flores aumenta conforme a poluição diminui
 */
function drawFactoryGardens() {
    const growthFactor = getPlantGrowthFactor();
    
    factoriesData.forEach((factory, idx) => {
        // Árvores na frente da fábrica (2-4 árvores dependendo do crescimento)
        const numTrees = Math.floor(2 + growthFactor * 2);
        const treeSpacing = Math.max(35, factory.w / (numTrees + 1));
        const startX = factory.x - 45;
        
        for (let i = 0; i < numTrees; i++) {
            // Pequeno offset por fábrica para variação visual
            const treeX = startX + treeSpacing * (i + 1) + (idx * 7);
            // Árvores um pouco menores que as entre casas (90% do tamanho)
            drawTree(treeX, groundY, growthFactor * 0.9);
        }
        
        // Mini jardim de flores mais próximo da fábrica
        const gardenX = factory.x - 25;
        const gardenY = groundY - 5;
        const gardenWidth = Math.min(35, factory.w * 0.4);
        
        drawMiniGarden(gardenX, gardenY, gardenWidth, growthFactor);
    });
}

/**
 * Desenha todas as plantas (exceto árvores entre casas)
 * Chamada durante o drawScene antes dos edifícios
 */
function drawPlants() {
    drawFactoryGardens();
}

/**
 * Desenha árvores entre casas (chamada depois dos edifícios)
 * Separada para que as árvores apareçam na frente dos edifícios
 */
function drawTreesBetweenHousesFront() {
    drawTreesBetweenHouses();
}

/**
 * Reseta o crescimento das plantas para o estado inicial
 * Chamado quando o estado da animação é resetado
 */
function resetPlants() {
    currentPlantGrowthFactor = 0.1;
}

