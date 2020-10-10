let canvas, ctx, W, H, t0, dt, tS, tE, fps, player, acceleration, friction, map, frontTile, backTile, enemPos, showBorder, showBorderLastTime, shot, reloadedBullets, bulletReloadedLastTime, healths, healthPos, camera, bullets, stars, lastFired, lastJumped, enemies, ctrlLEFT, ctrlRIGHT, ctrlSHOOT, ctrlUP, playerSprite, playerSpriteFrames, enemySpriteFrames, i1, i2;


class Vector {

    constructor(x=0, y=0, w=1) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.length = Math.hypot(this.x, this.y);
        this.angle = Math.atan2(this.y, this.x);
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mult(v) {
        return new Vector(this.x * v.x, this.y * v.y, 1);
    }

    scale(s) {
        return new Vector(this.x * s, this.y * s);
    }

    addScale(v, s) {
        return new Vector(this.x + v.x * s, this.y + v.y * s);
    }

    invert() {
        return new Vector(1/this.x, 1/this.y);
    }

    applyFunc(func) {
        return new Vector(func(this.x), func(this.y));
    }

    toArray() {
        return [this.x, this.y];
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    getDist(v) {
        return v.sub(this).length;
    }

    normalise() {
        if(this.length !== 0) {
            this.x / this.length;
            this.y /= this.length;
        }
    }

    static fromArray(arr) {
        return new Vector(arr[0], arr[1])
    }

    static fromObject(v) {
        return new Vector(v.x, v.y);
    }
}



class Camera {
    constructor(pos, dimension) {
        this.pos = pos;
        this.dimension = dimension;
    }

    clamp(min, max) {
        if(this.pos.x < min.x) 
            this.pos.x = min.x;
        if(this.pos.y < min.y)
            this.pos.y = min.y;
        if(this.pos.x + this.dimension.x > max.x)
            this.pos.x = max.x - this.dimension.x;
        if(this.pos.y + this.dimension.y > max.y)
            this.pos.y = max.y - this.dimension.y;
    }

    follow(cmp) {   
        this.pos = cmp.pos.add(cmp.dimension.scale(0.5))
            .sub(this.dimension.scale(0.5));
    }
}


class TileMap {
    constructor(map, size) {
        this.map = map;
        this.dimension = new Vector(this.map[0].length, this.map.length);
        this.size = size || new Vector(32, 32);
        this.camera = new Camera(new Vector(), 
            this.dimension.mult(this.size));

        this.id = null;
        this.col = null;
        this.row = null;
    }

    render(callback) {
        
        // map clamping
        let c_min = this.camera.pos.mult(this.size.invert())
            .applyFunc(Math.floor);
        let c_max = this.camera.pos.add(this.camera.dimension).mult(
            this.size.invert()).applyFunc(Math.ceil);
        
        if(c_min.x < 0) c_min.x = 0;
        if(c_min.y < 0) c_min.y = 0;

        if(c_max.x > this.dimension.x) 
            c_max.x = this.dimension.x;
        if(c_max.y > this.dimension.y)
            c_max.y = this.dimension.y;

        for(let r=c_min.y; r < c_max.y; r++) {
            for(let c=c_min.x; c < c_max.x; c++) {
                this.id = this.map[r][c];
                this.col = c;
                this.row = r;
                callback();
            }
        }
    }

    setCamera(camera) {
        this.camera = camera
    }
}



class TileSet extends Image {
    constructor(src, dimension, index) {
        super(0, 0);
        this.src = src;
        this.index = index;
        this.dimension = dimension;
    }

    indexAt(pos) {
        return new Vector(
            pos % this.index.x, pos / this.index.x).applyFunc(Math.floor);
    }
}


class Sprite extends Image {
    constructor(src, frames, dimension, delay) {
        super(0,0);
        this.src = src;
        this.delay = delay || 5;
        this.frames = frames || {};
        this.currentFrame = null;
        for(const i in this.frames) {
            this.setFrame(i);
            break;
        }
        this.dimension = dimension || new Vector();
        this.index = null;
        this.crop = new Vector();
        this._frameCounter = 0;
        this._delayCounter = 0;
    }

    setFrame(name) {
        this.currentFrame = this.frames[name];
    }

    animate() {
        this._delayCounter++;
        if(this._delayCounter > this.delay) {
            this._delayCounter = 0;
            this._frameCounter++;
            if(this._frameCounter >= this.currentFrame.length) {
                this._frameCounter = 0;
            }
            let index = this.currentFrame[this._frameCounter] - 1;
            this.crop = new Vector(index % this.dimension.x, 
                index / this.dimension.x).applyFunc(Math.floor);
        }
    }
}


class Component {
    constructor(pos, dimension, color) {
        this.pos = pos;
        this.dimension = dimension;
        this.color = color;
        this.velocity = new Vector();
        this.absPos = new Vector(null, null);
        // for collisions
        this.oldPos = new Vector(null, null);
        this.newPos = new Vector(null, null);
        this.collidingId = null;
        this.sprite = null;
    }

    checkCollision(map, {top=null, left=null}) {
        this.oldPos = this.pos;
        this.newPos = new Vector(
            this.pos.x + this.velocity.x,
            this.pos.y
        );
        this.p_min = this.newPos.mult(map.size.invert())
            .applyFunc(Math.floor);
        this.p_max = this.newPos.add(this.dimension).mult(
            map.size.invert()).applyFunc(Math.ceil);
        // console.log(this.p_min.x);

        for(let r=this.p_min.y; r < this.p_max.y; r++) {
            for(let c=this.p_min.x; c < this.p_max.x; c++) {  
                this.collidingId = map.map[r][c];
                if(typeof left === "function")
                    left();
            }
        }

        this.pos = this.newPos;

        this.oldPos = this.pos;
        this.newPos = new Vector(
            this.newPos.x,
            this.newPos.y + this.velocity.y
        );

        this.p_min = this.newPos.mult(map.size.invert())
            .applyFunc(Math.floor);
        this.p_max = this.newPos.add(this.dimension).mult(
            map.size.invert()).applyFunc(Math.ceil);

        for(let r=this.p_min.y; r < this.p_max.y; r++) {
            for(let c=this.p_min.x; c < this.p_max.x; c++) {  
                this.collidingId = map.map[r][c];
                if(typeof top === "function")
                    top();
            }
        }

        this.pos = this.newPos;
    }

    draw() {
        this.absPos = this.pos.sub(camera.pos);
        if(this.sprite !== null) {
            this.sprite.animate();
            let src = this.sprite.crop.mult({x:48, y:72});
            ctx.drawImage(this.img, src.x, src.y, 48, 72, 
                ...this.absPos.toArray(), ...this.dimension.toArray());
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(...this.absPos.toArray(), ...this.dimension.toArray());
        }
    }
}


class Player extends Component {
    constructor(pos, dimension, color) {
        super(pos, dimension, color);
        this.isJump = false;
        this.lastYPos = null;
        this.direction = "east";
        this.kill = 0;
        this.lives = 10;
        this.img = i2;
        this.isShooting = false;
        this.sprite = new Sprite("https://i.ibb.co/nLf2xBB/sprite.png", 
        {
            stand: [2],
            left: [13, 14, 15],
            right: [25, 26, 27]
        }, new Vector(12, 11), 5);
    }

    setKeyDir(dir) {
        this.direction = dir;
    }

    update() {
        let _this = this;
        this.velocity = this.velocity.add(acceleration);
        if(this.isJump) {
            if(Math.abs(this.pos.y - this.lastYPos) > this.dimension.y * 2) {
                this.isJump = false;
            } else this.velocity.y = -2;
        }

        this.checkCollision(map, {
            left() {
                if(_this.collidingId === 30) {
                    _this.newPos = _this.oldPos;
                    _this.newPos.x = Math.ceil(_this.oldPos.x);
                } else if(_this.collidingId === 92 || _this.collidingId === 3) {
                    alert("LOSER!!!");
                    game.restart();
                } else if(_this.collidingId === 332) {
                    alert("Congratulations");
                    game.restart();
                }
            },
            top() {
                if(_this.collidingId === 30) {
                    _this.newPos = _this.oldPos;
                    _this.newPos.y = Math.ceil(_this.oldPos.y);
                    _this.velocity.y *= -friction;
                    _this.isJump = false;
                } else if(_this.collidingId === 32) {
                    alert("Congratulations");
                    game.restart();
                }
            }
        });
        this.draw();

        let dir = this.direction === "east" ? "right" : "left";
        if(this.isShooting) {
            this.sprite.setFrame(dir);
        }
        else if(this.velocity.x > 0) {
            this.sprite.setFrame("right");
        } else if(this.velocity.x < 0) {
            this.sprite.setFrame("left");
        } else if(this.velocity.x === 0) {
            this.sprite.setFrame('stand');
        }
    }
}


class Enemy extends Component {
    constructor(pos, dimension, color) {
        super(pos, dimension, color);
        this.img = i2;
        this.velocity = new Vector(0, 0);
        this.speed = min_max(.1, 1);
        this.lives = map.size.x;
        this.spriteFrame = enemySpriteFrames[~~(Math.random() * enemySpriteFrames.length)];
        this.sprite = playerSprite = new Sprite("https://i.ibb.co/nLf2xBB/sprite.png",  this.spriteFrame, new Vector(12, 11), 5);
    }

    move() {
        let _this = this;
        let diff = player.pos.sub(this.pos);
        this.velocity = this.velocity.add(acceleration);

        this.checkCollision(map, {
            left() {
                if(_this.collidingId === 30||_this.collidingId === 92
                    || _this.collidingId === 4) {
                    _this.newPos = _this.oldPos;
                    _this.newPos.x = Math.ceil(_this.oldPos.x);
                    _this.velocity.x *= -1;
                }
            },
            top() {
                if(_this.collidingId === 30||_this.collidingId === 92
                    || _this.collidingId === 4) {
                    _this.newPos = _this.oldPos;
                    _this.newPos.y = Math.ceil(_this.oldPos.y);
                    _this.velocity.y *= -friction;
                }
            }
        });

        if(diff.length < 200) {
         if(rectCollision(this, player)) {
            player.lives-=0.01;
            showBorder = true;
            showBorderLastTime = new Date().getTime();
            if(player.lives < 0) {
                alert("LOSER!!");
                game.restart();
            }
        };
            if(Math.abs(diff.x) > Math.abs(diff.y)) {
                if(diff.x > 0) {
                    this.velocity.x = this.speed;
                } else {
                    this.velocity.x = -this.speed;
                }
            }
        } else {
            this.velocity.x = 0;
        }

        if(this.velocity.x > 0) {
            this.sprite.setFrame("right");
        } else if(this.velocity.x < 0) {
            this.sprite.setFrame("left");
        } else if(this.velocity.x === 0) {
            this.sprite.setFrame("stand");
        }
    }

    update() {  
        ctx.strokeStyle = "lightgray";
        ctx.fillStyle = "green";
        ctx.fillRect(this.absPos.x, this.absPos.y - 10, 
            this.lives, 5);
        ctx.strokeRect(this.absPos.x, this.absPos.y - 10, map.size.x, 5);
        this.draw();
        this.move();
    }
}


class Bullet extends Component {
    constructor(pos, direction) {
        super(pos, new Vector(12,3), "yellow");
        this.direction = direction;
        this.velocity = new Vector(1, 0);
        this.force = min_max(8, 12);
        this.erase = false;
        this.speed = 2;
    }

    update() {
        let _this = this;
        // this.pos = this.pos.add(new Vector(2, 0));
        if(this.pos.x < 0 || this.pos.x > player.pos.x + 
            player.dimension.x * .5 + camera.dimension.x * .5) {
            bullets.splice(bullets.indexOf(this), 1);
        }
        this.checkCollision(map, {
            left() {
                if(_this.collidingId === 30) {
                    _this.erase = true;
                }
            },
            top() {
                if(_this.collidingId === 30) {
                    _this.erase = true;
                }
            }
        });
        if(this.direction === "east") {
            this.velocity.x = this.speed;
        } else if(this.direction === "west") {
            this.velocity.x = -this.speed;
        }
        enemies.forEach((enemy, i) => {
            if(rectCollision(this, enemy)) {
                enemy.lives-=this.force;
                bullets.splice(bullets.indexOf(_this), 1);
                if(enemy.lives < 0) {
                    enemies.splice(i, 1);
                    player.kill++;
                }
            }
        });
        this.draw();
    }
}



class HealthKit extends Component {
    constructor(pos) {
        super(pos, null, null);
        this.r = 10;
    }

    update() {
        let _this = this;
        this.absPos = this.pos.sub(camera.pos);
        let gradient = ctx.createRadialGradient(
            this.absPos.x, this.absPos.y, this.r * .5,
            this.absPos.x, this.absPos.y, this.r
        );
        let boundingRect = {
            pos: new Vector(
                _this.absPos.x - this.r, _this.absPos.y - this.r),
            dimension: new Vector(_this.r, _this.r).scale(2),
            absPos: _this.absPos
        }
        if(rectCollision(boundingRect, player)) {
            let nextLive = player.lives + 0.5;
            player.lives = Math.min(100, nextLive);
            healths.splice(healths.indexOf(this), 1);
        }
        gradient.addColorStop(.1, "dimgray");
        gradient.addColorStop(.9, "red");
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(...this.absPos.toArray(), this.r, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}


class Controller extends Component {
    constructor(pos, dimension, color="white") {
        super(pos, dimension, color);
    }

    draw() {
        let bc = this.getBoundingCircle();
        ctx.save();
        ctx.globalAlpha = .5;
        ctx.strokeStyle = "white";
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(bc.x, bc.y, bc.w, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    getBoundingCircle() {
        // let circ = this.pos.add(this.dimension.scale(0.5));
        // circ.w = this.dimension.x * 0.5;
        return new Vector(
            this.pos.x + this.dimension.x * 0.5, 
            this.pos.y + this.dimension.y * 0.5,
            this.dimension.x * 0.5
        );
    }
}


const update = () => {
    let t1 = new Date().getTime();
    dt = .001 * (t1 - t0);
    t0 = t1;

    if(dt > 0.2) dt = 0;

    camera.follow(player);
    camera.clamp(new Vector(), map.dimension.mult(map.size));

    ctx.save();
    /*
    stars.forEach(s => {
        let pos = s;//s.sub(camera.pos);
        ctx.globalAlpha = .5;
        ctx.fillStyle = "lightgray";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
    });*/

    ctx.globalAlpha = 1;
    let moonPos = new Vector(W/3, H/2);
    let moonGradient = ctx.createRadialGradient(moonPos.x, moonPos.y, 20, 
        moonPos.x, moonPos.y, 50);
    moonGradient.addColorStop(.1, "dimgray");
    moonGradient.addColorStop(.9, "lightgray");
    ctx.fillStyle = moonGradient;
    ctx.shadowColor = "lightgray";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(moonPos.x, moonPos.y, 50, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    map.render(() => {
        let pos = new Vector(map.col, map.row)
            .scale(32).sub(camera.pos).applyFunc(Math.floor);
        let id = Math.max(map.id - 1, 0);
        if(id !== 0) {
            let src = frontTile.indexAt(id).mult(frontTile.dimension);
            ctx.drawImage(frontTile, ...src.toArray(), 
            ...frontTile.dimension.toArray(),
            ...pos.toArray(), ...map.size.toArray());
        }
    });

    enemies.forEach(e => e.update());

    bullets.forEach((bullet, i) => {
        bullet.update();
        if(bullet.erase) {
            bullets.splice(i, 1);
        }
    });

    healths.forEach(h => h.update());

    player.update();

    

    if(showBorder) {
        if(Math.abs(new Date().getTime() - showBorderLastTime) > 500) {
            showBorder = false;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.abs(Math.sin(Math.random()*50)*1));
        ctx.lineWidth = 20;
        ctx.strokeStyle = "red";
        ctx.strokeRect(0, 0, W, H);
        ctx.restore();
    }

    ctrlLEFT.draw();
    ctrlRIGHT.draw();
    ctrlUP.draw();
    ctrlSHOOT.draw();

    $("detail").innerHTML = `<b>FPS</b>: ${~~fps}<br>
    <b>Lives</b>: ${player.lives > 50 ? `<span style=color:green>${~~player.lives}</span>`:
    player.lives > 20 && player.lives <= 50 ? `<span style=color:yellow>${~~player.lives}</span>`
    : `<span style=color:red>${~~player.lives}</span>`}
    <br><b>Shot</b>: ${shot}<br><b>Killed</b>: ${player.kill}<br>
    <b>Bullets</b>: ${reloadedBullets.length - 1 > 0 ? reloadedBullets.length - 1: "<span style=color:red>Wait Till Next Reload</span>"}<br>
    <b>Next Reload</b>: ${new Date().getTime() - bulletReloadedLastTime}`;

}


const game = {
    calcFPS() {
        tE = performance.now();
        fps = 1000 / (tE - tS);
        tS = tE;
    },

    reloadBullet() {
        for(let i=20; i > 0; i--) {
            let bullet = new Bullet(player.pos, 
                player.direction);
            reloadedBullets.push(bullet);
        };
    },

    restart() {
        // reset player
        player = new Player(new Vector(160, 3136), map.size, "green");
        player.kill = 0;
        player.lives = 100;
        // reset bullets
        reloadedBullets = [];
        bullets = [];
        stars = [];
        enemies = [];
        healths = [];
        //
        t0 = new Date().getTime();
        acceleration = new Vector(0, .2);
        friction = .2;
        lastFired = new Date().getTime();
        lastJumped = new Date().getTime();
        showBorderLastTime = new Date().getTime();
        bulletReloadedLastTime = new Date().getTime();
        // update stars
        for(let i=0; i < 50; i++) {
            let x = min_max(1, W);
            let y = min_max(1, H);
            stars.push(new Vector(x, y));
        }
        // reset enemies
        enemPos.forEach(v => {
            let enemy = new Enemy(v, map.size, "red");
            enemies.push(enemy);
        });
        // reset health
        healthPos.forEach(h => {
            let health = new HealthKit(h);
            healths.push(health);
        });
        game.reloadBullet();
    },

    animate() {
        ctx.clearRect(0, 0, W, H);
        update();
        requestAnimationFrame(game.animate);
        game.calcFPS();
    }
}


const eventHandler = () => {

    const jump = () => {
        if(!player.isJump) {
            player.isJump = true; 
            if(Math.abs(new Date().getTime() - lastJumped) > 1000) {
                player.lastYPos = player.pos.y;
                lastJumped = new Date().getTime();
            }
        }
    }

    addEventListener("keydown", e => {
        let s = 1;
        if(e.keyCode === 37) {
            player.setKeyDir("west");
            // playerSprite.setFrame("left");
            player.velocity.x = -s;
        } else if(e.keyCode === 38) {
            player.velocity.y = -s;
        } else if(e.keyCode === 39) {
            player.setKeyDir("east");
            // playerSprite.setFrame("right");
            player.velocity.x = s;
        } else if(e.keyCode === 40) {
            player.velocity.y = s;
        } else if(e.keyCode === 32) {
            jump();
        } else if(e.keyCode === 13 && Math.abs(new Date().getTime() - lastFired) > 500) {
            if(reloadedBullets.length > 1) {
                player.isShooting = true;
                let last_bullet = reloadedBullets.shift();
                last_bullet.pos = player.pos.add(player.dimension.scale(0.5));
                last_bullet.direction = player.direction;
                bullets.push(last_bullet);
                shot++;
                bulletReloadedLastTime = new Date().getTime();
        } else {
            if(Math.abs(new Date().getTime() - bulletReloadedLastTime) > 10000) {
                game.reloadBullet();
            }
        }
        lastFired = new Date().getTime();
        }
    });

    addEventListener("keyup", e => {
        player.velocity = new Vector();
        player.isShooting = false;
    });


    canvas.addEventListener("touchstart", e => {
        let shoot = ctrlSHOOT.getBoundingCircle();
        let up = ctrlUP.getBoundingCircle();
        let left = ctrlLEFT.getBoundingCircle();
        let right = ctrlRIGHT.getBoundingCircle();
        let client = new Vector(e.touches[0].pageX, e.touches[0].pageY);
        let diffShoot = client.sub(shoot);
        let diffUp = client.sub(up);
        let diffLeft = client.sub(left);
        let diffRight = client.sub(right);
        let s = 1;
        if(diffShoot.length < shoot.w && Math.abs(new Date().getTime() - lastFired) > 500) {
            if(reloadedBullets.length > 1) {
            player.isShooting = true;
            let last_bullet = reloadedBullets.shift();
            last_bullet.pos = player.pos.add(player.dimension.scale(0.5));
            last_bullet.direction = player.direction;
            bullets.push(last_bullet);
            shot++;
            bulletReloadedLastTime = new Date().getTime();
        } else {
            if(Math.abs(new Date().getTime() - bulletReloadedLastTime) > 10000) {
                game.reloadBullet();
            }
        }
        lastFired = new Date().getTime();
        }
        if(diffUp.length < up.w) {
            jump();
        }
        if(diffLeft.length < left.w) {
            player.setKeyDir("west");
            player.velocity.x = -s;
        }
        if(diffRight.length < right.w) {
            player.setKeyDir("east");
            player.velocity.x = s;
        }
    });

    canvas.addEventListener("touchend", e => {
        player.velocity = new Vector();
        player.isShooting = false;
    });

};

alert("I like this game when played on Laptop PC then it runs at medium FPS\nKeyboard controls are the arrows, SPACE and ENTER keys");

const rectCollision = (r1, r2) => r1.absPos.x + r1.dimension.x 
> r2.absPos.x && r2.absPos.x + r2.dimension.x > r1.absPos.x && r1.absPos.y + 
r1.dimension.y > r2.absPos.y && r2.absPos.y + r2.dimension.y > r1.absPos.y;


const $ = id => document.getElementById(id);


const text = (txt, x, y, font, color) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
}

const min_max = (min, max) => Math.random() * (max - min + 1) + min;

const init = () => {
    canvas = document.getElementById("cvs");
    canvas.style.backgroundColor = "#000";
    ctx = canvas.getContext("2d");
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight/2 + innerHeight/4;
    
    showBorder = false;
    shot = 0;

    map = new TileMap(levels.map, new Vector(32, 32));
    camera = new Camera(new Vector(0, 0), new Vector(W,H));
    map.setCamera(camera);
    // https://i.ibb.co/NnPpWZ2/frontground.png
    // https://i.ibb.co/nLf2xBB/sprite.png

    i1 = new Image();
    i1.src = "https://i.ibb.co/NnPpWZ2/frontground.png";

    i2 = new Image();
    i2.src = "https://i.ibb.co/nLf2xBB/sprite.png";

    frontTile = new TileSet("https://i.ibb.co/NnPpWZ2/frontground.png", new Vector(32, 32), 
        new Vector(23, 21));
    ctrlLEFT = new Controller(new Vector(W - 95, H - 50), 
        new Vector(45, 45), "purple");
    ctrlRIGHT = new Controller(new Vector(W - 45, H - 50), 
        new Vector(45, 45), "teal");
    ctrlSHOOT = new Controller(new Vector(10, H - 60), 
        new Vector(50, 50), "navy"); 
    ctrlUP = new Controller(new Vector(W - 70, H - 95), 
        new Vector(45, 45), "yellow");

    enemySpriteFrames = [
        {
            stand:[5], 
            left: [16, 17, 18],
            right: [28, 29, 30]
        },
        {
            stand:[11], 
            left: [19, 20, 21],
            right: [31, 32, 33]
        },
        {
            stand:[5], 
            left: [22, 23, 24],
            right: [34, 35, 36]
        },
    ];

    healthPos = [
        new Vector(912, 2966),
        new Vector(74, 2256),
        new Vector(404, 2320),
        new Vector(464, 2640),
        new Vector(208, 3058),
        new Vector(1804, 2316),
        new Vector(1748, 2934),
        new Vector(1554, 2268),
        new Vector(942, 2248),
        new Vector(1202, 2544),
        new Vector(660, 3122),
        new Vector(1256, 1104),
        new Vector(1422, 1562),
        new Vector(2276, 2082),
        new Vector(2200, 3022),
        new Vector(1900, 2730),
        new Vector(374, 1500),
        new Vector(194, 1062),
        new Vector(728, 1024),
        new Vector(578, 474),
        new Vector(292, 122),
        new Vector(1014, 222),
        new Vector(2996, 348),
        new Vector(2334, 796),
        new Vector(2732, 1610),
        new Vector(2836, 2364)
    ];

    enemPos = [
        new Vector(52, 2964),
        new Vector(188, 2896),
        new Vector(48, 2864),
        new Vector(196, 2770),
        new Vector(440, 2832),
        new Vector(394, 2706),
        new Vector(306, 2936),
        new Vector(524, 2928),
        new Vector(624, 2702),
        new Vector(334, 3056),
        new Vector(882, 2958),
        new Vector(1038, 3054),
        new Vector(876, 2542),
        new Vector(946, 2546),
        new Vector(666, 2514),
        new Vector(646, 2288),
        new Vector(432, 2248),
        new Vector(240, 2414),
        new Vector(50, 2230),
        new Vector(366, 2100),
        new Vector(688, 2094),
        new Vector(822, 2190),
        new Vector(1012, 2158),
        new Vector(1230, 2228),
        new Vector(1078, 2410),
        new Vector(1200, 2540),
        new Vector(1140, 2732),
        new Vector(1608, 2156),
        new Vector(1432, 2702),
        new Vector(1586, 2548),
        new Vector(1782, 2166),
        new Vector(1838, 2558),
        new Vector(1902, 2422),
        new Vector(1708, 3026),
        new Vector(1998, 3024),
        new Vector(2254, 2998),
        new Vector(2812, 2980),
        new Vector(2898, 2852),
        new Vector(2900, 2616),
        new Vector(2386, 2720),
        new Vector(2890, 2358),
        new Vector(1982, 2332),
        new Vector(2740, 2254),
        new Vector(2896, 2036),
        new Vector(2482, 2354),
        new Vector(2036, 2136),
        new Vector(2386, 1930),
        new Vector(2748, 1640),
        new Vector(118, 110),
        new Vector(398, 308),
        new Vector(496, 650),
        new Vector(874, 152),
        new Vector(974, 628),
        new Vector(206, 818),
        new Vector(304, 1006),
        new Vector(304, 1312),
        new Vector(918, 1428),
        new Vector(1006, 1138),
        new Vector(526, 2002),
        new Vector(466, 1804),
        new Vector(818, 1644),
        new Vector(1492, 1578),
        new Vector(1072, 1996),
        new Vector(1130, 1710),
        new Vector(1332, 1580),
        new Vector(1908, 2026),
        new Vector(2096, 2000),
        new Vector(1226, 666),
        new Vector(1260, 470),
        new Vector(1526, 720),
        new Vector(1580, 856),
        new Vector(1416, 700),
        new Vector(1390, 1106),
        new Vector(1684, 984),
        new Vector(2962, 334),
        new Vector(2672, 292),
        new Vector(2702, 498),
        new Vector(3056, 778),
        new Vector(3050, 560),
        new Vector(2802, 1038),
        new Vector(2582, 1096),
        new Vector(2416, 1066),
        new Vector(2992, 1324),
        new Vector(2380, 1620),
        new Vector(2256, 1450),
        new Vector(2646, 1456),
        new Vector(332, 1680),
        new Vector(2054, 560),
        new Vector(1906, 198),
        new Vector(2030, 940),
        new Vector(2129, 1280),
        new Vector(1776, 1930),
        new Vector(1712, 122),
        new Vector(1550, 114),
        new Vector(464, 112),
    ];

    game.restart();
    game.reloadBullet();
    eventHandler();
    frontTile.onload = () => requestAnimationFrame(game.animate);
    i2.onload = () => requestAnimationFrame(game.animate);
};

addEventListener("load", init);



const levels = {
    map:[ 
        [30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
        [30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
        [30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30],
        [30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,30,30,30,30,30,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,30,30],
        [30,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,30,30,30,0,0,30,30,0,0,0,0,0,0,0,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,30,30,30],
        [30,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,30,0,0,30,30,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,30,30,30,30,30,0,0,0,30,30,30,30,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30],
        [30,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,30,30,30,30,0,0,30,30,30,30,0,0,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30],
        [30,0,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,30,30,0,0,30,30,0,0,0,30,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,30,30,0,0,30,30,30,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,0,0,0,0,0,0,30,30,30,0,30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,30,30,30],
        [30,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,30,30],
        [30,30,30,0,0,30,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,30,0,0,0,0,0,30,30,30,30,30,30,30],
        [30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,30,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,0,0,30,30,0,30,30,30,30,30,0,0,30,30,30,30,0,0,0,30,0,0,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30],
        [30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,0,0,0,0,30,0,0,0,30,30,30,30,30,30,30,30,30],
        [30,30,30,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,30,0,0,0,0,30,0,0,30,0,0,0,0,0,0,0,30,30],
        [30,30,30,30,0,0,30,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,30,0,0,0,0,0,0,0,30,30],
        [30,30,30,30,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,30,0,0,0,30,30,30,30,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,30,0,0,0,0,0,0,0,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,30,0,0,30,30,30,30,30,30,0,0,30,0,0,0,0,0,0,0,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,30,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,30,30,30,30,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,32,30,32,30,0,0,30,30,0,30,30,30,30,30,30,30],
        [30,30,30,30,30,30,30,30,30,30,30,0,30,0,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,30,0,0,0,0,0,0,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,30,0,0,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,0,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,30,30,32,30,32,30,0,0,0,30,0,0,0,0,0,0,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,30,30],
        [30,30,30,0,0,0,0,0,0,0,0,0,30,0,30,0,0,30,0,0,30,0,30,30,30,30,30,30,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30],
        [30,30,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,0,0,0,30,30,0,0,0,0,30,0,0,0,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,30,30,30,30,30,30,30],
        [30,0,0,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,30,30,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,0,0,30,30,30,30,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,30,0,30,30,30,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,30,30,0,0,30,30,30,30,30,0,0,30,0,30,30,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,30,30,30],
        [30,30,30,30,30,30,30,0,0,0,0,0,0,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,30,30,30],
        [30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,0,30,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,30,30,30],
        [30,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,30,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,30,30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,30,30,30,0,30,30,30],
        [30,0,30,30,30,30,30,0,0,0,0,0,0,30,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,30,0,30,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,30,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,30,30,30],
        [30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,30,31,30,30,0,0,30,0,0,0,30,30,30,30,0,0,30,30,30,30,0,0,0,0,0,30,30,30,0,0,0,0,30,30,30,30,30,30,0,0,30,30,30,0,30,30,30],
        [30,0,0,0,30,0,0,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,30,30,0,0,0,0,0,0,0,0,30,30,0,30,30,30],
        [30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,31,30,31,30,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,0,30,30,30],
        [30,0,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30],
        [30,0,0,0,0,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,31,30,31,30,31,30,30,30,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,0,0,0,30,30,30,30,30,0,0,0,0,0,30,30,30],
        [30,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30],
        [30,0,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,0,30,30,30,30,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,30,30,30],
        [30,0,0,0,30,30,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,30,30,30,30,0,0,30,30,30,30,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,30,30,30,30,0,30,30,30],
        [30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,0,30,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,30,30,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,30,30,30],
        [30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,30,30,30,30,30,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,30,30,30],
        [30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30,30,30,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,30,30,0,0,0,0,0,0,0,30,30,30,30,0,30,30,30],
        [30,31,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,0,0,0,30,30,30,30,0,30,30,30],
        [30,30,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,30,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,30,30,0,0,30,30,30,30,30,0,30,30,30],
        [30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,30,30,30,30,0,0,0,30,30,0,0,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,0,30,30,30],
        [30,30,30,0,0,30,30,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,30,30,0,0,30,30,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,30,0,0,0,30,30,30,30,0,30,30,30],
        [30,31,30,0,0,30,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,30,30,30,0,0,0,0,30,30,30,30,0,0,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,30,0,0,30,30,30,0,0,30,30,30,30,0,30,30,30],
        [30,30,30,0,0,30,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,30,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,0,0,30,0,0,0,30,30,30,30,0,30,30,30],
        [30,30,30,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,30,30,30,30,30,30,0,30,30,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,0,30,0,30,30,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,30,0,0,0,30,0,0,30,30,0,0,0,30,30,30,30,0,0,30,30],
        [30,31,30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,30,0,0,0,30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,30,30,30,0,0,0,30,30,30,30,30,0,0,30,30],
        [30,30,30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,30,30],
        [30,31,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,30,30],
        [30,30,30,0,0,0,0,30,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,30,30,30,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,0,30,30,30,30,0,0,30,30],
        [30,30,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,30,0,0,0,0,30,0,0,0,30,30,0,30,30,30,30,0,0,30,30],
        [30,31,30,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,30,0,0,0,30,0,0,0,0,30,0,0,30,30,30,0,0,0,30,30],
        [30,30,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,30,30,0,0,0,0,0,0,30,0,0,0,30,30,30,0,0,0,30,30],
        [30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,30,0,0,0,0,0,0,0,30,0,0,0,30,30,30,0,0,0,30,30],
        [30,31,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,30,0,30,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,30,30,0,30,0,0,0,0,30,30,30,30,0,0,0,30,30,30,0,0,0,30,30],
        [30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,30,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,0,0,0,30,30,30,30,30,30,0,30,0,0,0,0,30,0,0,0,0,0,0,30,30,30,0,0,30,30,30],
        [30,0,0,0,0,0,0,0,30,0,0,0,0,0,30,0,30,0,0,0,0,0,0,0,0,0,30,0,30,30,30,30,0,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,0,30,0,0,0,30,30,30,30,30,30,0,30,0,0,0,30,30,0,0,0,0,30,30,30,30,30,0,0,0,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,30,30,30,30,30,0,30,0,30,30,30,0,0,0,0,30,30,0,30,30,0,0,0,0,30,30],
        [30,30,30,30,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,30,30,30,0,0,30,30,30,30,30,30,30,30,30,30,0,30,0,0,0,0,0,0,0,30,30,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,30,0,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,30,0,30,0,0,0,0,0,0,30,30,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,30,0,0,0,30,0,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,30,0,30,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,30,30,30,30,30,30,30,0,0,0,0,0,0,30,30,0,0,0,30,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,0,0,30,0,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,30,0,0,0,0,30,0,0,0,30,30,92,92,30,30,0,0,0,0,0,0,30,0,0,0,0,30,0,0,0,0,0,0,0,0,30,30,0,0,0,30,0,0,30,0,0,30,0,30,30,30,30,30,30,30,30,30,0,0,0,30,30,30,30,30,30,30,30,30,30,0,0,0,0,30,30],
        [30,30,30,0,0,0,30,0,0,0,0,0,0,0,0,30,30,30,30,0,30,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,0,30,0,0,0,0,0,30,30,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,30,30],
        [30,0,0,0,0,0,30,30,30,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,30,30,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,0,0,0,0,30,30,30,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,30,0,0,30,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,30,30,30,30,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,0,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,0,0,0,30,30,30,30,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,30,30,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,30,0,0,30,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,0,0,0,30,0,0,30,0,0,0,0,0,30,0,0,0,0,0,30,30,30,30,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,30,30,30,0,0,0,0,0,0,30,30,30,30,0,30,0,0,0,30,0,30,0,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,30,0,0,0,0,30,30,30,30,30,30,0,0,0,0,0,30,30,30,30,0,0,30,30,0,0,0,0,0,0,0,0,0,0,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,30,0,30,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,30,30,30,0,0,0,30,0,30,30,30,0,0,30,30,30,30,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,30,30,0,0,0,30,0,0,30,30,30,30,30,0,0,0,0,30,0,0,0,30,0,30,0,30,0,0,0,0,0,0,30,30,30,0,0,0,30,30,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,30,0,0,0,0,0,0,0,0,30,0,30,30,30,30,30,0,0,0,30,30],
        [30,0,0,0,30,0,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,0,30,0,30,30,30,0,0,0,30,30,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,30,30,0,0,0,0,0,30,30,30,0,0,0,30,30,30,30,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,30,30,30,30,0,0,0,0,0,30,30,30,0,0,0,30,0,30,0,0,0,30,0,0,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,30,30,0,30,30,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,30,30,0,0,0,30,0,0,0,0,0,30,0,0,0,0,0,30,30,0,0,30,0,30,0,0,0,30,0,0,30,30,0,30,30,30,30,30,0,0,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,30,30,30,30,30,0,0,30,0,30,30,30,30,30,0,0,30,30,30,30,30,30,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,30,0,0,0,30,0,0,30,30,0,30,0,0,30,30,0,0,30,30,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,0,30,30],
        [30,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,30,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,30,30,30,0,30,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,30,30,30,30,0,30,0,30,0,0,0,0,0,30,0,0,0,0,30,30,30,0,0,30,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,0,0,0,30,0,0,0,30,30,0,30,30,30,0,0,0,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,30,0,30,0,0,0,0,0,0,0,30,30,30,30,30,30,0,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,30,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,30,0,30,30,30,30,30,30,0,0,0,0,0,30,30,30,30,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,30,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,30,30,30,30,30,30,0,0,0,0,30,30,30,30,30,30,30,30,30,0,0,0,0,30,0,0,0,0,0,30,30,0,0,0,0,30,30],
        [30,30,30,30,30,0,0,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,0,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,30,30,0,0,30,30,30,30],
        [30,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,30,30,30,0,0,0,30,30,30,30,0,0,30,30,30,30],
        [30,0,0,0,0,30,30,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,30,0,0,0,30,30,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,30,30,30,30,0,0,30,30,30,30],
        [30,0,0,0,30,30,0,0,0,30,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,0,30,30,30,0,0,0,0,0,0,30,30,0,0,0,0,30,0,0,0,0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,0,0,0,0,0,30,30,0,0,30,30,30,30],
        [30,30,30,0,0,0,0,0,30,30,0,0,30,0,0,0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,92,92,92,92,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,0,0,0,30,30,30,30,30,0,30,30,0,0,30,30,30,30],
        [30,30,30,30,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,30,0,0,0,30,0,0,0,0,30,0,0,30,30,30,30,92,92,92,92,30,0,0,0,0,0,0,30,0,0,0,0,0,0,30,30,30,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,30,30,30,30],
        [30,30,30,30,30,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,92,92,92,92,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,30,0,0,0,333,30,30],
        [30,30,30,30,31,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,92,92,92,92,92,92,92,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
        [30,30,30,30,30,30,30,30,92,92,92,92,30,30,30,30,30,30,30,30,30,30,30,30,92,92,92,92,92,92,92,92,92,92,92,92,92,92,92,92,30,30,92,92,92,92,92,92,92,92,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]
    ]
}
