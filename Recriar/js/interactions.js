/**
 * SISTEMA DE INTERAÇÕES E EVENTOS
 * 
 * Este módulo gerencia todas as interações do usuário:
 * - Drag and drop de painéis solares
 * - Drag and drop do autocarro
 * - Detecção de colisão e posicionamento correto
 * - Atualização de mitigação em tempo real durante o drag
 * - Eventos de mouse (mousedown, mousemove, mouseup, click)
 * - Eventos de teclado (reset com 'R')
 */

/**
 * Converte coordenadas do mouse do espaço da página para o espaço do canvas
 */
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

/**
 * Evento: Mouse pressionado
 * Inicia o drag de painéis solares ou autocarro se o mouse estiver sobre eles
 */
canvas.addEventListener('mousedown', (e) => {
    const mousePos = getMousePos(e);

    // Verifica se clicou em um painel solar
    if (showPanelsCheckbox && showPanelsCheckbox.checked) {
        for (let panel of solarPanels) {
            if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
                draggedPanel = panel;
                panel.isDragging = true;
                // Guarda o offset para manter a posição relativa durante o drag
                panel.dragOffsetX = mousePos.x - panel.x;
                panel.dragOffsetY = mousePos.y - panel.y;
                canvas.style.cursor = 'grabbing';
                // Destaca o edifício correspondente
                highlightedBuildingIndex = panel.buildingIndex;
                // Inicia animação se necessário
                if (!animationActive) startHighlightAnimation();
                return;
            }
        }
    }

    // Verifica se clicou em um contentor de reciclagem
    if (showRecyclingCheckbox && showRecyclingCheckbox.checked && typeof recyclingBins !== 'undefined') {
        for (let bin of recyclingBins) {
            if (isPointInBin(mousePos.x, mousePos.y, bin)) {
                draggedBin = bin;
                bin.isDragging = true;
                bin.dragOffsetX = mousePos.x - bin.x;
                bin.dragOffsetY = mousePos.y - bin.y;
                canvas.style.cursor = 'grabbing';
                return;
            }
        }
    }

    // Verifica se clicou no autocarro
    if (showBusCheckbox && showBusCheckbox.checked && bus && isPointInBus(mousePos.x, mousePos.y, bus)) {
        bus.isDragging = true;
        bus.dragOffsetX = mousePos.x - bus.x;
        bus.dragOffsetY = mousePos.y - bus.y;
        bus.autoDrive = false;
        bus.placedOnRoad = false;
        // Remove mitigação do autocarro enquanto está sendo arrastado
        extraMitigation = 0.0;
        recalcMitigation();
        canvas.style.cursor = 'grabbing';
        return;
    }
});

/**
 * Evento: Mouse em movimento
 * Atualiza posição durante o drag e verifica se está sobre elementos interativos
 */
canvas.addEventListener('mousemove', (e) => {
    const mousePos = getMousePos(e);

    // Drag de painel solar
    if (draggedPanel && draggedPanel.isDragging) {
        // Atualiza posição do painel
        draggedPanel.x = mousePos.x - draggedPanel.dragOffsetX;
        draggedPanel.y = mousePos.y - draggedPanel.dragOffsetY;
        
        // Verifica se está na posição correta (no telhado)
        draggedPanel.isPlacedCorrectly = isPanelCorrectlyPlaced(draggedPanel);
        
        // Recalcula posição de todos os outros painéis
        solarPanels.forEach(p => {
            if (p !== draggedPanel) {
                p.isPlacedCorrectly = isPanelCorrectlyPlaced(p);
            }
        });
        
        // Recalcula mitigação em tempo real
        recalcMitigation();
        
        // Inicia animação se necessário
        if (!animationActive) {
            startHighlightAnimation();
        }
    }
    // Drag de contentor de reciclagem
    else if (draggedBin && draggedBin.isDragging) {
        draggedBin.x = mousePos.x - draggedBin.dragOffsetX;
        draggedBin.y = mousePos.y - draggedBin.dragOffsetY;
        draggedBin.isPlacedCorrectly = isBinCorrectlyPlaced(draggedBin);
        recyclingBins.forEach(b => {
            if (b !== draggedBin) {
                b.isPlacedCorrectly = isBinCorrectlyPlaced(b);
            }
        });
        recalcMitigation();
        drawScene();
    }
    // Drag de autocarro
    else if (bus && bus.isDragging) {
        bus.x = mousePos.x - bus.dragOffsetX;
        bus.y = mousePos.y - bus.dragOffsetY;
        
        // Verifica se está na estrada e atualiza mitigação
        const r = getRoadRect();
        const centerY = bus.y;
        const onRoad = centerY >= r.y1 && centerY <= r.y2;
        
        if (onRoad !== bus.placedOnRoad) {
            bus.placedOnRoad = onRoad;
            // Autocarro na estrada adiciona 15% de mitigação
            extraMitigation = (showBusCheckbox && showBusCheckbox.checked && bus && bus.placedOnRoad) ? 0.15 : 0.0;
            recalcMitigation();
        }
        drawScene();
    }
    // Hover sobre elementos interativos (muda cursor)
    else if ((showPanelsCheckbox && showPanelsCheckbox.checked) || 
             (showRecyclingCheckbox && showRecyclingCheckbox.checked) || 
             (showBusCheckbox && showBusCheckbox.checked)) {
        let overPanel = false;
        for (let panel of solarPanels) {
            if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
                overPanel = true;
                break;
            }
        }
        let overBin = false;
        if (typeof recyclingBins !== 'undefined') {
            for (let bin of recyclingBins) {
                if (isPointInBin(mousePos.x, mousePos.y, bin)) {
                    overBin = true;
                    break;
                }
            }
        }
        const overBus = isPointInBus(mousePos.x, mousePos.y, bus);
        canvas.style.cursor = (overPanel || overBin || overBus) ? 'grab' : 'default';
    }
});

/**
 * Evento: Mouse solto
 * Finaliza o drag e atualiza o estado final dos elementos
 */
canvas.addEventListener('mouseup', () => {
    // Finaliza drag de painel solar
    if (draggedPanel) {
        draggedPanel.isDragging = false;
        draggedPanel = null;
        canvas.style.cursor = 'default';
        
        // Remove highlight se não estiver fixado
        if (!highlightPinned) {
            highlightedBuildingIndex = null;
        }
        
        // Recalcula posição final de todos os painéis
        solarPanels.forEach(p => {
            p.isPlacedCorrectly = isPanelCorrectlyPlaced(p);
        });
        
        recalcMitigation();
        drawScene();
    }

    // Finaliza drag de contentor de reciclagem
    if (draggedBin) {
        draggedBin.isDragging = false;
        draggedBin = null;
        canvas.style.cursor = 'default';
        recyclingBins.forEach(b => {
            b.isPlacedCorrectly = isBinCorrectlyPlaced(b);
        });
        recalcMitigation();
        drawScene();
    }

    // Finaliza drag de autocarro
    if (bus && bus.isDragging) {
        bus.isDragging = false;
        canvas.style.cursor = 'default';
        
        // Verifica se foi solto na estrada
        const r = getRoadRect();
        const centerY = bus.y;
        const onRoad = centerY >= r.y1 && centerY <= r.y2;
        bus.placedOnRoad = onRoad;
        
        if (onRoad) {
            // Alinha o autocarro à faixa e ativa movimento automático
            alignBusToLane(centerY);
            bus.autoDrive = true;
        } else {
            bus.autoDrive = false;
        }
        
        // Atualiza mitigação baseado na posição final
        extraMitigation = (showBusCheckbox && showBusCheckbox.checked && bus && bus.placedOnRoad) ? 0.15 : 0.0;
        recalcMitigation();
        drawScene();
    }
});

/**
 * Evento: Mouse sai do canvas
 * Cancela o drag se o mouse sair do canvas durante o arrasto
 */
canvas.addEventListener('mouseleave', () => {
    if (draggedPanel) {
        draggedPanel.isDragging = false;
        draggedPanel = null;
        canvas.style.cursor = 'default';
    }
});

/**
 * Evento: Checkbox de painéis solares
 * Mostra/esconde painéis e reseta estado quando desmarcado
 */
if (showPanelsCheckbox) {
    showPanelsCheckbox.addEventListener('change', () => {
        if (!showPanelsCheckbox.checked) {
            // Quando desmarcado, reseta tudo
            highlightedBuildingIndex = null;
            highlightPinned = false;
            solarPanels.forEach(p => p.isPlacedCorrectly = false);
            recalcMitigation();
        }
        drawScene();
    });
}

/**
 * Evento: Checkbox de reciclagem
 * Mostra/esconde contentores de reciclagem e reseta estado quando desmarcado
 */
if (showRecyclingCheckbox) {
    showRecyclingCheckbox.addEventListener('change', () => {
        if (!showRecyclingCheckbox.checked && typeof recyclingBins !== 'undefined') {
            // Quando desmarcado, reseta tudo
            recyclingBins.forEach(b => b.isPlacedCorrectly = false);
            recalcMitigation();
        }
        drawScene();
    });
}

/**
 * Evento: Checkbox de autocarro
 * Mostra/esconde autocarro e atualiza mitigação baseado na posição inicial
 */
if (showBusCheckbox) {
    showBusCheckbox.addEventListener('change', () => {
        if (!bus) return;
        bus.visible = showBusCheckbox.checked;
        
        if (!bus.visible) {
            // Quando desmarcado, reseta estado
            bus.isDragging = false;
            bus.placedOnRoad = false;
            bus.autoDrive = false;
            extraMitigation = 0.0;
            recalcMitigation();
        } else {
            // Quando marcado, reposiciona e verifica se está na estrada
            bus.x = 120;
            bus.y = canvas.height - 90;
            bus.targetLaneY = bus.y;
            bus.autoDrive = false;
            bus.placedOnRoad = false;
            
            const r = getRoadRect();
            const centerY = bus.y;
            const onRoad = centerY >= r.y1 && centerY <= r.y2;
            
            if (onRoad) {
                bus.placedOnRoad = true;
                extraMitigation = 0.15;
            } else {
                extraMitigation = 0.0;
            }
            recalcMitigation();
        }
        drawScene();
    });
}

/**
 * Evento: Click no canvas
 * Permite fixar/destacar edifícios clicando nos painéis solares
 */
canvas.addEventListener('click', (e) => {
    if (!showPanelsCheckbox || !showPanelsCheckbox.checked) return;
    
    const mousePos = getMousePos(e);
    let clickedPanel = null;
    
    // Encontra o painel clicado
    for (let panel of solarPanels) {
        if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
            clickedPanel = panel;
            break;
        }
    }
    
    if (clickedPanel) {
        // Toggle do highlight (fixa/desfixa)
        if (highlightedBuildingIndex === clickedPanel.buildingIndex && highlightPinned) {
            highlightedBuildingIndex = null;
            highlightPinned = false;
        } else {
            highlightedBuildingIndex = clickedPanel.buildingIndex;
            highlightPinned = true;
            startHighlightAnimation();
        }
        drawScene();
    }
});

/**
 * Evento: Teclado
 * Pressionar 'R' reseta todo o estado da animação
 */
document.addEventListener('keydown', (e) => {
    if ((e.key && e.key.toLowerCase() === 'r') || e.code === 'KeyR') {
        resetAnimationState();
    }
});

