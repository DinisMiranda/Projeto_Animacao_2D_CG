// ===== MÓDULO: FÁBRICAS =====

// ===== DADOS DAS FÁBRICAS (EXPOSTOS PARA FUMO) =====
const factoriesBaseY = 408;
const factoriesData = [
    { x: 760,  w: 120, h: 62, chimneys: [ {xOff: 18, w: 14, h: 54} ] },
    { x: 910,  w: 150, h: 70, chimneys: [ {xOff: 24, w: 16, h: 60}, {xOff: 80, w: 14, h: 50} ] },
    { x: 1080, w: 120, h: 60, chimneys: [ {xOff: 22, w: 14, h: 52} ] }
];
let factoryChimneyOutlets = [];

function drawFactories() {
    const baseY = factoriesBaseY;
    ctx.save();

    const silhouette = '#6a7a88';
    const darker = '#5f6c78';
    ctx.globalAlpha = 0.7;

    const factories = factoriesData;
    factoryChimneyOutlets = [];

    factories.forEach((f, idx) => {
        ctx.beginPath();
        ctx.moveTo(f.x, baseY);
        ctx.lineTo(f.x + f.w, baseY);
        ctx.lineTo(f.x + f.w, baseY - f.h);
        ctx.lineTo(f.x, baseY - f.h);
        ctx.closePath();
        ctx.fillStyle = idx % 2 === 0 ? silhouette : darker;
        ctx.fill();

        f.chimneys.forEach((c) => {
            const cx = f.x + c.xOff;
            const ch = c.h;
            ctx.beginPath();
            ctx.moveTo(cx, baseY - f.h);
            ctx.lineTo(cx + c.w, baseY - f.h);
            ctx.lineTo(cx + c.w, baseY - f.h - ch);
            ctx.lineTo(cx, baseY - f.h - ch);
            ctx.closePath();
            ctx.fillStyle = darker;
            ctx.fill();

            const smokeBaseX = cx + c.w * 0.5;
            const smokeBaseY = baseY - f.h - ch - 6;
            factoryChimneyOutlets.push({ x: smokeBaseX, y: smokeBaseY });
        });

        ctx.beginPath();
        ctx.moveTo(f.x, baseY);
        ctx.lineTo(f.x + f.w, baseY);
        ctx.lineTo(f.x + f.w, baseY + 1);
        ctx.lineTo(f.x, baseY + 1);
        ctx.closePath();
        ctx.fillStyle = '#6a7680';
        ctx.fill();

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 1;
        ctx.fillRect(f.x, baseY - 1, f.w, 5);
        ctx.restore();
    });

    const groundGrad = ctx.createLinearGradient(0, baseY, 0, 420);
    groundGrad.addColorStop(0, 'rgba(100, 115, 125, 0.45)');
    groundGrad.addColorStop(1, 'rgba(100, 115, 125, 0.0)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(720, baseY, canvas.width - 720, 420 - baseY);

    const hazeTop = baseY - 12;
    const hazeBottom = 420;
    const hazeGrad = ctx.createLinearGradient(0, hazeTop, 0, hazeBottom);
    hazeGrad.addColorStop(0, 'rgba(200, 220, 235, 0.08)');
    hazeGrad.addColorStop(1, 'rgba(200, 220, 235, 0)');
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(720, hazeTop, canvas.width - 720, hazeBottom - hazeTop);

    ctx.restore();
}

