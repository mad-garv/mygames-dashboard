export function drawPanel(ctx, {
    x = ctx.canvas.width / 2 - 100,
    y = ctx.canvas.height / 2 - 90,
    w = 200,
    h = 180,
    c1 = "white",
    c2 = "white",
    shadow = "black",
    stroke = "black",
    lineWidth = 1.5,
    radius = 10,
    text = "Game"
} = {}) {
    ctx.save();

    // Subtle vertical gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);

    ctx.fillStyle = gradient;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;

    // Soft shadow
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

export function drawStartGame(ctx, theme, title) {
    const canvas = ctx.canvas;

    drawPanel(ctx, {
        c1: theme.c1 ?? "white",
        c2: theme.c2 ?? "white",
        stroke: theme.border ?? "black",
        shadow: theme.shadow ?? "black"
    });

    ctx.save();

    ctx.fillStyle = theme.textColor ?? "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Game title
    ctx.font = "24px Arial";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 60);

    // Strat game
    ctx.font = "16px Arial";
    ctx.fillText("Start Game", canvas.width / 2, canvas.height / 2 + 60);

    ctx.restore();
}

export function drawGameOver(ctx, theme, score, highScore) {
    const canvas = ctx.canvas;

    drawPanel(ctx, {
        c1: theme.c1 ?? "white",
        c2: theme.c2 ?? "white",
        stroke: theme.border ?? "black",
        shadow: theme.shadow ?? "black"
    });

    ctx.save();

    ctx.fillStyle = theme.textColor ?? "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Game title
    ctx.font = "24px Arial";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 60);

    // Score
    ctx.font = "16px Arial";
    ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 - 35);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 - 15);

    ctx.restore();
}

export function drawMenu(ctx, theme, text, subtext) {
    const canvas = ctx.canvas;

    drawPanel(ctx, {
        c1: theme.c1 ?? "white",
        c2: theme.c2 ?? "white",
        stroke: theme.border ?? "black",
        shadow: theme.shadow ?? "black"
    });

    ctx.save();

    ctx.fillStyle = theme.textColor ?? "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    //Main text
    ctx.font = "20px Arial";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 60);

    // Sub text
    ctx.font = "16px Arial";
    ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 60);

    ctx.restore();
}