const gameArea = document.getElementById("game");
const ctx = gameArea.getContext("2d");
const score = document.querySelector(".score");
const highScore = document.querySelector(".highScore");
const resetBtn = document.querySelector(".reset");

let speed, 
highScoreCount, 
tileSize, 
tileCount, 
headX, 
headY, 
snakeBody, 
tailLength,
foodX,
foodY,
gameInPlay,
dx,
dy,
scoreCount,
isPaused = false; 

const init = () => {
    resetBtn.style.display = "none";
    headX = 10;
    headY = 10;
    snakeBody = [];
    tailLength = 1;
    tileSize = 10;
    tileCount = 40;
    foodX = 5;
    foodY = 5;
    gameInPlay = true;
    dx = 0;
    dy = 0;
    scoreCount = 0;
    speed = 200;
    highScoreCount = 0;

    drawGame();
}

const drawGame = () => {
    setTimeout(() => {
        if (isPaused) {
            drawPaused(); 
            drawGame(); 
            return; 
        }

        moveSnake();
        if (checkGameOver()) {
            showGameOver();
            gameInPlay = false;
            resetBtn.style.display = "block";
            const sound = new Audio('./assets/game_over.mp3');
            sound.play();
            return;
        } else {
            clearCanvas();
            drawFood();
            drawSnake();
            drawGame();
        }

    }, speed);
};

const drawPaused = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.0)"; 
    ctx.fillRect(0, 0, gameArea.clientWidth, gameArea.clientHeight);
    ctx.fillStyle = "grey";
    ctx.font = "50px 'creepster', cursive";
    ctx.fillText("Paused", 100, 200);
};

const drawSnake = () => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(headX * tileSize, headY * tileSize, tileSize, tileSize);

    ctx.strokeStyle = "black";
    ctx.strokeRect(headX * tileSize, headY * tileSize, tileSize, tileSize);
    
    ctx.fillStyle = "green";
    snakeBody.forEach(body => {
        ctx.fillRect(body.x * tileSize, body.y * tileSize, tileSize, tileSize);
        ctx.strokeRect(body.x * tileSize, body.y * tileSize, tileSize, tileSize);    
    });
    snakeBody.push({ x: headX, y: headY });
    while (snakeBody.length > tailLength) {
        snakeBody.shift();   
    }
}

const clearCanvas = () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, gameArea.clientWidth, gameArea.clientHeight);
}

const moveSnake = () => {
    headX += dx;
    headY += dy;
}

const checkGameOver = () => {
    if (headX < 0 || headX === tileCount || headY < 0 || headY === tileCount) {
        return true;
    }
    for (let i = 0; i < snakeBody.length; i++) {
        if (headX === snakeBody[i].x && headY === snakeBody[i].y && tailLength > 1) {
            return true;
        }
    }
    return false; 
};

const showGameOver = () => {
    ctx.fillStyle = "orange";
    ctx.font = "50px 'creepster', cursive";
    ctx.fillText("Game Over", 60, 200);
}

const drawFood = () => {
    if (tailLength === 1) {
        highScoreCount = localStorage.getItem("serpent_highScore") === null 
        ? 0 
        : Number(localStorage.getItem("serpent_highScore"));
        highScore.innerText = highScoreCount;
    } 

    ctx.fillStyle = "red";
    ctx.strokeStyle = "grey";
    ctx.fillRect(foodX * tileSize, foodY * tileSize, tileSize, tileSize);
    ctx.strokeRect(foodX * tileSize, foodY * tileSize, tileSize, tileSize);

    if (foodX === headX && foodY === headY) {
        foodX = Math.floor(Math.random() * tileCount);
        foodY = Math.floor(Math.random() * tileCount);
        tailLength++;
        scoreCount++;
        
        if (scoreCount == 5) {
            speed = 150; 
        } else if (scoreCount == 10) {
            speed = 100;
        } else if (scoreCount === 15) {
            speed = 50;
        }

        score.innerText = scoreCount;
        if (scoreCount > highScoreCount) {
            highScore.innerText = scoreCount;
            localStorage.setItem("serpent_highScore", scoreCount);
        }
        const sound = new Audio('./assets/eat.mp3');
        sound.play();
    }
};

const keyPressHandler = (e) => {
    const code = e.keyCode;

    if (code === 32) { 
        isPaused = !isPaused; 
        return; 
    }

    if (code === 37 && dx !== 1) {
        dx = -1;
        dy = 0;
    }
    if (code === 38 && dy !== 1) {
        dx = 0;
        dy = -1;
    }
    if (code === 39 && dx !== -1) {
        dx = 1;
        dy = 0;
    }
    if (code === 40 && dy !== -1) {
        dx = 0;
        dy = 1;
    }
};

const resetGame = () => {
    if (!gameInPlay) {
        init();
    }
}

init();

document.addEventListener("keydown", keyPressHandler);
resetBtn.addEventListener("click", resetGame);