/**
 * CONFIGURAÇÃO INICIAL
 * Define as variáveis globais principais do canvas e controles
 */

// Obtém referência ao elemento canvas do HTML pelo ID 'canvas'
const canvas = document.getElementById('canvas');

// Obtém o contexto 2D do canvas para poder desenhar nele
const ctx = canvas.getContext('2d');

// Obtém referência ao checkbox que controla a visibilidade dos painéis solares
const showPanelsCheckbox = document.getElementById('showPanels');

// Obtém referência ao checkbox que controla a visibilidade do autocarro
const showBusCheckbox = document.getElementById('showBus');

// Obtém referência ao checkbox que controla a visibilidade dos contentores de reciclagem
const showRecyclingCheckbox = document.getElementById('showRecycling');
