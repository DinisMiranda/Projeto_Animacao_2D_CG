// ===== MÓDULO: ANIMAÇÕES E LOOPS =====

// ===== VARIÁVEIS DE ANIMAÇÃO CONTÍNUA =====
let lastFrameTs = 0;
let animationActive = false;
let animationStartTs = null;
let dashOffset = 0;

// Timestamp de início da animação para o ciclo dia/noite (inicializado uma vez)
let animationStartTime = null;

function startHighlightAnimation() {
    if (!animationActive) {
        animationActive = true;
        animationStartTs = null;
        requestAnimationFrame(animationLoop);
    }
}

function stopHighlightAnimationIfIdle() {
    // O loop pára sozinho quando não há highlight ativo nem drag em curso
}

function animationLoop(ts) {
    if (!animationStartTime) animationStartTime = ts;
    if (animationStartTs === null) animationStartTs = ts;
    
    const elapsed = ts - animationStartTs;
    dashOffset = (elapsed / 16) % 100;
    
    // Sempre atualizar o ciclo dia/noite antes de desenhar
    const elapsedTime = ts - animationStartTime;
    updateDayNightCycle(elapsedTime);

    const shouldKeepAnimating = (highlightedBuildingIndex !== null && showPanelsCheckbox && showPanelsCheckbox.checked) || (draggedPanel && draggedPanel.isDragging);
    if (shouldKeepAnimating) {
        drawScene();
        requestAnimationFrame(animationLoop);
    } else {
        animationActive = false;
        animationStartTs = null;
        drawScene();
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
    if (bus) drawBus(bus);
    drawBuildings();

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
    drawScene();
    updateAndDrawCars(dtMs, ts);
    updateAndDrawSmoke(dtMs);
    requestAnimationFrame(mainLoop);
}

