// ===== MÓDULO: SISTEMA DE MITIGAÇÃO =====

// ===== MITIGAÇÃO (paineis solares reduzem levemente o fumo) =====
let mitigationFromPanels = 0;
let extraMitigation = 0;
let totalMitigation = 0;

function recalcMitigation() {
    const placedCount = solarPanels.reduce((acc, p) => acc + (p.isPlacedCorrectly ? 1 : 0), 0);
    mitigationFromPanels = placedCount * 0.15;
    totalMitigation = Math.min(0.75, mitigationFromPanels + extraMitigation);
}

