// ===== MÓDULO: DETECÇÃO FACIAL COM ML5.JS =====
// Detecta expressões faciais (especialmente sorrisos) para acelerar a transição para cidade mais verde

let faceMesh = null;
let isFaceDetectionEnabled = false;
let isDetecting = false;
let smileDetected = false;
let smileBoostActive = false;
let smileBoostTimer = 0;
const SMILE_BOOST_DURATION = 2000; // 2 segundos de boost por sorriso
const SMILE_BOOST_AMOUNT = 0.3; // Aumenta extraMitigation em 0.3 (30%) quando sorriso é detetado

// Elementos DOM
const webcamVideo = document.getElementById('webcam-video');
const webcamPreview = document.getElementById('webcam-preview');
const webcamPreviewVideo = document.getElementById('webcam-preview-video');
const enableFaceDetectionCheckbox = document.getElementById('enableFaceDetection');
const smileIndicator = document.getElementById('smile-indicator');

// Inicializar deteção facial quando o checkbox é ativado
if (enableFaceDetectionCheckbox) {
    enableFaceDetectionCheckbox.addEventListener('change', async (e) => {
        isFaceDetectionEnabled = e.target.checked;
        if (isFaceDetectionEnabled) {
            await initFaceDetection();
        } else {
            stopFaceDetection();
        }
    });
}

// Função para inicializar a deteção facial
async function initFaceDetection() {
    try {
        // Verificar se ML5 está disponível
        if (typeof ml5 === 'undefined') {
            console.error('ML5.js não está carregado. Verifique a conexão à internet.');
            if (enableFaceDetectionCheckbox) {
                enableFaceDetectionCheckbox.checked = false;
            }
            return;
        }

        // Solicitar acesso à webcam
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user' // Usar câmara frontal
            } 
        });
        
        webcamVideo.srcObject = stream;
        
        // Conectar o mesmo stream ao preview visível
        if (webcamPreviewVideo) {
            webcamPreviewVideo.srcObject = stream;
        }
        
        // Aguardar os vídeos estarem prontos
        await Promise.all([
            new Promise((resolve) => {
                webcamVideo.onloadedmetadata = () => {
                    webcamVideo.play();
                    resolve();
                };
            }),
            webcamPreviewVideo ? new Promise((resolve) => {
                webcamPreviewVideo.onloadedmetadata = () => {
                    webcamPreviewVideo.play();
                    resolve();
                };
            }) : Promise.resolve()
        ]);
        
        // Mostrar preview da webcam
        if (webcamPreview) {
            webcamPreview.classList.add('active');
        }

        // Inicializar FaceMesh do ML5.js (API moderna)
        faceMesh = await ml5.faceMesh({
            detectionConfidence: 0.9
        });
        
        console.log('FaceMesh inicializado com sucesso!');
        
        // Iniciar deteção contínua
        faceMesh.detectStart(webcamVideo, gotFaces);
        isDetecting = true;

    } catch (error) {
        console.error('Erro ao inicializar deteção facial:', error);
        alert('Não foi possível aceder à webcam. Por favor, verifique as permissões do navegador.');
        if (enableFaceDetectionCheckbox) {
            enableFaceDetectionCheckbox.checked = false;
        }
        isFaceDetectionEnabled = false;
    }
}

// Callback chamado quando faces são detetadas
function gotFaces(results) {
    if (!isFaceDetectionEnabled || !isDetecting) return;
    
    if (results && results.length > 0) {
        // Processar primeira face detetada
        const face = results[0];
        
        // FaceMesh retorna landmarks (pontos faciais)
        // Os landmarks podem estar em face.scaledMesh ou face.landmarks
        if (face.scaledMesh) {
            detectSmileFromLandmarks(face.scaledMesh);
        } else if (face.landmarks) {
            detectSmileFromLandmarks(face.landmarks);
        } else {
            smileDetected = false;
        }
    } else {
        // Nenhuma face detetada
        smileDetected = false;
    }
}

// Função para parar a deteção
function stopFaceDetection() {
    isDetecting = false;
    smileDetected = false;
    smileBoostActive = false;
    smileBoostTimer = 0;
    
    // Remover boost de mitigação
    if (typeof extraMitigation !== 'undefined') {
        extraMitigation = 0;
        if (typeof recalcMitigation !== 'undefined') {
            recalcMitigation();
        }
    }
    
    // Ocultar indicador
    if (smileIndicator) {
        smileIndicator.classList.remove('active');
    }
    
    // Ocultar preview da webcam
    if (webcamPreview) {
        webcamPreview.classList.remove('active');
    }
    
    // Parar deteção do FaceMesh
    if (faceMesh && faceMesh.detectStop) {
        faceMesh.detectStop();
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
    
    faceMesh = null;
}


// Função para detetar sorriso através de landmarks (pontos faciais do FaceMesh)
// FaceMesh retorna 468 pontos faciais, onde os pontos da boca estão em índices específicos
function detectSmileFromLandmarks(landmarks) {
    if (!landmarks || landmarks.length < 20) {
        smileDetected = false;
        return;
    }
    
    try {
        // FaceMesh landmarks podem estar em diferentes formatos:
        // - Array de objetos: [{x, y, z}, ...]
        // - Array de arrays: [[x, y, z], ...]
        // Normalizar para formato de objeto
        const normalizePoint = (point) => {
            if (Array.isArray(point)) {
                return { x: point[0], y: point[1], z: point[2] || 0 };
            }
            return point;
        };
        
        // FaceMesh landmarks: pontos da boca estão aproximadamente nos índices:
        // Canto esquerdo da boca: 61, 84
        // Canto direito da boca: 291, 308
        // Centro superior da boca: 13
        // Centro inferior da boca: 14
        
        // Tentar diferentes índices possíveis para os cantos da boca
        const leftMouthCorner = normalizePoint(landmarks[61] || landmarks[84] || landmarks[146]);
        const rightMouthCorner = normalizePoint(landmarks[291] || landmarks[308] || landmarks[375]);
        const topLipCenter = normalizePoint(landmarks[13] || landmarks[12]);
        const bottomLipCenter = normalizePoint(landmarks[14] || landmarks[16]);
        
        // Verificar se temos pontos válidos
        if (leftMouthCorner && rightMouthCorner && topLipCenter && bottomLipCenter &&
            typeof leftMouthCorner.x === 'number' && typeof rightMouthCorner.x === 'number') {
            
            // Calcular largura e altura da boca
            const mouthWidth = Math.abs(rightMouthCorner.x - leftMouthCorner.x);
            const mouthHeight = Math.abs(bottomLipCenter.y - topLipCenter.y);
            
            // Calcular a distância vertical dos cantos da boca em relação ao centro
            // Em um sorriso, os cantos da boca estão mais altos (menor y) que o centro
            const leftCornerY = leftMouthCorner.y;
            const rightCornerY = rightMouthCorner.y;
            const centerY = (topLipCenter.y + bottomLipCenter.y) / 2;
            
            // Verificar se os cantos estão elevados (indicando sorriso)
            const leftCornerElevated = leftCornerY < centerY;
            const rightCornerElevated = rightCornerY < centerY;
            
            // Ratio largura/altura (sorriso tem boca mais larga)
            const smileRatio = mouthWidth / (mouthHeight + 1);
            
            // Detetar sorriso: cantos elevados E ratio alto
            // Threshold ajustado para ser mais sensível
            const isSmiling = (leftCornerElevated || rightCornerElevated) && smileRatio > 1.5;
            
            if (isSmiling) {
                if (!smileDetected) {
                    // Novo sorriso detetado
                    smileDetected = true;
                    activateSmileBoost();
                }
            } else {
                smileDetected = false;
            }
        } else {
            smileDetected = false;
        }
    } catch (e) {
        // Se houver erro, assumir que não há sorriso
        console.error('Erro ao processar landmarks:', e);
        smileDetected = false;
    }
}

// Função para ativar o boost de mitigação quando sorriso é detetado
function activateSmileBoost() {
    if (!isFaceDetectionEnabled) return;
    
    smileBoostActive = true;
    smileBoostTimer = SMILE_BOOST_DURATION;
    
    // Aumentar extraMitigation
    if (typeof extraMitigation !== 'undefined') {
        extraMitigation = SMILE_BOOST_AMOUNT;
        if (typeof recalcMitigation !== 'undefined') {
            recalcMitigation();
        }
    }
    
    // Mostrar indicador visual
    if (smileIndicator) {
        smileIndicator.classList.add('active');
    }
}

// Função para atualizar o boost (chamada no loop de animação)
function updateSmileBoost(dtMs) {
    if (!isFaceDetectionEnabled) return;
    
    if (smileBoostActive) {
        smileBoostTimer -= dtMs;
        
        if (smileBoostTimer <= 0) {
            // Boost expirou
            smileBoostActive = false;
            smileBoostTimer = 0;
            
            // Reduzir extraMitigation
            if (typeof extraMitigation !== 'undefined') {
                extraMitigation = 0;
                if (typeof recalcMitigation !== 'undefined') {
                    recalcMitigation();
                }
            }
            
            // Ocultar indicador se não houver sorriso
            if (!smileDetected && smileIndicator) {
                smileIndicator.classList.remove('active');
            }
        } else if (smileDetected) {
            // Renovar boost se sorriso ainda está presente
            smileBoostTimer = SMILE_BOOST_DURATION;
            if (typeof extraMitigation !== 'undefined') {
                extraMitigation = SMILE_BOOST_AMOUNT;
                if (typeof recalcMitigation !== 'undefined') {
                    recalcMitigation();
                }
            }
        }
    } else if (smileDetected) {
        // Se não há boost ativo mas há sorriso, ativar boost
        activateSmileBoost();
    }
}

