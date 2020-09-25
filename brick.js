
"use strict";
var editor=
"http://jsbeautifier.org/?without-codemirror";
var canvas, ctx, div, div2, π = Math.PI, time;
var w = screen.width,
    h = w * 1.38,
    k = w / 320;
var blocks = [],
    debris = [],
    bonuses=[],
    pad = {
        x: 120 * k,
        y: 350 * k,
        w:90*k,h:15*k
    },
    ball = {
        x: 160 * k,
        y: 301 * k,
        vx: 1 * k,
        vy: 3 * k,
        v: 0,
        vxs: [-2.2, -2, -0.7, -0.5, -0.3,
            0, 0.3, 0.5, 0.7, 2, 2.2
        ],
        trails: []
    }
var score = 0,
    lvl = -1,
    gameOn = false;
var blockTypes = [

    //cracks
    [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 1],
        [1, 2, 0, 0, 0, 2, 1],
        [1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
    ],
    //heart
    [
        [0, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 1, 2, 2, 2, 1, 0],
        [0, 1, 2, 2, 2, 1, 0],
        [0, 0, 1, 2, 1, 0, 0],
    ]

];
var blockSize = [];
var boundaries = [{
        x: 3 * k,
        y: 3 * k,
        w: 10 * k,
        h: h
    },
    {
        x: w * 0.96,
        y: 3 * k,
        w: 10 * k,
        h: h
    },
    {
        x: 3 * k,
        y: 3 * k,
        w: w * 0.96,
        h: 10 * k
    },
    {
        x: 3 * k,
        y: h * 0.98,
        w: w * 0.96,
        h: 10 * k
    }
];

function quad1() {
    ball.vy *= -1;
}

function quad2() {
    ball.vx *= -1;
}

function quad3() {
    ball.vy *= -1;
}

function quad4() {
    ball.vx *= -1
}

function quadPad() {
    var delta = (ball.x - (pad.x + pad.w/2)) / 5;
    ball.vy *= -1;
    ball.vx = Closest(ball.vxs, delta);
}

function quadBlock(x) {
    var bx = blocks[x].x;
    var by = blocks[x].y;
    var diffX = Math.abs(ball.x - bx);
    var diffY = Math.abs(ball.y - by) * 2;
    var diff = Math.abs(diffX - diffY);
    if (diff < 5) {
        ball.vx *= -1;
        ball.vy *= -1;
    } else if (diffX < diffY) {
        ball.vy *= -1
    } else if (diffY < diffX) {
        ball.vx *= -1
    }
    if(blocks[x].type.color=="red"){
     createBonus(x);   
    }
    createDebris(x);
    blocks.splice(x, 1);

}
alert("*Cracking the blue Squares do not count,they serve as  barriers\n*Green squares carry 1 point\n*Red squares carry 2 points and also gives you dropdown bonuses\n*Tap anywhere on your screen to move paddle\n*Some bonuses make your paddle wider(collect them),some make your paddle shrink(avoid them)");
window.onload = getAssets;

function getAssets() {
    div = document.querySelector("#d1");
    div2 = document.querySelector("#d2");
    canvas = document.querySelector("canvas");
    ctx = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;
    sumBlockValues();
    nextLevel();
    window.addEventListener("touchstart", slidePad);
    setInterval(pushTrails, 100);
    Gameplay();
}

function Bonus(x,y,w){
var _this=this;
_this.x=x;
_this.y=y;
_this.w=w;
_this.type=Rand(0,2);
_this.drop=function(){
_this.y+=k;
}
}
function createBonus(h){
var x=blocks[h].x;
var y=blocks[h].y;
var w=blocks[h].w;
bonuses.push(new Bonus(x,y,w));
}
function setPadWidth(t){
t==1?pad.w=140*k:pad.w=70*k;
clearTimeout(time);
time=setTimeout("pad.w=90*k",5000);
}
function Debris(x, y, w, h, c, o) {
    var _this = this;
    _this.x = x;
    _this.y = y;
    _this.oy = y;
    _this.vy = Rand(1, 3);
    _this.t = 0;
    _this.w = w + Rand(-2, 2);
    _this.h = h;
    _this.c = c;
    _this.o = o;
    _this.move = function() {
        _this.y += _this.vy;
        if ((_this.y - _this.oy) > 25) {
            _this.t = 1;
        }

    }
}

function createDebris(i) {
    var opac = 1
    if (blocks[i].type.color == "blue") {
        opac = 0.3;
    }
    var x = blocks[i].x;
    var x1 = x;
    var y = blocks[i].y;
    var c = blocks[i].type.color;
    var wd = Rand(5, 7);
    var hd = Rand(2, 3);
    var w = blocks[i].w / wd;
    var h = blocks[i].h / hd;
    for (var i = 0; i < hd; i++) {
        for (var k = 0; k < wd; k++) {
            debris.push(new Debris(x, y, w - 1 * k, h - 1 * k, c, opac));
            x += w;
        }
        x = x1;
        y += h;
    }
}

function Trail(x, y, r) {
    var _this = this;
    _this.x = x + Rand(0, 8);
    _this.y = y + Rand(0, 8);
    _this.r = Rand(2, 4);
    _this.t = 0;
    setTimeout(function() {
        _this.t = 1
    }, 300);

}

function pushTrails() {
    ball.trails.push(new Trail(ball.x, ball.y));
    for (var i in ball.trails) {
        if (ball.trails[i].t == 1) {
            ball.trails.splice(i, 1);
        }
    }
}

function Block(x, y, w, h, t) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = objType(t);

}

function objType(a) {
    switch (a) {
        case 0:
            return {
                points: 0,
                color: "blue"
            }
        case 1:
            return {
                points: 1,
                color: "green"
            }
            break;
        case 2:
            return {
                points: 2,
                color: "red"
            }
            break;
    }
}

function Gameplay() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    UpdateBlocks();
    UpdateBonuses();
    UpdateDebris();
    UpdateBoundaries();
    UpdatePad();
    UpdateBall();
    moveBall();
    requestAnimationFrame(Gameplay);
}

function slidePad(e) {
    var tx = e.touches[0].pageX;

    if (tx > pad.w/2 && tx < w-pad.w/2 && gameOn) {
        pad.x = tx - 45 * k;
    } else if (tx < pad.w/2) {
        pad.x = pad.w/4 * k;
    } else if (tx > w-pad.w/2) {
        pad.x =  w-pad.w;
    }
}

function setBlocks(type) {
    ball.vy = 3 * k;
    ball.vx = 0.3 * k;
    div2.style.opacity = 0;
    gameOn = true;
    score = 0;
    div.innerHTML = "score:" + score;
    var blockW = 38 * k;
    var blockH = 20 * k;
    var x;
    var y = 20 * k;
    var c = 1;
    var j = 0;
    for (var i = 0; i < blockTypes[type].length; i++) {
        y += blockH + 3 * k;
        x = -20*k;
        for (var v = 0; v < blockTypes[type][0].length; v++) {
            c = 0;
            x += blockW + 3 * k;
            if (blockTypes[type][i][v] == 1) {
                c = 1
            } else if (blockTypes[type][i][v] == 2) {
                c = 2
            }
            blocks.push(new Block(x, y, blockW, blockH, c));
        }
    }
}

function sumBlockValues() {
    var sum = 0;
    for (var i in blockTypes) {
        sum = 0;
        for (var j in blockTypes[i]) {

            for (var n in blockTypes[i][j]) {
                sum += blockTypes[i][j][n];
            }
        }
        blockSize.push(sum);
    }
}

function UpdateBlocks() {
    for (var i in blocks) {
        ctx.save();
        ctx.beginPath();
        if (blocks[i].type.points == 0)
            ctx.globalAlpha = 0.2;
        ctx.fillStyle = blocks[i].type.color;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.rect(blocks[i].x, blocks[i].y, blocks[i].w, blocks[i].h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}
function UpdateBonuses(){
for(var i in bonuses){
var b=bonuses[i];
b.drop();
ctx.beginPath();
ctx.fillStyle="black";
ctx.rect(b.x,b.y-10*k,b.w,10*k);
ctx.fill();
ctx.stroke();
ctx.beginPath();
ctx.font=15*k+"px Arial";
if(b.type==0){
ctx.fillText("➡️⬅️",b.x,b.y);
}
else ctx.fillText("⬅️➡️",b.x,b.y);
ctx.fill();
if(b.y>h*0.9)bonuses.splice(i,1);
if(b.x>pad.x&&b.x<(pad.x+pad.w)
&&b.y>pad.y&&b.y<(pad.y+pad.h)
){
setPadWidth(b.type);
bonuses.splice(i,1);
}
}
}
function UpdateDebris() {
    for (var i in debris) {
        var d = debris[i];
        d.move();
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = d.c;
        ctx.globalAlpha = d.o;
        ctx.rect(d.x, d.y, d.w, d.h);
        ctx.fill();
        ctx.restore();
        if (d.t == 1) {
            debris.splice(i, 1);
        }
    }
}

function UpdateBoundaries() {
    for (var i in boundaries) {
        if (i == 3) continue;
        var obj = boundaries[i];
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.rect(obj.x, obj.y, obj.w, obj.h);
        ctx.fill();
    }

}

function UpdatePad() {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.roundRect(pad.x, pad.y, pad.w, pad.h, 6 * k);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "blue";
    ctx.strokeStyle = "white";
    ctx.rect(pad.x + pad.w/5, pad.y, pad.w*0.6 , pad.h);
    ctx.fill();
    ctx.stroke();
}

function UpdateBall() {
    for (var i in ball.trails) {
        var tr = ball.trails[i];
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.arc(tr.x, tr.y, tr.r, 0, 2 * π);
        ctx.fill();
    }
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2
    ctx.fillStyle = "yellow";
    ctx.arc(ball.x, ball.y, 9 * k, 0, 2 * π);
    ctx.fill();
    ctx.stroke();

}

function moveBall() {
    ball.x += ball.vx * k;
    ball.y += ball.vy * k;
    ball.v = Math.sqrt(ball.vx * ball.vx +
        ball.vy * ball.vy)
    //ball.v=Math.hypot(ball.vx,ball.vy);
    if (ball.v > 4) {
        ball.vx *= 0.9;
        ball.vy *= 0.9;
    } else if (ball.v < 3) {
        ball.vx *= 1.1;
        ball.vy *= 1.1;
    }
    if (ball.y > h * 0.96) {
        if (lvl != -1) setTimeout(loss, 1000);
        quad1();
        lvl = -1;
    }
var ballx=ball.x+9*k;
var bally=ball.y+9*k;
    if (ballx < boundaries[0].x + 20 * k)
        quad2();
    if (bally < boundaries[2].y + 20 * k) quad3();
    if (ballx > boundaries[1].x - (10 * k)) quad4();
    if (ballx > pad.x && ballx < (pad.x + pad.w) &&
        ball.y > pad.y - (5 * k) &&
        ball.y < (pad.y + pad.h)) {
        quadPad();
    }
    
    for (var i in blocks) {
        var b = blocks[i];
        if (
            Dist(b.x + (b.w / 2) * k,
                b.y + (b.h / 2) * k, ballx, bally) < 23 * k
        ) {
            extraScore(i);
            quadBlock(i);
            if (score == blockSize[lvl]) {
                ball.vx /= 3;
                ball.vy /= 3;
                nextLevel();
            }
            break;
        }
    }
}

function extraScore(i) {

    score += blocks[i].type.points;
    div.innerHTML = "score:" + score;

}

function nextLevel() {
    if (lvl == blockTypes.length - 1) {
        alert("you won");
        lvl = 0;
    } else lvl++;
    div2.style.opacity = 1;
    div2.innerHTML = "level " + (lvl + 1);
    blocks.splice(0, blocks.length);
    pad.x = 120 * k;
    pad.y = 350 * k;
    pad.w = 90 * k;
    ball.x = 165 * k;
    ball.y = 331 * k;
    ball.vx = 0 * k;
    ball.vy = 0 * k;
    ball.v = 0;
    ball.trails = [];
    debris = [];
    bonuses=[];
    gameOn = false;
    setTimeout("setBlocks(lvl);", 1000);
}

function loss() {
    alert("you lost");
    nextLevel();
}
