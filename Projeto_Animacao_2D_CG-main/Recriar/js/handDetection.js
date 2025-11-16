// ===== MÓDULO: DETECÇÃO DE EXPRESSÕES FACIAIS COM ML5.JS =====
// Substitui detecção de mão por análise de sorriso do utilizador
// O sorriso acelera a transição verde da cidade, simbolizando impacto positivo

// Variáveis globais
window.isHandDetectionEnabled = false; // Mantido por compatibilidade, agora para expressões faciais
let isDetecting = false;
let faceExpressions = null;
let userSmileIntensity = 0; // 0-1: intensidade do sorriso detectado
let faceDetected = false;
let faceml5 = null;
let detectionInterval = null;

// Elementos DOM
let webcamVideo, webcamPreview, webcamPreviewVideo, enableHandDetectionCheckbox;

// Debug
let debugCounter = 0;
let greenTransitionMultiplier = 1; // Multiplicador para acelerar transição verde (0.5 a 2.0)

// Inicializar DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOMElements);
} else {
    initDOMElements();
}

function initDOMElements() {
    console.log('Inicializando elementos DOM para detecção facial...');

    webcamVideo = document.getElementById('webcam-video');
    webcamPreview = document.getElementById('webcam-preview');
    webcamPreviewVideo = document.getElementById('webcam-preview-video');
    enableHandDetectionCheckbox = document.getElementById('enableHandDetection');

    // Obter referências aos checkboxes dos outros módulos
    showPanelsCheckbox = document.getElementById('showPanels');
    showRecyclingCheckbox = document.getElementById('showRecycling');

    console.log('Elementos encontrados:', {
        webcamVideo: !!webcamVideo,
        webcamPreview: !!webcamPreview,
        webcamPreviewVideo: !!webcamPreviewVideo,
        enableHandDetectionCheckbox: !!enableHandDetectionCheckbox
    });

    if (enableHandDetectionCheckbox) {
        enableHandDetectionCheckbox.addEventListener('change', async (e) => {
            console.log('Checkbox detecção facial mudou:', e.target.checked);
            window.isHandDetectionEnabled = e.target.checked;
            if (window.isHandDetectionEnabled) {
                await initFaceDetection();
            } else {
                stopFaceDetection();
            }
        });
    } else {
        console.error('Checkbox enableHandDetection não encontrado!');
    }
}

// Inicializa ML5 FaceApi
async function initFaceDetection() {
    try {
        // Aguardar ML5 estar disponível
        let attempts = 0;
        const maxAttempts = 50;

        while (typeof ml5 === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof ml5 === 'undefined') {
            console.error('ML5.js não está carregado. Tentando carregar manualmente...');

            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ml5@0.12.0/dist/ml5.min.js';
                script.onload = () => {
                    setTimeout(() => {
                        if (typeof ml5 !== 'undefined') {
                            console.log('ML5 carregado com sucesso!');
                            resolve();
                        } else {
                            reject(new Error('ML5 não disponível após carregamento'));
                        }
                    }, 500);
                };
                script.onerror = () => reject(new Error('Erro ao carregar ML5 do CDN'));
                document.head.appendChild(script);
            });
        }

        console.log('ML5 verificado! Versão:', ml5.version || 'desconhecida');
        console.log('Solicitando acesso à webcam...');

        // Solicitar acesso à webcam
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            console.log('✅ Acesso à webcam concedido!');
        } catch (mediaError) {
            console.error('❌ Erro ao aceder à webcam:', mediaError);
            let errorMsg = 'Não foi possível aceder à webcam. ';
            
            if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                errorMsg += 'Por favor, permita o acesso à câmara nas configurações do navegador.';
            } else if (mediaError.name === 'NotFoundError') {
                errorMsg += 'Nenhuma câmara foi encontrada.';
            } else if (mediaError.name === 'NotReadableError') {
                errorMsg += 'A câmara está a ser usada por outra aplicação.';
            } else {
                errorMsg += 'Erro: ' + mediaError.message;
            }
            
            alert(errorMsg);
            if (enableHandDetectionCheckbox) {
                enableHandDetectionCheckbox.checked = false;
            }
            window.isHandDetectionEnabled = false;
            return;
        }

        if (!webcamVideo) {
            console.error('Elemento webcam-video não encontrado!');
            alert('Erro: elemento de vídeo não encontrado.');
            if (enableHandDetectionCheckbox) {
                enableHandDetectionCheckbox.checked = false;
            }
            window.isHandDetectionEnabled = false;
            return;
        }

        webcamVideo.srcObject = stream;

        if (webcamPreviewVideo) {
            webcamPreviewVideo.srcObject = stream;
        }

        // Aguardar vídeos estarem prontos
        console.log('Aguardando vídeos estarem prontos...');
        await Promise.race([
            Promise.all([
                new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout webcam-video')), 5000);
                    webcamVideo.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        webcamVideo.play().then(() => {
                            console.log('✅ webcam-video pronto!');
                            resolve();
                        }).catch(reject);
                    };
                    webcamVideo.onerror = (e) => {
                        clearTimeout(timeout);
                        reject(new Error('Erro ao carregar webcam-video'));
                    };
                }),
                webcamPreviewVideo ? new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout preview')), 5000);
                    webcamPreviewVideo.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        webcamPreviewVideo.play().then(() => {
                            console.log('✅ webcam-preview-video pronto!');
                            resolve();
                        }).catch(reject);
                    };
                    webcamPreviewVideo.onerror = (e) => {
                        clearTimeout(timeout);
                        reject(new Error('Erro ao carregar preview'));
                    };
                }) : Promise.resolve()
            ]),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout geral vídeos')), 10000)
            )
        ]);

        await new Promise(resolve => setTimeout(resolve, 500));

        if (webcamVideo.videoWidth === 0 || webcamVideo.videoHeight === 0) {
            throw new Error('Vídeo não tem dimensões válidas');
        }

        console.log('📹 Dimensões do vídeo:', webcamVideo.videoWidth, 'x', webcamVideo.videoHeight);

        // Mostrar preview da webcam
        if (webcamPreview) {
            webcamPreview.classList.add('active');
        }

        console.log('Inicializando FaceApi do ML5.js...');

        // Inicializar detecção facial
        try {
            if (typeof ml5.faceApi === 'function') {
                console.log('Usando ml5.faceApi()');
                
                faceml5 = ml5.faceApi(webcamVideo, () => {
                    console.log('✅ FaceApi inicializado com sucesso!');
                    isDetecting = true;
                    startFaceDetection();
                });

                console.log('🎭 FaceApi configurado e pronto para detetar expressões!');
            } else {
                throw new Error('FaceApi não encontrado em ML5.js');
            }

        } catch (faceError) {
            console.error('Erro ao inicializar FaceApi:', faceError);
            throw new Error('Erro ao inicializar FaceApi: ' + faceError.message);
        }

    } catch (error) {
        console.error('❌ Erro completo ao inicializar detecção facial:', error);
        alert('Erro ao inicializar detecção facial: ' + error.message);

        // Limpar recursos
        if (webcamVideo && webcamVideo.srcObject) {
            const tracks = webcamVideo.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            webcamVideo.srcObject = null;
        }

        if (enableHandDetectionCheckbox) {
            enableHandDetectionCheckbox.checked = false;
        }
        window.isHandDetectionEnabled = false;
        isDetecting = false;
    }
}

// Função para detecção contínua de expressões faciais
function startFaceDetection() {
    if (detectionInterval) clearInterval(detectionInterval);

    console.log('🎬 Iniciando loop de detecção facial...');

    detectionInterval = setInterval(async () => {
        if (!window.isHandDetectionEnabled || !isDetecting || !faceml5) return;

        try {
            // Usar estimateFaces para obter detecções
            const predictions = await faceml5.estimateFaces(webcamVideo);
            
            if (predictions && predictions.length > 0) {
                processFaceData(predictions[0]);
            } else {
                faceDetected = false;
                userSmileIntensity = 0;
                greenTransitionMultiplier = 1;
            }
        } catch (e) {
            console.error('Erro na detecção facial:', e);
        }
    }, 100); // Atualizar a cada 100ms
}

// Processa dados da face para extrair expressões
function processFaceData(face) {
    try {
        if (!face) {
            faceDetected = false;
            userSmileIntensity = 0;
            greenTransitionMultiplier = 1;
            return;
        }

        faceDetected = true;

        // Extrair expressões da face
        const expressions = face.expressions || {};

        // Calcular intensidade do sorriso
        // ML5 FaceApi retorna: happy, sad, angry, fearful, disgusted, surprised, neutral
        let smileScore = 0;

        if (expressions.happy !== undefined) {
            smileScore = Math.max(smileScore, expressions.happy);
        }
        if (expressions.surprised !== undefined) {
            smileScore = Math.max(smileScore, expressions.surprised * 0.5); // Surpresa contribui menos
        }

        userSmileIntensity = Math.min(1, Math.max(0, smileScore));

        // Multiplicador de transição verde (0.5 a 2.0)
        // Sorriso forte = transição mais rápida (até 2x mais rápida)
        greenTransitionMultiplier = 0.5 + (userSmileIntensity * 1.5);

        // Debug - log ocasional
        if (Math.random() < 0.05) {
            console.log('😊 Expressões detectadas:', {
                happy: (expressions.happy || 0).toFixed(3),
                sad: (expressions.sad || 0).toFixed(3),
                angry: (expressions.angry || 0).toFixed(3),
                surprised: (expressions.surprised || 0).toFixed(3),
                smileIntensity: userSmileIntensity.toFixed(3),
                multiplier: greenTransitionMultiplier.toFixed(2)
            });
        }

    } catch (e) {
        console.error('Erro em processFaceData:', e);
        faceDetected = false;
        userSmileIntensity = 0;
        greenTransitionMultiplier = 1;
    }
}

// Função para parar detecção
function stopFaceDetection() {
    console.log('Parando detecção facial...');
    isDetecting = false;
    faceDetected = false;
    userSmileIntensity = 0;
    greenTransitionMultiplier = 1;

    // Ocultar preview da webcam
    if (webcamPreview) {
        webcamPreview.classList.remove('active');
    }

    // Parar intervalo de detecção
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }

    // Parar stream da webcam
    if (webcamVideo && webcamVideo.srcObject) {
        const tracks = webcamVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        webcamVideo.srcObject = null;
    }

    // Limpar preview video
    if (webcamPreviewVideo) {
        webcamPreviewVideo.srcObject = null;
    }

    faceml5 = null;
}

// ===== FUNÇÕES MANTIDAS PARA COMPATIBILIDADE =====
// Estas funções mantêm a interface para evitar quebras noutros módulos

function currentHandPosition() {
    // Não aplicável para detecção facial
    return null;
}

function isHandPinching() {
    // Não aplicável para detecção facial
    return false;
}

function updateHandDragging() {
    // Detecção facial não envolve arraste de objetos
    // Esta funcionalidade foi removida
}

function releaseDraggedObjects() {
    // Mantido para compatibilidade mas vazio
}

// Função para desenhar indicador visual no canvas (para debug/UI)
function drawHandIndicator() {
    drawFaceIndicator();
}

function drawFaceIndicator() {
    if (!window.isHandDetectionEnabled) {
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('DETECÇÃO FACIAL DESATIVADA', 10, 30);
        ctx.restore();
        return;
    }

    if (!faceDetected) {
        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('⏳ AGUARDANDO ROSTO...', 10, 30);
        ctx.restore();
        return;
    }

    ctx.save();

    // Posição da UI
    const barX = 20;
    const barY = 50;
    const barWidth = 250;
    const barHeight = 35;

    // ===== BARRA DE INTENSIDADE DO SORRISO =====
    // Fundo da barra
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Preenchimento baseado na intensidade do sorriso
    const fillWidth = barWidth * userSmileIntensity;
    const fillColor = `hsl(${120 * userSmileIntensity}, 100%, 50%)`; // Verde quando sorriso forte
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Borda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Texto principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('😊 SORRISO:', barX + 10, barY + 22);

    // Percentagem do sorriso
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`${(userSmileIntensity * 100).toFixed(0)}%`, barX + barWidth - 50, barY + 22);

    // ===== MULTIPLICADOR DE TRANSIÇÃO =====
    ctx.font = '11px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`Transição Verde: ${greenTransitionMultiplier.toFixed(2)}x`, barX + 10, barY + 48);

    // ===== MENSAGEM MOTIVACIONAL =====
    if (userSmileIntensity > 0.7) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#00ff00';
        ctx.fillText('🌱 Seu sorriso acelera a mudança! 🌍', barX + 10, barY + 70);
    }

    ctx.restore();
}