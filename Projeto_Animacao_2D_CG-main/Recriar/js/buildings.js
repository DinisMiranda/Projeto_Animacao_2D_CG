/**
 * MÓDULO: EDIFÍCIOS
 * Gerencia o desenho dos edifícios da cidade
 */

// Array com dados de cada edifício: posição X, largura (w) e altura (h)
// x: posição horizontal do edifício
// w: largura do edifício
// h: altura do edifício
const buildings = [
    {x: 80,  w: 120, h: 180},  // Edifício 1: posição X=80, largura 120px, altura 180px
    {x: 230, w: 100, h: 220},  // Edifício 2: posição X=230, largura 100px, altura 220px
    {x: 380, w: 160, h: 200},  // Edifício 3: posição X=380, largura 160px, altura 200px
    {x: 560, w: 130, h: 240}   // Edifício 4: posição X=560, largura 130px, altura 240px
];

// Array com 3 cores diferentes para os edifícios (alterna entre elas)
// Cores em hexadecimal: cinza escuro, cinza médio, cinza mais escuro
const colors = ['#445066', '#384356', '#2f3848'];

/**
 * Desenha uma janela com cantos arredondados e gradiente
 * @param {number} x - Posição X do canto superior esquerdo
 * @param {number} y - Posição Y do canto superior esquerdo
 * @param {number} width - Largura da janela
 * @param {number} height - Altura da janela
 */
function drawWindow(x, y, width, height) {
    // Inicia um novo caminho de desenho
    ctx.beginPath();
    
    // Desenha o canto superior esquerdo arredondado (arco de 180° a 270°)
    ctx.arc(x + 2, y + 2, 2, Math.PI, Math.PI * 1.5);
    
    // Linha do topo da janela (da esquerda para direita)
    ctx.lineTo(x + width - 2, y);
    
    // Desenha o canto superior direito arredondado (arco de 270° a 0°)
    ctx.arc(x + width - 2, y + 2, 2, Math.PI * 1.5, 0);
    
    // Linha do lado direito da janela (de cima para baixo)
    ctx.lineTo(x + width, y + height - 2);
    
    // Desenha o canto inferior direito arredondado (arco de 0° a 90°)
    ctx.arc(x + width - 2, y + height - 2, 2, 0, Math.PI * 0.5);
    
    // Linha da base da janela (da direita para esquerda)
    ctx.lineTo(x + 2, y + height);
    
    // Desenha o canto inferior esquerdo arredondado (arco de 90° a 180°)
    ctx.arc(x + 2, y + height - 2, 2, Math.PI * 0.5, Math.PI);
    
    // Fecha o caminho conectando o último ponto ao primeiro
    ctx.closePath();

    // Cria um gradiente linear diagonal (canto superior esquerdo para inferior direito)
    const windowGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    
    // Define a cor no início do gradiente (canto superior esquerdo - azul claro)
    windowGradient.addColorStop(0, '#87ceeb');
    
    // Define a cor no meio do gradiente (azul médio)
    windowGradient.addColorStop(0.5, '#5ba3d1');
    
    // Define a cor no final do gradiente (canto inferior direito - azul escuro)
    windowGradient.addColorStop(1, '#3a7ca5');
    
    // Aplica o gradiente como cor de preenchimento
    ctx.fillStyle = windowGradient;
    
    // Preenche a janela com o gradiente
    ctx.fill();

    // Define a cor da borda da janela (azul escuro)
    ctx.strokeStyle = '#2d4a5f';
    
    // Define a espessura da borda (2 pixels)
    ctx.lineWidth = 2;
    
    // Desenha a borda da janela
    ctx.stroke();

    // Inicia um novo caminho para desenhar as divisórias da janela (cruz)
    ctx.beginPath();
    
    // Linha vertical no meio da janela (de cima para baixo)
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    
    // Move para o início da linha horizontal (sem desenhar)
    ctx.moveTo(x, y + height / 2);
    
    // Linha horizontal no meio da janela (da esquerda para direita)
    ctx.lineTo(x + width, y + height / 2);
    
    // Define a cor das divisórias (mesma cor da borda)
    ctx.strokeStyle = '#2d4a5f';
    
    // Define a espessura das divisórias (1.5 pixels - mais fina que a borda)
    ctx.lineWidth = 1.5;
    
    // Desenha as divisórias
    ctx.stroke();

    // Inicia um novo caminho para desenhar o brilho/reflexo da janela
    ctx.beginPath();
    
    // Desenha um círculo pequeno no canto superior direito (simula reflexo de luz)
    // Posição: 70% da largura e 30% da altura, raio de 4 pixels
    ctx.arc(x + width * 0.7, y + height * 0.3, 4, 0, Math.PI * 2);
    
    // Fecha o caminho (círculo completo)
    ctx.closePath();
    
    // Define cor branca semi-transparente para o reflexo (40% de opacidade)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    
    // Preenche o círculo do reflexo
    ctx.fill();
}

/**
 * Desenha uma porta com cantos arredondados no topo
 * @param {number} x - Posição X do canto superior esquerdo
 * @param {number} y - Posição Y do canto superior esquerdo
 * @param {number} width - Largura da porta
 * @param {number} height - Altura da porta
 */
function drawDoor(x, y, width, height) {
    // Inicia um novo caminho de desenho
    ctx.beginPath();
    
    // Desenha o canto superior esquerdo arredondado (arco de 180° a 270°)
    ctx.arc(x + 3, y + 3, 3, Math.PI, Math.PI * 1.5);
    
    // Linha do topo da porta (da esquerda para direita)
    ctx.lineTo(x + width - 3, y);
    
    // Desenha o canto superior direito arredondado (arco de 270° a 0°)
    ctx.arc(x + width - 3, y + 3, 3, Math.PI * 1.5, 0);
    
    // Linha do lado direito da porta até a base
    ctx.lineTo(x + width, y + height);
    
    // Linha duplicada (mantida para compatibilidade)
    ctx.lineTo(x + width, y + height);
    
    // Linha da base da porta (da direita para esquerda)
    ctx.lineTo(x, y + height);
    
    // Linha do lado esquerdo da porta (de baixo para cima)
    ctx.lineTo(x, y);
    
    // Fecha o caminho
    ctx.closePath();

    // Cria um gradiente linear diagonal para dar profundidade à porta
    const doorGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    
    // Cor no início do gradiente (canto superior esquerdo - marrom claro)
    doorGradient.addColorStop(0, '#4a3a2a');
    
    // Cor no meio do gradiente (marrom médio)
    doorGradient.addColorStop(0.5, '#3d2f21');
    
    // Cor no final do gradiente (canto inferior direito - marrom escuro)
    doorGradient.addColorStop(1, '#2a1f15');
    
    // Aplica o gradiente como cor de preenchimento
    ctx.fillStyle = doorGradient;
    
    // Preenche a porta com o gradiente
    ctx.fill();

    // Define a cor da borda da porta (marrom muito escuro, quase preto)
    ctx.strokeStyle = '#1a1510';
    
    // Define a espessura da borda (2 pixels)
    ctx.lineWidth = 2;
    
    // Desenha a borda da porta
    ctx.stroke();

    // Inicia um novo caminho para desenhar a maçaneta
    ctx.beginPath();
    
    // Desenha um círculo pequeno no lado direito da porta (maçaneta dourada)
    // Posição: 85% da largura e 50% da altura, raio de 3 pixels
    ctx.arc(x + width * 0.85, y + height * 0.5, 3, 0, Math.PI * 2);
    
    // Fecha o caminho (círculo completo)
    ctx.closePath();
    
    // Define cor dourada para a maçaneta
    ctx.fillStyle = '#d4af37';
    
    // Preenche a maçaneta
    ctx.fill();

    // Inicia um novo caminho para desenhar o brilho/reflexo na porta
    ctx.beginPath();
    
    // Desenha um círculo maior no lado esquerdo (simula reflexo de luz)
    // Posição: 30% da largura e 30% da altura, raio de 6 pixels
    ctx.arc(x + width * 0.3, y + height * 0.3, 6, 0, Math.PI * 2);
    
    // Fecha o caminho (círculo completo)
    ctx.closePath();
    
    // Define cor branca semi-transparente para o reflexo (15% de opacidade)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    
    // Preenche o reflexo
    ctx.fill();
}

/**
 * Desenha todos os edifícios da cidade
 * Para cada edifício, desenha o corpo, janelas e porta
 */
function drawBuildings() {
    // Itera sobre cada edifício no array buildings
    // building: objeto com dados do edifício (x, w, h)
    // i: índice do edifício no array
    buildings.forEach((building, i) => {
        // Inicia um novo caminho para desenhar o corpo do edifício
        ctx.beginPath();
        
        // Move para o canto inferior esquerdo do edifício (no chão, Y=420)
        ctx.moveTo(building.x, 420);
        
        // Linha da base do edifício (da esquerda para direita)
        ctx.lineTo(building.x + building.w, 420);
        
        // Linha do lado direito do edifício (de baixo para cima)
        ctx.lineTo(building.x + building.w, 420 - building.h);
        
        // Linha do topo do edifício (da direita para esquerda)
        ctx.lineTo(building.x, 420 - building.h);
        
        // Fecha o caminho (conecta ao ponto inicial)
        ctx.closePath();
        
        // Seleciona a cor do edifício alternando entre as 3 cores disponíveis
        // i % 3 garante que sempre use um índice válido (0, 1 ou 2)
        ctx.fillStyle = colors[i % 3];
        
        // Preenche o edifício com a cor selecionada
        ctx.fill();

        // Define dimensões das janelas
        const windowWidth = 18;      // Largura de cada janela em pixels
        const windowHeight = 24;     // Altura de cada janela em pixels
        const windowSpacing = 8;     // Espaçamento entre janelas em pixels
        
        // Calcula quantas janelas cabem em uma linha (largura do edifício - margens de 20px)
        // Math.floor() arredonda para baixo para garantir número inteiro
        const windowsPerRow = Math.floor((building.w - 20) / (windowWidth + windowSpacing));
        
        // Calcula quantas linhas de janelas cabem (altura do edifício - margens de 60px)
        const numRows = Math.floor((building.h - 60) / (windowHeight + windowSpacing));

        // Calcula a largura total ocupada pelas janelas (incluindo espaçamentos)
        const totalWindowsWidth = windowsPerRow * windowWidth + (windowsPerRow - 1) * windowSpacing;
        
        // Calcula a posição X inicial para centralizar as janelas no edifício
        const startX = building.x + (building.w - totalWindowsWidth) / 2;
        
        // Calcula a altura total ocupada pelas janelas (incluindo espaçamentos)
        const totalWindowsHeight = numRows * windowHeight + (numRows - 1) * windowSpacing;
        
        // Calcula a posição Y inicial (20px abaixo do topo do edifício)
        const startY = 420 - building.h + 20;

        // Loop para desenhar cada linha de janelas
        for (let row = 0; row < numRows; row++) {
            // Loop para desenhar cada janela na linha
            for (let col = 0; col < windowsPerRow; col++) {
                // Calcula a posição X da janela atual (startX + colunas * (largura + espaçamento))
                const windowX = startX + col * (windowWidth + windowSpacing);
                
                // Calcula a posição Y da janela atual (startY + linhas * (altura + espaçamento))
                const windowY = startY + row * (windowHeight + windowSpacing);
                
                // Desenha a janela na posição calculada
                drawWindow(windowX, windowY, windowWidth, windowHeight);
            }
        }

        // Define dimensões da porta
        const doorWidth = 24;    // Largura da porta em pixels
        const doorHeight = 40;   // Altura da porta em pixels
        
        // Calcula a posição X da porta (centralizada no edifício)
        const doorX = building.x + (building.w - doorWidth) / 2;
        
        // Calcula a posição Y da porta (1 pixel acima do chão para ficar sobre a linha)
        const doorY = 419 - doorHeight;
        
        // Desenha a porta na posição calculada
        drawDoor(doorX, doorY, doorWidth, doorHeight);
    });
}

/**
 * Calcula a área retangular do telhado onde os painéis solares podem ser colocados
 * @param {Object} building - Objeto com dados do edifício (x, w, h)
 * @returns {Object} Retorna um objeto com x, y, w, h da área do telhado
 */
function getRoofTargetRect(building) {
    // Calcula a posição Y do topo do edifício (telhado)
    // 420 é a posição Y do chão, então 420 - altura = topo do edifício
    const roofY = 420 - building.h;
    
    // Padding horizontal (margem lateral) para não colar nas bordas
    const paddingX = 8;
    
    // Altura da zona de colocação (aumentada de 18 para 30 para facilitar o acerto)
    const zoneHeight = 30;
    
    // Posição X da área (edifício X + padding lateral)
    const x = building.x + paddingX;
    
    // Posição Y da área (4 pixels acima do telhado para dar espaço visual)
    const y = roofY - zoneHeight - 4;
    
    // Largura da área (largura do edifício - padding dos dois lados)
    const w = building.w - paddingX * 2;
    
    // Altura da área
    const h = zoneHeight;
    
    // Retorna um objeto com as coordenadas e dimensões da área
    return { x, y, w, h };
}

