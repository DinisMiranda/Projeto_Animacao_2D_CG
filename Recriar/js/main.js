// ===== MÓDULO PRINCIPAL: INICIALIZAÇÃO =====

// Inicializa componentes que dependem do canvas
initBus();
initSolarPanels();

// Inicializa a mitigação (garante que totalMitigation comece com 0)
recalcMitigation();

// Inicia animação contínua
requestAnimationFrame(mainLoop);

