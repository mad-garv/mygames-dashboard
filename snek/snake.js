import {
    drawStartGame,
    drawGameOver,
    drawMenu
} from "../shared/ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const params = new URLSearchParams(window.location.search);
const demoMode = params.get("demo") === "true";

let score = 0;

const highScoreKey = "snekHighScore";

let highScore =
    Number(localStorage.getItem(highScoreKey)) || 0;

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(highScoreKey, highScore);
    }
}

const Game = {
    start: "start",
    play: "playing",
    over: "game over"
}

let game = demoMode ? Game.play : Game.start;

const tileSize = 25;
const numCols = canvas.width / tileSize;
const numRows = canvas.height / tileSize;

/**Snake array - holds all the snake segments
 *  snake[0] = head of snake
 */
let snake = [
    { col: 8, row: 8 },
    { col: 7, row: 8 },
    { col: 6, row: 8 }
];

let dx = 1;
let dy = 0;

let nextDx = 1;
let nextDy = 0;

/**Method to draw the head of the snake*/
function drawHead(col, row) {
    ctx.fillStyle = "rgb(0, 167, 17)";
    ctx.beginPath();
    ctx.arc(
        col * tileSize + tileSize / 2 + 1,
        row * tileSize + tileSize / 2,
        tileSize * 0.6,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.arc(
        col * tileSize + tileSize * 0.75,
        row * tileSize + tileSize * 0.3,
        2.5,
        0,
        Math.PI * 2
    );
    ctx.arc(
        col * tileSize + tileSize * 0.75,
        row * tileSize + tileSize * 0.7,
        2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

/**drawSnake()
 * draws snake segment by segment,
 * each having col and row values depicting its position on the grid
 */
function drawSnake() {

    let isFirst = true;
    for (const seg of snake) {
        if (isFirst) {
            drawHead(seg.col, seg.row);
            isFirst = false;
        } else {
            ctx.fillStyle = "rgb(0, 167, 17)";
            ctx.beginPath();
            ctx.arc(
                seg.col * tileSize + tileSize / 2,
                seg.row * tileSize + tileSize / 2,
                tileSize * 0.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
}

function moveSnake() {
    dx = nextDx;
    dy = nextDy;

    const head = {
        col: snake[0].col + dx,
        row: snake[0].row + dy
    };

    if (head.col >= numCols) {
        head.col = 0;
    } else if (head.col < 0) {
        head.col = numCols - 1;
    }

    if (head.row >= numRows) {
        head.row = 0;
    } else if (head.row < 0) {
        head.row = numRows - 1;
    }

    if(demoMode){
        if(food.col > head.col && dx !== -1) {
            nextDx = 1;
            nextDy = 0;
        } else if (food.col < head.col && dx !== 1) {
            nextDx = -1;
            nextDy = 0;
        } else if(food.row > head.row && dy !== -1) {
            nextDx = 0;
            nextDy = 1;
        } else if (food.row < head.row && dy !== 1){
            nextDx = 0;
            nextDy = -1;
        }
    }

    if (ateSnake(head) && !demoMode) {        
        game = Game.over;
        return;
    }

    snake.unshift(head);

    if (ateFood(head)) {
        if(!demoMode){
            score += 5;
        }
        spawnFood();
    } else {
        snake.pop();
    }
}

/* Food
    - setting a food object with random grid coordinates
    - draws the food object at set coordinates on the grid
    - checks whether head of snake overlaps with food object(i.e., snake eats food)
    - random coordinates passed to the food object when snake eats food
 */

let food = {
    col: Math.floor(Math.random() * numCols),
    row: Math.floor(Math.random() * numRows)
};

function drawFood() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(
        food.col * tileSize + tileSize / 2,
        food.row * tileSize + tileSize / 2,
        tileSize / 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

/* Method to randomly spawn food on the grid */
function spawnFood() {
    let newFood;

    do {
        newFood = {
            col: Math.floor(Math.random() * numCols),
            row: Math.floor(Math.random() * numRows)
        };
    } while (
        snake.some(seg =>
            seg.col === newFood.col &&
            seg.row === newFood.row
        )
    );

    food = newFood;
}

function ateFood(pos) {
    if (pos.col === food.col && pos.row === food.row) {
        return true;
    }
    return false;
}

/*Method to check if snake head collides with some part of snake body*/
function ateSnake(position) {
    return snake.some(seg =>
        seg.col === position.col &&
        seg.row === position.row
    );
}

function drawBackground() {
    ctx.save();

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            ctx.fillStyle =
                (row + col) % 2 === 0
                    ? "rgb(38, 139, 7)"
                    : "rgb(19, 109, 21)";
            ctx.beginPath();
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
    }

    ctx.restore();
}

function drawGame() {
    drawBackground();
    drawFood();
    drawSnake();
    syncUI();
}

const snakeTheme = {
    c1: "rgb(19, 109, 21)",
    c2: "rgb(0, 149, 2)",
    border: "red",
    shadow: "rgb(0, 167, 17)",
    textColor: "black"
}

function gameState() {
    switch (game) {
        case Game.start:
            drawGame();
            drawStartGame(ctx, snakeTheme, "Snake");
            break;

        case Game.play:
            moveSnake();
            drawGame();
            break;

        case Game.over:
            updateHighScore();
            drawGame();
            drawGameOver(ctx, snakeTheme, score, highScore);            
            break;
    }
}

document.addEventListener("keydown", function (e) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === "ArrowLeft" && dx !== 1) {
        nextDx = -1;
        nextDy = 0;
    } else if (e.key === "ArrowRight" && dx !== -1) {
        nextDx = 1;
        nextDy = 0;
    } else if (e.key === "ArrowUp" && dy !== 1) {
        nextDx = 0;
        nextDy = -1;
    } else if (e.key === "ArrowDown" && dy !== -1) {
        nextDx = 0;
        nextDy = 1;
    }
});

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");

startBtn.addEventListener("click", () => {
    game = Game.play;
    startBtn.hidden = true;
})

retryBtn.addEventListener("click", () => {
    window.location.reload();
    return;
})

homeBtn.addEventListener("click", () => {
    window.location.href = "../mygames.html";
    return;
})

function syncUI() {

    ctx.fillStyle = "rgb(185, 255, 144)";
    ctx.font = "18px Arial";
    ctx.textBaseline = "middle";

    if(demoMode) {
        ctx.textAlign = "left";
        ctx.fillText(
            "Snake",
            15,
            15
        );
    
        ctx.textAlign = "right";
        ctx.fillText(
            "High Score: " + highScore,
            canvas.width - 15,
            15
        );
        
        startBtn.hidden = true;
        retryBtn.hidden = true;
        homeBtn.hidden = true;
        return;
    } else {        
        ctx.fillText(score, 360, 15);

        startBtn.hidden = game !== Game.start;
        retryBtn.hidden = game !== Game.over;
        homeBtn.hidden = game !== Game.over;   
    }
}

function draw() {
    gameState();    
}

draw();
setInterval(draw, 150);