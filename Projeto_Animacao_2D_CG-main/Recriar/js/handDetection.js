// ===== MÓDULO: DETECÇÃO DE MÃO COM ML5.JS =====

// Variáveis globais
window.isHandDetectionEnabled = false;
let isDetecting = false;
let currentHandPosition = null;
let isHandPinching = false;
let manualDetectionInterval = null;
let handPose = null;

// Elementos DOM
let webcamVideo, webcamPreview, webcamPreviewVideo, enableHandDetectionCheckbox;

// Debug
let debugCounter = 0;

// Garantir acesso às variáveis globais dos outros módulos
// Essas variáveis são definidas em solarPanels.js e recycling.js
// Removido declarações locais para evitar conflitos - usar as globais dos outros módulos

// Inicializar DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOMElements);
} else {
    initDOMElements();
}

function initDOMElements() {
    console.log('Inicializando elementos DOM para hand detection...');

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
        enableHandDetectionCheckbox: !!enableHandDetectionCheckbox,
        showPanelsCheckbox: !!showPanelsCheckbox,
        showRecyclingCheckbox: !!showRecyclingCheckbox
    });

    if (enableHandDetectionCheckbox) {
        enableHandDetectionCheckbox.addEventListener('change', async (e) => {
            console.log('Checkbox hand detection mudou:', e.target.checked);
            window.isHandDetectionEnabled = e.target.checked;
            if (window.isHandDetectionEnabled) {
                await initHandDetection();
            } else {
                stopHandDetection();
            }
        });
        console.log('Listener adicionado ao checkbox');
    } else {
        console.error('Checkbox enableHandDetection não encontrado!');
    }
}

// Inicializa ML5 HandPose
async function initHandDetection() {
    try {
        // Aguardar ML5 estar disponível (pode levar um tempo para carregar)
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos (50 * 100ms)

        while (typeof ml5 === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        // Verificar se ML5 está disponível
        if (typeof ml5 === 'undefined') {
            console.error('ML5.js não está carregado após aguardar.');
            console.error('Verificando se o script ML5 está no DOM...');
            const ml5Scripts = document.querySelectorAll('script[src*="ml5"]');
            console.log('Scripts ML5 encontrados:', ml5Scripts.length);
            ml5Scripts.forEach((script, i) => {
                console.log(`Script ${i}:`, script.src, 'loaded:', script.complete || script.readyState === 'complete');
            });

            console.error('Tentando carregar ML5 manualmente...');

            // Tentar carregar manualmente
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/ml5@0.22.2/dist/ml5.min.js';
                    script.onload = () => {
                        // Aguardar um pouco mais para ML5 estar disponível
                        setTimeout(() => {
                            if (typeof ml5 !== 'undefined') {
                                console.log('ML5 carregado manualmente com sucesso!');
                                resolve();
                            } else {
                                reject(new Error('ML5 não disponível após carregar'));
                            }
                        }, 500);
                    };
                    script.onerror = (error) => {
                        console.error('Erro no evento onerror do script:', error);
                        reject(new Error('Erro ao carregar ML5 do CDN'));
                    };
                    document.head.appendChild(script);
                });
            } catch (error) {
                console.error('Erro ao carregar ML5 manualmente:', error);
                alert('ML5.js não está carregado. Verifique a conexão à internet e tente recarregar a página.\n\nErro: ' + error.message);
                if (enableHandDetectionCheckbox) {
                    enableHandDetectionCheckbox.checked = false;
                }
                return;
            }
        }

        // Verificação final
        if (typeof ml5 === 'undefined') {
            console.error('ML5 ainda não está disponível após todas as tentativas!');
            alert('Não foi possível carregar ML5.js. Por favor:\n1. Verifique a conexão à internet\n2. Recarregue a página (Ctrl+F5)\n3. Verifique o console para mais detalhes');
            if (enableHandDetectionCheckbox) {
                enableHandDetectionCheckbox.checked = false;
            }
            return;
        }

        console.log('ML5 verificado e disponível! Versão:', ml5.version || 'desconhecida');

        console.log('Solicitando acesso à webcam...');

        // Solicitar acesso à webcam
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user' // Usar câmara frontal
                }
            });
            console.log('Acesso à webcam concedido!');
        } catch (mediaError) {
            console.error('Erro ao aceder à webcam:', mediaError);
            let errorMsg = 'Não foi possível aceder à webcam. ';
            if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                errorMsg += 'Por favor, permita o acesso à câmara nas configurações do navegador.';
            } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
                errorMsg += 'Nenhuma câmara foi encontrada.';
            } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
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

        // Conectar o mesmo stream ao preview visível
        if (webcamPreviewVideo) {
            webcamPreviewVideo.srcObject = stream;
        }

        // Aguardar os vídeos estarem prontos com timeout
        console.log('Aguardando vídeos estarem prontos...');
        await Promise.race([
            Promise.all([
                new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout aguardando webcam-video'));
                    }, 5000);
                    webcamVideo.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        webcamVideo.play().then(() => {
                            console.log('webcam-video pronto!');
                            resolve();
                        }).catch(reject);
                    };
                    webcamVideo.onerror = (e) => {
                        clearTimeout(timeout);
                        reject(new Error('Erro ao carregar webcam-video: ' + e));
                    };
                }),
                webcamPreviewVideo ? new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout aguardando webcam-preview-video'));
                    }, 5000);
                    webcamPreviewVideo.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        webcamPreviewVideo.play().then(() => {
                            console.log('webcam-preview-video pronto!');
                            resolve();
                        }).catch(reject);
                    };
                    webcamPreviewVideo.onerror = (e) => {
                        clearTimeout(timeout);
                        reject(new Error('Erro ao carregar webcam-preview-video: ' + e));
                    };
                }) : Promise.resolve()
            ]),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout aguardando vídeos')), 10000)
            )
        ]);

        // Aguardar um pouco mais para garantir que o vídeo está realmente a reproduzir
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar se o vídeo tem dimensões válidas
        if (webcamVideo.videoWidth === 0 || webcamVideo.videoHeight === 0) {
            throw new Error('Vídeo não tem dimensões válidas. videoWidth: ' + webcamVideo.videoWidth + ', videoHeight: ' + webcamVideo.videoHeight);
        }

        console.log('Dimensões do vídeo:', webcamVideo.videoWidth, 'x', webcamVideo.videoHeight);

        // Mostrar preview da webcam
        if (webcamPreview) {
            webcamPreview.classList.add('active');
        }

        console.log('Inicializando HandPose...');
        console.log('ML5 disponível:', typeof ml5 !== 'undefined');
        if (typeof ml5 !== 'undefined') {
            const allFunctions = Object.keys(ml5 || {}).filter(k => typeof ml5[k] === 'function');
            console.log('Todas as funções ML5 disponíveis:', allFunctions);
            console.log('Funções relacionadas a mão:', allFunctions.filter(k => k.toLowerCase().includes('hand')));
        }

        // Inicializar HandPose do ML5.js
        // Tentar diferentes formas de inicializar dependendo da versão
        try {
            // Tentar ml5.handPose (com P maiúsculo, versão mais recente - async)
            if (typeof ml5.handPose === 'function') {
                console.log('Usando ml5.handPose() (async)');
                handPose = await ml5.handPose(webcamVideo, {
                    flipHorizontal: true
                });
                console.log('HandPose inicializado com sucesso!');
                isDetecting = true;

                // Para versão mais recente, usar detecção manual diretamente
                console.log('Iniciando detecção manual para versão mais recente...');
                startManualDetection();
            }
            // Tentar ml5.handpose (versão antiga)
            else if (typeof ml5.handpose === 'function') {
                console.log('Usando ml5.handpose()');
                handPose = ml5.handpose(webcamVideo, {
                    flipHorizontal: true
                }, () => {
                    console.log('HandPose inicializado com sucesso!');
                    isDetecting = true;
                });

                if (handPose && typeof handPose.on === 'function') {
                    console.log('✅ Registrando listener predict (ml5.handpose)...');
                    handPose.on('predict', (results) => {
                        console.log('📢 Evento predict recebido (ml5.handpose)!', results);
                        gotHands(results);
                    });
                    console.log('HandPose configurado e pronto para detetar!');
                } else {
                    console.warn('handPose.on não disponível, tentando detectStart ou detecção manual...');
                    if (handPose && typeof handPose.detectStart === 'function') {
                        console.log('Usando detectStart...');
                        handPose.detectStart(webcamVideo, gotHands);
                    } else {
                        console.log('Iniciando detecção manual como fallback...');
                        startManualDetection();
                    }
                }
            }
            // Tentar usar MediaPipe Hands diretamente
            else if (typeof ml5.hands === 'function' || typeof ml5.Hands === 'function') {
                console.log('Tentando usar ml5.hands ou ml5.Hands...');
                const handsFunction = ml5.hands || ml5.Hands;
                handPose = await handsFunction(webcamVideo, {
                    flipHorizontal: true
                });
                console.log('Hands inicializado com sucesso!');
                isDetecting = true;

                if (handPose && typeof handPose.on === 'function') {
                    console.log('✅ Registrando listener predict (ml5.hands)...');
                    handPose.on('predict', (results) => {
                        console.log('📢 Evento predict recebido (ml5.hands)!', results);
                        gotHands(results);
                    });
                } else {
                    console.warn('handPose.on não disponível para ml5.hands, tentando detecção manual...');
                    startManualDetection();
                }
            }
            // Se nenhuma função de mão estiver disponível, usar MediaPipe Hands diretamente via TensorFlow.js
            else {
                console.warn('Nenhuma função de detecção de mão encontrada no ML5. Tentando usar MediaPipe Hands diretamente...');

                // Carregar MediaPipe Hands
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
                document.head.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Não foi possível carregar MediaPipe Hands'));
                    setTimeout(() => reject(new Error('Timeout carregando MediaPipe')), 10000);
                });

                // Usar MediaPipe Hands diretamente
                const hands = new Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                    }
                });

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                hands.onResults((results) => {
                    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        // Converter formato MediaPipe para formato esperado
                        const hand = {
                            landmarks: results.multiHandLandmarks[0].map(lm => [lm.x * webcamVideo.videoWidth, lm.y * webcamVideo.videoHeight, lm.z])
                        };
                        gotHands([hand]);
                    } else {
                        gotHands([]);
                    }
                });

                // Processar frames
                const camera = new Camera(webcamVideo, {
                    onFrame: async () => {
                        await hands.send({image: webcamVideo});
                    },
                    width: webcamVideo.videoWidth,
                    height: webcamVideo.videoHeight
                });
                camera.start();

                handPose = { hands, camera }; // Guardar referências
                isDetecting = true;
                console.log('MediaPipe Hands configurado e pronto para detetar!');
            }

            if (!handPose) {
                throw new Error('Não foi possível inicializar detecção de mão');
            }

        } catch (handposeError) {
            console.error('Erro ao inicializar HandPose:', handposeError);
            console.error('Tipo do erro:', handposeError.constructor.name);
            console.error('Stack:', handposeError.stack);

            // Mostrar funções disponíveis para debug
            if (typeof ml5 !== 'undefined') {
                const availableFunctions = Object.keys(ml5 || {}).filter(k => typeof ml5[k] === 'function');
                console.error('Funções ML5 disponíveis:', availableFunctions);
            }

            throw new Error('Erro ao inicializar HandPose: ' + handposeError.message);
        }

    } catch (error) {
        console.error('Erro completo ao inicializar deteção de mão:', error);
        console.error('Stack trace:', error.stack);

        let errorMessage = 'Erro ao inicializar deteção de mão. ';
        if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Por favor, verifique a consola do navegador para mais detalhes.';
        }

        alert(errorMessage);

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

// Função para detecção manual em loop (fallback se eventos não funcionarem)
async function startManualDetection() {
    if (manualDetectionInterval) clearInterval(manualDetectionInterval);

    manualDetectionInterval = setInterval(async () => {
        if (!window.isHandDetectionEnabled || !isDetecting || !handPose) return;

        try {
            let results = await handPose.detect(webcamVideo); // detect retorna resultados
            if (results) gotHands(results);
        } catch(e) {
            console.error('Erro na detecção manual:', e);
        }
    }, 100); // a cada 100ms
}

// Callback chamado quando mãos são detetadas
function gotHands(results) {
    // Debug: SEMPRE logar (remover random para debug)
    debugCounter++;
    console.log(`🔵 gotHands chamado #${debugCounter}:`, {
        enabled: window.isHandDetectionEnabled,
        detecting: isDetecting,
        resultsLength: results ? results.length : 0,
        hasResults: !!results,
        resultsType: typeof results,
        isArray: Array.isArray(results)
    });

    if (!window.isHandDetectionEnabled || !isDetecting) {
        currentHandPosition = null;
        isHandPinching = false;
        return;
    }

    // Handle different result formats: array or object
    let handsArray = null;
    if (Array.isArray(results)) {
        handsArray = results;
        console.log('🔍 Results is array with length:', results.length);
    } else if (results && typeof results === 'object') {
        console.log('🔍 Results is object with keys:', Object.keys(results));
        // Try to extract hands from common object properties
        if (results.hands && Array.isArray(results.hands)) {
            handsArray = results.hands;
            console.log('🔍 Extracted hands from results.hands, length:', results.hands.length);
        } else if (results.predictions && Array.isArray(results.predictions)) {
            handsArray = results.predictions;
            console.log('🔍 Extracted hands from results.predictions, length:', results.predictions.length);
        } else if (results.multiHandLandmarks && Array.isArray(results.multiHandLandmarks)) {
            // Convert MediaPipe format to expected format
            handsArray = results.multiHandLandmarks.map(landmarks => ({
                landmarks: landmarks.map(lm => [lm.x * webcamVideo.videoWidth, lm.y * webcamVideo.videoHeight, lm.z])
            }));
            console.log('🔍 Converted MediaPipe multiHandLandmarks to hands array, length:', results.multiHandLandmarks.length);
        } else if (results.landmarks && Array.isArray(results.landmarks)) {
            handsArray = [{ landmarks: results.landmarks }];
            console.log('🔍 Wrapped results.landmarks in hands array');
        } else if (results[0] && Array.isArray(results[0])) {
            // Check if results is an object with numeric keys (like results[0], results[1], etc.)
            handsArray = Object.values(results).filter(val => Array.isArray(val));
            console.log('🔍 Extracted array values from results object, length:', handsArray.length);
        } else {
            // Log the object structure for debugging
            console.log('🔍 Unknown results object structure - FULL DUMP:');
            console.log('🔍 Keys:', Object.keys(results));
            for (let key of Object.keys(results)) {
                console.log(`🔍 results.${key}:`, results[key], 'type:', typeof results[key], 'isArray:', Array.isArray(results[key]));
            }
            console.log('🔍 Full results object:', JSON.stringify(results, null, 2));
        }
    } else {
        console.log('🔍 Results is neither array nor object:', results, 'type:', typeof results);
    }

    // Debug: verificar formato dos resultados
    if (handsArray && handsArray.length > 0) {
        // Processar primeira mão detetada
        const hand = handsArray[0];

        console.log('Mão detectada! Formato:', {
            hand: hand,
            hasLandmarks: !!hand.landmarks,
            landmarksType: Array.isArray(hand.landmarks) ? 'array' : typeof hand.landmarks,
            landmarksLength: hand.landmarks ? hand.landmarks.length : 0,
            handKeys: Object.keys(hand)
        });

        // HandPose retorna landmarks (pontos da mão como array [x, y])
        // Pode estar em hand.landmarks ou diretamente em hand
        let landmarks = hand.landmarks || hand;

        // Se não for array, pode ser objeto com propriedades
        if (!Array.isArray(landmarks) && typeof landmarks === 'object') {
            // Tentar converter objeto para array
            if (hand.keypoints && Array.isArray(hand.keypoints)) {
                landmarks = hand.keypoints.map(kp => [kp.x, kp.y, kp.z || 0]);
                console.log('Convertido keypoints para landmarks');
            } else {
                console.warn('Formato de landmarks não reconhecido:', landmarks);
                currentHandPosition = null;
                isHandPinching = false;
                return;
            }
        }

        if (landmarks && Array.isArray(landmarks) && landmarks.length >= 21) {
            processHandLandmarks(landmarks);
        } else {
            console.warn('Landmarks inválidos:', {
                isArray: Array.isArray(landmarks),
                length: landmarks ? landmarks.length : 0,
                landmarks: landmarks
            });
            currentHandPosition = null;
            isHandPinching = false;
        }
    } else {
        // Nenhuma mão detetada
        if (Math.random() < 0.05) {
            console.log('Nenhuma mão detectada');
        }
        currentHandPosition = null;
        isHandPinching = false;
    }
}

// ===== Processa os landmarks da mão para obter posição e estado =====
function processHandLandmarks(landmarks) {
    try {
        if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 21) {
            currentHandPosition = null;
            isHandPinching = false;
            return;
        }

        const indexFinger = landmarks[8]; // [x, y, z]
        const thumb = landmarks[4];
        const wrist = landmarks[0];
        const middleFinger = landmarks[12];

        if (!indexFinger || !thumb || !wrist || !middleFinger) {
            currentHandPosition = null;
            isHandPinching = false;
            return;
        }

        // Coordenadas da mão
        let fingerX = indexFinger[0];
        let fingerY = indexFinger[1];

        // Usar canvas se disponível, senão vídeo
        const canvasWidth = (typeof canvas !== 'undefined') ? canvas.width : webcamVideo.videoWidth;
        const canvasHeight = (typeof canvas !== 'undefined') ? canvas.height : webcamVideo.videoHeight;

        // Detecta se coordenadas são normalizadas (0-1) ou absolutas
        if (fingerX <= 1 && fingerY <= 1) {
            // Coordenadas normalizadas (0-1) - converter para canvas
            currentHandPosition = { x: fingerX * canvasWidth, y: fingerY * canvasHeight };
        } else {
            // Coordenadas absolutas - mapear do vídeo para canvas
            // Inverter horizontalmente se necessário (flipHorizontal)
            const flippedX = webcamVideo.videoWidth - fingerX;
            currentHandPosition = {
                x: (flippedX / webcamVideo.videoWidth) * canvasWidth,
                y: (fingerY / webcamVideo.videoHeight) * canvasHeight
            };
        }

        // Normalizar coordenadas se necessário para detecção de pinça
        let normalizedFingerY = fingerY;
        if (fingerY > 1) {
            normalizedFingerY = fingerY / webcamVideo.videoHeight;
        }

        // Detectar "pinça" baseada na proximidade entre polegar e indicador
        const thumbX = thumb[0];
        const thumbY = thumb[1];
        const indexX = indexFinger[0];
        const indexY = indexFinger[1];

        // Calcular distância entre polegar e indicador
        const distance = Math.sqrt(Math.pow(thumbX - indexX, 2) + Math.pow(thumbY - indexY, 2));

        // Normalizar a distância baseada no tamanho da mão (distância punho-dedo médio)
        const handSize = Math.sqrt(Math.pow(wrist[0] - middleFinger[0], 2) + Math.pow(wrist[1] - middleFinger[1], 2));
        const normalizedDistance = distance / handSize;

        // Pinça quando a distância é pequena (dedos próximos)
        isHandPinching = normalizedDistance < 0.15; // Ajustar threshold conforme necessário

        // Debug
        if (Math.random() < 0.1) {
            console.log('processHandLandmarks:', {
                pos: currentHandPosition,
                pinching: isHandPinching,
                distance: distance.toFixed(2),
                handSize: handSize.toFixed(2),
                normalizedDistance: normalizedDistance.toFixed(3),
                fingerY: fingerY.toFixed(2),
                normalizedFingerY: normalizedFingerY.toFixed(2)
            });
        }

    } catch (e) {
        console.error('Erro em processHandLandmarks:', e);
        currentHandPosition = null;
        isHandPinching = false;
    }
}

// Função para parar a deteção
function stopHandDetection() {
    isDetecting = false;
    currentHandPosition = null;
    isHandPinching = false;

    // Ocultar preview da webcam
    if (webcamPreview) {
        webcamPreview.classList.remove('active');
    }

    // Parar deteção do HandPose
    if (handPose) {
        // Remover listener se existir
        if (handPose.off) {
            handPose.off('predict', gotHands);
        }
        // Parar detectStart se estiver ativo
        if (handPose.detectStop) {
            handPose.detectStop();
        }
    }

    // Parar detecção manual
    if (manualDetectionInterval) {
        clearInterval(manualDetectionInterval);
        manualDetectionInterval = null;
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

    handPose = null;

    // Soltar qualquer objeto sendo arrastado
    releaseDraggedObjects();
}

// Solta objetos que estão sendo arrastados
function releaseDraggedObjects() {
    let somethingWasDragged = false;

    // Soltar painel solar se estiver sendo arrastado
    if (typeof draggedPanel !== 'undefined' && draggedPanel && draggedPanel.isDragging) {
        draggedPanel.isDragging = false;
        somethingWasDragged = true;

        // Resetar variável global se necessário (definida em solarPanels.js)
        if (typeof window !== 'undefined' && window.draggedPanel) {
            window.draggedPanel = null;
        }

        if (typeof solarPanels !== 'undefined') {
            solarPanels.forEach(p => {
                p.isPlacedCorrectly = isPanelCorrectlyPlaced(p);
            });
        }
        if (typeof recalcMitigation !== 'undefined') {
            recalcMitigation();
        }
    }

    // Soltar caixote se estiver sendo arrastado
    if (typeof draggedBin !== 'undefined' && draggedBin && draggedBin.isDragging) {
        draggedBin.isDragging = false;
        somethingWasDragged = true;

        // Resetar variável global se necessário (definida em recycling.js)
        if (typeof window !== 'undefined' && window.draggedBin) {
            window.draggedBin = null;
        }

        if (typeof recyclingBins !== 'undefined') {
            recyclingBins.forEach(b => {
                b.isPlacedCorrectly = isBinCorrectlyPlaced(b);
            });
        }
        if (typeof recalcMitigation !== 'undefined') {
            recalcMitigation();
        }
    }

    // Se algo foi solto, redesenhar a cena
    if (somethingWasDragged && typeof drawScene !== 'undefined') {
        drawScene();
    }
}

// Função para desenhar indicador visual da mão no canvas (para debug)
function drawHandIndicator() {
    // Debug: verificar se função está sendo chamada
    if (Math.random() < 0.01) {
        console.log('drawHandIndicator chamado:', {
            enabled: window.isHandDetectionEnabled,
            hasPosition: !!currentHandPosition,
            position: currentHandPosition,
            pinching: isHandPinching
        });
    }

    if (!window.isHandDetectionEnabled) {
        // Desenhar mensagem se detecção não está ativa
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('DETECÇÃO DESATIVADA', 10, 30);
        ctx.restore();
        return;
    }

    if (!currentHandPosition) {
        // Desenhar mensagem se mão não está detectada
        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('AGUARDANDO MÃO...', 10, 30);
        ctx.restore();
        return;
    }

    ctx.save();

    // Círculo maior e mais visível na posição do dedo indicador
    const circleSize = isHandPinching ? 15 : 10;
    ctx.fillStyle = isHandPinching ? '#00ff00' : '#ff0000';  // Verde se em pinça, vermelho se não
    ctx.beginPath();
    ctx.arc(currentHandPosition.x, currentHandPosition.y, circleSize, 0, Math.PI * 2);
    ctx.fill();

    // Borda branca para melhor visibilidade
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto indicando estado
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const text = isHandPinching ? 'PINÇA ✓' : 'SOLTO';
    ctx.strokeText(text, currentHandPosition.x + 20, currentHandPosition.y - 5);
    ctx.fillText(text, currentHandPosition.x + 20, currentHandPosition.y - 5);

    // Mostrar coordenadas para debug
    ctx.font = '10px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`X:${Math.round(currentHandPosition.x)} Y:${Math.round(currentHandPosition.y)}`,
                 currentHandPosition.x + 20,
                 currentHandPosition.y + 10);

    ctx.restore();
}

// ===== Atualiza o arraste com a mão =====
function updateHandDragging() {
    if (!window.isHandDetectionEnabled || !currentHandPosition) {
        return;
    }

    // Debug
    if (Math.random() < 0.05) {
        console.log('updateHandDragging:', {
            pos: currentHandPosition,
            pinching: isHandPinching
        });
    }

    // Sempre verificar se mão está sobre objetos para iniciar arraste
    // Se não estiver arrastando nada, tentar iniciar arraste quando mão estiver sobre objeto
    if (!draggedPanel || !draggedPanel.isDragging) {
        // Tentar iniciar arraste de painel
        if (showPanelsCheckbox && showPanelsCheckbox.checked &&
            solarPanels && solarPanels.length) {

            for (let panel of solarPanels) {
                const isInside = isPointInPanel(currentHandPosition.x, currentHandPosition.y, panel);
                if (isInside) {
                    draggedPanel = panel;
                    panel.isDragging = true;
                    panel.dragOffsetX = currentHandPosition.x - panel.x;
                    panel.dragOffsetY = currentHandPosition.y - panel.y;
                    highlightedBuildingIndex = panel.buildingIndex;
                    if (typeof startHighlightAnimation !== 'undefined') startHighlightAnimation();
                    console.log('Iniciando arraste do painel:', panel);
                    break;
                }
            }
        }
    }

    // Se não estiver arrastando caixote, tentar iniciar arraste
    if (!draggedBin || !draggedBin.isDragging) {
        // Tentar iniciar arraste de caixote
        if (showRecyclingCheckbox && showRecyclingCheckbox.checked &&
            recyclingBins && recyclingBins.length) {

            for (let bin of recyclingBins) {
                const isInside = isPointInBin(currentHandPosition.x, currentHandPosition.y, bin);
                if (isInside) {
                    draggedBin = bin;
                    bin.isDragging = true;
                    bin.dragOffsetX = currentHandPosition.x - bin.x;
                    bin.dragOffsetY = currentHandPosition.y - bin.y;
                    console.log('Iniciando arraste do caixote:', bin);
                    break;
                }
            }
        }
    }

    // Atualizar posição dos objetos sendo arrastados
    if (draggedPanel && draggedPanel.isDragging) {
        draggedPanel.x = currentHandPosition.x - draggedPanel.dragOffsetX;
        draggedPanel.y = currentHandPosition.y - draggedPanel.dragOffsetY;
        draggedPanel.isPlacedCorrectly = isPanelCorrectlyPlaced(draggedPanel);
    }

    if (draggedBin && draggedBin.isDragging) {
        draggedBin.x = currentHandPosition.x - draggedBin.dragOffsetX;
        draggedBin.y = currentHandPosition.y - draggedBin.dragOffsetY;
        draggedBin.isPlacedCorrectly = isBinCorrectlyPlaced(draggedBin);
    }
}
