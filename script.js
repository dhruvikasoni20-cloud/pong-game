// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 8;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;
const COMPUTER_SPEED = 3.5;

// Game objects
const player = {
    x: 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0,
    dy: 0
};

const computer = {
    x: canvas.width - PADDLE_WIDTH - 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0,
    dy: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: BALL_SPEED,
    dy: BALL_SPEED,
    speed: BALL_SPEED
};

// Game state
let gameRunning = false;
let gamePaused = false;
let keys = {};
let mouseY = 0;

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('mousemove', handleMouseMove);

function handleKeyDown(e) {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            gamePaused = !gamePaused;
            updateGameStatus();
        }
    }
    
    if (e.key.toLowerCase() === 'r') {
        resetGame();
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
}

function startGame() {
    gameRunning = true;
    gamePaused = false;
    resetBall();
    updateGameStatus();
    gameLoop();
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    player.score = 0;
    computer.score = 0;
    player.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    computer.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = BALL_SPEED;
    ball.dy = BALL_SPEED;
    
    updateScoreboard();
    updateGameStatus();
    draw();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 4;
    ball.dx = BALL_SPEED * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = BALL_SPEED * Math.sin(angle);
}

function updateGameStatus() {
    const status = document.getElementById('gameStatus');
    if (!gameRunning) {
        status.textContent = 'Press SPACE to Start';
    } else if (gamePaused) {
        status.textContent = 'PAUSED - Press SPACE to Resume';
    } else {
        status.textContent = 'PLAYING';
    }
}

function updateScoreboard() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

function updatePlayerPaddle() {
    // Arrow keys control
    if (keys['ArrowUp']) {
        player.dy = -PADDLE_SPEED;
    } else if (keys['ArrowDown']) {
        player.dy = PADDLE_SPEED;
    } else {
        player.dy = 0;
    }
    
    // Mouse control (moves paddle towards mouse)
    const paddleCenter = player.y + PADDLE_HEIGHT / 2;
    const distance = mouseY - paddleCenter;
    
    if (Math.abs(distance) > 5) {
        player.dy = Math.sign(distance) * PADDLE_SPEED;
    }
    
    // Apply movement
    player.y += player.dy;
    
    // Collision with walls
    if (player.y < 0) {
        player.y = 0;
    }
    if (player.y + PADDLE_HEIGHT > canvas.height) {
        player.y = canvas.height - PADDLE_HEIGHT;
    }
}

function updateComputerPaddle() {
    // Simple AI: track the ball
    const computerCenter = computer.y + PADDLE_HEIGHT / 2;
    const distance = ball.y - computerCenter;
    
    if (Math.abs(distance) > 5) {
        computer.dy = Math.sign(distance) * COMPUTER_SPEED;
    } else {
        computer.dy = 0;
    }
    
    // Apply movement
    computer.y += computer.dy;
    
    // Collision with walls
    if (computer.y < 0) {
        computer.y = 0;
    }
    if (computer.y + PADDLE_HEIGHT > canvas.height) {
        computer.y = canvas.height - PADDLE_HEIGHT;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Top and bottom wall collision
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
    }
    
    // Left wall collision (computer scores)
    if (ball.x - ball.size < 0) {
        computer.score++;
        updateScoreboard();
        resetBall();
        return;
    }
    
    // Right wall collision (player scores)
    if (ball.x + ball.size > canvas.width) {
        player.score++;
        updateScoreboard();
        resetBall();
        return;
    }
    
    // Paddle collision detection
    checkPaddleCollision(player);
    checkPaddleCollision(computer);
}

function checkPaddleCollision(paddle) {
    // Check if ball is within paddle's Y range
    if (ball.y - ball.size < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y) {
        
        // Check if ball is within paddle's X range
        if ((paddle === player && ball.x - ball.size < paddle.x + paddle.width) ||
            (paddle === computer && ball.x + ball.size > paddle.x)) {
            
            // Bounce the ball
            ball.dx = -ball.dx;
            
            // Add spin based on where the ball hits the paddle
            const hitPos = (ball.y - (paddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            ball.dy += hitPos * 2;
            
            // Increase ball speed slightly
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = (ball.dx / speed) * (ball.speed + 0.5);
            ball.dy = (ball.dy / speed) * (ball.speed + 0.5);
            ball.speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            
            // Push ball away from paddle to prevent multiple collisions
            if (paddle === player) {
                ball.x = paddle.x + paddle.width + ball.size;
            } else {
                ball.x = paddle.x - ball.size;
            }
        }
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line (dashed)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    drawPaddle(player, 'rgba(100, 200, 255, 0.9)');
    drawPaddle(computer, 'rgba(255, 100, 100, 0.9)');
    
    // Draw ball
    drawBall();
}

function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = 'rgba(255, 255, 100, 0.95)';
    ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (gameRunning) {
        if (!gamePaused) {
            updatePlayerPaddle();
            updateComputerPaddle();
            updateBall();
        }
        
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Initialize
resetGame();
