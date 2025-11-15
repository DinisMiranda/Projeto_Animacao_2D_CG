/**
 * INICIALIZAÇÃO DO PROJETO
 * Este arquivo é executado por último e inicia todos os sistemas
 */

// Chama a função initBus() que cria o objeto autocarro com posição e propriedades iniciais
initBus();

// Chama a função initSolarPanels() que cria um painel solar para cada edifício
initSolarPanels();

// Chama a função recalcMitigation() para calcular a mitigação inicial (garante que começa em 0)
recalcMitigation();

// Solicita ao navegador que execute a função mainLoop no próximo frame de animação
// Isso inicia o loop contínuo de animação
requestAnimationFrame(mainLoop);
