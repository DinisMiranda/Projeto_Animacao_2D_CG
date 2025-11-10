// ===== MÓDULO: SISTEMA DE MITIGAÇÃO =====

// ===== MITIGAÇÃO (paineis solares reduzem significativamente o fumo) =====
let mitigationFromPanels = 0;
let extraMitigation = 0;
let totalMitigation = 0;

function recalcMitigation() {
    const placedCount = solarPanels.reduce((acc, p) => acc + (p.isPlacedCorrectly ? 1 : 0), 0);
    // Reduzido para 0.1 por painel - efeito mais sutil e gradual
    mitigationFromPanels = placedCount * 0.1;
    // Máximo de 0.4 (40%) - redução sutil, mantém a maior parte do fumo
    totalMitigation = Math.min(0.4, mitigationFromPanels + extraMitigation);
}

