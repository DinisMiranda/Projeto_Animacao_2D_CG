// ===== MÓDULO: INTERAÇÕES E EVENTOS =====

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (e) => {
    const mousePos = getMousePos(e);

    if (showPanelsCheckbox && showPanelsCheckbox.checked) {
        for (let panel of solarPanels) {
            if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
                draggedPanel = panel;
                panel.isDragging = true;
                panel.dragOffsetX = mousePos.x - panel.x;
                panel.dragOffsetY = mousePos.y - panel.y;
                canvas.style.cursor = 'grabbing';
                highlightedBuildingIndex = panel.buildingIndex;
                if (!animationActive) startHighlightAnimation();
                return;
            }
        }
    }

    if (showBusCheckbox && showBusCheckbox.checked && bus && isPointInBus(mousePos.x, mousePos.y, bus)) {
        bus.isDragging = true;
        bus.dragOffsetX = mousePos.x - bus.x;
        bus.dragOffsetY = mousePos.y - bus.y;
        canvas.style.cursor = 'grabbing';
        return;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const mousePos = getMousePos(e);

    if (draggedPanel && draggedPanel.isDragging) {
        draggedPanel.x = mousePos.x - draggedPanel.dragOffsetX;
        draggedPanel.y = mousePos.y - draggedPanel.dragOffsetY;
        // Atualizar a posição correta e recalcular mitigação em tempo real durante o drag
        draggedPanel.isPlacedCorrectly = isPanelCorrectlyPlaced(draggedPanel);
        // Recalcular mitigação para todos os painéis para refletir mudanças em tempo real
        solarPanels.forEach(p => {
            if (p !== draggedPanel) {
                p.isPlacedCorrectly = isPanelCorrectlyPlaced(p);
            }
        });
        recalcMitigation();
        // Garantir que a animação continue rodando durante o drag
        if (!animationActive) {
            startHighlightAnimation();
        }
        // Não chamar drawScene() diretamente - deixar o animationLoop cuidar disso
        // Isso mantém a animação do highlight funcionando
    } else if (bus && bus.isDragging) {
        bus.x = mousePos.x - bus.dragOffsetX;
        bus.y = mousePos.y - bus.dragOffsetY;
        drawScene();
    } else if ((showPanelsCheckbox && showPanelsCheckbox.checked) || (showBusCheckbox && showBusCheckbox.checked)) {
        let overPanel = false;
        for (let panel of solarPanels) {
            if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
                overPanel = true;
                break;
            }
        }
        const overBus = isPointInBus(mousePos.x, mousePos.y, bus);
        canvas.style.cursor = (overPanel || overBus) ? 'grab' : 'default';
    }
});

canvas.addEventListener('mouseup', () => {
    if (draggedPanel) {
        draggedPanel.isDragging = false;
        draggedPanel = null;
        canvas.style.cursor = 'default';
        if (!highlightPinned) {
            highlightedBuildingIndex = null;
        }
        solarPanels.forEach(p => {
            p.isPlacedCorrectly = isPanelCorrectlyPlaced(p);
        });
        recalcMitigation();
        if (!animationActive) stopHighlightAnimationIfIdle();
        drawScene();
    }

    if (bus && bus.isDragging) {
        bus.isDragging = false;
        canvas.style.cursor = 'default';
        const r = getRoadRect();
        const centerY = bus.y;
        const onRoad = centerY >= r.y1 && centerY <= r.y2;
        bus.placedOnRoad = onRoad;
        if (onRoad) {
            bus.y = (r.y1 + r.y2) / 2 - 5;
        }
        extraMitigation = (showBusCheckbox && showBusCheckbox.checked && bus && bus.placedOnRoad) ? 0.15 : 0.0;
        recalcMitigation();
        drawScene();
    }
});

canvas.addEventListener('mouseleave', () => {
    if (draggedPanel) {
        draggedPanel.isDragging = false;
        draggedPanel = null;
        canvas.style.cursor = 'default';
    }
});

if (showPanelsCheckbox) {
    showPanelsCheckbox.addEventListener('change', () => {
        if (!showPanelsCheckbox.checked) {
            highlightedBuildingIndex = null;
            highlightPinned = false;
            solarPanels.forEach(p => p.isPlacedCorrectly = false);
            recalcMitigation();
        }
        drawScene();
    });
}

if (showBusCheckbox) {
    showBusCheckbox.addEventListener('change', () => {
        if (!bus) return;
        bus.visible = showBusCheckbox.checked;
        if (!bus.visible) {
            bus.isDragging = false;
            bus.placedOnRoad = false;
            extraMitigation = 0.0;
            recalcMitigation();
        } else {
            bus.x = 120;
            bus.y = canvas.height - 90;
        }
        drawScene();
    });
}

canvas.addEventListener('click', (e) => {
    if (!showPanelsCheckbox || !showPanelsCheckbox.checked) return;
    const mousePos = getMousePos(e);
    let clickedPanel = null;
    for (let panel of solarPanels) {
        if (isPointInPanel(mousePos.x, mousePos.y, panel)) {
            clickedPanel = panel;
            break;
        }
    }
    if (clickedPanel) {
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

