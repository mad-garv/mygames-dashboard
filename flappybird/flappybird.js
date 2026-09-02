import { 
    drawStartGame,
    drawGameOver 
} from "../shared/ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const params = new URLSearchParams(window.location.search);
const demoMode = params.get("demo") === "true";

const gravity = 0.4;
let jumpStrength = -4.5;

const poleW = 60;
const gap = 80;
const poleSpeed = 2.5;

let score = 0;

const highScoreKey = "flappybirdHighScore";

let highScore =
    Number(localStorage.getItem(highScoreKey)) || 0;

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(highScoreKey, highScore);
    }
}

document.addEventListener("keydown", (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); 
        bird.flap();
    }
});

function Bird(x, y) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 12;
    this.vy = 0;
}

Bird.prototype.flap = function() {
    this.vy = jumpStrength;
};

Bird.prototype.draw = function() {
    ctx.save();

    ctx.strokeStyle = "rgb(80, 40, 19)";
    ctx.lineWidth = 2;

    // Body
    ctx.fillStyle = "rgb(255, 190, 0)";
    ctx.beginPath();
    ctx.ellipse(
        this.x,
        this.y,
        this.w,
        this.h,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Wing
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.beginPath();
    ctx.ellipse(
        this.x - 10,
        this.y + 4,
        8,
        5,
        -0.3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Upper lip
    ctx.fillStyle = "rgb(247, 118, 3)";
    ctx.beginPath();
    ctx.roundRect(
        this.x + 4,
        this.y + 1,
        12,
        5,
        3
    );
    ctx.fill();
    ctx.stroke();

    // Lower lip
    ctx.fillStyle = "rgb(247, 118, 3)";
    ctx.beginPath();
    ctx.roundRect(
        this.x + 4,
        this.y + 5,
        10,
        4,
        3
    );
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
        this.x + 7,
        this.y - 5,
        4,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Pupil
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(
        this.x + 9,
        this.y - 5,
        2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
};

function getNextPole() {
    let nextPole = null;

    for (let i = 0; i < poles.length; i++) {
        const p = poles[i];

        if (p.x + poleW > bird.x) {
            if (
                nextPole === null ||
                p.x < nextPole.x
            ) {
                nextPole = p;
            }
        }
    }

    return nextPole;
}

Bird.prototype.update = function() {
    if(demoMode){
        const nextPole = getNextPole();

        if (!nextPole) return;

        const targetY = nextPole.y;
        const tolerance = 15;

        if (bird.y > targetY + tolerance &&
            bird.vy > -2) {
            bird.flap();
        }
    }

    this.vy += gravity;
    this.y += this.vy;
};

const bird = new Bird(
    canvas.width / 4,
    canvas.height / 2
);

function Pole(x, y) {
    this.x = x;
    this.y = y;

    this.counted = false;
}

Pole.prototype.draw = function() {
    ctx.save();

    const gapStart = this.y - gap / 2;
    const gapEnd = this.y + gap / 2;

    ctx.fillStyle = "rgb(115, 190, 40)";
    ctx.strokeStyle = "black";
    ctx.beginPath();

    ctx.rect(this.x, 0, poleW, gapStart);
    ctx.rect(this.x - 10, gapStart - 20, poleW + 20, 20);
    ctx.rect(this.x, gapEnd, poleW, canvas.height);
    ctx.rect(this.x - 10, gapEnd, poleW + 20, 20);
    
    ctx.stroke();
    ctx.fill();

    ctx.restore();
}

function getRightmostPoleX(excludePole) {
    let rightmostX = 0;

    for (let i = 0; i < poles.length; i++) {
        const p = poles[i];

        if (p === excludePole) {
            continue;
        }

        if (p.x > rightmostX) {
            rightmostX = p.x;
        }
    }

    return rightmostX;
}

Pole.prototype.update = function() {
    this.x -= poleSpeed;

    if (this.x + poleW < 0) {
        const rightmostX = getRightmostPoleX(this);

        this.x = rightmostX + poleSpacing;

        this.counted = false;
    }
};

const poleSpacing = 240;

const poles = [
    new Pole(canvas.width, 180),
    new Pole(canvas.width + poleSpacing, 260),
    new Pole(canvas.width + poleSpacing * 2, 150)
];

function checkPoleCollision(pole) {
    const birdLeft = bird.x - 12;
    const birdRight = bird.x + 12;
    const birdTop = bird.y - 10;
    const birdBottom = bird.y + 10;

    const poleLeft = pole.x;
    const poleRight = pole.x + poleW;

    const gapStart = pole.y - gap / 2;
    const gapEnd = pole.y + gap / 2;

    const overlapsHorizontally =
        birdRight > poleLeft &&
        birdLeft < poleRight;

    if (!overlapsHorizontally) {
        return false;
    }

    return (
        birdTop < gapStart ||
        birdBottom > gapEnd
    );
}

function checkCollisions() {
    const birdTop = bird.y - 10;
    const birdBottom = bird.y + 10;

    if (
        birdTop <= 0 ||
        birdBottom >= canvas.height
    ) {
        return true;
    }

    for (let i = 0; i < poles.length; i++) {
        if (checkPoleCollision(poles[i])) {
            return true;
        }
    }

    return false;
}

function calcScore() {
    if(!demoMode){
        for (let i = 0; i < poles.length; i++) {
            const p = poles[i];
    
            if (
                !p.counted &&
                p.x + poleW < bird.x
            ) {
                score++;
                p.counted = true;
            }
        }
    }
}

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");

function drawBackground() {
    ctx.fillStyle = "rgb(173, 230, 237)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function syncUI() {
    ctx.save();
    ctx.fillStyle = "rgb(80, 40, 19)",
    ctx.font = "18px Arial";
    ctx.textBaseline = "middle";

    if(demoMode){

        ctx.textAlign = "left";
        ctx.fillText(
            "flappybird",
            90,
            20
        );
    
        ctx.textAlign = "right";
        ctx.fillText(
            "High Score: " + highScore,
            canvas.width - 150,
            20
        );

        startBtn.hidden = true;
        retryBtn.hidden = true;
        homeBtn.hidden = true;
        return;
    } else {
        ctx.textAlign = "center";
        ctx.fillText(
            score,
            canvas.width / 2,
            30
        );
    
        startBtn.hidden = game !== Game.start;
        retryBtn.hidden = game !== Game.over;
        homeBtn.hidden = game !== Game.over;
    }
    ctx.restore();
}

function drawGame() {
    drawBackground();
    for (let i = 0; i < poles.length; i++) {        
        poles[i].draw();
    }
    bird.draw();
    syncUI();
}

function updateGame() {    
    for (let i = 0; i < poles.length; i++) {
        poles[i].update();                
    }
    bird.update();
    calcScore();
    if (checkCollisions()) {
        game = Game.over;
    }
}

const flappyTheme = {
    c1: "rgb(115, 190, 40)",
    c2: "rgb(173, 230, 237)",
    border: "rgb(80, 40, 19)",
    shadow: "rgba(249, 194, 145, 0.7)",
    textColor: "rgb(80, 40, 19)"
}

const Game = {
    start: "start",
    play: "playing",
    over: "game over"
}

let game = demoMode ? Game.play : Game.start;

function gameState() {
    switch(game){
        case Game.start:
            drawGame();
            drawStartGame(ctx, flappyTheme, "Flappy Bird");
            break;

        case Game.play: 
            updateGame();
            drawGame();           
            break;

        case Game.over:
            updateHighScore();
            drawGame();
            drawGameOver(ctx, flappyTheme, score, highScore);
            break;
    }
}

startBtn.addEventListener("click", () => {
    game = Game.play;
    startBtn.hidden = true;
})

retryBtn.addEventListener("click", () => {
    window.location.reload();    
    syncUI();
    return;
})

homeBtn.addEventListener("click", () => {
    window.location.href = "../mygames.html";
    syncUI();
    return;
})

function draw() {
    gameState();    
}

draw();
setInterval(draw, 1000/60);