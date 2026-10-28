/**
STARSHIFT - 8-BIT CONSTELLATION GAME
Main Game Controller
*/

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

// Player state
let player = { x: 0, y: 0, rotation: 0, scale: 1 };
let keys = {};
let levelCompleted = false;
let currentLevelIndex = 0;
let stars = [];

// DOM Elements
const hudLevel = document.getElementById('hud-level');
const hudName = document.getElementById('hud-name');
const progressFill = document.getElementById('progress-fill');
const accuracyValue = document.getElementById('accuracy-value');
const victoryModal = document.getElementById('victory-modal');
const modalMessage = document.getElementById('modal-message');
const statName = document.getElementById('stat-name');
const statAccuracy = document.getElementById('stat-accuracy');
const playAgainBtn = document.getElementById('play-again-btn');

// Level configuration - 5 constellations (Data cleaned and standardized)
const LEVELS = [
    {
        id: 'level1', name: 'Orion',
        description: 'The Hunter - Visible summer constellation.',
        stars: [{x: -80, y: 0}, {x: 0, y: -40}, {x: 80, y: 0}, {x: 25, y: -60}, {x: 25, y: -95}],
        lines: [[{x: -80, y: 0}, {x: 0, y: -40}], [{x: 0, y: -40}, {x: 80, y: 0}], [{x: -70, y: -30}, {x: 25, y: -60}], [{x: 25, y: -60}, {x: 25, y: -95}]],
        target: {x: 0, y: 0, rotation: 0, scale: 1.0},
        funFact: 'Orion is one of the most recognizable constellations in the night sky, visible for about 7 months a year.'
    },
    {
        id: 'level2', name: 'Ursa Major',
        description: 'The Great Bear - Famous for the Big Dipper.',
        stars: [{x: 0, y: -10}, {x: 50, y: -40}, {x: 30, y: -80}],
        lines: [[{x: 0, y: -10}, {x: 50, y: -40}], [{x: 50, y: -40}, {x: 30, y: -80}]],
        target: {x: 0, y: -60, rotation: 0, scale: 1.0},
        funFact: 'Ursa Major contains some of the brightest stars in the northern hemisphere and includes 7 main visible stars.'
    },
    {
        id: 'level3', name: 'Cassiopeia',
        description: 'The Queen - Distinctive W-shaped constellation.',
        stars: [{x: -60, y: 20}, {x: -50, y: -40}, {x: 50, y: -40}, {x: 60, y: 20}],
        lines: [[{x: -60, y: 20}, {x: -50, y: -40}], [{x: -50, y: -40}, {x: 50, y: -40}], [{x: 50, y: -40}, {x: 60, y: 20}]],
        target: {x: 0, y: 0, rotation: 0, scale: 1.2}, 
        funFact: 'Cassiopeia is one of the few constellations visible from both hemispheres and has no faint stars within 30° of it.'
    },
    {
        id: 'level4', name: 'Cygnus',
        description: 'The Swan - Known for its bright central star.',
        stars: [{x: -90, y: -50}, {x: -30, y: 10}, {x: 20, y: 40}, {x: 70, y: -60}],
        lines: [[{x: -90, y: -50}, {x: -30, y: 10}], [{x: -30, y: 10}, {x: 20, y: 40}], [{x: 20, y: 40}, {x: 70, y: -60}]],
        target: {x: 30, y: -30, rotation: 0, scale: 1.0},
        funFact: 'Cygnus contains Deneb, the brightest star in the constellation and one of the brightest stars visible from Earth.'
    },
    {
        id: 'level5', name: 'Taurus',
        description: 'The Bull - Contains the famous Pleiades.',
        stars: [{x: -50, y: 30}, {x: -40, y: 10}, {x: 30, y: 20}, {x: 20, y: -10}],
        lines: [[{x: -50, y: 30}, {x: -40, y: 10}], [{x: -40, y: 10}, {x: 30, y: 20}], [{x: 30, y: 20}, {x: 20, y: -10}]],
        target: {x: 40, y: 0, rotation: 0, scale: 0.9},
        funFact: 'Taurus contains the Pleiades (Seven Sisters), an open star cluster that appears as a small fuzzy patch to the naked eye.'
    }
];

// ============================================
// LOCAL STORAGE INTEGRATION
// ============================================
function saveProgress(levelIndex) {
    const saveData = { levelIndex, completedLevels: [levelIndex], score: 100 };
    localStorage.setItem('StarShift-SavedGame', JSON.stringify(saveData));
}

function loadProgress() {
    try {
        const saved = localStorage.getItem('StarShift-SavedGame');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error('Error loading saved game:', e); }
    return null;
}

// ============================================
// CANVAS & STARFIELD SETUP
// ============================================
function resizeCanvas() {
    CANVAS.width = CANVAS.clientWidth;
    CANVAS.height = CANVAS.clientHeight;
    initStarfield();
}

function initStarfield() {
    stars = [];
    for(let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * CANVAS.width,
            y: Math.random() * CANVAS.height,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.8 + 0.2
        });
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================
// INPUT LISTENERS
// ============================================
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    if (e.shiftKey) {
        // Shift + Scroll = Scale/Zoom
        player.scale += delta * 0.05;
        player.scale = Math.max(0.2, Math.min(3.0, player.scale));
    } else {
        // Scroll = Rotation
        player.rotation += delta * 5;
    }
}, { passive: false });

// ============================================
// GAME LOGIC & RENDERING
// ============================================
function update() {
    if (levelCompleted) return;

    const speed = 3;
    if (keys['w'] || keys['arrowup']) player.y -= speed;
    if (keys['s'] || keys['arrowdown']) player.y += speed;
    if (keys['a'] || keys['arrowleft']) player.x -= speed;
    if (keys['d'] || keys['arrowright']) player.x += speed;

    checkWinCondition();
}

function calculateAccuracy() {
    const target = LEVELS[currentLevelIndex].target;

    // Position accuracy (max distance 200px)
    const dist = Math.sqrt(Math.pow(player.x - target.x, 2) + Math.pow(player.y - target.y, 2));
    const posAcc = Math.max(0, 1 - (dist / 200));

    // Rotation accuracy (max diff 180 deg)
    let rotDiff = Math.abs(player.rotation - (target.rotation || 0)) % 360;
    if (rotDiff > 180) rotDiff = 360 - rotDiff;
    const rotAcc = Math.max(0, 1 - (rotDiff / 180));

    // Scale accuracy (max diff 1.0)
    const scaleDiff = Math.abs(player.scale - target.scale);
    const scaleAcc = Math.max(0, 1 - (scaleDiff / 1.0));

    return (posAcc + rotAcc + scaleAcc) / 3;
}

function checkWinCondition() {
    const accuracy = calculateAccuracy();
    const accuracyPct = Math.round(accuracy * 100);
    
    // Update HUD
    progressFill.style.width = accuracyPct + '%';
    accuracyValue.textContent = accuracyPct + '%';

    // Auto-snap win condition (80%+ accuracy)
    if (accuracy >= 0.80) {
        levelCompleted = true;
        triggerVictory(accuracyPct);
    }
}

function draw() {
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    
    // 1. Draw 8-bit starfield background
    CTX.fillStyle = '#fff';
    stars.forEach(s => {
        CTX.globalAlpha = s.alpha;
        CTX.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    });
    CTX.globalAlpha = 1.0;

    const level = LEVELS[currentLevelIndex];
    const cx = CANVAS.width / 2 + player.x;
    const cy = CANVAS.height / 2 + player.y;
    
    // 2. Draw Target Outline (Faint guide)
    CTX.save();
    CTX.translate(CANVAS.width / 2 + level.target.x, CANVAS.height / 2 + level.target.y);
    CTX.rotate((level.target.rotation || 0) * Math.PI / 180);
    CTX.scale(level.target.scale, level.target.scale);
    CTX.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    CTX.lineWidth = 2;
    CTX.setLineDash([5, 5]);
    CTX.beginPath();
    level.lines.forEach(line => {
        CTX.moveTo(line[0].x, line[0].y);
        CTX.lineTo(line[1].x, line[1].y);
    });
    CTX.stroke();
    CTX.setLineDash([]);
    CTX.restore();

    // 3. Draw User-Controlled Constellation Overlay
    CTX.save();
    CTX.translate(cx, cy);
    CTX.rotate(player.rotation * Math.PI / 180);
    CTX.scale(player.scale, player.scale);

    // Lines
    CTX.strokeStyle = '#1db9ff';
    CTX.lineWidth = 3 / player.scale; 
    CTX.shadowColor = '#1db9ff';
    CTX.shadowBlur = 8 / player.scale;
    CTX.beginPath();
    level.lines.forEach(line => {
        CTX.moveTo(line[0].x, line[0].y);
        CTX.lineTo(line[1].x, line[1].y);
    });
    CTX.stroke();

    // Stars
    CTX.shadowBlur = 0;
    level.stars.forEach(star => {
        CTX.fillStyle = '#ffd700';
        CTX.shadowColor = '#ffd700';
        CTX.shadowBlur = 15 / player.scale;
        CTX.beginPath();
        CTX.arc(star.x, star.y, 5 / player.scale, 0, Math.PI * 2);
        CTX.fill();
    });
    
    CTX.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// VICTORY & LEVEL MANAGEMENT
// ============================================
function triggerVictory(accuracyPct) {
    const level = LEVELS[currentLevelIndex];
    modalMessage.textContent = level.funFact;
    statName.textContent = level.name;
    statAccuracy.textContent = accuracyPct + '%';
    
    victoryModal.classList.remove('hidden');
    document.body.classList.add('victory-active');
    
    saveProgress(currentLevelIndex);
}

playAgainBtn.addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    document.body.classList.remove('victory-active');
    
    currentLevelIndex = (currentLevelIndex + 1) % LEVELS.length;
    resetLevel();
});

function resetLevel() {
    player = { x: 0, y: 0, rotation: 0, scale: 1 };
    levelCompleted = false;
    const level = LEVELS[currentLevelIndex];
    hudLevel.textContent = currentLevelIndex + 1;
    hudName.textContent = level.name.toUpperCase();
    progressFill.style.width = '0%';
    accuracyValue.textContent = '0%';
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    const saved = loadProgress();
    if (saved && typeof saved.levelIndex === 'number') {
        currentLevelIndex = (saved.levelIndex + 1) % LEVELS.length;
    }
    resetLevel();
    gameLoop();
}

init();