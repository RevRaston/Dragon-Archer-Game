// SECTION 1: CANVAS SETUP
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
    canvas.width = 800;
    canvas.height = window.innerHeight * 0.93;
}


//Start Methods
resizeCanvas();
setInterval(spawnZombie, 5000);
window.addEventListener("resize", resizeCanvas);
// SECTION 2: GAME VARIABLES

let isFireBeamActive = false;
let fireBeam = {
    x: 0,
    minWidth: 20,
    maxWidth: 40,
    currentWidth: 0,
    startTime: 0,
    chargeTime: 1000,
    activeTime: 2000,
    expanding: true,
    state: "inactive" //charging
};

let powerUps = [];
const POWERUP_TYPES = {
    AMMO: "ammo",
    HEALTH: "health",
    MAX_HEALTH: "max_health",
    TIME_STOP: "time_stop"
};
let isTimeStopped = false;
let timeStopEnd = 0;
let isPlayerSnared = false;
let snareEndTime = 0;
const SNARE_DURATION = 2000;
const FIREBALL_PARTICLES = 15; 
const SMOKE_PARTICLES = 8;

let webProjectiles = []; 
const WEB_SPEED = 3;
const WEB_RADIUS = 8;
//arrays
let dragons = [];
let spiders = []; 
let fireballs = [];
let projectiles = []; 
let blocks = [];
//physics and rules
let spiderSpawnInterval = 5000;
let gravity = 0.1;
let dragonsKilled = 0;
let isGameOver = false;
let dragonWavePending = false;

let currentLevel = 0;
let currentWave = 0;
let enemiesRemaining = 0;
//mouse position
let mouseX = 0;

//levels
const levels = [
    {
        waves: 1,
        enemiesPerWave: 1,
        dragonsToKill: 1,
        microBoss: null,
        description: "Welcome to Level 1: Tutorial!",
        blockType: "leaf", 
    },
    {
        waves: 3,
        enemiesPerWave: 2,
        dragonsToKill: 6,
        microBoss: null,
        description: "Level 2: Defeat 3 waves of 2 dragons!",
        blockType: "wood",
    },
    {
        waves: 3,
        enemiesPerWave: 3,
        dragonsToKill: 9,
        microBoss: null,
        description: "Level 3: Defeat 3 waves of 3 dragons and the mini dragon boss!",
        blockType: "leaf",
    },
    // Level 4: Zombie introduction
    {
        waves: 2,
        enemiesPerWave: 5,
        dragonsToKill: 10,
        description: "Wave 4: Zombies appear!",
        blockType: "wood",
        enemyTypes: ["dragon", "zombie"]
    },
    
   
    {
        waves: 3,
        enemiesPerWave: 6,
        dragonsToKill: 18,
        description: "Wave 5: Rapid enemies!",
        blockType: "stone",
        enemyTypes: ["dragon", "spider"],
        enemySpeed: 1.5
    },
    
    {
        waves: 2,
        enemiesPerWave: 8,
        dragonsToKill: 16,
        description: "Wave 6: Archery test!",
        blockType: "wood",
        enemyTypes: ["dragon"],
        playerAmmo: 10
    },
    
    {
        waves: 4,
        enemiesPerWave: 5,
        dragonsToKill: 20,
        description: "Wave 7: Survive the onslaught!",
        blockType: "stone",
        enemyTypes: ["dragon", "spider", "zombie"]
    },
    
    {
        waves: 3,
        enemiesPerWave: 7,
        dragonsToKill: 21,
        description: "Wave 8: Fast and furious!",
        blockType: "leaf",
        enemyTypes: ["dragon", "spider"],
        enemySpeed: 2.0
    },
    
    {
        waves: 5,
        enemiesPerWave: 6,
        dragonsToKill: 30,
        description: "Wave 9: Ultimate test!",
        blockType: "wood",
        enemyTypes: ["dragon", "spider", "zombie"]
    },
    
    {
        waves: 1,
        enemiesPerWave: 15,
        dragonsToKill: 15,
        description: "Wave 10: Victory lap!",
        blockType: "stone",
        enemyTypes: ["dragon"],
        playerAmmo: 999
    }


];

// SECTION 3: LOAD ASSETS (UPDATED)

//track assets
let assetsLoaded = 0;
const totalAssets = 9;

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        document.getElementById("loadingScreen").style.display = "none";
        setupEventListeners();
        gameLoop();
    }
}

const knightImg = new Image();
knightImg.onload = assetLoaded;
knightImg.src = "Assets/knight1.png";

const dragonImg = new Image();
dragonImg.onload = assetLoaded;
dragonImg.src = "Assets/Sprites/Dragons/Fire Dragon Anim/FD WU MC.png";

const fireballImg = new Image();
fireballImg.onload = assetLoaded;
fireballImg.src = "Assets/fireball.png";

const spiderImg = new Image();
spiderImg.onload = assetLoaded;
spiderImg.src = "Assets/spider2.png";

const zombieImg = new Image();
zombieImg.onload = assetLoaded;
zombieImg.src = "Assets/Sprites/Zombie/Zombie.png";

const arrowImg = new Image();
arrowImg.onload = assetLoaded;
arrowImg.src = "Assets/arrow.png";

const bowImg = new Image();
bowImg.onload = assetLoaded;
bowImg.src = "Assets/bow.png";

const swordImg = new Image();
swordImg.onload = assetLoaded;
swordImg.src = "Assets/arrow.png";

const backgroundImg = new Image();
backgroundImg.onload = assetLoaded;
backgroundImg.src = "Assets/Backgrounds/Tavern/Tavern.png";

const backgroundBottomImg = new Image();
backgroundBottomImg.onload = assetLoaded;
backgroundBottomImg.src = "Assets/Backgrounds/Tavern/TavernBottom.png";

// SECTION 4: CLASS CREATION
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.color = this.getColor();
        this.lifetime = 10000;
        this.spawnTime = Date.now();
        this.velocityY = 0;
        this.onGround = false;
    }

    getColor() {
        switch (this.type) {
            case POWERUP_TYPES.AMMO: return "gold";
            case POWERUP_TYPES.HEALTH: return "red";
            case POWERUP_TYPES.MAX_HEALTH: return "pink";
            case POWERUP_TYPES.TIME_STOP: return "cyan";
            default: return "white";
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw type
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        switch (this.type) {
            case POWERUP_TYPES.AMMO:
                ctx.fillText("A", this.x, this.y);
                break;
            case POWERUP_TYPES.HEALTH:
                ctx.fillText("H", this.x, this.y);
                break;
            case POWERUP_TYPES.MAX_HEALTH:
                ctx.fillText("M", this.x, this.y);
                break;
            case POWERUP_TYPES.TIME_STOP:
                ctx.fillText("T", this.x, this.y);
                break;
        }
    }

    update() {
        // Apply gravity if not on ground
        if (!this.onGround) {
            this.velocityY += gravity * 0.3;
            this.y += this.velocityY;

            // Check floor collision
            if (this.y + this.height / 2 > floor.y) {
                this.y = floor.y - this.height / 2;
                this.onGround = true;
                this.velocityY = 0;
            }
        }

        // Check if expired
        return Date.now() - this.spawnTime > this.lifetime;
    }
}
class Floor {
    constructor() {
        this.y = canvas.height - 50;
        this.height = 20;
        this.color = "#0040FF";
        this.isVisible = true;
    }

    draw() {
        if (!this.isVisible) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(0, this.y, canvas.width, this.height);
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
    }
}

// Instantiate the floor
const floor = new Floor();
class Zombie {
    constructor(x, y, width = 40, height = 60) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spawnTime = Date.now();
        this.isActive = true;
    }

    draw() {
        if (!this.isActive) return;

        // Draw the hitbox (for debugging, optional)
        ctx.fillStyle = "rgba(0, 128, 0, 0.3)";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw the zombie sprite over the hitbox
        if (zombieImg.complete) { 
            ctx.drawImage(
                zombieImg,
                this.x - 0,
                this.y - 5,
                this.width,
                this.height
            );
        } else {
            console.error("Zombie sprite not loaded!");
        }
    }

    update(player) {
        if (!this.isActive) return;

        // Check if the zombiealive > 5 secs
        if (Date.now() - this.spawnTime > 5000) {
            this.isActive = false;
            this.respawn(player);
        }

        // Check for player collision
        const playerLeft = player.x;
        const playerRight = player.x + player.width;
        const playerTop = player.y;
        const playerBottom = player.y + player.height;

        const zombieLeft = this.x;
        const zombieRight = this.x + this.width;
        const zombieTop = this.y;
        const zombieBottom = this.y + this.height;

        if (
            playerRight > zombieLeft &&
            playerLeft < zombieRight &&
            playerBottom > zombieTop &&
            playerTop < zombieBottom
        ) {
            player.takeDamage();
            this.isActive = false;
            this.respawn(player);
        }
        
    }

    respawn(player) {
        setTimeout(() => {
            let x, y;

            //zombie spawn safe distance from the player
            do {
                x = Math.random() * (canvas.width - this.width);
                y = canvas.height - 60;
            } while (Math.abs(x - player.x) < 100);

            this.x = x;
            this.y = y;
            this.spawnTime = Date.now();
            this.isActive = true;
        }, 2000);
    }
}
class Tree {
    constructor(type) {
        this.type = type;
        this.thickness = this.getThickness();
        this.nodeDistance = this.getNodeDistance();
        this.height = this.getHeight();
    }

    getThickness() {
        switch (this.type) {
            case "Oak":
                return 30; 
            case "Pine":
                return 20;
            case "Maple":
                return 25; 
            default:
                return 20;
        }
    }

    getNodeDistance() {
        switch (this.type) {
            case "Oak":
                return 40;
            case "Pine":
                return 30;
            case "Maple":
                return 35; 
            default:
                return 30;
        }
    }

    getHeight() {
        switch (this.type) {
            case "Oak":
                return 100;
            case "Pine":
                return 120;
            case "Maple":
                return 80;
            default:
                return 100;
        }
    }
}

class LeafBlock {
    constructor(x, y, width = 40, height = 20, type = "leaf") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.health = this.getHealth();
        this.isDestroyed = false;
    }

    getHealth() {
        switch (this.type) {
            case "leaf":
                return 1;
            case "wood":
                return 3;
            case "stone":
                return Infinity;
            default:
                return 1;
        }
    }

    draw() {
        if (this.isDestroyed) return;

        // Set color based on type
        switch (this.type) {
            case "leaf":
                ctx.fillStyle = "green";
                break;
            case "wood":
                ctx.fillStyle = "brown";
                break;
            case "stone":
                ctx.fillStyle = "gray";
                break;
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    takeDamage() {
        if (this.type === "stone") return;

        this.health--;
        if (this.health <= 0) {
            this.isDestroyed = true;
        }
    }
}

// UPDATE FIREBALL CLASS/OBJECT (modify your existing fireball structure)
class Fireball {
    constructor(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.particles = [];
        this.size = 20;

        // Create particles
        for (let i = 0; i < FIREBALL_PARTICLES; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                size: Math.random() * 4 + 2,
                life: 1,
                decay: Math.random() * 0.02 + 0.01,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                color: `hsl(${Math.random() * 20 + 20}, 100%, 50%)`
            });
        }
    }

    update() {
        // Update main fireball
        this.x += this.speedX;
        this.y += this.speedY;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;

            // Add gravity to smoke particles
            if (p.life < 0.5) {
                p.speedY -= 0.05;
            }

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Add new smoke particles
        if (Math.random() < 0.3) {
            this.particles.push({
                x: this.x,
                y: this.y,
                size: Math.random() * 6 + 4,
                life: 1,
                decay: Math.random() * 0.01 + 0.005,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `hsla(0, 0%, ${Math.random() * 30 + 50}%, 0.7)`
            });
        }
    }

    draw(ctx) {
        // Draw particles first (behind fireball)
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw main fireball (keep your existing fireball drawing code)
        ctx.drawImage(fireballImg, this.x - 10, this.y - 10, 20, 20);
    }
}



// Player Class
class Player {
    constructor() {
        this.x = canvas.width / 2 - 25;
        this.y = floor.y - this.height;
        this.width = 80; 
        this.height = 50;
        this.arrowAngle = -Math.PI / 4;
        this.health = 3;
        this.isSwordAttacking = false;
        this.velocityY = 0;
        this.jumpPower = 6;
        this.isJumping = false;
        this.isGrabbed = false;

        this.maxAmmo = 3;
        this.ammo = this.maxAmmo;
        this.ammoCooldown = 5000;
        this.isReloading = false;
        this.reloadInterval = null;
        this.defaultMaxAmmo = 3;

    }



    startReload() {
        this.isReloading = true;
        this.reloadInterval = setInterval(() => {
            if (this.ammo < this.maxAmmo) {
                this.ammo++;
                this.isReloading = false; 
            } else {
                clearInterval(this.reloadInterval);
                this.isReloading = false;
            }
        }, this.ammoCooldown);
    }

    drawAmmo() {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(`Arrows: ${this.ammo}`, canvas.width - 150, 60);
    }

    update() {
        if (!isPlayerSnared) {
            this.y += this.velocityY;
            this.velocityY += gravity;
        }

        // Check collision with floor
        if (this.y + this.height > floor.y) {
            this.y = floor.y - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        if (this.isGrabbed) return;
    }

    jump() {
        if (isPlayerSnared) return;
        if (!this.isJumping) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
        }
    }

    draw() {
        // Draw player and health bar
        ctx.fillStyle = "rgba(0,255,0,0.5)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(knightImg, this.x - 0, this.y - 5, 80, 80);
        this.drawHealth();

        // Draw current level
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(`Level: ${currentLevel + 1}`, canvas.width - 100, 30);

        if (isPlayerSnared) {
            // Draw web overlay
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(
                player.x + player.width / 2,
                player.y + player.height / 2,
                player.width * 0.7,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // snare time
            const timeLeft = ((snareEndTime - Date.now()) / 1000).toFixed(1);
            ctx.globalAlpha = 1;
            ctx.fillStyle = "black";
            ctx.font = "12px Arial";
            ctx.fillText(timeLeft, player.x + player.width / 2 - 10, player.y - 10);
            ctx.restore();
        }

    }

    drawHealth() {
        ctx.fillStyle = "black";
        ctx.fillRect(10, 10, 100, 10);
        ctx.fillStyle = "red";
        ctx.fillRect(10, 10, (this.health / 3) * 100, 10);
    }

    moveLeft() {
        if (isPlayerSnared) return; 
        if (this.x > 0) {
            this.x -= 10;
        }
    }

    moveRight() {
        if (isPlayerSnared) return;
        if (this.x < canvas.width - this.width) {
            this.x += 10;
        }
    }

    aimUp() {
        this.arrowAngle = Math.max(-Math.PI / 2, this.arrowAngle - 0.1);
    }

    aimDown() {
        this.arrowAngle = Math.min(Math.PI / 2, this.arrowAngle + 0.1);
    }

    shoot() {
        if (!this.isSwordAttacking && this.ammo > 0 && !this.isReloading) {
            const speed = 10;
            const angleX = Math.cos(this.arrowAngle);
            const angleY = Math.sin(this.arrowAngle);

            projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                speedX: speed * angleX,
                speedY: speed * angleY * 1.1,
            });

            this.ammo--;
            if (this.ammo === 0) {
                this.startReload();
            }
        }
    }

    attackSword() {
        if (!this.isSwordAttacking) {
            this.isSwordAttacking = true;
            setTimeout(() => {
                this.isSwordAttacking = false;
            }, 300);
        }
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            endGame();
        }
    }

   
    reset() {
        this.health = 3;
        this.maxAmmo = this.defaultMaxAmmo;
        this.ammo = this.maxAmmo;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = floor.y - this.height;
        this.velocityY = 0;
        this.isJumping = false;
    }

}
const player = new Player();

// SECTION 5: GAME FUNCTIONS

function drawLeafBlocks() {
    leafBlocks.forEach((block) => block.draw());
}

function drawWebProjectiles() {
    ctx.save();
    webProjectiles.forEach(web => {
        // White web ball with slight transparency
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(web.x, web.y, web.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        for (let j = 0; j < 3; j++) {
            const angle = Math.PI * 2 * (j / 3 + Math.random() * 0.1);
            ctx.beginPath();
            ctx.moveTo(web.x, web.y);
            ctx.lineTo(
                web.x + Math.cos(angle) * web.radius * 1.5,
                web.y + Math.sin(angle) * web.radius * 1.5
            );
            ctx.stroke();
        }
    });
    ctx.restore();
}
function drawDragons() {
    dragons.forEach((dragon) => {
        ctx.fillStyle = dragon.isHovering ? "rgba(255, 200, 0, 0.3)" : "rgba(0, 255, 0, 0.3)";
        ctx.fillRect(dragon.x, dragon.y, dragon.width, dragon.height);
        ctx.drawImage(dragonImg, dragon.x, dragon.y, dragon.width, dragon.height);

        if (dragon.isHovering) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.beginPath();
            ctx.arc(dragon.x + dragon.width / 2, dragon.y + dragon.height, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}


function drawSpiders() {
    spiders.forEach((spider) => {
        ctx.fillStyle = "rgba(128, 0, 128, 0.3)";
        ctx.fillRect(spider.x, spider.y, spider.width, spider.height);
        ctx.drawImage(spiderImg, spider.x - 0, spider.y - 5, 80, 80);

    });
}


function drawFireballs() {
    fireballs.forEach((fireball) => {
        ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(fireball.x, fireball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(fireballImg, fireball.x - 10, fireball.y - 10, 20, 20);
    });
}

function drawProjectiles() {
    projectiles.forEach((projectile) => {
        ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        let angle = Math.atan2(projectile.speedY, projectile.speedX);
        ctx.rotate(angle);
        ctx.drawImage(arrowImg, -10, -5, 20, 10);
        ctx.restore();
    });
}


function drawAimingArrow() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.arrowAngle);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();
    ctx.restore();
}


function drawSword() {
    if (player.isSwordAttacking) {
        ctx.save();
        let swordX, swordY, swordWidth, swordHeight;
        const swordThickness = 10;
        const swordLength = 40;
        const isMouseRight = mouseX >= player.x + player.width / 2;

        if (isMouseRight) {
            swordX = player.x + player.width;
            swordY = player.y + player.height / 2 - swordThickness / 2;
            swordWidth = swordLength;
            swordHeight = swordThickness;
        } else {
            swordX = player.x - swordLength;
            swordY = player.y + player.height / 2 - swordThickness / 2;
            swordWidth = swordLength;
            swordHeight = swordThickness;
        }

        ctx.strokeStyle = "red";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(swordX, swordY);
        ctx.lineTo(swordX + swordWidth, swordY);
        ctx.stroke();
        ctx.restore();
    }
}
function updateFireballs() {
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fireball = fireballs[i];

        if (!isTimeStopped) {
            fireball.x += fireball.speedX || 0;
            fireball.y += fireball.speedY;
            
            if (fireball.y > canvas.height - 50) {
                fireballs.splice(i, 1);
                continue;
            }
        }

        if (checkFireballPlayerCollision(fireball)) {
            fireballs.splice(i, 1);
        }
    }
}
function checkFireballPlayerCollision(fireball) {
    return (
        fireball.x > player.x &&
        fireball.x < player.x + player.width &&
        fireball.y > player.y &&
        fireball.y < player.y + player.height
    );
}

function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        if (!isTimeStopped) {
            projectile.speedY += gravity;
            projectile.x += projectile.speedX;
            projectile.y += projectile.speedY;

            if (
                projectile.x < 0 ||
                projectile.x > canvas.width ||
                projectile.y > canvas.height - 50
            ) {
                projectiles.splice(index, 1);
            }
        }
    });
}

function updateDragons() {
    dragons.forEach((dragon) => {
        if (!isTimeStopped) {
            if (!dragon.isHovering && 
                Math.random() < 0.005 && 
                dragon.x + dragon.width/2 > player.x - 100 && 
                dragon.x + dragon.width/2 < player.x + player.width + 100) {
                
                dragon.isHovering = true;
                dragon.hoverEndTime = Date.now() + 4000;
                dragon.originalSpeed = dragon.speed;
                dragon.speed = 0;
                dragon.hasFiredBeam = false;
            }
            
            if (dragon.isHovering && !dragon.hasFiredBeam && Math.random() < 0.02) {
                if (!isFireBeamActive) {
                    activateFireBeam(dragon.x + dragon.width/2);
                    dragon.hasFiredBeam = true;
                }
            }
            
            if (dragon.isHovering && Date.now() > dragon.hoverEndTime) {
                dragon.isHovering = false;
                dragon.speed = dragon.originalSpeed;
            }
            
            if (!dragon.isHovering) {
                dragon.x += dragon.speed;
                if (dragon.x > canvas.width) {
                    dragon.x = -dragon.width;
                }
            }
        }
        
        if (!isTimeStopped && !dragon.isHovering && Math.random() < 0.005) {
            spawnFireball(dragon);
        }
    });
}

function activateFireBeam(xPosition) {
    fireBeam.state = "charging";
    fireBeam.x = xPosition - fireBeam.minWidth / 2;
    fireBeam.startTime = Date.now();
    fireBeam.currentWidth = fireBeam.minWidth;
    fireBeam.expanding = true;

    setTimeout(() => {
        if (fireBeam.state === "charging") {
            fireBeam.state = "active";
            fireBeam.startTime = Date.now();

            const beamAnimation = setInterval(() => {
                if (fireBeam.expanding) {
                    fireBeam.currentWidth += 2;
                    if (fireBeam.currentWidth >= fireBeam.maxWidth) {
                        fireBeam.expanding = false;
                    }
                } else {
                    fireBeam.currentWidth -= 2;
                    if (fireBeam.currentWidth <= fireBeam.minWidth) {
                        fireBeam.expanding = true;
                    }
                }
            }, 30);

            setTimeout(() => {
                clearInterval(beamAnimation);
                fireBeam.state = "inactive";
            }, fireBeam.activeTime);
        }
    }, fireBeam.chargeTime);
}

function updateWebProjectiles() {
    for (let i = webProjectiles.length - 1; i >= 0; i--) {
        const web = webProjectiles[i];

        web.x += web.speedX;
        web.alpha -= 0.01;

        if (checkWebHitPlayer(web)) {
            webProjectiles.splice(i, 1);
            continue;
        }

        if (web.x < -50 || web.x > canvas.width + 50 || web.alpha <= 0) {
            webProjectiles.splice(i, 1);
        }
    }
}

function checkWebHitPlayer(web) {
    if (isPlayerSnared || !web) return false;

    const collided = (
        web.x > player.x &&
        web.x < player.x + player.width &&
        web.y > player.y &&
        web.y < player.y + player.height
    );

    if (collided) {
        isPlayerSnared = true;
        snareEndTime = Date.now() + SNARE_DURATION;
        player.velocityY = 0;

        createWebSnareEffect(player.x + player.width / 2, player.y + player.height / 2);
        return true;
    }
    return false;
}

function updateSnare() {
    if (isPlayerSnared) {
        player.velocityY = 0;

        if (Date.now() > snareEndTime) {
            isPlayerSnared = false;
        }
    }
}
function createWebSnareEffect(x, y) {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
            ctx.beginPath();
            ctx.arc(
                x + (Math.random() - 0.5) * player.width,
                y + (Math.random() - 0.5) * player.height,
                Math.random() * 3 + 1,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }, i * 100);
    }
}
function drawFireBeam() {
    if (fireBeam.state === "inactive") return;
    
    const activeProgress = fireBeam.state === "charging"
        ? (Date.now() - fireBeam.startTime) / fireBeam.chargeTime
        : (Date.now() - fireBeam.startTime) / fireBeam.activeTime;

    let shakeX = 10;
    let shakeY = 25;

    if (fireBeam.state === "active" && activeProgress < 0.1) {
        const shakeIntensity = 1 - (activeProgress / 0.1); 
        shakeX = (Math.random() - 0.5) * 10 * shakeIntensity;
        shakeY = (Math.random() - 0.5) * 5 * shakeIntensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (fireBeam.state === "charging") {
        // 1. Pulsating warning zone
        const pulseIntensity = 0.3 + 0.3 * Math.sin(activeProgress * 20);
        ctx.fillStyle = `rgba(255, 200, 0, ${pulseIntensity})`;
        ctx.fillRect(fireBeam.x - 20, 0, fireBeam.minWidth + 40, canvas.height);

        // 2. Countdown circle
        ctx.beginPath();
        ctx.arc(
            fireBeam.x + fireBeam.minWidth / 2,
            canvas.height / 2,
            30,
            -Math.PI / 2,
            -Math.PI / 2 + (2 * Math.PI * activeProgress)
        );
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(255, ${200 - activeProgress * 150}, 0, 0.8)`;
        ctx.stroke();

        // 3. Warning text
        ctx.fillStyle = `rgba(255, 50, 0, ${pulseIntensity})`;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("WARNING!", fireBeam.x + fireBeam.minWidth / 2, canvas.height / 2);

        ctx.restore();
        return;
    }

    const alpha = 0.4 + 0.6 * (1 - activeProgress);

    // 1. Main beam with gradient
    const gradient = ctx.createLinearGradient(
        fireBeam.x, 0,
        fireBeam.x + fireBeam.currentWidth, 0
    );
    gradient.addColorStop(0, `rgba(255, 50, 0, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, 50, 0, ${alpha})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(fireBeam.x, 0, fireBeam.currentWidth, canvas.height);

    // 2. Pulsing white core
    const corePulse = 0.7 + 0.3 * Math.sin(Date.now() / 100);
    const coreWidth = fireBeam.currentWidth * 0.4;
    const coreX = fireBeam.x + (fireBeam.currentWidth - coreWidth) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * corePulse})`;
    ctx.fillRect(coreX, 0, coreWidth, canvas.height);

    // 3. Particle effects at bottom
    for (let i = 0; i < 15; i++) {
        const particleX = fireBeam.x + Math.random() * fireBeam.currentWidth;
        const size = 2 + Math.random() * 5;
        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${alpha})`;
        ctx.fillRect(particleX, canvas.height - 50, size, 15 + Math.random() * 35);
    }

    // 4. Initial flash effect
    if (activeProgress < 0.1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - activeProgress * 10})`;
        ctx.fillRect(fireBeam.x - 5, 0, fireBeam.currentWidth + 10, canvas.height);
    }

    ctx.restore();
}
function checkFireBeamCollision() {
    return fireBeam.state === "active" &&
        player.x + player.width > fireBeam.x &&
        player.x < fireBeam.x + fireBeam.currentWidth;
}

function updateSpiders() {
    const currentTime = Date.now();
    spiders.forEach((spider) => {
        if (!isTimeStopped) {
            if (currentTime >= spider.nextShotTime) {
                let webSpeedX = spider.initialSide === "left" ? 5 : -5;
                webProjectiles.push({
                    x: spider.x + spider.width / 2,
                    y: spider.y + spider.height / 2,
                    speedX: webSpeedX,
                    speedY: 0,
                    radius: 8,
                    alpha: 0.9
                });

                if (spider.initialSide === "left") {
                    spider.x = canvas.width + 60;
                    spider.initialSide = "right";
                } else {
                    spider.x = -60;
                    spider.initialSide = "left";
                }

                spider.shootCount = (spider.shootCount || 0) + 1;
                spider.nextShotTime = currentTime + 1500;

                if (spider.shootCount >= 3) {
                    spider.isMoving = true;
                    spider.initialSide = Math.random() < 0.5 ? "left" : "right";
                    spider.speed = spider.initialSide === "left" ? 0.3 : -0.3;
                    spider.y = 560;
                }
            }
        } else {
            spider.x += spider.speed;
            if (spider.x > canvas.width || spider.x + spider.width < 0) {
                const index = spiders.indexOf(spider);
                if (index > -1) {
                    spiders.splice(index, 1);
                }
                setTimeout(spawnSpider, spiderSpawnInterval);
            }
        }
    });
}

function updateZombies(player) {
    if (!zombie) return;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    const zombieLeft = zombie.x;
    const zombieRight = zombie.x + zombie.width;
    const zombieTop = zombie.y;
    const zombieBottom = zombie.y + zombie.height;

    if (
        playerRight > zombieLeft &&
        playerLeft < zombieRight &&
        playerBottom > zombieTop &&
        playerTop < zombieBottom
    ) {
        player.takeDamage();
        zombie = null;
    }
}

function checkCollisions() {
    projectiles.forEach((projectile, pIndex) => {
        dragons.forEach((dragon, dIndex) => {
            if (
                projectile.x > dragon.x &&
                projectile.x < dragon.x + dragon.width &&
                projectile.y > dragon.y &&
                projectile.y < dragon.y + dragon.height
            ) {
                console.log("Arrow hit dragon!");
                projectiles.splice(pIndex, 1);
                const deadDragon = dragons.splice(dIndex, 1)[0];
                dragonsKilled++;
                updateDragonsKilledCounter();

                if (Math.random() < 1) {
                    const types = Object.values(POWERUP_TYPES);
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    powerUps.push(new PowerUp(
                        deadDragon.x + deadDragon.width / 2,
                        deadDragon.y + deadDragon.height / 2,
                        randomType
                    ));
                }
                if (dragonsKilled >= levels[currentLevel].dragonsToKill) {
                    endGame(true);
                }
            }
        });

        spiders.forEach((spider, sIndex) => {
            if (
                projectile.x > spider.x &&
                projectile.x < spider.x + spider.width &&
                projectile.y > spider.y &&
                projectile.y < spider.y + spider.height
            ) {
                console.log("Arrow hit spider!");
                projectiles.splice(pIndex, 1);
                spiders.splice(sIndex, 1);
            }
        });

        fireballs.forEach((fireball, fIndex) => {
            if (
                projectile.x > fireball.x - 8 &&
                projectile.x < fireball.x + 8 &&
                projectile.y > fireball.y - 8 &&
                projectile.y < fireball.y + 8
            ) {
                console.log("Arrow hit fireball!"); 
                projectiles.splice(pIndex, 1);
                fireballs.splice(fIndex, 1);
            }
        });

        leafBlocks.forEach((block, bIndex) => {
            if (
                !block.isDestroyed &&
                projectile.x > block.x &&
                projectile.x < block.x + block.width &&
                projectile.y > block.y &&
                projectile.y < block.y + block.height
            ) {
                console.log("Arrow hit leaf block!");
                block.takeDamage();
                projectiles.splice(pIndex, 1);
            }
        });
    });

    fireballs.forEach((fireball, fIndex) => {
        leafBlocks.forEach((block, bIndex) => {
            if (
                !block.isDestroyed &&
                fireball.x > block.x &&
                fireball.x < block.x + block.width &&
                fireball.y > block.y &&
                fireball.y < block.y + block.height
            ) {
                console.log("Fireball hit leaf block!");
                block.takeDamage();
                fireballs.splice(fIndex, 1);
            }
        });
    });

    fireballs.forEach((fireball, fIndex) => {
        if (
            fireball.x > player.x &&
            fireball.x < player.x + player.width &&
            fireball.y > player.y &&
            fireball.y < player.y + player.height
        ) {
            console.log("Fireball hit player!");
            player.takeDamage(); 
            fireballs.splice(fIndex, 1);
        }
    });

    // Check collisions between sword attacks and spiders
    if (player.isSwordAttacking) {
        let swordX, swordY, swordWidth, swordHeight;
        const swordThickness = 10;
        const swordLength = 40;

        if (player.arrowAngle >= 0) {
            swordX = player.x + player.width;
            swordY = player.y + player.height / 2 - swordThickness / 2;
            swordWidth = swordLength;
            swordHeight = swordThickness;
        } else {
            swordX = player.x - swordLength;
            swordY = player.y + player.height / 2 - swordThickness / 2;
            swordWidth = swordLength;
            swordHeight = swordThickness;
        }

        // Sword vs. spiders
        for (let i = spiders.length - 1; i >= 0; i--) {
            const spider = spiders[i];
            if (
                spider.x < swordX + swordWidth &&
                spider.x + spider.width > swordX &&
                spider.y < swordY + swordHeight &&
                spider.y + spider.height > swordY
            ) {
                console.log("Sword hit spider!");
                spiders.splice(i, 1);
            }
        }

        // Sword vs. leaf blocks
        leafBlocks.forEach((block, bIndex) => {
            if (
                !block.isDestroyed &&
                swordX < block.x + block.width &&
                swordX + swordWidth > block.x &&
                swordY < block.y + block.height &&
                swordY + swordHeight > block.y
            ) {
                console.log("Sword hit leaf block!");
                block.takeDamage();
            }
        });
    }

    for (let i = spiders.length - 1; i >= 0; i--) {
        const spider = spiders[i];
        if (
            player.x < spider.x + spider.width &&
            player.x + player.width > spider.x &&
            player.y < spider.y + spider.height &&
            player.y + player.height > spider.y
        ) {
            console.log("Spider hit player!");
            player.takeDamage();
            spiders.splice(i, 1);
        }
    }
}

function spawnMicroBoss() {
    const microBossType = levels[currentLevel].microBoss;
    if (microBossType === "dragon") {
        dragons.push({
            x: canvas.width / 2 - 60,
            y: 100,
            width: 150,
            height: 100,
            speed: 0.2,
            health: 10,
            isMicroBoss: true,
        });
    } else if (microBossType === "spider") {
        spiders.push({
            x: canvas.width / 2 - 40,
            y: 620,
            width: 80,
            height: 80,
            speed: 0.5,
            health: 5,
            isMicroBoss: true,
        });
    }
}

function drawLeafBlocks() {
    leafBlocks.forEach((block) => block.draw());
}

function drawZombies() {
    if (zombie) {
        zombie.draw();
    }
}

function drawBackground() {
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, -27, 0, canvas.width, canvas.height);
    }

    if (backgroundBottomImg.complete) {
        ctx.drawImage(backgroundBottomImg, -27, 345, canvas.width, canvas.height);
    }

}

function gameLoop() {
    if (isGameOver) return;

    console.log("Game loop running");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // debug
    ctx.fillStyle = "rgba(0,255,0,0.3)";
    ctx.fillRect(
        canvas.width / 2 - player.width / 2,
        floor.y - player.height,
        player.width,
        player.height
    );
    drawBackground();
    floor.draw()
    player.update();
    player.draw();
    player.drawAmmo();
    drawLeafBlocks();
    drawAimingArrow();
    drawSword();
    drawDragons();
    drawSpiders();
    if (zombie) zombie.update(player);
    drawZombies();
    for (let i = fireballs.length - 1; i >= 0; i--) {
        fireballs[i].update();
        if (fireballs[i].y > canvas.height) {
            fireballs.splice(i, 1);
        }
    }
    fireballs.forEach(fb => fb.draw(ctx));
    drawProjectiles();
    drawPowerUps();
    if (!isTimeStopped) {
        updatePowerUps();
    }

    if (isTimeStopped) {
        ctx.save();
        ctx.fillStyle = "rgba(100, 200, 255, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // blueish time stop
        ctx.globalCompositeOperation = "multiply";
        dragons.forEach(dragon => {
            ctx.fillStyle = "rgba(0, 100, 255, 0.5)";
            ctx.fillRect(dragon.x, dragon.y, dragon.width, dragon.height);
        });
        ctx.restore();

        // Show time remaining
        const timeLeft = ((timeStopEnd - Date.now()) / 1000).toFixed(1);
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.strokeText(`TIME STOP: ${timeLeft}s`, canvas.width / 2, 50);
        ctx.fillText(`TIME STOP: ${timeLeft}s`, canvas.width / 2, 50);
    }

    if (fireBeam.state === "charging") {
        // Draw warning area
        ctx.fillStyle = "rgba(255, 150, 0, 0.2)";
        ctx.fillRect(fireBeam.x - 20, 0, fireBeam.minWidth + 40, canvas.height);

        // Draw danger text
        ctx.fillStyle = "red";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("DANGER!", fireBeam.x + fireBeam.minWidth / 2, 50);
    }

    drawFireBeam();
    if (checkFireBeamCollision() && !isTimeStopped) {
        player.takeDamage();
    }
    
    drawWebProjectiles();
    updateSnare();
    updateDragons();
    updateWebProjectiles();
    updateSpiders();
    updateZombies(player);
    updateFireballs();
    updateProjectiles();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

let leafBlocks = [];

function spawnLeafBlocks() {
    const tree = new Tree("Oak");
    const middleRowY = canvas.height / 2 - 10;
    const blockWidth = tree.thickness;
    const blockHeight = 20;
    const minGap = tree.nodeDistance;
    const maxGap = tree.nodeDistance + 20;
    const yVariation = tree.height / 2;

    const clearingWidth = 100;
    let x = clearingWidth;

    const totalColumns = 10;

    for (let col = 0; col < totalColumns; col++) {
        const gap = Math.random() * (maxGap - minGap) + minGap;
        x += gap;

        if (x + blockWidth <= canvas.width - clearingWidth) {
            const y = middleRowY + (Math.random() * yVariation - yVariation / 2);
            const numLeaves = Math.floor(Math.random() * 6) + 3;
            
            for (let i = 0; i < numLeaves; i++) {
                const angle = (Math.PI * 2 * i) / numLeaves;
                const radius = 40;
                const leafX = x + Math.cos(angle) * radius;
                const leafY = y + Math.sin(angle) * radius;

                leafBlocks.push(new LeafBlock(leafX, leafY, blockWidth, blockHeight, "leaf"));
            }

            x += blockWidth;
        }
    }
}

function drawPowerUps() {
    powerUps.forEach(pu => pu.draw());
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];

        if (powerUp.update()) {
            powerUps.splice(i, 1);
            continue;
        }

        if (checkPowerUpCollection(powerUp)) {
            applyPowerUp(powerUp);
            powerUps.splice(i, 1);
        }
    }
}

function checkPowerUpCollection(powerUp) {
    return (
        player.x < powerUp.x + powerUp.width &&
        player.x + player.width > powerUp.x &&
        player.y < powerUp.y + powerUp.height &&
        player.y + player.height > powerUp.y
    );
}

function applyPowerUp(powerUp) {
    switch (powerUp.type) {
        case POWERUP_TYPES.AMMO:
            player.maxAmmo = 10;
            player.ammo = player.maxAmmo;
            break;

        case POWERUP_TYPES.HEALTH:
            player.health = Math.min(player.health + 1, 3);
            break;

        case POWERUP_TYPES.MAX_HEALTH:
            player.health = 4;
            break;

        case POWERUP_TYPES.TIME_STOP:
            isTimeStopped = true;
            timeStopEnd = Date.now() + 3000;
            setTimeout(() => {
                isTimeStopped = false;
            }, 3000);
            break;
    }
}
function spawnWoodBlocks() {
    const blockWidth = 40;
    const blockHeight = 20;
    const y = canvas.height / 2 - 10;

    // Clear any existing blocks before spawning new ones
    leafBlocks = [];

    // Spawn line of wood
    for (let x = 100; x < canvas.width - 100; x += blockWidth) {
        leafBlocks.push(new LeafBlock(x, y, blockWidth, blockHeight, "wood"));
    }
}

function spawnStoneBlocks() {
    const blockWidth = 40;
    const blockHeight = 20;

    // Example preset: A wall of stone blocks
    for (let x = 200; x < canvas.width - 200; x += blockWidth + 10) {
        for (let y = canvas.height / 2 - 50; y < canvas.height / 2 + 50; y += blockHeight + 10) {
            leafBlocks.push(new LeafBlock(x, y, blockWidth, blockHeight, "stone"));
        }
    }
}

let zombie = null;
const minDistanceFromPlayer = 100;
function spawnBoss() {
    boss = {
        x: canvas.width / 2 - BOSS_WIDTH / 2,
        y: 100,
        width: BOSS_WIDTH,
        height: BOSS_HEIGHT,
        speed: 0.4,
        health: levels[currentLevel].bossHealth,
        maxHealth: levels[currentLevel].bossHealth,
        isHovering: false,
        nextShotTime: 0,
        fireballRate: 1500
    };

    blocks = [
        new LeafBlock(200, 400, 400, 30, "wood")
    ];
}

function drawBoss() {
    if (!boss) return;

    // Draw boss dragon
    ctx.drawImage(dragonImg, boss.x, boss.y, boss.width, boss.height);

    // Draw health bar
    const healthPercent = boss.health / boss.maxHealth;

    // Health bar background
    ctx.fillStyle = "black";
    ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);

    // Health bar foreground
    ctx.fillStyle = healthPercent > 0.5 ? "green" :
        healthPercent > 0.2 ? "orange" : "red";
    ctx.fillRect(boss.x, boss.y - 20, boss.width * healthPercent, 10);

    // Health text
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`${boss.health}/${boss.maxHealth}`,
        boss.x + 5, boss.y - 10);
}

function updateBoss() {
    if (!boss || isTimeStopped) return;

    // Movement pattern
    boss.x += boss.speed;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
        boss.speed *= -1;
    }

    // Shooting logic
    if (Date.now() > boss.nextShotTime) {
        fireballs.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height,
            speedX: (Math.random() - 0.5) * 2,
            speedY: 3
        });
        boss.nextShotTime = Date.now() + boss.fireballRate;
    }
}

function checkBossHit() {
    projectiles.forEach((proj, pIndex) => {
        if (boss &&
            proj.x > boss.x &&
            proj.x < boss.x + boss.width &&
            proj.y > boss.y &&
            proj.y < boss.y + boss.height) {

            boss.health--;
            projectiles.splice(pIndex, 1);

            // Boss hit effect
            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

            if (boss.health <= 0) {
                // Boss defeated!
                dragonsKilled++;
                boss = null;
                if (dragonsKilled >= levels[currentLevel].dragonsToKill) {
                    endGame(true);
                }
            }
        }
    });
}

// PLAYER SPAWN CONTROLLER
const playerSpawn = {
    init() {
        this.calculateSpawnPosition();
        window.addEventListener('resize', () => this.calculateSpawnPosition());
    },
    
    calculateSpawnPosition() {
        this.x = canvas.width / 2 - player.width / 2;
        this.y = floor.y - player.height;
        console.log("Calculated spawn position:", { x: this.x, y: this.y });
    },

    spawn() {
        player.x = this.x;
        player.y = this.y;
        player.velocityY = 0;
        player.isJumping = false;

        console.log("Player spawned at:", {
            x: player.x,
            y: player.y,
            floorY: floor.y,
            canvasHeight: canvas.height
        });

        this.drawSpawnMarker();
    },

    // debug helper
    drawSpawnMarker() {
        ctx.fillStyle = "rgba(0,255,0,0.5)";
        ctx.fillRect(player.x, player.y, player.width, player.height);
        setTimeout(() => {
            if (player.x === this.x && player.y === this.y) {
                ctx.clearRect(player.x, player.y, player.width, player.height);
            }
        }, 1000);
    }
};

// Initialize when game starts
playerSpawn.init();

function spawnZombie() {
    if (zombie || currentLevel < 3) return;
    let x, y;

    do {
        x = Math.random() * (canvas.width - 40);
        y = floor.y - 60;
    } while (Math.abs(x - player.x) < minDistanceFromPlayer);

    zombie = new Zombie(x, y, 40, 60);
}

// Spawn a new stationary spider
function spawnSpider() {
    if (spiders.length > 0 || currentLevel < 3) return;
    const side = Math.random() < 0.5 ? "left" : "right";
    const x = side === "left" ? -60 : canvas.width + 60;
    const y = floor.y - 80;
    const spiderWidth = 50 * 1.75;
    const spiderHeight = 50 * 1.75;
    spiders.push({
        x,
        y,
        width: spiderWidth,
        height: spiderHeight,
        speed: 0,
        isMoving: false,
        shootCount: 0,
        nextShotTime: Date.now() + 1500,
        initialSide: side,
    });
}
// Spawn a wave of dragons
function spawnWave() {
    const level = levels[currentLevel];
    const enemiesToSpawn = level.enemiesPerWave;

    for (let i = 0; i < enemiesToSpawn; i++) {
        setTimeout(() => {
            const side = Math.random() < 0.5 ? "left" : "right";
            const x = side === "left" ? -100 : canvas.width + 100;
            const y = Math.random() * (canvas.height / 3);
            const dragonWidth = 200;
            const dragonHeight = 160;
            dragons.push({
                x,
                y,
                width: dragonWidth,
                height: dragonHeight,
                speed: 0.3,
                isHovering: false,
                originalSpeed: 0.3,
                hoverEndTime: 0,
                hasFiredBeam: false
            });
        }, i * 500);
    }

    enemiesRemaining = enemiesToSpawn;
}

function spawnFireball(dragon) {
    fireballs.push(new Fireball(
        dragon.x + dragon.width / 2,
        dragon.y + dragon.height,
        0, //speed stuff
        2
    ));
}

setInterval(spawnSpider, spiderSpawnInterval);

setInterval(() => {
    dragons.forEach((dragon) => {
        spawnFireball(dragon);
    });
}, 2000);


function showLevelCompleteScreen() {
    const overlay = document.getElementById("overlay");
    const overlayMessage = document.getElementById("overlayMessage");
    const nextLevelButton = document.getElementById("nextLevelButton");

    overlayMessage.textContent = "Level Complete!";
    nextLevelButton.textContent = "Next Level";
    overlay.style.display = "block";

    nextLevelButton.onclick = () => {
        overlay.style.display = "none";
        currentLevel++;
        if (currentLevel < levels.length) {
            loadLevel(currentLevel);
            resetPlayer();
            spawnLeafBlocks(levels[currentLevel].leafBlockType);
            isGameOver = false;
            gameLoop();
        } else {
            alert("You've completed all levels!");
        }
    };
}

function resetGame() {
    dragons = [];
    spiders = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];
    zombie = null;
    boss = null;

    player.x = canvas.width / 2 - player.width / 2;
    player.y = floor.y - player.height;
    player.health = 3;
    player.ammo = player.maxAmmo;
    powerUps = [];
    isTimeStopped = false;
    player.reset();

    dragonsKilled = 0;
    isGameOver = false;
    dragonWavePending = false;

    const level = levels[currentLevel];
    switch (level.blockType) {
        case "leaf":
            spawnLeafBlocks();
            break;
        case "wood":
            spawnWoodBlocks();
            break;
        case "stone":
            spawnStoneBlocks();
            break;
        default:
            spawnLeafBlocks();
    }
    spawnWave();
}

function resetPlayer() {
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.health = 3;
}

function resetPlayer() {
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.health = 3;
}

function endGame(isWin = false, isFinalLevel = false) {
    isGameOver = true;
    if (isWin) {
        showLevelCompleteScreen();
        saveProgress(currentLevel);
    } else {
        const overlay = document.getElementById("overlay");
        const overlayMessage = document.getElementById("overlayMessage");
        const playAgainButton = document.getElementById("playAgainButton");

        overlayMessage.textContent = "Game Over!";
        playAgainButton.style.display = "inline-block";
        overlay.style.display = "block";

        playAgainButton.onclick = () => {
            overlay.style.display = "none";
            currentLevel = 0;
            loadLevel(currentLevel);
            resetPlayer();
            isGameOver = false;
            gameLoop();
        };
    }
}

function startFreeplay() {
    resetGameState();
    playerSpawn.spawn();
    spawnLeafBlocks();
    spawnWave();
    gameLoop();
}

function loadLevel(levelIndex) {
    currentLevel = levelIndex;
    const level = levels[currentLevel];

    // Reset game state
    dragons = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];
    powerUps = [];
    dragonsKilled = 0;
    boss = null;

    // Clear any intervals
    clearAllIntervals();

    // Special boss level setup
    if (level.isBossLevel) {
        spawnBoss();
        spawnWoodBlocks();
        return;
    }

    // Normal level setup
    switch (level.blockType) {
        case "leaf": spawnLeafBlocks(); break;
        case "wood": spawnWoodBlocks(); break;
        case "stone": spawnStoneBlocks(); break;
    }

    spawnWave();
}


// Update your loadLevelButtons function:

function loadLevelButtons() {
    const levelButtonsContainer = document.getElementById("levelButtons");
    levelButtonsContainer.innerHTML = "";

    levels.forEach((level, index) => {
        const button = document.createElement("button");
        button.className = "levelButton";
        button.textContent = `Level ${index + 1}`;

        button.addEventListener("click", () => {
            // Hide loading screen and show game
            document.getElementById("loadingScreen").style.display = "none";
            document.getElementById("game-container").style.display = "block";

            // Load the selected level
            loadLevel(index);

            // Start the game if not already running
            if (isGameOver) {
                isGameOver = false;
                gameLoop();
            }
        });

        // Check if the level is unlocked
        const isUnlocked = localStorage.getItem(`level_${index}_unlocked`) || index === 0;
        if (!isUnlocked) {
            button.disabled = true;
        }

        levelButtonsContainer.appendChild(button);
    });
}

function saveProgress(level) {
    localStorage.setItem(`level_${level}_unlocked`, true);
}

document.getElementById("resetButton").addEventListener("click", () => {
    // Clear all level keys
    levels.forEach((_, index) => {
        localStorage.removeItem(`level_${index}_unlocked`);
    });

    // Refresh the level buttons
    loadLevelButtons();
});

document.getElementById("loadingButton").addEventListener("click", () => {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("loadingScreen").style.display = "flex";
    loadLevelButtons();
});

document.getElementById("backButton").addEventListener("click", () => {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("mainMenu").style.display = "flex";
});

function setupEventListeners() {
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        player.arrowAngle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
    });

    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0 && !player.isSwordAttacking) {
            player.shoot();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "v") {
            floor.toggleVisibility();
        }
    });
    function handleMovement() {
        if (isPlayerSnared) return;
    }
    
    document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        if (key === "a") {
            player.moveLeft();
        } else if (key === "d") {
            player.moveRight();
        } else if (key === "w") {
            player.aimUp();
        } else if (key === "s") {
            player.aimDown();
        } else if (key === "f") {
            player.attackSword();
        } else if (e.code === "Space") {
            e.preventDefault();
            player.jump();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const mainMenu = document.getElementById("mainMenu");
    const freeplayButton = document.getElementById("freeplayButton");
    const storyButton = document.getElementById("storyButton");

    freeplayButton.addEventListener("click", () => {
        mainMenu.style.display = "none";
        startGame("freeplay");
    });

    storyButton.addEventListener("click", () => {
        mainMenu.style.display = "none";
        startGame("story");
    });
});

function startGame(mode) {
    currentLevel = 0;
    dragonsKilled = 0;
    isGameOver = false;
    dragonWavePending = false;

    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.health = 3;

    dragons = [];
    spiders = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];
    zombies = [];


    setupEventListeners();
    
    if (mode === "freeplay") {
        startFreeplay();
    } else if (mode === "story") {
        startStory();
    }
}

function startFreeplay() {
    spawnLeafBlocks("strong");
    spawnWave(3, 5);
    setInterval(spawnSpider, spiderSpawnInterval);
    setInterval(spawnZombie, 5000);
    playerSpawn.spawn();

    gameLoop();
}

function startStory() {
    clearInterval(spawnSpider);
    clearInterval(spawnZombie);

    playerSpawn.spawn();

    loadLevel(currentLevel);
    gameLoop();
}

//function startFreeplay() {
//    // Start the game as it is
//    spawnWave();
//    gameLoop();
//    spawnLeafBlocks();
//}

//function startStory() {
    // Start the tutorial levels
 //   currentLevel = 0; // Start with level 1 (tutorial)
  //  loadLevel(currentLevel);
//    gameLoop();
//}

function showTutorial(text) {
    const tutorialDiv = document.getElementById("tutorial");
    tutorialDiv.innerHTML = text.replace(/\n/g, "<br>");
    tutorialDiv.style.display = "block";
}

function hideTutorial() {
    const tutorialDiv = document.getElementById("tutorial");
    tutorialDiv.style.display = "none";
}

function loadLevel(levelIndex) {
    const level = levels[levelIndex];

    dragons = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];

    // Reset counter
    dragonsKilled = 0;
    updateDragonsKilledCounter();

    // Disable spiders and zombies in Levels 1 and 2
    if (levelIndex < 2) {
        spiders = [];
        zombies = [];
    }

    // Show tutorial for Level 1
    if (levelIndex === 0) {
        showTutorial(level.description);
    } else {
        hideTutorial();
    }

    document.getElementById("dragonsToKillValue").textContent = level.dragonsToKill;

    switch (levelIndex) {
        case 0:
            spawnLeafBlocks();
            break;
        case 1:
            spawnWoodBlocks();
            break;
        case 2:
            spawnLeafBlocks();
            break;
        default:
            spawnLeafBlocks();
    }

    gameLoop();
    spawnWave(level.waves, level.enemiesPerWave);
}

function updateDragonsKilledCounter() {
    document.getElementById("dragonsKilledValue").textContent = dragonsKilled;
}



function spawnLeafBlocks(toughness = "strong") {
    const tree = new Tree("Oak");
    const middleRowY = canvas.height / 2 - 10;
    const blockWidth = tree.thickness;
    const blockHeight = 20;
    const minGap = tree.nodeDistance;
    const maxGap = tree.nodeDistance + 20;
    const yVariation = tree.height / 2;

    const clearingWidth = 100;
    let x = clearingWidth;

    const totalColumns = 10;

    for (let col = 0; col < totalColumns; col++) {
        const gap = Math.random() * (maxGap - minGap) + minGap;
        x += gap;

        if (x + blockWidth <= canvas.width - clearingWidth) {
            const y = middleRowY + (Math.random() * yVariation - yVariation / 2);
            const numLeaves = Math.floor(Math.random() * 6) + 3; 
            
            for (let i = 0; i < numLeaves; i++) {
                const angle = (Math.PI * 2 * i) / numLeaves;
                const radius = 40;
                const leafX = x + Math.cos(angle) * radius;
                const leafY = y + Math.sin(angle) * radius;

                leafBlocks.push(new LeafBlock(leafX, leafY, blockWidth, blockHeight, toughness));
            }

            x += blockWidth;
        }
    }
}
function spawnWave(waves, enemiesPerWave) {
    for (let wave = 0; wave < waves; wave++) {
        setTimeout(() => {
            for (let i = 0; i < enemiesPerWave; i++) {
                setTimeout(() => {
                    const side = Math.random() < 0.5 ? "left" : "right";
                    const x = side === "left" ? -100 : canvas.width + 100;
                    const y = Math.random() * (canvas.height / 3);
                    const dragonWidth = 120;
                    const dragonHeight = 80;
                    dragons.push({
                        x,
                        y,
                        width: dragonWidth,
                        height: dragonHeight,
                        speed: 0.3,
                    });
                }, i * 500);
            }
        }, wave * 10000);
    }
}

