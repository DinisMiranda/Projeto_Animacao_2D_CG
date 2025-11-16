// ============================================================================
// MÓDULO: CONFIGURAÇÃO INICIAL
// ============================================================================
// Define variáveis globais principais: canvas, contexto e controles da UI
// ============================================================================

// ============================================================================
// CANVAS E CONTEXTO
// ============================================================================

// Referência ao elemento canvas do HTML
let canvas, ctx;

// Inicializar canvas após DOM estar pronto
function initCanvas() {
    canvas = document.getElementById('canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        console.log('Canvas inicializado:', canvas.width, 'x', canvas.height);
    } else {
        console.error('Canvas não encontrado!');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvas);
} else {
    initCanvas();
}

// ============================================================================
// CONTROLES DA INTERFACE (CHECKBOXES)
// ============================================================================

// Checkbox que controla visibilidade dos painéis solares
let showPanelsCheckbox, showBusCheckbox, showRecyclingCheckbox;

// Inicializar controles após DOM estar pronto
function initControls() {
    showPanelsCheckbox = document.getElementById('showPanels');
    showBusCheckbox = document.getElementById('showBus');
    showRecyclingCheckbox = document.getElementById('showRecycling');
    console.log('Controles inicializados');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initControls);
} else {
    initControls();
}
