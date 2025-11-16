// ============================================================================
// MÓDULO: SISTEMA DE MITIGAÇÃO DE POLUIÇÃO
// ============================================================================
// Calcula o nível de mitigação baseado em ações do usuário
// A mitigação afeta: quantidade de fumo, crescimento de plantas, spawn de carros
// ============================================================================

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let mitigationFromPanels = 0;      // Mitigação dos painéis solares (0.1 = 10% por painel)
let mitigationFromRecycling = 0;   // Mitigação dos contentores (0.1 = 10% por conjunto)
let extraMitigation = 0;           // Mitigação extra (autocarro: 0.15, sorriso: 0.3)
let totalMitigation = 0;            // Mitigação total (máximo: 0.5 = 50%)

// ============================================================================
// CÁLCULO DE MITIGAÇÃO
// ============================================================================

/**
 * Recalcula a mitigação total baseada em todas as ações do usuário
 * 
 * Contribuições:
 * - Cada painel solar colocado corretamente: +10% (0.1)
 * - Conjunto de reciclagem colocado corretamente: +10% (0.1)
 * - Autocarro na estrada: +15% (0.15)
 * - Sorriso detectado: +30% (0.3) - temporário
 * 
 * Máximo total: 50% (0.5) - mantém fumo visível para efeito visual
 */
function recalcMitigation() {
    // ===== CONTAR PAINÉIS SOLARES COLOCADOS =====
    // Conta quantos painéis estão corretamente posicionados
    const placedPanelsCount = solarPanels.reduce((acc, p) => 
        acc + (p.isPlacedCorrectly ? 1 : 0), 0
    );
    
    // Cada painel colocado adiciona 10% de mitigação
    mitigationFromPanels = placedPanelsCount * 0.1;
    
    // ===== VERIFICAR RECICLAGEM =====
    // Verifica se o conjunto de reciclagem está colocado corretamente
    let recyclingPlaced = false;
    if (typeof recyclingBins !== 'undefined' && recyclingBins.length > 0) {
        recyclingPlaced = recyclingBins[0].isPlacedCorrectly;
    }
    
    // Conjunto de reciclagem colocado adiciona 10% de mitigação
    mitigationFromRecycling = recyclingPlaced ? 0.1 : 0.0;
    
    // ===== CALCULAR TOTAL =====
    // Soma todas as fontes de mitigação e limita a 50% máximo
    totalMitigation = Math.min(0.5, 
        mitigationFromPanels + 
        mitigationFromRecycling + 
        extraMitigation
    );
}
