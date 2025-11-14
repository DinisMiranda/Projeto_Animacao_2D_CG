// ===== MÓDULO: CARROS E AUTOCARRO =====

const cars = [];
let nextCarSpawnTs = 0;
const baseExhaustInterval = 120;

// ===== AUTOCARRO (drag-and-drop para a estrada) =====
let bus = null;
const BUS_WRAP_MARGIN = 80;

function initBus() {
    bus = {
        x: 80,
        y: canvas.height - 90,
        w: 120,
        h: 30,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        placedOnRoad: false,
        visible: false,
        dir: 1,
        speed: 0.18,
        lane: 0,
        targetLaneY: canvas.height - 90,
        autoDrive: false
    };
}

function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(canvas.width, 420);
    ctx.lineTo(canvas.width, 545);
    ctx.lineTo(0, 545);
    ctx.closePath();
    ctx.fillStyle = '#7a8a99';
    ctx.fill();
}

function drawRoad() {
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.lineTo(canvas.width, 470);
    ctx.lineTo(canvas.width, 530);
    ctx.lineTo(0, 530);
    ctx.closePath();
    ctx.fillStyle = '#444c5a';
    ctx.fill();

    ctx.strokeStyle = '#cfd7e6';
    ctx.setLineDash([18, 14]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(canvas.width, 500);
    ctx.stroke();
    ctx.setLineDash([]);
}

function getRoadRect() {
    return { y1: 470, y2: 530 };
}

function getBusLaneCenters() {
    const r = getRoadRect();
    const laneHeight = (r.y2 - r.y1) / 2;
    return [
        r.y1 + laneHeight * 0.5,
        r.y1 + laneHeight * 1.5
    ];
}

function alignBusToLane(referenceY) {
    if (!bus) return;
    const r = getRoadRect();
    const laneCenters = getBusLaneCenters();
    const midRoad = (r.y1 + r.y2) * 0.5;
    const useTopLane = referenceY <= midRoad;
    bus.lane = useTopLane ? 0 : 1;
    bus.dir = useTopLane ? 1 : -1;
    bus.targetLaneY = laneCenters[bus.lane];
    bus.y = bus.targetLaneY;
}

function updateBus(dtMs) {
    if (!bus || !bus.visible || bus.isDragging || !bus.placedOnRoad || !bus.autoDrive) return;
    bus.x += bus.speed * bus.dir * dtMs;

    if (bus.dir > 0 && bus.x - bus.w * 0.5 > canvas.width + BUS_WRAP_MARGIN) {
        bus.x = -BUS_WRAP_MARGIN;
    } else if (bus.dir < 0 && bus.x + bus.w * 0.5 < -BUS_WRAP_MARGIN) {
        bus.x = canvas.width + BUS_WRAP_MARGIN;
    }

    if (typeof bus.targetLaneY === 'number') {
        bus.y += (bus.targetLaneY - bus.y) * 0.2;
    }
}

function drawBus(obj) {
    if (!obj || !obj.visible) return;
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.roundRect(-obj.w * 0.5, -obj.h * 0.5, obj.w, obj.h, 6);
    ctx.fill();
    ctx.fillStyle = '#dff2ff';
    const winY = -obj.h * 0.22;
    const winH = obj.h * 0.44;
    const cols = 5;
    for (let i = 0; i < cols; i++) {
        const t = (i + 0.5) / cols;
        const wx = -obj.w * 0.36 + t * obj.w * 0.72;
        ctx.beginPath();
        ctx.roundRect(wx - 10, winY, 20, winH, 3);
        ctx.fill();
    }
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-obj.w * 0.35, obj.h * 0.5, 7, 0, Math.PI * 2);
    ctx.arc(obj.w * 0.35, obj.h * 0.5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function spawnCar(ts) {
    const lane = Math.random() < 0.5 ? 0 : 1;
    if (lane === 0) {
        cars.push({
            x: -120,
            y: 488,
            w: 46, h: 16,
            color: '#e74c3c',
            speed: 0.18 + Math.random() * 0.10,
            dir: 1,
            lastSmoke: ts
        });
    } else {
        cars.push({
            x: canvas.width + 120,
            y: 512,
            w: 52, h: 18,
            color: '#3498db',
            speed: 0.16 + Math.random() * 0.10,
            dir: -1,
            lastSmoke: ts
        });
    }
}

function updateAndDrawCars(dtMs, ts) {
    if (ts >= nextCarSpawnTs) {
        spawnCar(ts);
        const baseGap = 900 + Math.random() * 1400;
        let spawnFactor = 1 + totalMitigation * 1.0;
        if (showBusCheckbox && showBusCheckbox.checked && bus && bus.placedOnRoad) spawnFactor *= 1.25;
        
        // Reduzir tráfego durante a noite (até 70% menos carros)
        const nightFactor = typeof getNightFactor === 'function' ? getNightFactor() : 0;
        if (nightFactor > 0) {
            // Durante a noite: reduzir spawn rate (noite completa = 3x menos carros)
            spawnFactor *= (1 + nightFactor * 2);
        }
        
        nextCarSpawnTs = ts + baseGap * spawnFactor;
    }

    for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        c.x += c.speed * c.dir * dtMs;
        if ((c.dir > 0 && c.x - c.w > canvas.width + 40) || (c.dir < 0 && c.x + c.w < -40)) {
            cars.splice(i, 1);
            continue;
        }

        const exhaustInterval = baseExhaustInterval * (1 + totalMitigation * 3.0);
        if (ts - c.lastSmoke > exhaustInterval) {
            const exhaustX = c.dir > 0 ? c.x - c.w * 0.5 - 4 : c.x + c.w * 0.5 + 4;
            const exhaustY = c.y + c.h * 0.25;
            spawnCarSmoke(exhaustX, exhaustY, c.dir);
            c.lastSmoke = ts;
        }
    }

    cars.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.dir, 1);
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h, 4);
        ctx.fill();
        ctx.fillStyle = '#cfe8ff';
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.2, -c.h * 0.6, c.w * 0.35, c.h * 0.55, 3);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-c.w * 0.25, c.h * 0.5, 5, 0, Math.PI * 2);
        ctx.arc(c.w * 0.25, c.h * 0.5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function isPointInBus(x, y, obj) {
    if (!obj || !obj.visible) return false;
    return x >= obj.x - obj.w * 0.5 && x <= obj.x + obj.w * 0.5 &&
           y >= obj.y - obj.h * 0.5 && y <= obj.y + obj.h * 0.5;
}

function resetCars() {
    cars.length = 0;
    nextCarSpawnTs = 0;
}

