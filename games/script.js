const game = document.getElementById("game");
const player = document.getElementById("player");
const scoreText = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOver");

let score = 0;
let gameRunning = true;

const gameWidth = game.clientWidth;
const gameHeight = game.clientHeight;

let playerX = gameWidth / 2 - 40;

function movePlayer(x){
    playerX = x - game.offsetLeft - 40;

    if(playerX < 0) playerX = 0;
    if(playerX > gameWidth - 80) playerX = gameWidth - 80;

    player.style.left = playerX + "px";
}

// Mouse
game.addEventListener("mousemove",(e)=>{
    movePlayer(e.pageX);
});

// Touch
game.addEventListener("touchmove",(e)=>{
    movePlayer(e.touches[0].pageX);
});

function createBlock(){
    if(!gameRunning) return;

    const block = document.createElement("div");
    block.classList.add("block");

    let x = Math.random() * (gameWidth - 30);

    block.style.left = x + "px";
    block.style.top = "-30px";

    game.appendChild(block);

    let y = -30;

    const fall = setInterval(()=>{

        if(!gameRunning){
            clearInterval(fall);
            return;
        }

        y += 4;
        block.style.top = y + "px";

        const blockRect = block.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        // Catch
        if(
            blockRect.bottom >= playerRect.top &&
            blockRect.left < playerRect.right &&
            blockRect.right > playerRect.left
        ){
            score++;
            scoreText.textContent = score;
            block.remove();
            clearInterval(fall);
        }

        // Missed
        if(y > gameHeight){
            clearInterval(fall);
            gameOver();
        }

    },16);
}

function gameOver(){
    gameRunning = false;
    gameOverScreen.style.display = "flex";
}

setInterval(()=>{
    if(gameRunning){
        createBlock();
    }
},900);
