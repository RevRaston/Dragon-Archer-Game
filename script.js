// ========================
// SECTION 1: CANVAS SETUP

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
    canvas.width = 800;
    canvas.height = window.innerHeight * 0.93;
}


//Start Methods - two more methods at very bottom due to load order
resizeCanvas();
// 1000 interveral == 1 second
setInterval(spawnZombie, 5000);
window.addEventListener("resize", resizeCanvas);


// ========================
// SECTION 2: GAME VARIABLES
// Add to SECTION 2: GAME VARIABLES

// Add to SECTION 2: GAME VARIABLES
let isFireBeamActive = false;
// Replace the existing fireBeam object with:
let fireBeam = {
    x: 0,
    minWidth: 20,
    maxWidth: 40,
    currentWidth: 0,
    startTime: 0,
    chargeTime: 1000, // 1 second charging
    activeTime: 2000, // 2 seconds active
    expanding: true,
    state: "inactive" // "charging", "active", "inactive"
};

// Add to SECTION 2: GAME VARIABLES
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
const SNARE_DURATION = 2000; // 2 seconds
const FIREBALL_PARTICLES = 15; // Particles per fireball
const SMOKE_PARTICLES = 8;     // Smoke particles per frame

let webProjectiles = []; // Array for spider webs
const WEB_SPEED = 3;
const WEB_RADIUS = 8;
//arrays
let dragons = [];
let spiders = []; // Only one spider can be kept in an array at one time
let fireballs = [];
let projectiles = []; // Array for storing projectiles
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
        blockType: "leaf", // Leaf blocks
    },
    {
        waves: 3,
        enemiesPerWave: 2,
        dragonsToKill: 6,
        microBoss: null,
        description: "Level 2: Defeat 3 waves of 2 dragons!",
        blockType: "wood", // Wood blocks
    },
    {
        waves: 3,
        enemiesPerWave: 3,
        dragonsToKill: 9,
        microBoss: null,
        description: "Level 3: Defeat 3 waves of 3 dragons and the mini dragon boss!",
        blockType: "leaf", // Leaf blocks
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
    
    // Level 5: Fast-paced
    {
        waves: 3,
        enemiesPerWave: 6,
        dragonsToKill: 18,
        description: "Wave 5: Rapid enemies!",
        blockType: "stone",
        enemyTypes: ["dragon", "spider"],
        enemySpeed: 1.5
    },
    
    // Level 6: Archery challenge
    {
        waves: 2,
        enemiesPerWave: 8,
        dragonsToKill: 16,
        description: "Wave 6: Archery test!",
        blockType: "wood",
        enemyTypes: ["dragon"],
        playerAmmo: 10
    },
    
    // Level 7: Survival
    {
        waves: 4,
        enemiesPerWave: 5,
        dragonsToKill: 20,
        description: "Wave 7: Survive the onslaught!",
        blockType: "stone",
        enemyTypes: ["dragon", "spider", "zombie"]
    },
    
    // Level 8: Mobile enemies
    {
        waves: 3,
        enemiesPerWave: 7,
        dragonsToKill: 21,
        description: "Wave 8: Fast and furious!",
        blockType: "leaf",
        enemyTypes: ["dragon", "spider"],
        enemySpeed: 2.0
    },
    
    // Level 9: Final challenge
    {
        waves: 5,
        enemiesPerWave: 6,
        dragonsToKill: 30,
        description: "Wave 9: Ultimate test!",
        blockType: "wood",
        enemyTypes: ["dragon", "spider", "zombie"]
    },
    
    // Level 10: Victory lap
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

// ========================
// SECTION 3: LOAD ASSETS (UPDATED)

// Array to track loaded assets
let assetsLoaded = 0;
const totalAssets = 9; // Update this if you add more images

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        // All assets loaded, hide loading screen
        document.getElementById("loadingScreen").style.display = "none";
        // Initialize game
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
swordImg.src = "Assets/arrow.png"; //temp using it

const backgroundImg = new Image();
backgroundImg.onload = assetLoaded;
backgroundImg.src = "Assets/Backgrounds/Tavern/Tavern.png";

const backgroundBottomImg = new Image();
backgroundBottomImg.onload = assetLoaded;
backgroundBottomImg.src = "Assets/Backgrounds/Tavern/TavernBottom.png";
// ========================
// SECTION 4: CLASS CREATION

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.color = this.getColor();
        this.lifetime = 10000; // 10 seconds
        this.spawnTime = Date.now();
        this.velocityY = 0; // Add gravity
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

        // Draw icon based on type
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
            this.velocityY += gravity * 0.3; // Slower fall than player
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
        this.y = canvas.height - 50; // Position at bottom of screen
        this.height = 20; // Thickness of floor
        this.color = "#0040FF";
        this.isVisible = true; // Toggle for visibility
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
        this.width = width; // Hitbox width
        this.height = height; // Hitbox height
        this.spawnTime = Date.now();
        this.isActive = true;
    }

    draw() {
        if (!this.isActive) return;

        // Draw the hitbox (for debugging, optional)
        ctx.fillStyle = "rgba(0, 128, 0, 0.3)"; // Green hitbox
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw the zombie sprite over the hitbox
        if (zombieImg.complete) { // Ensure the image is loaded
            ctx.drawImage(
                zombieImg, // The zombie sprite
                this.x - 0, // Adjust X position if needed
                this.y - 5, // Adjust Y position if needed
                this.width, // Render width
                this.height // Render height
            );
        } else {
            console.error("Zombie sprite not loaded!");
        }
    }

    update(player) {
        if (!this.isActive) return;

        // Check if the zombie has been alive for more than 5 seconds
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

            // Ensure the zombie spawns at a safe distance from the player
            do {
                x = Math.random() * (canvas.width - this.width);
                y = canvas.height - 60; // Spawn at the bottom of the screen
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
                return 30; // Thicker leaves
            case "Pine":
                return 20; // Thinner leaves
            case "Maple":
                return 25; // Medium thickness
            default:
                return 20; // Default thickness
        }
    }

    getNodeDistance() {
        switch (this.type) {
            case "Oak":
                return 40; // Wider gaps
            case "Pine":
                return 30; // Narrower gaps
            case "Maple":
                return 35; // Medium gaps
            default:
                return 30; // Default gaps
        }
    }

    getHeight() {
        switch (this.type) {
            case "Oak":
                return 100; // Taller tree
            case "Pine":
                return 120; // Taller and narrower
            case "Maple":
                return 80; // Shorter tree
            default:
                return 100; // Default height
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
        this.health = this.getHealth(); // Set health based on type
        this.isDestroyed = false;
    }

    getHealth() {
        switch (this.type) {
            case "leaf":
                return 1; // Breaks in one hit
            case "wood":
                return 3; // Takes 3 hits to break
            case "stone":
                return Infinity; // Cannot be broken
            default:
                return 1; // Default to leaf
        }
    }

    draw() {
        if (this.isDestroyed) return; // Don't draw if destroyed

        // Set color based on type
        switch (this.type) {
            case "leaf":
                ctx.fillStyle = "green"; // Green for leaf
                break;
            case "wood":
                ctx.fillStyle = "brown"; // Brown for wood
                break;
            case "stone":
                ctx.fillStyle = "gray"; // Gray for stone
                break;
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    takeDamage() {
        if (this.type === "stone") return; // Stone blocks cannot be broken

        this.health--;
        if (this.health <= 0) {
            this.isDestroyed = true;
            // Add destruction animation here (e.g., particles)
        }
    }
}

// ========================
// UPDATE FIREBALL CLASS/OBJECT (modify your existing fireball structure)
class Fireball {
    constructor(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.particles = [];
        this.size = 20;

        // Create initial particles
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
        this.y = floor.y - this.height; // Spawn just above floor
        this.width = 80; // Increased from 50 to 100 (2x)
        this.height = 50; // Increased from 30 to 60 (2x)
        this.arrowAngle = -Math.PI / 4;
        this.health = 3;
        this.isSwordAttacking = false;
        this.velocityY = 0;
        this.jumpPower = 6;
        this.isJumping = false;
        this.isGrabbed = false;

        this.maxAmmo = 3; // Maximum arrows
        this.ammo = this.maxAmmo; // Current arrows
        this.ammoCooldown = 5000; // 5-second cooldown per arrow
        this.isReloading = false; // Whether the player is reloading
        this.reloadInterval = null; // Interval for reloading
        // In the Player class constructor:
        this.defaultMaxAmmo = 3; // Store original value

    }



    startReload() {
        this.isReloading = true;
        this.reloadInterval = setInterval(() => {
            if (this.ammo < this.maxAmmo) {
                this.ammo++; // Replenish 1 arrow
                this.isReloading = false; // Allow shooting as soon as 1 arrow is replenished
            } else {
                clearInterval(this.reloadInterval); // Stop reloading when full
                this.isReloading = false;
            }
        }, this.ammoCooldown);
    }

    drawAmmo() {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(`Arrows: ${this.ammo}`, canvas.width - 150, 60); // Adjusted y position to 60
    }

    update() {
        if (!isPlayerSnared) { // Only apply gravity if not snared
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
        if (isPlayerSnared) return; // Don't jump if snared
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

            // Draw remaining snare time
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
        if (isPlayerSnared) return; // Don't move if snared
        if (this.x > 0) {
            this.x -= 10;
        }
    }

    moveRight() {
        if (isPlayerSnared) return; // Don't move if snared
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
                speedY: speed * angleY * 1.1, // Reduce vertical speed
            });

            this.ammo--; // Decrease ammo
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
            }, 300); // Sword attack duration
        }
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            endGame();
        }
    }

    // Add a reset method to the Player class:
    reset() {
        this.health = 3;
        this.maxAmmo = this.defaultMaxAmmo;
        this.ammo = this.maxAmmo;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = floor.y - this.height; // Explicit floor alignment
        this.velocityY = 0;
        this.isJumping = false;
    }

}

// Instantiate player
const player = new Player();

// ========================
// SECTION 5: GAME FUNCTIONS


//Hit box and rendering
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

        // Optional: Add web-like lines
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

// In drawDragons(), modify to show hover state:
function drawDragons() {
    dragons.forEach((dragon) => {
        ctx.fillStyle = dragon.isHovering ? "rgba(255, 200, 0, 0.3)" : "rgba(0, 255, 0, 0.3)";
        ctx.fillRect(dragon.x, dragon.y, dragon.width, dragon.height);
        ctx.drawImage(dragonImg, dragon.x, dragon.y, dragon.width, dragon.height);

        // Draw hover indicator
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
        // Draw the hitbox (for debugging, optional)
        ctx.fillStyle = "rgba(128, 0, 128, 0.3)"; // Transparent purple
        ctx.fillRect(spider.x, spider.y, spider.width, spider.height);
        ctx.drawImage(spiderImg, spider.x - 0, spider.y - 5, 80, 80);

    });
}


function drawFireballs() {
    fireballs.forEach((fireball) => {
        ctx.fillStyle = "rgba(255, 165, 0, 0.3)"; // Transparent orange
        ctx.beginPath();
        ctx.arc(fireball.x, fireball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(fireballImg, fireball.x - 10, fireball.y - 10, 20, 20);
    });
}

function drawProjectiles() {
    projectiles.forEach((projectile) => {
        ctx.fillStyle = "rgba(255, 255, 0, 0.3)"; // Transparent yellow
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

// Updates
function updateFireballs() {
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fireball = fireballs[i];

        if (!isTimeStopped) {
            fireball.x += fireball.speedX || 0;
            fireball.y += fireball.speedY;

            // Remove if out of bounds
            if (fireball.y > canvas.height - 50) {
                fireballs.splice(i, 1);
                continue;
            }
        }

        // Collision detection still works during time stop
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
            // Check if dragon should enter hover mode (50% chance when over player)
            if (!dragon.isHovering && 
                Math.random() < 0.005 && 
                dragon.x + dragon.width/2 > player.x - 100 && 
                dragon.x + dragon.width/2 < player.x + player.width + 100) {
                
                dragon.isHovering = true;
                dragon.hoverEndTime = Date.now() + 4000; // Hover for 4 seconds
                dragon.originalSpeed = dragon.speed;
                dragon.speed = 0;
                dragon.hasFiredBeam = false; // Reset beam flag
            }
            
            // During hover, check if should fire beam (50% chance, only once)
            if (dragon.isHovering && !dragon.hasFiredBeam && Math.random() < 0.02) {
                if (!isFireBeamActive) {
                    activateFireBeam(dragon.x + dragon.width/2);
                    dragon.hasFiredBeam = true;
                }
            }
            
            // Check if hover time is over
            if (dragon.isHovering && Date.now() > dragon.hoverEndTime) {
                dragon.isHovering = false;
                dragon.speed = dragon.originalSpeed;
            }
            
            // Move if not hovering
            if (!dragon.isHovering) {
                dragon.x += dragon.speed;
                if (dragon.x > canvas.width) {
                    dragon.x = -dragon.width;
                }
            }
        }
        
        // Regular fireball shooting (when not time stopped and not hovering)
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

    // Start charging phase
    setTimeout(() => {
        if (fireBeam.state === "charging") {
            fireBeam.state = "active";
            fireBeam.startTime = Date.now();

            // Animate the beam
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

            // Deactivate after duration
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

        // Update position
        web.x += web.speedX;
        web.alpha -= 0.01; // Gradually fade out

        // Check collision with player (no damage)
        if (checkWebHitPlayer(web)) {
            webProjectiles.splice(i, 1);
            continue;
        }

        // Remove if off-screen or fully faded
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
        player.velocityY = 0; // Stop any vertical movement

        // Visual effect
        createWebSnareEffect(player.x + player.width / 2, player.y + player.height / 2);
        return true;
    }
    return false;
}

function updateSnare() {
    if (isPlayerSnared) {
        // Completely stop player movement while snared
        player.velocityY = 0;

        if (Date.now() > snareEndTime) {
            isPlayerSnared = false;
        }
    }
}
function createWebSnareEffect(x, y) {
    // Create web particles around player
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

    // Calculate active progress for the entire function
    const activeProgress = fireBeam.state === "charging"
        ? (Date.now() - fireBeam.startTime) / fireBeam.chargeTime
        : (Date.now() - fireBeam.startTime) / fireBeam.activeTime;

    // ===== SCREEN SHAKE EFFECT =====
    let shakeX = 10;
    let shakeY = 25;

    if (fireBeam.state === "active" && activeProgress < 0.1) {
        const shakeIntensity = 1 - (activeProgress / 0.1); // Easing out
        shakeX = (Math.random() - 0.5) * 10 * shakeIntensity;
        shakeY = (Math.random() - 0.5) * 5 * shakeIntensity;
    }

    // Save the canvas state before applying transformations
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ===== CHARGING PHASE VISUALS =====
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

    // ===== ACTIVE PHASE VISUALS =====
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

    // Restore the canvas state after all drawing is complete
    ctx.restore();
}
function checkFireBeamCollision() {
    // Only check collision when beam is active
    return fireBeam.state === "active" &&
        player.x + player.width > fireBeam.x &&
        player.x < fireBeam.x + fireBeam.currentWidth;
}

function updateSpiders() {
    const currentTime = Date.now();
    spiders.forEach((spider) => {
        if (!isTimeStopped) {
            if (currentTime >= spider.nextShotTime) {
                // Shoot web projectile instead of fireball
                let webSpeedX = spider.initialSide === "left" ? 5 : -5;
                webProjectiles.push({
                    x: spider.x + spider.width / 2,
                    y: spider.y + spider.height / 2,
                    speedX: webSpeedX,
                    speedY: 0,
                    radius: 8,  // Size of the web projectile
                    alpha: 0.9  // Initial transparency
                });

                // Existing spider teleport logic
                if (spider.initialSide === "left") {
                    spider.x = canvas.width + 60;
                    spider.initialSide = "right";
                } else {
                    spider.x = -60;
                    spider.initialSide = "left";
                }

                spider.shootCount = (spider.shootCount || 0) + 1;
                spider.nextShotTime = currentTime + 1500; // 1.5-second delay between shots

                if (spider.shootCount >= 3) {
                    spider.isMoving = true;
                    spider.initialSide = Math.random() < 0.5 ? "left" : "right";
                    spider.speed = spider.initialSide === "left" ? 0.3 : -0.3;
                    spider.y = 560; // Set Y position to 560 for moving mode
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
    if (!zombie) return; // No zombie to update

    // Check for player collision
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
        player.takeDamage(); // Hurt the player
        zombie = null; // Remove the zombie
    }
}

// Check collisions
function checkCollisions() {
    // Check collisions between projectiles and dragons
    projectiles.forEach((projectile, pIndex) => {
        dragons.forEach((dragon, dIndex) => {
            if (
                projectile.x > dragon.x &&
                projectile.x < dragon.x + dragon.width &&
                projectile.y > dragon.y &&
                projectile.y < dragon.y + dragon.height
            ) {
                console.log("Arrow hit dragon!"); // Debug log
                projectiles.splice(pIndex, 1); // Remove the projectile
                const deadDragon = dragons.splice(dIndex, 1)[0];
                dragonsKilled++; // Increment dragons killed
                updateDragonsKilledCounter(); // Update the counter

                if (Math.random() < 1) {
                    const types = Object.values(POWERUP_TYPES);
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    powerUps.push(new PowerUp(
                        deadDragon.x + deadDragon.width / 2,
                        deadDragon.y + deadDragon.height / 2,
                        randomType
                    ));
                }
                // Check if all dragons are defeated
                if (dragonsKilled >= levels[currentLevel].dragonsToKill) {
                    endGame(true); // Level completed
                }
            }
        });

        // Check collisions between projectiles and spiders
        spiders.forEach((spider, sIndex) => {
            if (
                projectile.x > spider.x &&
                projectile.x < spider.x + spider.width &&
                projectile.y > spider.y &&
                projectile.y < spider.y + spider.height
            ) {
                console.log("Arrow hit spider!"); // Debug log
                projectiles.splice(pIndex, 1); // Remove the projectile
                spiders.splice(sIndex, 1); // Remove the spider
            }
        });

        // Check collisions between projectiles and fireballs
        fireballs.forEach((fireball, fIndex) => {
            if (
                projectile.x > fireball.x - 8 &&
                projectile.x < fireball.x + 8 &&
                projectile.y > fireball.y - 8 &&
                projectile.y < fireball.y + 8
            ) {
                console.log("Arrow hit fireball!"); // Debug log
                projectiles.splice(pIndex, 1); // Remove the projectile
                fireballs.splice(fIndex, 1); // Remove the fireball
            }
        });

        // Check collisions between projectiles and leaf blocks
        leafBlocks.forEach((block, bIndex) => {
            if (
                !block.isDestroyed &&
                projectile.x > block.x &&
                projectile.x < block.x + block.width &&
                projectile.y > block.y &&
                projectile.y < block.y + block.height
            ) {
                console.log("Arrow hit leaf block!"); // Debug log
                block.takeDamage(); // Damage the block
                projectiles.splice(pIndex, 1); // Remove the projectile
            }
        });
    });

    // Check collisions between fireballs and leaf blocks
    fireballs.forEach((fireball, fIndex) => {
        leafBlocks.forEach((block, bIndex) => {
            if (
                !block.isDestroyed &&
                fireball.x > block.x &&
                fireball.x < block.x + block.width &&
                fireball.y > block.y &&
                fireball.y < block.y + block.height
            ) {
                console.log("Fireball hit leaf block!"); // Debug log
                block.takeDamage(); // Damage the block
                fireballs.splice(fIndex, 1); // Remove the fireball
            }
        });
    });

    // Check collisions between fireballs and player
    fireballs.forEach((fireball, fIndex) => {
        if (
            fireball.x > player.x &&
            fireball.x < player.x + player.width &&
            fireball.y > player.y &&
            fireball.y < player.y + player.height
        ) {
            console.log("Fireball hit player!"); // Debug log
            player.takeDamage(); // Damage the player
            fireballs.splice(fIndex, 1); // Remove the fireball
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
                console.log("Sword hit spider!"); // Debug log
                spiders.splice(i, 1); // Remove the spider
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
                console.log("Sword hit leaf block!"); // Debug log
                block.takeDamage(); // Damage the block
            }
        });
    }

    // Check collisions between player and spiders
    for (let i = spiders.length - 1; i >= 0; i--) {
        const spider = spiders[i];
        if (
            player.x < spider.x + spider.width &&
            player.x + player.width > spider.x &&
            player.y < spider.y + spider.height &&
            player.y + player.height > spider.y
        ) {
            console.log("Spider hit player!"); // Debug log
            player.takeDamage(); // Damage the player
            spiders.splice(i, 1); // Remove the spider
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
            isMicroBoss: true, // Mark as micro-boss
        });
    } else if (microBossType === "spider") {
        spiders.push({
            x: canvas.width / 2 - 40,
            y: 620,
            width: 80,
            height: 80,
            speed: 0.5,
            health: 5,
            isMicroBoss: true, // Mark as micro-boss
        });
    }
}

//Draw Leaf Blocks
function drawLeafBlocks() {
    leafBlocks.forEach((block) => block.draw());
}

//Draw Zombies
function drawZombies() {
    if (zombie) {
        zombie.draw();
    }
}

// Draw background
function drawBackground() {
    // Draw the background image
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, -27, 0, canvas.width, canvas.height);
    }

    if (backgroundBottomImg.complete) {
        ctx.drawImage(backgroundBottomImg, -27, 345, canvas.width, canvas.height);
    }

}

// Game loop
function gameLoop() {
    if (isGameOver) return;

    console.log("Game loop running"); // Debug log

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // DEBUG: Draw spawn point
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
    // In gameLoop(), add these near the other draw/update calls:
    drawPowerUps();
    if (!isTimeStopped) {
        updatePowerUps();
    }

    
    // In gameLoop(), where you draw the time stop effect:
    if (isTimeStopped) {
        ctx.save();
        ctx.fillStyle = "rgba(100, 200, 255, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Make enemies blue-ish during time stop
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

    // In gameLoop(), modify the fire beam section:
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
    const tree = new Tree("Oak"); // Example: Spawn an Oak tree
    const middleRowY = canvas.height / 2 - 10; // Middle of the screen
    const blockWidth = tree.thickness; // Use tree thickness for block width
    const blockHeight = 20; // Fixed height for simplicity
    const minGap = tree.nodeDistance; // Use tree node distance for gaps
    const maxGap = tree.nodeDistance + 20; // Add some variation
    const yVariation = tree.height / 2; // Use tree height for vertical spread

    const clearingWidth = 100; // Width of the clearings on the left and right
    let x = clearingWidth; // Start from the left edge of the spawning area

    const totalColumns = 10; // Decrease the number of columns

    for (let col = 0; col < totalColumns; col++) {
        // Add a random gap between columns
        const gap = Math.random() * (maxGap - minGap) + minGap;
        x += gap;

        // Spawn a column if it fits within the spawning area
        if (x + blockWidth <= canvas.width - clearingWidth) {
            const y = middleRowY + (Math.random() * yVariation - yVariation / 2); // Randomize Y position
            const numLeaves = Math.floor(Math.random() * 6) + 3; // Random number of leaves (3-8)

            // Spawn leaf blocks in a circular pattern around the center node
            for (let i = 0; i < numLeaves; i++) {
                const angle = (Math.PI * 2 * i) / numLeaves; // Evenly distribute leaves in a circle
                const radius = 40; // Increase radius for a bushier look
                const leafX = x + Math.cos(angle) * radius;
                const leafY = y + Math.sin(angle) * radius;

                leafBlocks.push(new LeafBlock(leafX, leafY, blockWidth, blockHeight, "leaf"));
            }

            x += blockWidth; // Move to the end of the current column
        }
    }
}

// Add to SECTION 5: GAME FUNCTIONS
function drawPowerUps() {
    powerUps.forEach(pu => pu.draw());
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];

        // Always update powerups (so they can be collected during time stop)
        if (powerUp.update()) {
            powerUps.splice(i, 1);
            continue;
        }

        // Check collection
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
            player.maxAmmo = 10; // Increase max ammo
            player.ammo = player.maxAmmo; // Refill ammo
            break;

        case POWERUP_TYPES.HEALTH:
            player.health = Math.min(player.health + 1, 3); // Heal 1 HP, max 3
            break;

        case POWERUP_TYPES.MAX_HEALTH:
            player.health = 4; // New max health
            break;

        case POWERUP_TYPES.TIME_STOP:
            isTimeStopped = true;
            timeStopEnd = Date.now() + 3000; // 3 seconds
            setTimeout(() => {
                isTimeStopped = false;
            }, 3000);
            break;
    }
}
function spawnWoodBlocks() {
    const blockWidth = 40; // Width of each wood block
    const blockHeight = 20; // Height of each wood block
    const y = canvas.height / 2 - 10; // Y position for the line of blocks (middle of the screen)

    // Clear any existing blocks before spawning new ones
    leafBlocks = [];

    // Spawn a consecutive line of wood blocks
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

let zombie = null; // Only one zombie at a time
const minDistanceFromPlayer = 100; // Minimum distance from the player
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
        fireballRate: 1500 // Shoots every 1.5 seconds
    };

    // Spawn wood platform arena
    blocks = [
        new LeafBlock(200, 400, 400, 30, "wood") // Main platform
    ];
}

function drawBoss() {
    if (!boss) return;

    // Draw boss dragon (using your existing dragonImg but scaled up)
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
        boss.speed *= -1; // Reverse direction at edges
    }

    // Shooting logic
    if (Date.now() > boss.nextShotTime) {
        fireballs.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height,
            speedX: (Math.random() - 0.5) * 2, // Some horizontal spread
            speedY: 3 // Faster fireballs
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
// ========================
// PLAYER SPAWN CONTROLLER
// ========================

const playerSpawn = {
    // Initialize spawn system
    init() {
        this.calculateSpawnPosition();
        window.addEventListener('resize', () => this.calculateSpawnPosition());
    },

    // Calculate proper spawn position relative to floor
    calculateSpawnPosition() {
        this.x = canvas.width / 2 - player.width / 2;
        this.y = floor.y - player.height;
        console.log("Calculated spawn position:", { x: this.x, y: this.y });
    },

    // Spawn the player (call this whenever needed)
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

        // DEBUG: Visual spawn marker
        this.drawSpawnMarker();
    },

    // Visual debug helper
    drawSpawnMarker() {
        // This will show a temporary marker at spawn point
        ctx.fillStyle = "rgba(0,255,0,0.5)";
        ctx.fillRect(player.x, player.y, player.width, player.height);
        setTimeout(() => {
            // Marker will disappear after 1 second
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
        y = floor.y - 60; // Spawn above floor
    } while (Math.abs(x - player.x) < minDistanceFromPlayer);

    zombie = new Zombie(x, y, 40, 60);
}

// Spawn a new stationary spider
function spawnSpider() {
    if (spiders.length > 0 || currentLevel < 3) return;
    const side = Math.random() < 0.5 ? "left" : "right";
    const x = side === "left" ? -60 : canvas.width + 60;
    const y = floor.y - 80; // Spawn above floor
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
            const y = Math.random() * (canvas.height / 3); // Spawn in the top third of the screen
            const dragonWidth = 200; // Increased from 120 to 180 (1.5x)
            const dragonHeight = 160; // Increased from 80 to 120 (1.5x)
            dragons.push({
                x,
                y,
                width: dragonWidth,
                height: dragonHeight,
                speed: 0.3,
                isHovering: false,
                originalSpeed: 0.3,
                hoverEndTime: 0,
                hasFiredBeam: false  // Add this new property
            });
        }, i * 500);
    }

    enemiesRemaining = enemiesToSpawn;
}

// Spawn fireballs from dragons
function spawnFireball(dragon) {
    fireballs.push(new Fireball(
        dragon.x + dragon.width / 2,
        dragon.y + dragon.height,
        0,  // speedX (adjust as needed)
        2   // speedY (adjust as needed)
    ));
}

// Start spawning spiders at intervals
setInterval(spawnSpider, spiderSpawnInterval);

// Spawn fireballs from dragons every 2 seconds
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
            loadLevel(currentLevel); // Load the next level
            resetPlayer(); // Reset player position and health
            spawnLeafBlocks(levels[currentLevel].leafBlockType); // Spawn new leaf blocks
            isGameOver = false;
            gameLoop(); // Restart the game loop
        } else {
            alert("You've completed all levels!");
        }
    };
}

function resetGame() {
    // Reset game variables
    dragons = [];
    spiders = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];
    zombie = null;
    boss = null;

    // Reset player position and health
    player.x = canvas.width / 2 - player.width / 2;
    player.y = floor.y - player.height; // Spawn on floor
    player.health = 3;
    player.ammo = player.maxAmmo;
    powerUps = [];
    isTimeStopped = false;
    player.reset(); // Use new reset method

    // Reset level-specific variables
    dragonsKilled = 0;
    isGameOver = false;
    dragonWavePending = false;

    // Load the level blocks
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

    // Start the first wave
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

// End game
function endGame(isWin = false, isFinalLevel = false) {
    isGameOver = true;
    if (isWin) {
        showLevelCompleteScreen(); // Show the level complete screen
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
    playerSpawn.spawn(); // Unified spawn call
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
        spawnWoodBlocks(); // Spawn wood platform arena
        return; // Skip normal level setup
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
    levelButtonsContainer.innerHTML = ""; // Clear existing buttons

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
    loadLevelButtons(); // Load level buttons dynamically
});

document.getElementById("backButton").addEventListener("click", () => {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("mainMenu").style.display = "flex";
});

function setupEventListeners() {
    // Event listener for mouse movement (aiming)
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        player.arrowAngle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
    });

    // Event listener for mouse clicks (shooting)
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
    // Event listener for keyboard input (movement and actions)
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
            e.preventDefault(); // Prevent spacebar from scrolling the page
            player.jump();
        }
    });
}

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    const mainMenu = document.getElementById("mainMenu");
    const freeplayButton = document.getElementById("freeplayButton");
    const storyButton = document.getElementById("storyButton");

    // Freeplay button: Start the game as is
    freeplayButton.addEventListener("click", () => {
        mainMenu.style.display = "none"; // Hide the main menu
        startGame("freeplay"); // Start freeplay mode
    });

    // Story button: Start the tutorial levels
    storyButton.addEventListener("click", () => {
        mainMenu.style.display = "none"; // Hide the main menu
        startGame("story"); // Start story mode
    });
});

function startGame(mode) {
    // Initialize game variables
    currentLevel = 0;
    dragonsKilled = 0;
    isGameOver = false;
    dragonWavePending = false;

    // Reset player position and health
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.health = 3;

    // Clear existing game entities
    dragons = [];
    spiders = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];
    zombies = [];

    // Add event listeners for player movement
    setupEventListeners();

    // Start the game based on the selected mode
    if (mode === "freeplay") {
        startFreeplay();
    } else if (mode === "story") {
        startStory();
    }
}

function startFreeplay() {
    // Spawn all features and enemies at once
    spawnLeafBlocks("strong"); // Strong leaf blocks
    spawnWave(3, 5); // Example: 3 waves of 5 dragons

    // Enable spiders and zombies in Freeplay mode
    setInterval(spawnSpider, spiderSpawnInterval);
    setInterval(spawnZombie, 5000);
    playerSpawn.spawn();

    gameLoop();
}

function startStory() {
    // Disable spiders and zombies in Story mode
    clearInterval(spawnSpider);
    clearInterval(spawnZombie);

    playerSpawn.spawn(); // Unified spawn call

    // Start with the tutorial level
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
    tutorialDiv.innerHTML = text.replace(/\n/g, "<br>"); // Replace newlines with <br>
    tutorialDiv.style.display = "block";
}

function hideTutorial() {
    const tutorialDiv = document.getElementById("tutorial");
    tutorialDiv.style.display = "none";
}

function loadLevel(levelIndex) {
    const level = levels[levelIndex];

    // Clear existing game entities
    dragons = [];
    fireballs = [];
    projectiles = [];
    leafBlocks = [];

    // Reset dragons killed counter
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
        hideTutorial(); // Hide tutorial for other levels
    }

    // Update the dragons to kill counter
    document.getElementById("dragonsToKillValue").textContent = level.dragonsToKill;

    // Spawn blocks based on level
    switch (levelIndex) {
        case 0: // Level 1: Leafs
            spawnLeafBlocks();
            break;
        case 1: // Level 2: Wood
            spawnWoodBlocks();
            break;
        case 2: // Level 3: Leafs (random generation)
            spawnLeafBlocks();
            break;
        default:
            spawnLeafBlocks(); // Default to leafs
    }

    // Start the first wave
    gameLoop();
    spawnWave(level.waves, level.enemiesPerWave);
}

function updateDragonsKilledCounter() {
    document.getElementById("dragonsKilledValue").textContent = dragonsKilled;
}



function spawnLeafBlocks(toughness = "strong") {
    const tree = new Tree("Oak"); // Example: Spawn an Oak tree
    const middleRowY = canvas.height / 2 - 10; // Middle of the screen
    const blockWidth = tree.thickness; // Use tree thickness for block width
    const blockHeight = 20; // Fixed height for simplicity
    const minGap = tree.nodeDistance; // Use tree node distance for gaps
    const maxGap = tree.nodeDistance + 20; // Add some variation
    const yVariation = tree.height / 2; // Use tree height for vertical spread

    const clearingWidth = 100; // Width of the clearings on the left and right
    let x = clearingWidth; // Start from the left edge of the spawning area

    const totalColumns = 10; // Decrease the number of columns

    for (let col = 0; col < totalColumns; col++) {
        // Add a random gap between columns
        const gap = Math.random() * (maxGap - minGap) + minGap;
        x += gap;

        // Spawn a column if it fits within the spawning area
        if (x + blockWidth <= canvas.width - clearingWidth) {
            const y = middleRowY + (Math.random() * yVariation - yVariation / 2); // Randomize Y position
            const numLeaves = Math.floor(Math.random() * 6) + 3; // Random number of leaves (3-8)

            // Spawn leaf blocks in a circular pattern around the center node
            for (let i = 0; i < numLeaves; i++) {
                const angle = (Math.PI * 2 * i) / numLeaves; // Evenly distribute leaves in a circle
                const radius = 40; // Increase radius for a bushier look
                const leafX = x + Math.cos(angle) * radius;
                const leafY = y + Math.sin(angle) * radius;

                leafBlocks.push(new LeafBlock(leafX, leafY, blockWidth, blockHeight, toughness));
            }

            x += blockWidth; // Move to the end of the current column
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
                    const y = Math.random() * (canvas.height / 3); // Spawn in the top third of the screen
                    const dragonWidth = 120;
                    const dragonHeight = 80;
                    dragons.push({
                        x,
                        y,
                        width: dragonWidth,
                        height: dragonHeight,
                        speed: 0.3,
                    });
                }, i * 500); // Stagger dragon spawns
            }
        }, wave * 10000); // 10-second delay between waves
    }
}
// Start the game loop
//spawnWave();
//gameLoop();
//spawnLeafBlocks();" "/* style.css */
