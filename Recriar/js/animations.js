// ===== MÓDULO: ANIMAÇÕES E LOOPS =====

// ===== VARIÁVEIS DE ANIMAÇÃO CONTÍNUA =====
let lastFrameTs = 0;
let animationActive = false;
let animationStartTs = null;
let animationLastFrameTs = 0; // Para calcular dtMs no animationLoop
let dashOffset = 0;

// Timestamp de início da animação para o ciclo dia/noite (inicializado uma vez)
let animationStartTime = null;

function startHighlightAnimation() {
    if (!animationActive) {
        animationActive = true;
        animationStartTs = null;
        // Usar o timestamp atual do mainLoop se disponível, ou 0 para ser inicializado no primeiro frame
        // Isso evita saltos grandes no delta time quando o loop é iniciado
        if (lastFrameTs > 0) {
            animationLastFrameTs = lastFrameTs;
        } else {
            animationLastFrameTs = 0;
        }
        requestAnimationFrame(animationLoop);
    }
}

function stopHighlightAnimationIfIdle() {
    // O loop pára sozinho quando não há highlight ativo nem drag em curso
}

function animationLoop(ts) {
    if (!animationStartTime) animationStartTime = ts;
    if (animationStartTs === null) animationStartTs = ts;
    
    // Inicializar animationLastFrameTs no primeiro frame para evitar saltos grandes
    // Se estiver zerado ou muito antigo, usar o timestamp atual
    // IMPORTANTE: Se a diferença for muito grande, resetar para evitar aceleração
    if (!animationLastFrameTs || animationLastFrameTs === 0) {
        animationLastFrameTs = ts;
    } else if ((ts - animationLastFrameTs) > 50) {
        // Se passou mais de 50ms desde o último frame, resetar para evitar aceleração
        animationLastFrameTs = ts - 16.67; // Usar um delta time padrão de 1 frame
    }
    
    // Calcular delta time para animações
    // Limitar o delta time máximo para evitar saltos quando o loop é reiniciado
    // Usar um limite mais conservador (16.67ms = 1 frame a 60fps) para evitar aceleração
    const rawDt = ts - animationLastFrameTs;
    const dtMs = Math.min(16.67, Math.max(0, rawDt));
    animationLastFrameTs = ts;
    
    const elapsed = ts - animationStartTs;
    dashOffset = (elapsed / 16) % 100;
    
    // Sempre atualizar o ciclo dia/noite antes de desenhar
    const elapsedTime = ts - animationStartTime;
    updateDayNightCycle(elapsedTime);

    // Atualizar spawn de fumo (apenas atualiza estado, não desenha)
    spawnFactorySmoke(dtMs);
    updateBus(dtMs);
    
    // Atualizar crescimento gradual das plantas
    if (typeof updatePlantGrowth !== 'undefined') {
        updatePlantGrowth(dtMs);
    }
    
    // Atualizar boost de sorriso (deteção facial)
    if (typeof updateSmileBoost !== 'undefined') {
        updateSmileBoost(dtMs);
    }

    const shouldKeepAnimating = (highlightedBuildingIndex !== null && showPanelsCheckbox && showPanelsCheckbox.checked) || (draggedPanel && draggedPanel.isDragging);
    if (shouldKeepAnimating) {
        drawScene();
        // Desenhar carros e fumo DEPOIS do drawScene para que apareçam sobre a cena
        updateAndDrawCars(dtMs, ts);
        updateAndDrawSmoke(dtMs);
        requestAnimationFrame(animationLoop);
    } else {
        animationActive = false;
        animationStartTs = null;
        animationLastFrameTs = 0;
        drawScene();
        // Desenhar carros e fumo DEPOIS do drawScene para que apareçam sobre a cena
        updateAndDrawCars(dtMs, ts);
        updateAndDrawSmoke(dtMs);
    }
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSky();
    drawSun();
    drawMoon();
    drawStars();
    drawAllClouds();
    drawFactories();
    drawGround();
    drawRoad();
    drawPlants(); // Desenha jardins das fábricas (crescem conforme poluição diminui)
    if (bus) drawBus(bus);
    drawBuildings();
    // Desenhar árvores entre casas DEPOIS dos edifícios para ficarem na frente
    if (typeof drawTreesBetweenHousesFront !== 'undefined') {
        drawTreesBetweenHousesFront();
    }

    if (showPanelsCheckbox && showPanelsCheckbox.checked && highlightedBuildingIndex !== null) {
        const b = buildings[highlightedBuildingIndex];
        if (b) {
            // Usar dashOffset para a animação do highlight
            drawRoofHighlight(b, dashOffset * 16);
        }
    }

    if (showPanelsCheckbox && showPanelsCheckbox.checked) {
        solarPanels.forEach(panel => drawSolarPanel(panel));
    }
}

function mainLoop(ts) {
    if (!lastFrameTs) lastFrameTs = ts;
    if (!animationStartTime) animationStartTime = ts;
    
    const dtMs = Math.min(50, ts - lastFrameTs);
    lastFrameTs = ts;

    if (animationStartTs === null) animationStartTs = ts;
    const elapsed = ts - animationStartTs;
    dashOffset = (elapsed / 16) % 100;

    // Calcular tempo decorrido desde o início para o ciclo dia/noite
    const elapsedTime = ts - animationStartTime;

    // Sempre atualizar ciclo dia/noite antes de desenhar
    updateDayNightCycle(elapsedTime);

    spawnFactorySmoke(dtMs);
    updateBus(dtMs);
    
    // Só atualizar animações se o animationLoop NÃO estiver ativo
    // Isso evita duplicação de atualizações quando ambos os loops estão rodando
    if (!animationActive) {
        // Atualizar crescimento gradual das plantas
        if (typeof updatePlantGrowth !== 'undefined') {
            updatePlantGrowth(dtMs);
        }
        
        // Atualizar boost de sorriso (deteção facial)
        if (typeof updateSmileBoost !== 'undefined') {
            updateSmileBoost(dtMs);
        }
    }
    
    drawScene();
    updateAndDrawCars(dtMs, ts);
    updateAndDrawSmoke(dtMs);
    requestAnimationFrame(mainLoop);
}

function resetAnimationState() {
    lastFrameTs = 0;
    animationStartTs = null;
    animationLastFrameTs = 0;
    animationStartTime = null;
    dashOffset = 0;

    if (showPanelsCheckbox) {
        showPanelsCheckbox.checked = false;
    }
    if (showBusCheckbox) {
        showBusCheckbox.checked = false;
    }

    if (typeof resetCars === 'function') {
        resetCars();
    }
    if (typeof resetSmoke === 'function') {
        resetSmoke();
    }
    if (typeof resetSolarPanels === 'function') {
        resetSolarPanels();
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

    extraMitigation = 0.0;
    recalcMitigation();
    generateStars();
    drawScene();
}

