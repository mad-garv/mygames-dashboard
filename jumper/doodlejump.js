import {
    drawStartGame,
    drawGameOver
} from "../shared/ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const params = new URLSearchParams(window.location.search);
const demoMode = params.get("demo") === "true";

let jumps = 0;

const gravity = 0.3;
let jumpStrength = -9.5;

let leftDown = false;
let rightDown = false;

let gridOffsetY = 0;
const gridSize = 15;

let alive = true;

let score = 0;
let distTravelled = 0;
let jumpBonus = 0;

const highScoreKey = "doodlejumpHighScore";

let highScore =
    Number(localStorage.getItem(highScoreKey)) || 0;

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(highScoreKey, highScore);
    }
}

/*Event Listeners for jumper movement
 - keydown: sets direction for as long as key is pressed
 - keyup: stops movement of jumper in said direction
 */
document.addEventListener("keydown", function (e) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === "ArrowLeft") {
        leftDown = true;
    }
    if (e.key === "ArrowRight") {
        rightDown = true;
    }
});

document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft") {
        leftDown = false;
    }
    if (e.key === "ArrowRight") {
        rightDown = false;
    }
});

/*Jumper
    - jumper constructor, to store pos, size, velocity
    - jumper draw, draws the jumper
    - jumper update, to update jumpers pos based on keypress
    - jumper jump, moves jumper upward
*/
function Jumper(x, y) {
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 40;
    this.vx = 0;
    this.vy = 0;

    this.jetActive = false;
    this.jetTimer = 0;
}

Jumper.prototype.startJetpack = function() {
    this.jetActive = true;
    this.jetTimer = 120;
};

Jumper.prototype.draw = function () {
    ctx.fillStyle = "rgb(168, 221, 18)";

    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(this.x - 9, this.y, this.w, 20);

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x + 3, this.y - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x + 4, this.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
};

Jumper.prototype.update = function () {
    if (leftDown) {
        this.vx = -4.5;
    } else if (rightDown) {
        this.vx = 4.5;
    } else {
        this.vx = 0;
    }
    this.x += this.vx;
    
    if(this.jetActive){
        this.vy = -12;
        this.jetTimer--;
        if(this.jetTimer <= 0){
            this.jetActive = false;
        }
    } else {
        this.vy += gravity;
    }    
    this.y += this.vy;

    if (this.x < 0) {
        this.x = canvas.width;
    }
    if (this.x > canvas.width) {
        this.x = 0;
    }

    if (this.y >= canvas.height + 20) {
        alive = false;
    }

    if (demoMode && jumps > 0) {

        const leftTarget =
            canvas.width / 2
            - 2 * platformW
            + platformW / 2;

        const rightTarget =
            canvas.width / 2
            + platformW
            + platformW / 2;

        const tolerance = 10;

        if (jumps % 2 === 0) {

            // Move toward left green platform
            if (this.x > leftTarget + tolerance) {
                leftDown = true;
                rightDown = false;
            } else {
                leftDown = false;
                rightDown = false;
            }

        } else {

            // Move toward right green platform
            if (this.x < rightTarget - tolerance) {
                rightDown = true;
                leftDown = false;
            } else {
                rightDown = false;
                leftDown = false;
            }
        }
    }
};

Jumper.prototype.jump = function (strength = jumpStrength) {
    this.vy = strength;
};

/*to draw jumper at initial location */
const jumper = new Jumper(200, canvas.height - 100);

/*Platforms
    - platform constructor, for various platform charactersitic values
        pos, size, breaking, moving etc 
    - platform draw, to draw individual platforms, based on characteristics
*/
const platformW = 68;
const platformH = 12;

const springX = 40;
const springY = 12;
const springW = 12;
const springH = 10;

const jetX = 15;
const jetY = 18;
const jetW = 12;
const jetH = 18;

function Platform(x, y, type, power) {
    this.x = x;
    this.y = y;
    this.w = 68;
    this.h = 10;
    this.type = type;
    this.power = power;
    this.counted = false;

    /*following sets platform type based on value of type*/
    this.normal = false;
    this.breaking = false;
    this.moving = false;
    this.disappearing = false;

    this.spring = false;
    this.jet = false;

    this.broken = false; 
    this.disappeared = false;

    this.setType(type);

    /*handling the movement of moving platforms*/
    this.vx = 1.5;
    this.minX = 0;
    this.maxX = canvas.width - this.w;

    this.setPower(power);
    this.powerUsed = false;
}

Platform.prototype.setType = function (type) {
    this.type = type;

    /*following sets platform type based on value of type*/
    this.normal = (type < 0.75);
    this.moving = (type >= 0.75 && type < 0.85);
    this.breaking = (type >= 0.85 && type < 0.95);
    this.disappearing = (type >= 0.95);
}

Platform.prototype.setPower = function (power) {
    this.power = power;
    this.spring = false;
    this.jet = false;

    if (!this.normal) {
        return;
    }

    if(power < 0.07){
        this.spring = true;        
    } else if(power < 0.1){
        this.jet = true;
    }
}

function drawSpring(x, y) {
    ctx.beginPath();
    ctx.fillStyle = "rgb(209, 209, 209)";
    ctx.fillRect(x + springX, y - springY, springW, springH);
}

function drawJet(x, y){
    ctx.beginPath();
    ctx.fillStyle = "rgb(255, 0, 0)";
    ctx.roundRect(x + jetX, y - jetY, jetW / 2, jetH, 5);
    ctx.roundRect(x + jetX + jetW / 2, y - jetY, jetW / 2, jetH, 10);
    ctx.fill();
}

Platform.prototype.draw = function () {
    if (this.broken || this.disappeared) {
        return;
    }

    ctx.save();
    ctx.strokeStyle = "rgb(35, 31, 32)";
    // Soft shadow                
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    if (this.breaking) {
        ctx.shadowColor = "rgba(161, 113, 45, 0.5)";
        ctx.fillStyle = "rgb(192, 143, 90)";
    } else if (this.moving) {
        ctx.shadowColor = "rgba(0, 133, 215, 0.5)";
        ctx.fillStyle = "rgb(0, 174, 239)";
    } else if (this.disappearing) {
        ctx.shadowColor = "rgba(211, 213, 215, 0.5)";
        ctx.fillStyle = "rgb(240, 240, 240)";
    } else if (this.normal) {
        ctx.shadowColor = "rgba(111, 163, 45, 0.5)";
        ctx.fillStyle = "rgb(140, 198, 62)";
    }

    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 5);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    if (this.spring) {
        drawSpring(this.x, this.y);
    } else if (this.jet){
        drawJet(this.x, this.y);
    }
    ctx.restore();
};

Platform.prototype.update = function () {
    if (!this.moving) {
        return;
    }

    this.x += this.vx;

    if (this.x <= this.minX) {
        this.x = this.minX;
        this.vx = Math.abs(this.vx);
    }

    if (this.x >= this.maxX) {
        this.x = this.maxX;
        this.vx = -Math.abs(this.vx);
    }

}

/*array to store all platforms, to cycle through the screen
for loop to push platforms into array*/
const platforms = [];
const numPlatforms = demoMode ? 12 : 9;

const minGap = 50;
const maxGap = 120;
const breakingMinGap = 30;
const breakingMaxGap = 45;

let previousY = canvas.height - 10 - platformH;
let prevBreaking = false;

for (let i = 0; i < numPlatforms; i++) {
    if (i === 0) {
        platforms.push(
            new Platform(
                canvas.width / 2 - platformW / 2,
                previousY,
                0.5,
                0.5
            )
        );
    } else {
        let gap = 0;
        let x = 0;
        let platType = 0;
        let platPower = 1;
        if (demoMode) {
            gap = 45;
            previousY -= gap;
            x = canvas.width / 2 - platformW / 2;
            if (i % 2 === 0) {
                platType = 0.5;
                if (i % 4 === 0) {
                    x = canvas.width / 2 - 2 * platformW;
                } else {
                    x = canvas.width / 2 + platformW;
                }
            } else {
                x = Math.random() * (canvas.width - platformW);
                platType = Math.random() * (0.25) + 0.75;
            }
        } else {
            if (prevBreaking) {
                // guarantee a nearby safe platform
                gap = Math.random() * (60 - 40) + 20;
                platType = Math.random() * 0.85;
            } else {
                platType = Math.random();
                if (platType >= 0.85) {
                    // Current platform is breaking,
                    // so keep it close to the safe platform below it.
                    gap = Math.random() * (breakingMaxGap - breakingMinGap) + breakingMinGap;
                } else {
                    // Normal/moving platform
                    gap = Math.random() * (maxGap - minGap) + minGap;
                }
            }
            previousY -= gap;
            x = Math.random() * (canvas.width - platformW);
            platPower = Math.random();
        }
        const platform = new Platform(
            x,
            previousY,
            platType,
            platPower
        )
        platforms.push(platform);
        if (!demoMode) {
            prevBreaking = platform.breaking;
        }
    }
}

function handlePowerUps(p, jl, jr){
    const hitSpring = (
        jr > p.x + springX &&
        jl < p.x + springX + springW
    );

    if (p.spring && hitSpring) {
        jumper.jump(-16);
    } else {
        jumper.jump();
    }
}

/*method to check if player lands on a platform,
    and makes it jump */
function checkPlatformCollisions() {
    for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];            

        const playerBottom = jumper.y + jumper.h / 2;
        const prevBottom = playerBottom - jumper.vy;

        const jumperLeft = jumper.x - jumper.w / 2;
        const jumperRight = jumper.x + jumper.w / 2;

        if (
            jumper.vy > 0 &&
            jumperRight > p.x &&
            jumperLeft < p.x + p.w &&
            prevBottom <= p.y &&
            playerBottom >= p.y
        ) {
            if(p.disappeared){
                return;
            }
            if (p.breaking) {
                p.broken = true;
                return;
            }
            if(p.disappearing){
                p.disappeared = true;
            }                        

            handlePowerUps(p, jumperLeft, jumperRight);

            if (demoMode) {
                jumps++;
            }

            if (!p.counted) {
                if (!demoMode) {
                    jumpBonus += 5;
                }
                p.counted = true;
            }
        }
    }
}

function jetpack() {
    const jumperLeft = jumper.x - jumper.w / 2;
    const jumperRight = jumper.x + jumper.w / 2;

    const jumperTop = jumper.y - jumper.h / 2;
    const jumperBottom = jumper.y + jumper.h / 2;

    for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];

        if (!p.jet || p.powerUsed) {
            continue;
        }

        const jetLeft = p.x + jetX;
        const jetRight = jetLeft + jetW;

        const jetTop = p.y - jetY;
        const jetBottom = jetTop + jetH;

        const hitJet =
            jumperRight > jetLeft &&
            jumperLeft < jetRight &&
            jumperBottom > jetTop &&
            jumperTop < jetBottom;

        if (hitJet) {
            jumper.startJetpack();
            p.powerUsed = true;
        }
    }
}

function getHighestPlatform(excludePlatform) {
    let highest = null;

    for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];

        if (p === excludePlatform) {
            continue;
        }

        if (
            highest === null ||
            p.y < highest.y
        ) {
            highest = p;
        }
    }

    return highest;
}

/*method to make the UI move upward, giving a scrolling effect*/
function scroll() {
    const scrollHeight = canvas.height / 2;
    if (jumper.y < scrollHeight && jumper.vy < 0) {
        const scrollAmount = -jumper.vy;
        jumper.y = scrollHeight;
        //distanceScore += scrollAmount / 10;
        distTravelled += scrollAmount;

        gridOffsetY += scrollAmount;

        for (let i = 0; i < platforms.length; i++) {
            platforms[i].y += scrollAmount;

            if (platforms[i].y > canvas.height) {
                if (demoMode) {
                    platforms[i].y = 0;

                    platforms[i].broken = false;
                    platforms[i].counted = false;

                    if (i % 2 === 0) {
                        // green platforms alternate left/right
                        platforms[i].setType(0.5);

                        if (i % 4 === 0) {
                            platforms[i].x =
                                canvas.width / 2 - 2 * platformW;
                        } else {
                            platforms[i].x =
                                canvas.width / 2 + platformW;
                        }

                    } else {
                        // special platform
                        platforms[i].x = Math.random() * (canvas.width - platformW);

                        platforms[i].setType(
                            Math.random() * 0.25 + 0.75
                        );
                    }
                } else {
                    const highest = getHighestPlatform(platforms[i]);

                    let re_gap;
                    let newType;

                    if (highest.breaking) {
                        // Previous/highest platform is breaking,
                        // so this one must be safe and nearby.
                        newType = Math.random() * 0.85;
                        re_gap = Math.random() * (breakingMaxGap - breakingMinGap) + breakingMinGap;

                    } else {
                        newType = Math.random();
                        if (newType >= 0.85) {
                            // New platform itself is breaking,
                            // so keep it close to the safe platform below.
                            re_gap = Math.random() * (breakingMaxGap - breakingMinGap) + breakingMinGap;
                        } else {
                            re_gap = Math.random() * (maxGap - minGap) + minGap;
                        }
                    }

                    platforms[i].y = highest.y - re_gap;
                    platforms[i].x = Math.random() * (canvas.width - platformW);

                    platforms[i].counted = false;
                    platforms[i].broken = false;
                    platforms[i].disappeared = false;

                    platforms[i].setType(newType);
                    platforms[i].setPower(Math.random());
                    platforms[i].powerUsed = false;
                }
            }
        }
    }
}

function calcScore() {
    if (!demoMode) {
        return Math.floor(distTravelled / 10) + jumpBonus;
    }
    return 0;
}


function drawBackground() {
    ctx.fillStyle = "rgb(253, 241, 220)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(245, 200, 200, 0.35)";
    ctx.lineWidth = 1;

    const offset = gridOffsetY % gridSize;

    // Horizontal lines
    for (let y = -gridSize + offset; y <= canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function drawGame() {
    drawBackground();
    for (let i = 0; i < platforms.length; i++) {
        platforms[i].draw();
    }
    jumper.draw();
    ctx.fillText(calcScore(), 350, 25);
    syncUI();
}

function updateGame() {
    for (let i = 0; i < platforms.length; i++) {
        platforms[i].update();
    }
    jumper.update();
    if (!alive) {
        game = Game.over;
        score = calcScore();
        updateHighScore();
        return;
    }
    checkPlatformCollisions();
    jetpack();
    scroll();
}

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");

const doodleTheme = {
    c1: "rgb(140, 198, 62)",
    c2: "rgb(253, 241, 220)",
    border: "rgba(245, 200, 200, 0.35)",
    shadow: "rgba(111, 163, 45, 0.5)",
    textColor: "rgb(35, 31, 32)"
}

const Game = {
    start: "start",
    play: "playing",
    over: "game over"
}

let game = demoMode ? Game.play : Game.start;
function gameState() {
    //game = Game.over;
    switch (game) {
        case Game.start:
            drawGame();
            drawStartGame(ctx, doodleTheme, "DoodleJump");
            break;

        case Game.play:
            updateGame();
            drawGame();
            break;

        case Game.over:
            drawGame();
            drawGameOver(ctx, doodleTheme, score, highScore);
            break;
    }
}

function syncUI() {
    ctx.fillStyle = "#542b35";
    ctx.font = "18px Arial";
    ctx.textBaseline = "middle";

    if (demoMode) {

        ctx.textAlign = "left";
        ctx.fillText(
            "DoodleJump",
            15,
            115
        );

        ctx.textAlign = "right";
        ctx.fillText(
            "High Score: " + highScore,
            canvas.width - 15,
            115
        );

        startBtn.hidden = true;
        retryBtn.hidden = true;
        homeBtn.hidden = true;
        return;
    } else {
        startBtn.hidden = game !== Game.start;
        retryBtn.hidden = game !== Game.over;
        homeBtn.hidden = game !== Game.over;
    }
}

startBtn.addEventListener("click", () => {
    game = Game.play;
    syncUI();
    startBtn.hidden = true;
});

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
setInterval(draw, 1000 / 60);