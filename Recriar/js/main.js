// ===== MÓDULO PRINCIPAL: INICIALIZAÇÃO =====

// Inicializa componentes que dependem do canvas
initBus();
initSolarPanels();

// Inicia animação contínua
requestAnimationFrame(mainLoop);

