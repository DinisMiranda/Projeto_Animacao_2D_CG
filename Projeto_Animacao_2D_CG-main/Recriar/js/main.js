// ============================================================================
// MÓDULO: INICIALIZAÇÃO DO PROJETO
// ============================================================================
// Este arquivo é executado por último e inicia todos os sistemas do projeto
// ============================================================================

// ============================================================================
// INICIALIZAÇÃO DOS SISTEMAS
// ============================================================================

// Inicializa o autocarro
initBus();

// Inicializa os painéis solares (um para cada edifício)
initSolarPanels();

// Inicializa os contentores de reciclagem
if (typeof initRecyclingBins === 'function') {
    initRecyclingBins();
}

// Calcula a mitigação inicial (garante que começa em 0)
recalcMitigation();

// ============================================================================
// INICIAR LOOP DE ANIMAÇÃO
// ============================================================================

// Solicita ao navegador que execute mainLoop no próximo frame
// Isso inicia o loop contínuo de animação
requestAnimationFrame(mainLoop);
