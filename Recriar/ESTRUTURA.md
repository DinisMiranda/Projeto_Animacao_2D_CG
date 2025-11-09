# Estrutura do Projeto - Recriar

## Organização dos Módulos JavaScript

O projeto foi organizado em múltiplos ficheiros JavaScript para melhor manutenção e organização:

### 📁 js/config.js
- Define variáveis globais: `canvas`, `ctx`, `showPanelsCheckbox`, `showBusCheckbox`
- Carregado primeiro para disponibilizar essas variáveis para todos os outros módulos

### 📁 js/buildings.js
- **Edifícios**: Dados e funções relacionadas aos edifícios
- Funções: `drawBuildings()`, `drawWindow()`, `drawDoor()`, `getRoofTargetRect()`
- Dados: `buildings[]`, `colors[]`

### 📁 js/sky.js
- **Céu, Sol e Nuvens**: Elementos do céu
- Funções: `drawSky()`, `drawSun()`, `drawCloud()`, `drawAllClouds()`
- Dados: `cloudPositions[]`

### 📁 js/factories.js
- **Fábricas**: Fábricas distantes com chaminés
- Funções: `drawFactories()`
- Dados: `factoriesData[]`, `factoryChimneyOutlets[]`, `factoriesBaseY`

### 📁 js/smoke.js
- **Sistema de Partículas de Fumo**: Fumo das fábricas e dos carros
- Funções: `spawnFactorySmoke()`, `spawnCarSmoke()`, `updateAndDrawSmoke()`
- Dados: `smokeParticles[]`

### 📁 js/cars.js
- **Carros e Autocarro**: Veículos na estrada
- Funções: `initBus()`, `drawGround()`, `drawRoad()`, `drawBus()`, `spawnCar()`, `updateAndDrawCars()`, `getRoadRect()`, `isPointInBus()`
- Dados: `cars[]`, `bus`, `nextCarSpawnTs`, `baseExhaustInterval`

### 📁 js/mitigation.js
- **Sistema de Mitigação**: Cálculo da redução de poluição
- Funções: `recalcMitigation()`
- Dados: `mitigationFromPanels`, `extraMitigation`, `totalMitigation`

### 📁 js/solarPanels.js
- **Painéis Solares**: Painéis solares arrastáveis
- Funções: `initSolarPanels()`, `drawSolarPanel()`, `drawRoofHighlight()`, `isPanelCorrectlyPlaced()`, `isPointInPanel()`
- Dados: `solarPanels[]`, `draggedPanel`, `highlightedBuildingIndex`, `highlightPinned`

### 📁 js/animations.js
- **Animações e Loops**: Controlo de animações e loop principal
- Funções: `startHighlightAnimation()`, `stopHighlightAnimationIfIdle()`, `animationLoop()`, `drawScene()`, `mainLoop()`
- Dados: `lastFrameTs`, `animationActive`, `animationStartTs`, `dashOffset`

### 📁 js/interactions.js
- **Interações e Eventos**: Eventos de mouse e interações do utilizador
- Funções: `getMousePos()`
- Event Listeners: `mousedown`, `mousemove`, `mouseup`, `mouseleave`, `click`, `change` (checkboxes)

### 📁 js/main.js
- **Módulo Principal**: Inicialização do projeto
- Chama: `initBus()`, `initSolarPanels()`, `requestAnimationFrame(mainLoop)`

## Ordem de Carregamento

Os módulos são carregados na seguinte ordem no `index.html`:

1. `config.js` - Configuração inicial
2. `buildings.js` - Edifícios (usado por outros módulos)
3. `sky.js` - Céu
4. `factories.js` - Fábricas
5. `smoke.js` - Sistema de partículas
6. `cars.js` - Carros e autocarro
7. `mitigation.js` - Sistema de mitigação
8. `solarPanels.js` - Painéis solares (depende de `buildings.js`)
9. `animations.js` - Animações
10. `interactions.js` - Interações
11. `main.js` - Inicialização final

## Notas

- Todos os módulos compartilham as variáveis globais definidas em `config.js`
- A função `drawScene()` em `animations.js` chama todas as funções de desenho na ordem correta
- O loop principal `mainLoop()` em `animations.js` controla toda a animação
- As interações do utilizador são geridas em `interactions.js`

