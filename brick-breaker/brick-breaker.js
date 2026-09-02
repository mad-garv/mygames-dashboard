import {
    drawPanel, 
    drawStartGame,
    drawGameOver,
    drawMenu 
} from "../shared/ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const params = new URLSearchParams(window.location.search);
const demoMode = params.get("demo") === "true";

if (demoMode) {
    document.getElementById("lives-container").style.display = "none";
}

ctx.textAlign = "center";
ctx.textBaseline = "middle";

/*Scoring Rules:
    - brick hit = +5
    - brick killed = +10
    - row cleared = +15
    - life lost = -50
    - lives bonus(at end of level/game) = lives remaining * 30
*/
let score = 0;
let streak = 0;
const brickBonus = 10;
const rowBonus = 15;
const lifePenalty = -50;

function addScore(amount) {
    if (!demoMode) {
        score += amount;
    }
}

const highScoreKey = "brick-breakerHighScore";

let highScore =
    Number(localStorage.getItem(highScoreKey)) || 0;

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(highScoreKey, highScore);
    }
}

let lives = 3;
let level = 1;

/*method to draw the background*/
function drawBackground() {
    ctx.fillStyle = "rgb(255, 126, 126)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/*Level select screen
    - array of button objects to loop through when drawing/clicking
    - draw method to draw  whole level select screen
    
const levelButtons = [];
const startX = 140;
const startY = 160;
const gapX = 80;
const gapY = 70;


for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
        levelButtons.push({
            level: level,
            x: startX + i * gapX,
            y: startY + j * gapY,
            w: buttonSize,
            h: buttonSize
        });
        level++;
        }
}   --- removing button functions and adding html buttons

function drawLvlSelect() {
    drawBox({ w: 200 });
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "20px Arial";
    ctx.fillText("Level Select", canvas.width / 2, 130);

    ctx.font = "18px Arial";
    for (let i = 0; i < levelButtons.length; i++) {
        const btn = levelButtons[i];

        drawButton({
            x: btn.x,
            y: btn.y
        });

        ctx.fillStyle = "black";
        ctx.fillText(btn.level, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
}*/

/*The board
    - the y position is fixed, x position changes according to mouse
    - x has a start position variable
*/
const boardW = 60;
const boardH = 10;
const boardY = 390;
const boardStartX = 200 - boardW / 2;
let boardX = boardStartX;
let mouseX = canvas.width / 2;

function drawBoard() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgb(255, 107, 107)";
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 5);
    ctx.fill();
    ctx.stroke();
}

/*The Ball
    - set values for ball size, position and speed
    - set values for speed increase
*/
const ballR = 7.5;
let ballX = 200;
let ballY = boardY - ballR - 1;
//boardX = ballX - boardW / 2;

const minSpeedX = 1.2;
const maxSpeedX = demoMode ? 3.5 : 7.5;
let speedX = Math.random() * 4 - 2;
if(Math.abs(speedX) < minSpeedX) {
    speedX = speedX < 0 ? -minSpeedX : minSpeedX;
}

let speedY = -(Math.random() * 2 + 1);
const maxSpeedY = demoMode ? 4.5 : 7.5;

let demoSpeedX = 3.5;
let demoSpeedY = 2;

const speedIncreaseX = 0.5;
const speedIncreaseY = 0.5;

//prev ball positions to be used for collision handling
let prevBallX = ballX;
let prevBallY = ballY;

function drawBall(x, y) {
    ctx.fillStyle = "rgb(26, 24, 26)";
    ctx.beginPath();
    ctx.arc(x, y, ballR, 0, Math.PI * 2);
    ctx.fill();
}

/*Updating the ball
    - ball gets redrawn repeatedly
    - ball position changes by adding speed values to position vals
    - ball bounces off of canvas sides and ceiling
    - ball bounces when it hits the board
*/
function updateBall() {

    prevBallX = ballX;
    prevBallY = ballY;

    ballX += speedX;
    ballY += speedY;

    if (ballX + ballR >= canvas.width || ballX - ballR <= 0) {
        speedX = -speedX;
    }

    if (ballY - ballR <= 0) {
        speedY = -speedY;
    }

    if (
        ballY + ballR >= boardY &&
        ballY + ballR <= boardY + boardH &&
        ballX >= boardX &&
        ballX <= boardX + boardW
    ) {
        speedY = -Math.abs(speedY);
    }

    if(demoMode) {
        boardX = ballX - boardW / 2;
    }
    

}

/* method to reset ball and board positions */
function resetPlay() {
    ballX = 200;
    ballY = boardY - ballR - 2;
    boardX = boardStartX;

    speedX = Math.abs(speedX);
    speedY = -Math.abs(speedY);
}

/*Drawing the Bricks
    - set all the variable values for bricks
    - makeBrick: to return a brick object
    - bricks[]: array to hold all the bricks
    - drawBrick: takes a brick object and draws it
    - brickHit: handles the logic of when the ball hits a break
*/
const brickCols = 8;
const brickGap = 3;
const brickW = (canvas.width) / (brickCols) - brickGap;
const brickH = 20;
const brickStartX = 5;
const brickStartY = 30;

const bricks = [];

function makeBrick(x, y, row, brickRows) {
    return {
        x: x,
        y: y,
        w: brickW,
        h: brickH,
        row: row,
        hitsLeft: brickRows - row,
        alive: true
    };
}

/*method to set up a level and push bricks to array*/
function createBricks(lvl) {
    bricks.length = 0;
    const brickRows = lvl;

    for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
            const x = brickStartX + col * (brickW + brickGap - 1);
            const y = brickStartY + row * (brickH + brickGap);
            bricks.push(makeBrick(x, y, row, brickRows));
        }
    }
}
createBricks(level);

function drawBrick(brick) {
    if (brick.hitsLeft === 4) {
        ctx.fillStyle = "rgb(255, 0, 0)";
    } else if (brick.hitsLeft === 3) {
        ctx.fillStyle = "rgb(255, 75, 0)";
    } else if (brick.hitsLeft === 2) {
        ctx.fillStyle = "rgb(255, 125, 0)";
    } else {
        ctx.fillStyle = "rgb(255, 175, 0)";
    }
    ctx.strokeStyle = "rgb(0, 0, 0)"
    ctx.lineWidth = 1;

    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
}

function brickGrid() {
    for (let i = 0; i < bricks.length; i++) {
        if (bricks[i].alive) {
            drawBrick(bricks[i]);
        }
    }
}

function rowCleared(targetRow) {
    for (let i = 0; i < bricks.length; i++) {
        if (bricks[i].row === targetRow && bricks[i].alive) {
            return false;
        }
    }
    return true;
}

function bricksCleared() {
    for (let i = 0; i < bricks.length; i++) {
        if (bricks[i].alive) {
            return false;
        }
    }
    return true;
}

/*checks for ball hitting a brick and accordingly adjusts
    ball speeds and increments score*/
function brickHit() {
    for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (b.alive) {
            //drawBrick(b);

            if ( //checks if the ball hit the brick
                ballX + ballR > b.x &&
                ballX - ballR < b.x + b.w &&
                ballY + ballR > b.y &&
                ballY - ballR < b.y + b.h
            ) {

                if (prevBallX + ballR <= b.x) { //ball hit the left side
                    speedX = -Math.abs(speedX);          // so ball bounces toward left after collision 
                } else if (prevBallX - ballR >= b.x + b.w) { //ball hit the ride side 
                    speedX = Math.abs(speedX);               // so ball bounces off to the right
                } else if (prevBallY + ballR <= b.y) {//hit top
                    speedY = -Math.abs(speedY);      //so bounced upward
                } else if (prevBallY - ballR >= b.y + b.h) { //hit bottom
                    speedY = Math.abs(speedY);               //so bounced downward
                } else {
                    speedY = -speedY;
                }

                if (Math.abs(speedX) <= maxSpeedX) {
                    if (speedX > 0) {
                        speedX += speedIncreaseX;
                    } else {
                        speedX -= speedIncreaseX;
                    }
                }

                b.hitsLeft--;
                addScore(5 + streak);
                streak++;


                if (b.hitsLeft <= 0) {
                    b.alive = false;
                    addScore(brickBonus);

                    if (rowCleared(b.row)) {
                        addScore(rowBonus);

                        if (speedY > 0 && Math.abs(speedY) <= maxSpeedY) {
                            speedY += speedIncreaseY;
                        } else {
                            speedY -= speedIncreaseY;
                        }
                    }
                }

                break;
            }
        }
    }
}

function resetDemo() {
    lives = 3;
    level = 1;
    score = 0;
    streak = 0;

    createBricks(level);
    resetPlay();

    game = Game.play;
}

/*Game states
    - function to check for all the various game states and draw UI accordingly    
*/
const Game = {
    start: "start",
    play: "playing",
    life_lost: "lost a life",
    level_up: "completed a level",
    over: "game over",
    won: "game won"
}

//function to check if life is lost, and what to do when life is lost
function lifeLost() {
    if (ballY - ballR > canvas.height) {
        lives--;
        streak = 0;
        addScore(lifePenalty);
        resetPlay();

        if (lives > 0) {
            game = Game.life_lost;
        } else {            
            game = Game.over;
        }
        //syncUI();
    }
}

function levelUp() {
    if (!bricksCleared()) return;

    if (lives > 0) {
        if (level < 4) {
            level++;
            resetPlay();
            createBricks(level);

            if (demoMode) {
                game = Game.play;
            } else {
                game = Game.level_up;
            }            
            syncUI();
        } else {
            if (demoMode) {
                resetDemo();
            } else {
                game = Game.won;
            }
            syncUI();
        }
    }
}

const startBtn = document.getElementById("startBtn");
const continueBtn = document.getElementById("continueBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");

function syncUI() {

    if (demoMode) {
        startBtn.hidden = true;
        continueBtn.hidden = true;
        retryBtn.hidden = true;
        homeBtn.hidden = true;
        return;
    }

    startBtn.hidden = game !== Game.start;
    continueBtn.hidden = !(
        game === Game.life_lost ||
        game === Game.level_up
    );
    retryBtn.hidden = game !== Game.over;
    homeBtn.hidden = game !== Game.over;
}

const brickTheme = {
    c1: "rgb(255, 150, 150)",
    c2: "#ffe8e8",
    border: "rgba(120, 40, 40, 0.45)",
    shadow: "rgba(70, 20, 20, 0.5)",
    textColor: "#542b35"
}

let game = demoMode ? Game.play : Game.start;
function gameState() {
    switch (game) {
        case Game.start:           
            drawStartGame(ctx, brickTheme, "brick-breaker");
            break;

        case Game.play:
            updateBall();
            brickHit();
            lifeLost();
            levelUp();
            break;

        case Game.life_lost:            
            let lifeText = "";
            if (lives === 1) {
                lifeText = "1 life remaining";
            } else if (lives === 2) {
                lifeText = "2 lives remaining";
            }
            drawMenu(ctx, brickTheme, lifeText, "Continue");
            break;

        case Game.level_up:            
            drawMenu(ctx, brickTheme, "Level " + (level - 1) + " Complete", "Continue");
            break;

        case Game.over:
            updateHighScore();
            drawGameOver(ctx, brickTheme, score, highScore);
            break;

        case Game.won:
            addScore(lives * 30); //lives bonus
            updateHighScore();
            resetPlay();
            //drawBox();
            ctx.fillStyle = "#542b35";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.font = "24px Arial";
            ctx.fillText("You Win!", canvas.width / 2, 130);

            ctx.font = "18px Arial";
            ctx.fillText("Final Score: " + score, canvas.width / 2, 160);
            break;
    }
}

canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;

    if (game === Game.play) {
        boardX = Math.max(0, Math.min(mouseX - boardW / 2, canvas.width - boardW));
    }
});

startBtn.addEventListener("click", () => {
    game = Game.play;
    syncUI();
});

continueBtn.addEventListener("click", () => {
    game = Game.play;
    syncUI();
});

retryBtn.addEventListener("click", () => {
    window.location.reload();
})

homeBtn.addEventListener("click", () => {
    window.location.href = "../mygames.html";
})

function drawLives() {
    ctx.save();

    // Loop from 1 to 3 (matching our heart IDs)
    for (let i = 1; i <= 3; i++) {
        const heart = document.getElementById(`heart-${i}`);
        
        if (!heart) continue;

        if (i <= lives) {
        heart.classList.remove('lost');
        } else {
        heart.classList.add('lost');
        }
    }

    ctx.restore();
}

function UI() {
    ctx.save();

    ctx.fillStyle = "#542b35";
    ctx.font = "18px Arial";
    ctx.textBaseline = "middle";

    if (demoMode) {

        ctx.textAlign = "left";
        ctx.fillText(
            "Brick Breaker",
            15,
            20
        );
    
        ctx.textAlign = "right";
        ctx.fillText(
            "High Score: " + highScore,
            canvas.width - 15,
            20
        );

    } else {

        ctx.textAlign = "center";
        ctx.fillText("Score: " + score, 350, 20);
        ctx.fillText("Level: " + level, 200, 20);

        drawLives();
    }

    ctx.restore();
}

function draw() {
    drawBackground();
    //drawLvlSelect();
    drawBoard();
    brickGrid();
    drawBall(ballX, ballY);
    gameState();
    UI();
    syncUI();
}

draw();
setInterval(draw, 1000 / 60);