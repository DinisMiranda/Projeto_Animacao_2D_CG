// ===== MÓDULO: EDIFÍCIOS =====

// Array com dados dos edifícios (posição x, largura, altura)
const buildings = [
    {x: 80,  w: 120, h: 180},
    {x: 230, w: 100, h: 220},
    {x: 380, w: 160, h: 200},
    {x: 560, w: 130, h: 240}
];

// Array com cores para os edifícios (alterna entre 3 cores)
const colors = ['#445066', '#384356', '#2f3848'];

function drawWindow(x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 2, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 2, y);
    ctx.arc(x + width - 2, y + 2, 2, Math.PI * 1.5, 0);
    ctx.lineTo(x + width, y + height - 2);
    ctx.arc(x + width - 2, y + height - 2, 2, 0, Math.PI * 0.5);
    ctx.lineTo(x + 2, y + height);
    ctx.arc(x + 2, y + height - 2, 2, Math.PI * 0.5, Math.PI);
    ctx.closePath();

    const windowGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    windowGradient.addColorStop(0, '#87ceeb');
    windowGradient.addColorStop(0.5, '#5ba3d1');
    windowGradient.addColorStop(1, '#3a7ca5');
    ctx.fillStyle = windowGradient;
    ctx.fill();

    ctx.strokeStyle = '#2d4a5f';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.strokeStyle = '#2d4a5f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width * 0.7, y + height * 0.3, 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
}

function drawDoor(x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x + 3, y + 3, 3, Math.PI, Math.PI * 1.5);
    ctx.lineTo(x + width - 3, y);
    ctx.arc(x + width - 3, y + 3, 3, Math.PI * 1.5, 0);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y);
    ctx.closePath();

    const doorGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    doorGradient.addColorStop(0, '#4a3a2a');
    doorGradient.addColorStop(0.5, '#3d2f21');
    doorGradient.addColorStop(1, '#2a1f15');
    ctx.fillStyle = doorGradient;
    ctx.fill();

    ctx.strokeStyle = '#1a1510';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width * 0.85, y + height * 0.5, 3, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width * 0.3, y + height * 0.3, 6, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
}

function drawBuildings() {
    buildings.forEach((building, i) => {
        ctx.beginPath();
        ctx.moveTo(building.x, 420);
        ctx.lineTo(building.x + building.w, 420);
        ctx.lineTo(building.x + building.w, 420 - building.h);
        ctx.lineTo(building.x, 420 - building.h);
        ctx.closePath();
        ctx.fillStyle = colors[i % 3];
        ctx.fill();

        const windowWidth = 18;
        const windowHeight = 24;
        const windowSpacing = 8;
        const windowsPerRow = Math.floor((building.w - 20) / (windowWidth + windowSpacing));
        const numRows = Math.floor((building.h - 60) / (windowHeight + windowSpacing));

        const totalWindowsWidth = windowsPerRow * windowWidth + (windowsPerRow - 1) * windowSpacing;
        const startX = building.x + (building.w - totalWindowsWidth) / 2;
        const totalWindowsHeight = numRows * windowHeight + (numRows - 1) * windowSpacing;
        const startY = 420 - building.h + 20;

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < windowsPerRow; col++) {
                const windowX = startX + col * (windowWidth + windowSpacing);
                const windowY = startY + row * (windowHeight + windowSpacing);
                drawWindow(windowX, windowY, windowWidth, windowHeight);
            }
        }

        const doorWidth = 24;
        const doorHeight = 40;
        const doorX = building.x + (building.w - doorWidth) / 2;
        const doorY = 419 - doorHeight;
        drawDoor(doorX, doorY, doorWidth, doorHeight);
    });
}

function getRoofTargetRect(building) {
    const roofY = 420 - building.h;
    const paddingX = 8;
    const zoneHeight = 18;
    const x = building.x + paddingX;
    const y = roofY - zoneHeight - 4;
    const w = building.w - paddingX * 2;
    const h = zoneHeight;
    return { x, y, w, h };
}

