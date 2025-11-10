// ===== MÓDULO: SISTEMA DE PARTÍCULAS DE FUMO =====

const smokeParticles = [];

function spawnFactorySmoke(dtMs) {
    const spawnPerSecondBase = 2.5;
    // Mínimo de 0.6 - permite redução sutil (até 40% de redução)
    const spawnPerSecond = spawnPerSecondBase * Math.max(0.6, (1 - totalMitigation));
    const prob = Math.max(0, spawnPerSecond) * (dtMs / 1000);
    factoryChimneyOutlets.forEach((o) => {
        if (Math.random() < prob) {
            // Efeito sutil - tamanho reduz levemente (máximo 30%)
            const sizeFactor = Math.max(0.7, (1 - totalMitigation * 0.6));
            // Crescimento reduz levemente
            const growthFactor = Math.max(0.75, (1 - totalMitigation * 0.5));
            smokeParticles.push({
                kind: 'factory',
                x: o.x + (Math.random() * 4 - 2),
                y: o.y + (Math.random() * 2 - 1),
                vx: (Math.random() * 0.15 - 0.075),
                vy: -(0.25 + Math.random() * 0.35),
                radius: (6 + Math.random() * 6) * sizeFactor,
                growth: (0.015 + Math.random() * 0.02) * growthFactor,
                // Opacidade reduz levemente (máximo 30% de redução)
                alpha: 0.35 * (1 - totalMitigation * 0.6),
                // Desaparece um pouco mais rápido, mas muito sutilmente
                fade: 0.04 * (1 + totalMitigation * 0.5),
            });
        }
    });
}

function spawnCarSmoke(x, y, dir) {
    // Efeito sutil - tamanho reduz levemente (máximo 30%)
    const sizeFactor = Math.max(0.7, (1 - totalMitigation * 0.6));
    // Crescimento reduz levemente
    const growthFactor = Math.max(0.75, (1 - totalMitigation * 0.5));
    smokeParticles.push({
        kind: 'car',
        x: x,
        y: y,
        vx: (dir > 0 ? -0.12 : 0.12) + (Math.random() * 0.12 - 0.06),
        vy: -(0.05 + Math.random() * 0.1),
        radius: (2.5 + Math.random() * 2) * sizeFactor,
        growth: (0.02 + Math.random() * 0.02) * growthFactor,
        // Opacidade reduz levemente (máximo 30% de redução)
        alpha: 0.5 * (1 - totalMitigation * 0.6),
        // Desaparece um pouco mais rápido, mas muito sutilmente
        fade: 0.10 * (1 + totalMitigation * 0.5),
    });
}

function updateAndDrawSmoke(dtMs) {
    const dt = dtMs / 16.67;
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.x += p.vx * dtMs;
        p.y += p.vy * dtMs;
        p.radius += p.growth * dtMs;
        // Aplicar mitigação sutil ao fumo existente - desaparece levemente mais rápido (máximo 30% mais rápido)
        const mitigationFadeMultiplier = 1 + totalMitigation * 0.5;
        p.alpha -= p.fade * (dtMs / 1000) * mitigationFadeMultiplier;
        if (p.alpha <= 0 || p.radius <= 0 || p.y + p.radius < 0) {
            smokeParticles.splice(i, 1);
            continue;
        }
    }

    smokeParticles.forEach((p) => {
        ctx.save();
        // Aplicar mitigação sutil à opacidade - torna levemente mais transparente (máximo 25% de redução)
        const mitigationAlphaMultiplier = 1 - totalMitigation * 0.25;
        const finalAlpha = Math.max(0, Math.min(1, p.alpha * mitigationAlphaMultiplier));
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = p.kind === 'factory' ? 'rgba(220, 225, 230, 1)' : 'rgba(200, 205, 210, 1)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

