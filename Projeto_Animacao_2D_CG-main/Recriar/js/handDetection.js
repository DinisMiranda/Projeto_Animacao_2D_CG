// ===== MÓDULO: DETECÇÃO DE MÃO COM ML5.JS (VERSÃO CORRIGIDA) =====

// Variáveis globais
window.isHandDetectionEnabled = false;
let isDetecting = false;
let currentHandPosition = null;
let isHandPinching = false;
let handPose = null;
let wasPinching = false;
let lastMouseEventTime = 0;
let detectionLoopRunning = false;

// Elementos DOM
let webcamVideo, webcamPreview, webcamPreviewVideo, enableHandDetectionCheckbox;

// Debug
let debugCounter = 0;
let lastDebugLog = 0;

// ===== INICIALIZAÇÃO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOMElements);
} else {
    initDOMElements();
}

function initDOMElements() {
    console.log('🔧 Inicializando elementos DOM...');

    webcamVideo = document.getElementById('webcam-video');
    webcamPreview = document.getElementById('webcam-preview');
    webcamPreviewVideo = document.getElementById('webcam-preview-video');
    enableHandDetectionCheckbox = document.getElementById('enableHandDetection');

    if (enableHandDetectionCheckbox) {
        enableHandDetectionCheckbox.addEventListener('change', async (e) => {
            window.isHandDetectionEnabled = e.target.checked;
            if (window.isHandDetectionEnabled) {
                await initHandDetection();
            } else {
                stopHandDetection();
            }
        });
        console.log('✅ Checkbox configurado');
    } else {
        console.error('❌ Checkbox enableHandDetection não encontrado!');
    }
}

// ===== INICIALIZAR HANDPOSE =====
async function initHandDetection() {
    try {
        console.log('🚀 Iniciando deteção de mão...');

        // Verificar se ML5 está carregado
        if (typeof ml5 === 'undefined') {
            console.log('⏳ ML5 não está carregado, aguardando...');
            await waitForML5();
        }

        console.log('✅ ML5 disponível:', ml5.version || 'versão desconhecida');

        // Solicitar acesso à webcam
        console.log('📷 Solicitando acesso à webcam...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        });

        webcamVideo.srcObject = stream;
        if (webcamPreviewVideo) {
            webcamPreviewVideo.srcObject = stream;
        }

        // Aguardar vídeo estar pronto
        await new Promise((resolve) => {
            webcamVideo.onloadedmetadata = () => {
                webcamVideo.play().then(resolve);
            };
        });

        // Aguardar estabilização
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('📹 Vídeo pronto:', webcamVideo.videoWidth, 'x', webcamVideo.videoHeight);

        // Mostrar preview
        if (webcamPreview) {
            webcamPreview.classList.add('active');
        }

        // Inicializar HandPose
        console.log('🤖 Carregando modelo HandPose...');
        handPose = await ml5.handPose({
            maxHands: 1,
            flipped: true
        });

        console.log('✅ Modelo HandPose carregado!');

        // Começar deteção em loop
        isDetecting = true;
        startDetectionLoop();

    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
        alert('Erro ao inicializar deteção de mão: ' + error.message);
        
        if (enableHandDetectionCheckbox) {
            enableHandDetectionCheckbox.checked = false;
        }
        window.isHandDetectionEnabled = false;
        stopHandDetection();
    }
}

// Aguardar ML5 estar disponível
async function waitForML5() {
    let attempts = 0;
    const maxAttempts = 50;

    while (typeof ml5 === 'undefined' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (typeof ml5 === 'undefined') {
        throw new Error('ML5.js não está carregado. Verifique se o script está incluído na página.');
    }
}

// ===== LOOP DE DETEÇÃO =====
async function startDetectionLoop() {
    if (detectionLoopRunning) return;
    
    detectionLoopRunning = true;
    console.log('🔄 Iniciando loop de deteção...');

    const detect = async () => {
        if (!window.isHandDetectionEnabled || !isDetecting || !handPose) {
            detectionLoopRunning = false;
            return;
        }

        try {
            // Detetar mãos no vídeo
            const predictions = await handPose.detect(webcamVideo);
            
            // Processar resultados
            processHandPredictions(predictions);

        } catch (error) {
            // Silenciar erros menores
            if (Date.now() - lastDebugLog > 5000) {
                console.warn('⚠️ Erro na deteção:', error.message);
                lastDebugLog = Date.now();
            }
        }

        // Continuar loop
        requestAnimationFrame(detect);
    };

    detect();
}

// ===== PROCESSAR PREDIÇÕES =====
function processHandPredictions(predictions) {
    debugCounter++;

    // Log ocasional para debug
    if (debugCounter % 100 === 0) {
        console.log('📊 Predições:', predictions.length, 'mão(s) detetada(s)');
    }

    if (!predictions || predictions.length === 0) {
        // Nenhuma mão detetada
        currentHandPosition = null;
        isHandPinching = false;
        if (wasPinching) {
            simulateMouseUp();
            wasPinching = false;
        }
        return;
    }

    // Processar primeira mão detetada
    const hand = predictions[0];
    
    // ML5 HandPose retorna keypoints com estrutura {x, y, z, name}
    if (!hand.keypoints || hand.keypoints.length < 21) {
        console.warn('⚠️ Keypoints insuficientes:', hand.keypoints ? hand.keypoints.length : 0);
        return;
    }

    processHandKeypoints(hand.keypoints);
}

// ===== PROCESSAR KEYPOINTS DA MÃO =====
function processHandKeypoints(keypoints) {
    // Índices dos keypoints importantes:
    // 0: Pulso (wrist)
    // 4: Ponta do polegar
    // 8: Ponta do dedo indicador
    // 12: Ponta do dedo médio

    const wrist = keypoints[0];
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];

    if (!indexTip || !thumbTip || !wrist || !middleTip) {
        console.warn('⚠️ Keypoints essenciais em falta');
        return;
    }

    // Posição do cursor = ponta do dedo indicador
    const canvasWidth = canvas ? canvas.width : 1100;
    const canvasHeight = canvas ? canvas.height : 600;

    currentHandPosition = {
        x: indexTip.x * (canvasWidth / webcamVideo.videoWidth),
        y: indexTip.y * (canvasHeight / webcamVideo.videoHeight)
    };

    // Calcular distância entre polegar e indicador
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calcular tamanho da mão (distância pulso-dedo médio)
    const handDx = middleTip.x - wrist.x;
    const handDy = middleTip.y - wrist.y;
    const handSize = Math.sqrt(handDx * handDx + handDy * handDy);

    // Distância normalizada
    const normalizedDistance = distance / handSize;

    // Detetar pinça (threshold ajustável)
    const previousPinching = isHandPinching;
    isHandPinching = normalizedDistance < 0.12;

    // Debug ocasional
    if (debugCounter % 50 === 0) {
        console.log('🖐️', {
            pos: `(${Math.round(currentHandPosition.x)}, ${Math.round(currentHandPosition.y)})`,
            pinch: isHandPinching,
            dist: normalizedDistance.toFixed(3)
        });
    }

    // Simular eventos de mouse
    simulateMouseMove();

    // Detetar mudança de estado da pinça
    if (isHandPinching && !previousPinching && !wasPinching) {
        simulateMouseDown();
        wasPinching = true;
    } else if (!isHandPinching && wasPinching) {
        simulateMouseUp();
        wasPinching = false;
    }
}

// ===== SIMULAR EVENTOS DE MOUSE =====
function simulateMouseMove() {
    if (!currentHandPosition || !canvas) return;

    const now = Date.now();
    if (now - lastMouseEventTime < 16) return; // Limitar a ~60fps
    lastMouseEventTime = now;

    const rect = canvas.getBoundingClientRect();
    
    const event = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + currentHandPosition.x,
        clientY: rect.top + currentHandPosition.y,
        button: 0,
        buttons: isHandPinching ? 1 : 0
    });

    canvas.dispatchEvent(event);
}

function simulateMouseDown() {
    if (!currentHandPosition || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + currentHandPosition.x,
        clientY: rect.top + currentHandPosition.y,
        button: 0,
        buttons: 1
    });

    canvas.dispatchEvent(event);
    console.log('🖱️ MOUSEDOWN simulado');
}

function simulateMouseUp() {
    if (!currentHandPosition || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    const event = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + currentHandPosition.x,
        clientY: rect.top + currentHandPosition.y,
        button: 0,
        buttons: 0
    });

    canvas.dispatchEvent(event);
    console.log('🖱️ MOUSEUP simulado');
}

// ===== PARAR DETEÇÃO =====
function stopHandDetection() {
    console.log('🛑 Parando deteção de mão...');
    
    isDetecting = false;
    detectionLoopRunning = false;
    currentHandPosition = null;
    isHandPinching = false;
    wasPinching = false;

    // Ocultar preview
    if (webcamPreview) {
        webcamPreview.classList.remove('active');
    }

    // Parar stream
    if (webcamVideo && webcamVideo.srcObject) {
        webcamVideo.srcObject.getTracks().forEach(track => track.stop());
        webcamVideo.srcObject = null;
    }

    if (webcamPreviewVideo) {
        webcamPreviewVideo.srcObject = null;
    }

    handPose = null;

    // Soltar objetos arrastados
    if (typeof window.releaseDraggedObjects === 'function') {
        window.releaseDraggedObjects();
    }

    console.log('✅ Deteção parada');
}

// ===== DESENHAR INDICADOR VISUAL =====
function drawHandIndicator() {
    if (!ctx) return;

    if (!window.isHandDetectionEnabled) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('❌ DETEÇÃO DESATIVADA', 10, 30);
        ctx.restore();
        return;
    }

    if (!currentHandPosition) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('🖐️ AGUARDANDO MÃO...', 10, 30);
        ctx.restore();
        return;
    }

    ctx.save();

    // Círculo na posição do dedo indicador
    const radius = isHandPinching ? 15 : 10;
    const color = isHandPinching ? '#00ff00' : '#ff0000';

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(currentHandPosition.x, currentHandPosition.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Borda branca
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto de estado
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const text = isHandPinching ? '🤏 PINÇA' : '👆 SOLTO';
    ctx.strokeText(text, currentHandPosition.x + 20, currentHandPosition.y - 5);
    ctx.fillText(text, currentHandPosition.x + 20, currentHandPosition.y - 5);

    // Coordenadas
    ctx.font = '10px Arial';
    ctx.fillStyle = '#ffff00';
    const coords = `(${Math.round(currentHandPosition.x)}, ${Math.round(currentHandPosition.y)})`;
    ctx.fillText(coords, currentHandPosition.x + 20, currentHandPosition.y + 10);

    ctx.restore();
}

// ===== ATUALIZAR ARRASTE COM A MÃO =====
function updateHandDragging() {
    if (!window.isHandDetectionEnabled || !currentHandPosition) {
        if (wasPinching) {
            wasPinching = false;
        }
        return;
    }

    // Os eventos de mouse já são simulados em processHandKeypoints
    // Esta função pode ser chamada no loop principal se necessário
}

// Exportar funções principais
window.drawHandIndicator = drawHandIndicator;
window.updateHandDragging = updateHandDragging;
window.stopHandDetection = stopHandDetection;