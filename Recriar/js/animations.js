/**
 * SISTEMA DE ANIMAÇÕES E LOOPS
 * 
 * Este módulo gerencia:
 * - Loop principal de animação (mainLoop)
 * - Loop de animação durante interações (animationLoop)
 * - Renderização da cena (drawScene)
 * - Controle de velocidade de animação para evitar aceleração
 */

// Variáveis de controle de tempo e animação
let lastFrameTs = 0;              // Timestamp do último frame do mainLoop
let animationActive = false;       // Indica se o animationLoop está ativo
let animationStartTs = null;      // Timestamp de início da animação atual
let animationLastFrameTs = 0;     // Timestamp do último frame do animationLoop
let dashOffset = 0;               // Offset para animação do highlight (linha tracejada)
let animationStartTime = null;    // Timestamp de início para ciclo dia/noite

/**
 * Inicia o loop de animação durante interações (drag de painéis, highlight)
 * Sincroniza o timestamp inicial com o mainLoop para evitar saltos na animação
 */
function startHighlightAnimation() {
    // Verifica se a animação já está ativa (evita múltiplos loops simultâneos)
    if (!animationActive) {
        // Marca que a animação está ativa
        animationActive = true;
        
        // Reseta o timestamp de início (será definido no primeiro frame)
        animationStartTs = null;
        
        // Sincroniza o timestamp do último frame com o mainLoop se disponível
        // Isso evita saltos grandes no delta time quando o animationLoop começa
        if (lastFrameTs > 0) {
            // Usa o timestamp do último frame do mainLoop
            animationLastFrameTs = lastFrameTs;
        } else {
            // Se não houver timestamp do mainLoop, começa do zero
            animationLastFrameTs = 0;
        }
        
        // Solicita ao navegador que execute animationLoop no próximo frame
        requestAnimationFrame(animationLoop);
    }
}

/**
 * Loop de animação usado durante interações (drag de painéis, highlight de edifícios)
 * Mantém velocidade constante mesmo quando iniciado durante o drag
 */
function animationLoop(ts) {
    // Inicializa o timestamp de início do sistema se ainda não foi definido
    // animationStartTime é usado para o ciclo dia/noite
    if (!animationStartTime) animationStartTime = ts;
    
    // Inicializa o timestamp de início desta animação se ainda não foi definido
    if (animationStartTs === null) animationStartTs = ts;
    
    // Proteção contra saltos grandes no delta time (pode acontecer se o navegador pausar)
    if (!animationLastFrameTs || animationLastFrameTs === 0) {
        // Se não houver timestamp anterior, usa o timestamp atual
        animationLastFrameTs = ts;
    } else if ((ts - animationLastFrameTs) > 50) {
        // Se passou mais de 50ms desde o último frame (muito tempo), assume 1 frame padrão
        // Isso evita aceleração quando o navegador volta de pausa
        animationLastFrameTs = ts - 16.67;
    }
    
    // Calcula o delta time (tempo desde o último frame) em milissegundos
    const rawDt = ts - animationLastFrameTs;
    
    // Limita o delta time a no máximo 16.67ms (1 frame a 60fps)
    // Math.max(0, rawDt) garante que nunca seja negativo
    // Math.min(16.67, ...) garante que nunca ultrapasse 1 frame
    const dtMs = Math.min(16.67, Math.max(0, rawDt));
    
    // Atualiza o timestamp do último frame para o próximo ciclo
    animationLastFrameTs = ts;
    
    // Atualiza a animação do highlight (linha tracejada ao redor dos edifícios)
    // Calcula o tempo decorrido desde o início desta animação
    const elapsed = ts - animationStartTs;
    
    // Calcula o offset da linha tracejada (cicla de 0 a 100)
    // elapsed / 16 faz a animação mais rápida (quanto menor o divisor, mais rápido)
    // % 100 garante que o valor sempre fique entre 0 e 100
    dashOffset = (elapsed / 16) % 100;
    
    // Atualiza sistemas da cena que dependem do tempo total decorrido
    // Calcula o tempo total desde o início do sistema
    const elapsedTime = ts - animationStartTime;
    
    // Atualiza o ciclo dia/noite (muda a cor do céu)
    updateDayNightCycle(elapsedTime);
    
    // Atualiza as posições das nuvens (movimento contínuo)
    if (typeof updateClouds !== 'undefined') {
        updateClouds(dtMs);
    }
    
    // Spawna novo fumo das fábricas baseado no delta time
    spawnFactorySmoke(dtMs);
    
    // Atualiza a posição e movimento do autocarro
    updateBus(dtMs);
    
    // Atualiza o crescimento das plantas (apenas se o módulo trees.js estiver carregado)
    // typeof verifica se a função existe antes de chamá-la
    if (typeof updatePlantGrowth !== 'undefined') {
        // Passa o delta time para atualizar o crescimento gradualmente
        updatePlantGrowth(dtMs);
    }
    
    // Atualiza o boost de sorriso (apenas se o módulo faceDetection.js estiver carregado)
    if (typeof updateSmileBoost !== 'undefined') {
        // Passa o delta time para atualizar o boost gradualmente
        updateSmileBoost(dtMs);
    }

    // Verifica se deve continuar animando
    // Continua se: há um edifício destacado E painéis estão visíveis
    // OU se: há um painel sendo arrastado
    const shouldKeepAnimating = (highlightedBuildingIndex !== null && showPanelsCheckbox && showPanelsCheckbox.checked) || (draggedPanel && draggedPanel.isDragging);
    
    if (shouldKeepAnimating) {
        // Continua o loop de animação
        // Desenha a cena completa
        drawScene();
        
        // Atualiza e desenha os carros
        updateAndDrawCars(dtMs, ts);
        
        // Atualiza e desenha o fumo
        updateAndDrawSmoke(dtMs);
        
        // Solicita o próximo frame
        requestAnimationFrame(animationLoop);
    } else {
        // Para o loop de animação
        // Marca que a animação não está mais ativa
        animationActive = false;
        
        // Reseta os timestamps
        animationStartTs = null;
        animationLastFrameTs = 0;
        
        // Desenha uma última vez antes de parar
        drawScene();
        updateAndDrawCars(dtMs, ts);
        updateAndDrawSmoke(dtMs);
    }
}

/**
 * Desenha toda a cena na ordem correta (fundo para frente)
 * A ordem é importante para que elementos apareçam corretamente sobrepostos
 */
function drawScene() {
    // Limpa todo o canvas apagando o conteúdo anterior
    // clearRect(x, y, width, height) apaga uma área retangular
    // 0, 0, canvas.width, canvas.height apaga todo o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // === DESENHA O FUNDO (elementos mais distantes) ===
    // Desenha o céu com gradiente (muda de cor conforme o ciclo dia/noite)
    drawSky();
    
    // Desenha o sol (visível durante o dia)
    drawSun();
    
    // Desenha a lua (visível durante a noite)
    drawMoon();
    
    // Desenha as estrelas (visíveis durante a noite)
    drawStars();
    
    // Desenha todas as nuvens
    drawAllClouds();
    
    // === DESENHA ELEMENTOS DO MEIO (elementos intermediários) ===
    // Desenha as fábricas (edifícios industriais)
    drawFactories();
    
    // Desenha o chão (grama/terra)
    drawGround();
    
    // Desenha a estrada (onde os carros e autocarro circulam)
    drawRoad();
    
    // Desenha os jardins das fábricas (árvores e flores na frente das fábricas)
    // Esta função é chamada antes dos edifícios para que fiquem atrás
    drawPlants();
    
    // === DESENHA ELEMENTOS MÓVEIS ===
    // Desenha o autocarro se ele existir e estiver visível
    if (bus) drawBus(bus);
    
    // === DESENHA OS EDIFÍCIOS ===
    // Desenha todos os edifícios residenciais (casas)
    drawBuildings();
    
    // === DESENHA ÁRVORES ENTRE CASAS ===
    // Desenha as árvores entre as casas (chamada depois dos edifícios)
    // Isso garante que as árvores apareçam na frente dos edifícios
    // typeof verifica se a função existe (módulo trees.js pode não estar carregado)
    if (typeof drawTreesBetweenHousesFront !== 'undefined') {
        // Chama a função que desenha as árvores entre casas
        drawTreesBetweenHousesFront();
    }

    // === DESENHA HIGHLIGHT DO TELHADO ===
    // Verifica se deve desenhar o highlight (linha tracejada ao redor do telhado)
    // Condições: checkbox de painéis marcado E há um edifício destacado
    if (showPanelsCheckbox && showPanelsCheckbox.checked && highlightedBuildingIndex !== null) {
        // Obtém o edifício destacado usando o índice
        const b = buildings[highlightedBuildingIndex];
        
        // Verifica se o edifício existe (proteção contra erros)
        if (b) {
            // Desenha o highlight ao redor do telhado
            // dashOffset * 16 é o offset da linha tracejada (cria efeito de movimento)
            drawRoofHighlight(b, dashOffset * 16);
        }
    }

    // === DESENHA HIGHLIGHT DA ZONA DE RECICLAGEM ===
    // Verifica se deve desenhar a zona verde onde o contentor deve ser colocado
    // Condições: checkbox de reciclagem marcado E há um contentor sendo arrastado
    // A zona verde aparece entre o segundo e terceiro edifício
    if (showRecyclingCheckbox && showRecyclingCheckbox.checked && draggedBin && typeof drawRecyclingZoneHighlight !== 'undefined') {
        // Desenha a zona verde de highlight entre o segundo e terceiro edifício
        // dashOffset * 16 é o offset da linha tracejada (cria efeito de movimento)
        drawRecyclingZoneHighlight(dashOffset * 16);
    }

    // === DESENHA CONTENTORES DE RECICLAGEM ===
    // Desenha os contentores de reciclagem antes dos painéis solares
    // Verifica se o checkbox de reciclagem está marcado
    if (showRecyclingCheckbox && showRecyclingCheckbox.checked && typeof recyclingBins !== 'undefined') {
        // Itera sobre cada contentor no array
        recyclingBins.forEach(bin => {
            // Desenha cada contentor de reciclagem
            drawRecyclingBin(bin);
        });
    }

    // === DESENHA PAINÉIS SOLARES ===
    // Desenha os painéis solares por último para ficarem visíveis sobre tudo
    // Verifica se o checkbox de painéis está marcado
    if (showPanelsCheckbox && showPanelsCheckbox.checked) {
        // Itera sobre cada painel solar no array
        solarPanels.forEach(panel => {
            // Desenha cada painel solar
            drawSolarPanel(panel);
        });
    }
}

/**
 * Loop principal de animação
 * Executa continuamente e atualiza todos os sistemas da cena
 * Só atualiza animações se o animationLoop não estiver ativo (evita duplicação)
 */
function mainLoop(ts) {
    // Inicializa o timestamp do último frame na primeira execução
    // Se lastFrameTs ainda não foi definido, usa o timestamp atual
    if (!lastFrameTs) lastFrameTs = ts;
    
    // Inicializa o timestamp de início do sistema na primeira execução
    // animationStartTime é usado para calcular o tempo total decorrido
    if (!animationStartTime) animationStartTime = ts;
    
    // Calcula o delta time (tempo desde o último frame) em milissegundos
    // Math.min(50, ...) limita o delta time a no máximo 50ms
    // Isso evita saltos grandes na animação se o navegador pausar ou ficar lento
    const dtMs = Math.min(50, ts - lastFrameTs);
    
    // Atualiza o timestamp do último frame para o próximo ciclo
    lastFrameTs = ts;

    // Atualiza a animação do highlight (linha tracejada ao redor dos edifícios)
    // Inicializa o timestamp de início do highlight se ainda não foi definido
    if (animationStartTs === null) animationStartTs = ts;
    
    // Calcula o tempo decorrido desde o início da animação do highlight
    const elapsed = ts - animationStartTs;
    
    // Calcula o offset da linha tracejada (cicla de 0 a 100)
    // elapsed / 16 faz a animação mais rápida (quanto menor o divisor, mais rápido)
    // % 100 garante que o valor sempre fique entre 0 e 100
    dashOffset = (elapsed / 16) % 100;

    // === ATUALIZA SISTEMAS DA CENA ===
    // Calcula o tempo total decorrido desde o início do sistema
    const elapsedTime = ts - animationStartTime;
    
    // Atualiza o ciclo dia/noite (muda a cor do céu conforme o tempo)
    updateDayNightCycle(elapsedTime);
    
    // Atualiza as posições das nuvens (movimento contínuo)
    if (typeof updateClouds !== 'undefined') {
        updateClouds(dtMs);
    }
    
    // Spawna novo fumo das fábricas baseado no delta time
    spawnFactorySmoke(dtMs);
    
    // Atualiza a posição e movimento do autocarro
    updateBus(dtMs);
    
    // Só atualiza animações se o animationLoop não estiver ativo
    // Isso evita que sejam atualizadas duas vezes quando ambos os loops rodam
    // O animationLoop já atualiza esses sistemas durante interações
    if (!animationActive) {
        // Atualiza o crescimento das plantas (apenas se o módulo trees.js estiver carregado)
        // typeof verifica se a função existe antes de chamá-la
        if (typeof updatePlantGrowth !== 'undefined') {
            // Passa o delta time para atualizar o crescimento gradualmente
            updatePlantGrowth(dtMs);
        }
        
        // Atualiza o boost de sorriso (apenas se o módulo faceDetection.js estiver carregado)
        if (typeof updateSmileBoost !== 'undefined') {
            // Passa o delta time para atualizar o boost gradualmente
            updateSmileBoost(dtMs);
        }
    }
    
    // === DESENHA A CENA E ELEMENTOS DINÂMICOS ===
    // Desenha todos os elementos estáticos da cena (céu, edifícios, etc.)
    drawScene();
    
    // Atualiza posições dos carros e desenha eles
    // dtMs: delta time para movimento suave
    // ts: timestamp atual (pode ser usado para sincronização)
    updateAndDrawCars(dtMs, ts);
    
    // Atualiza posições do fumo e desenha ele
    // dtMs: delta time para movimento suave
    updateAndDrawSmoke(dtMs);
    
    // === CONTINUA O LOOP ===
    // Solicita ao navegador que execute mainLoop novamente no próximo frame
    // Isso cria um loop contínuo de animação
    requestAnimationFrame(mainLoop);
}

/**
 * Reseta todo o estado da animação para o estado inicial
 * Chamado quando o usuário pressiona 'R' ou quando necessário
 */
function resetAnimationState() {
    // Reseta variáveis de tempo e animação
    lastFrameTs = 0;
    animationStartTs = null;
    animationLastFrameTs = 0;
    animationStartTime = null;
    dashOffset = 0;

    // Desmarca checkboxes
    if (showPanelsCheckbox) {
        showPanelsCheckbox.checked = false;
    }
    if (showRecyclingCheckbox) {
        showRecyclingCheckbox.checked = false;
    }
    if (showBusCheckbox) {
        showBusCheckbox.checked = false;
    }

    // Reseta sistemas individuais
    if (typeof resetCars === 'function') {
        resetCars();
    }
    if (typeof resetSmoke === 'function') {
        resetSmoke();
    }
    if (typeof resetSolarPanels === 'function') {
        resetSolarPanels();
    }
    if (typeof resetRecyclingBins === 'function') {
        resetRecyclingBins();
    }
    if (typeof resetPlants === 'function') {
        resetPlants();
    }
    if (typeof initBus === 'function') {
        initBus();
        bus.visible = false;
        bus.autoDrive = false;
        bus.placedOnRoad = false;
    }

    // Reseta mitigação
    extraMitigation = 0.0;
    recalcMitigation();
    
    // Regenera estrelas e desenha cena inicial
    generateStars();
    drawScene();
}

