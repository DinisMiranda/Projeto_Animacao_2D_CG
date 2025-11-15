/**
 * SISTEMA DE MITIGAÇÃO DE POLUIÇÃO
 * 
 * Este módulo calcula o nível de mitigação baseado em:
 * - Painéis solares colocados corretamente nos telhados
 * - Contentores de reciclagem colocados na frente dos edifícios
 * - Autocarro colocado na estrada
 * - Deteção facial (sorriso acelera a transição)
 * 
 * A mitigação afeta:
 * - Quantidade e opacidade do fumo das fábricas
 * - Crescimento das árvores e flores
 * - Frequência de spawn de carros
 */

// Variáveis globais de mitigação
let mitigationFromPanels = 0;      // Mitigação dos painéis solares (0.1 por painel)
let mitigationFromRecycling = 0;  // Mitigação dos contentores de reciclagem (0.1 por conjunto)
let extraMitigation = 0;          // Mitigação extra (autocarro: 0.15, sorriso: 0.3)
let totalMitigation = 0;          // Mitigação total (máximo: 0.5 = 50%)

/**
 * Recalcula a mitigação total baseada nos painéis solares, reciclagem e mitigação extra
 * Cada painel solar colocado corretamente adiciona 0.1 (10%)
 * O conjunto de reciclagem colocado corretamente adiciona 0.1 (10%)
 * O autocarro na estrada adiciona 0.15 (15%)
 * O máximo total é 0.5 (50% de redução de poluição)
 */
function recalcMitigation() {
    // Usa reduce() para contar quantos painéis estão colocados corretamente
    // Para cada painel (p), se isPlacedCorrectly for true, adiciona 1 ao acumulador (acc)
    const placedPanelsCount = solarPanels.reduce((acc, p) => acc + (p.isPlacedCorrectly ? 1 : 0), 0);
    
    // Calcula a mitigação dos painéis: cada painel colocado adiciona 0.1 (10%)
    // Se houver 4 painéis colocados: 4 * 0.1 = 0.4 (40%)
    mitigationFromPanels = placedPanelsCount * 0.1;
    
    // Verifica se o conjunto de reciclagem está colocado corretamente
    // Verifica se o módulo de reciclagem está carregado
    let recyclingPlaced = false;
    if (typeof recyclingBins !== 'undefined' && recyclingBins.length > 0) {
        // Verifica se o único conjunto de reciclagem está colocado corretamente
        recyclingPlaced = recyclingBins[0].isPlacedCorrectly;
    }
    
    // Calcula a mitigação da reciclagem: o conjunto colocado adiciona 0.1 (10%)
    mitigationFromRecycling = recyclingPlaced ? 0.1 : 0.0;
    
    // Calcula a mitigação total somando painéis + reciclagem + mitigação extra (autocarro, sorriso)
    // Math.min() garante que nunca ultrapasse 0.5 (50% máximo)
    // Isso mantém a maior parte do fumo visível para efeito visual
    totalMitigation = Math.min(0.5, mitigationFromPanels + mitigationFromRecycling + extraMitigation);
}

