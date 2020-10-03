
var map,rotx=0,roty=0,keysPressed={},interval = [],up,down,left,right,tup,tdown,tleft,tright,objects=[],player,treedim=50,yes=true,t,names=[],speed=0,fric,applyfric,points,m,n,carspeed=0,marked=false,disval=0,options = [],turned = false,tupleft,tupright,tdownleft,tdownright;

window.onload = function() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("questions").style.display = "block";
};

function select(x) {
    let option = document.getElementsByClassName("option")[x];
    option.style.background = "rgba(255,255,255,0.5)";
    option.style.fontSize = "30px";
    let other = x==1 ? document.getElementsByClassName("option")[0] : document.getElementsByClassName("option")[1];
    other.style.background = "transparent";
    other.style.fontSize = "20px";
    marked = x;
}

function next() {
    if (marked !== false) {
        options.push(marked);
        marked = false;
        let mblock = document.getElementById("mblock");
        
        if (options.length == 1) {
            mblock.innerHTML = `<br>Which mode do you want to play?<br><br><br><div id = "free" class = "option" onclick = "select(0)">Free mode</div><div id = "challenge" class = "option" onclick = "select(1)">Challenge mode</div><div id = "confirm" onclick = "next()">Start</div>`;
        }
        
        else {
            OnFilled(...options);
        }
    }
    
    else {
        disclaimer("Please select one of the above options!");
    }
}

function disclaimer(text) {
    let body = document.getElementsByTagName("body")[0];
    let dis = document.getElementById("dis");
    
    if (dis === null) {
        body.innerHTML += "<div class = 'disclaimer' id = 'dis' style = 'position:absolute;transition:.5s;height:10%;width:80%;left:10%;top:100%;'>"+text+"</div>";
        dis = document.getElementById("dis");
    }
    
    dis.style.top = "90%";
    
    setTimeout(function() {
        dis.style.top = "100%";
    },1000);
    
}

function OnFilled(x,y) {
    setInterval(TaskDefiner,100);
    
    if (x === 1) {
        alert("Experience in laptop maybe better! Click on the buttons at the bottom to take turns!\n\nNote: In order to take turns you will have to click two buttons i.e. up and THEN right for moving right and, up and THEN left for moving left and the opposite with the down arrow button! Make sure that when you click at left or right you are already holding any of the up or down buttons! Continuous clicks are available!");
    }
    if (x === 0) {
        alert("Click on the up, down, left and right keys of your keyboard!\n\nNote: In order to take turns you will have to click two keys i.e. up and right for moving right and, up and left for moving left and the opposite with the down arrow key!");
    }
    if (y === 1) {
        alert("The task will be shown at the bottom left corner!");
    }
    
    document.getElementById("main").style.display = "block";
    
    map = document.getElementById("map");
    up = document.getElementById("up");
    down = document.getElementById("down");
    left = document.getElementById("left");
    right = document.getElementById("right");
    player = document.getElementById("player");
    points = document.getElementById("points");
    let task = document.getElementById("task");

    if (x === 1) {
        player.style.top = "200px";
        task.style.top = "10px";
    }
    
    if (x === 0) {
        up.style.display = "none";
        down.style.display = "none";
        left.style.display = "none";
        right.style.display = "none";
    }
    
    else {
        up.addEventListener("touchstart", function(){
            keysPressed.ArrowUp = true;
            tup = setInterval(TurnUp,30);
            if (keysPressed.ArrowLeft) { tupleft = setInterval(TurnLeft, 30); }
            if (keysPressed.ArrowRight) { tupright = setInterval(TurnRight, 30); }
            clearInterval(applyfric);
        });
        
        up.addEventListener("touchend", function() {
            keysPressed.ArrowUp = false;
            clearInterval(tup);
            clearInterval(tupleft);
            clearInterval(tupright);
            applyfric = setInterval(ApplySpeed,30);
        });
        
        down.addEventListener("touchstart", function(){
            keysPressed.ArrowDown = true;
            if (keysPressed.ArrowRight) { tdownleft = setInterval(TurnLeft, 30); }
            if (keysPressed.ArrowLeft) { tdownright = setInterval(TurnRight, 30); }
            clearInterval(applyfric);
            tdown = setInterval(TurnDown,30);
        });
        
        down.addEventListener("touchend", function() {
            keysPressed.ArrowDown = false;
            clearInterval(tdown);
            clearInterval(tdownleft);
            clearInterval(tdownright);
            applyfric = setInterval(ApplySpeed,30);
        });
        
        left.addEventListener("touchstart", function(){
            keysPressed.Arrowleft = true;
            if (keysPressed.ArrowDown) { tleft = setInterval(TurnRight,30); }
            if (keysPressed.ArrowUp) { tleft = setInterval(TurnLeft,30); }
        });
        
        left.addEventListener("touchend", function() {
            keysPressed.ArrowLeft = false;
            clearInterval(tleft);
        });
        
        right.addEventListener("touchstart", function(){
            keysPressed.ArrowRight = true;
            if (keysPressed.ArrowDown) { tright = setInterval(TurnLeft,30); }
            if (keysPressed.ArrowUp) { tright = setInterval(TurnRight,30); }
        });
        
        right.addEventListener("touchend", function() {
            keysPressed.ArrowRight = false;
            clearInterval(tright);
        });
    }
    
    var road = document.getElementById("road");
    
    for (let i = 0; i < parseFloat(road.style.height);i+=120) {
        if (y === 1) {
            road.innerHTML += `<div style = 'position:absolute;top:${i}px;left:calc(25% - 5px);height:90px;width:10px;background:white;'></div><div style = 'position:absolute;top:${i}px;left:calc(75% - 5px);height:90px;width:10px;background:white;'></div>`;
        }
        
        else {
            road.innerHTML += `<div style = 'position:absolute;top:${i}px;left:calc(50% - 10px);height:90px;width:20px;background:white;'></div>`;
        }
    }
    
    road.innerHTML += "<div style = 'position:absolute;left:10px;height:100%;width:10px;background:orange;'></div><div style = 'position:absolute;left:calc(100% - 20px);height:100%;width:10px;background:orange;'></div>";
    
    m = parseFloat(player.style.left)+parseFloat(player.style.width)/2;
    n = parseFloat(player.style.top)+parseFloat(player.style.height)/2;
    
    for (let i = 0; i < 200; i++) {
        
        map.innerHTML += `<div style = 'height:100%;width:2px;position:absolute;left:${i*100}px;top:0;background:rgb(200,${i*3},0)'></div><div style = 'height:2px;width:100%;position:absolute;top:${i*100}px;left:0;background:rgb(0,${i*3},200);z-index:1'></div>`;
    }
    
    if (y === 1) {
        objects.push(/*document.getElementById("car"), */document.getElementById("roadleft"), document.getElementById("roadright"),document.getElementById("bottom"),document.getElementById("shops1"),document.getElementById("shops2"),document.getElementById("road"),document.getElementById("middle"),document.getElementById("middle2"),document.getElementById("finish"),document.getElementById("checkturn"),document.getElementById("checkdist"));
        names.push(/*"car",*/"roadleft","roadright","bottom","shops1","shops2","road","middle","middle2","finish","checkturn","checkdist");
    }
    else {
        document.getElementById("task").style.display = "none";
        objects.push(/*document.getElementById("car"), */document.getElementById("roadleft"), document.getElementById("roadright"),document.getElementById("bottom"),document.getElementById("shops1"),document.getElementById("shops2"),document.getElementById("road"));
        names.push(/*"car",*/"roadleft","roadright","bottom","shops1","shops2","road");
        document.getElementById("finish").style.display = "none";
        document.getElementById("middle").style.display = "none";
        document.getElementById("middle2").style.display = "none";
    }
    
    document.addEventListener('keydown',function(e) {
        keysPressed[e.key] = true;
        
        if (keysPressed.ArrowLeft) {
            if (keysPressed.ArrowDown) { TurnRight(); }
            if (keysPressed.ArrowUp) { TurnLeft(); }
        }
        
        if (keysPressed.ArrowRight) {
            if (keysPressed.ArrowDown) { TurnLeft(); }
            if (keysPressed.ArrowUp) { TurnRight(); }
        }
        
        if (keysPressed.ArrowDown) {
            TurnDown();
            clearInterval(applyfric);
        }
        
        if (keysPressed.ArrowUp) {
            TurnUp();
            clearInterval(applyfric);
        }
    });
    
    document.addEventListener('keyup',function(e) {
        delete keysPressed[e.key];
        
        if (e.key == "ArrowUp" || e.key == "ArrowDown")
            applyfric = setInterval(ApplySpeed,30);
    });
    
    /*setInterval(carMove, 5);*/
    fric = setInterval(friction, 30);
    t = setInterval(find,20);
}

function friction() {
    if (speed > 0) {
        speed-=speed/10+0.1;
        if (speed < 0) {
            speed = 0;
        }
    }
    
    if (speed < 0) {
        speed-=speed/10-0.1;
        if (speed > 0) {
            speed = 0;
        }
    }
}

function ApplySpeed() {
    if (yes) {
        
        let moveleft = speed*Math.sin(rotx * Math.PI/180);
        let movetop = speed*Math.cos(rotx * Math.PI/180);
        
        map.style.transformOrigin = `${-parseFloat(map.style.left)+m}px ${-parseFloat(map.style.top)+n}px`;
        
        map.style.top = parseFloat(map.style.top)+movetop + "px";
        map.style.left = parseFloat(map.style.left)+moveleft + "px";
        change(movetop,moveleft);
    }
}

function TurnLeft(e) {
    if (yes) {
        rotx++;
        map.style.transformOrigin = `${-parseFloat(map.style.left)+m}px ${-parseFloat(map.style.top)+n}px`;
        
        map.style.transform = "rotate("+rotx+"deg)";
        change(0,0);
    }
}

function TurnRight(e) {
    if (yes) {
        rotx--;
        map.style.transformOrigin = `${-parseFloat(map.style.left)+m}px ${-parseFloat(map.style.top)+n}px`;
        
        map.style.transform = "rotate("+rotx+"deg)";
        change(0,0);
    }
}
function TurnDown(e) {
    if (yes) {
        if (speed > -15) {
            speed+=speed/5-0.4;
        }
        if (speed < -15) {
            speed = -15;
        }
        
        let moveleft = speed*Math.sin(rotx * Math.PI/180);
        let movetop = speed*Math.cos(rotx * Math.PI/180);
        
        map.style.transformOrigin = `${-parseFloat(map.style.left)+m}px ${-parseFloat(map.style.top)+n}px`;
        
        map.style.top = parseFloat(map.style.top)+movetop + "px";
        map.style.left = parseFloat(map.style.left)+moveleft + "px";
        
        change(movetop,moveleft);
    }
}
function TurnUp(e) {
    if (yes) {
        if (speed < 15) {
            speed+=speed/5+0.4;
        }
        if (speed > 15) {
            speed = 15;
        }
        
        let moveleft = speed*Math.sin(rotx * Math.PI/180);
        let movetop = speed*Math.cos(rotx * Math.PI/180);
        
        map.style.transformOrigin = `${-parseFloat(map.style.left)+m}px ${-parseFloat(map.style.top)+n}px`;
        
        map.style.top = parseFloat(map.style.top)+movetop + "px";
        map.style.left = parseFloat(map.style.left)+moveleft + "px";
        
        change(movetop,moveleft);
    }
}

function change(x,y,rotate=rotx) {
    for (let i = 0; i < objects.length; i++) {
        
        objects[i].style.transformOrigin = `${m-parseFloat(objects[i].style.left)}px ${n-parseFloat(objects[i].style.top)}px`;
        
        objects[i].style.top = parseFloat(objects[i].style.top)+x+"px";
        objects[i].style.left = parseFloat(objects[i].style.left)+y+"px";
        objects[i].style.transform = `rotate(${rotate}deg)`;
    }
}

function find() {
    if (yes) {
        for (let k = 0; k < names.length; k++) {
            let obj = document.getElementById(names[k]);
            
            let p = parseFloat(obj.style.width)/2;
            let q = parseFloat(obj.style.height)/2;
            let x = parseFloat(obj.style.left)+p;
            let y = parseFloat(obj.style.top)+q;
            
            let d1 = -n+parseFloat(obj.style.top)+parseFloat(obj.style.height)/2;
            let d2 = -m+parseFloat(obj.style.left)+parseFloat(obj.style.width)/2;
            
            let pt = parseFloat(player.style.top);
            let pl = parseFloat(player.style.left);
            let ph = parseFloat(player.style.height);
            let pw = parseFloat(player.style.width);
            
            let a = [[pl+pw,pt],[pl+pw,pt+ph],[pl,pt+ph],[pl,pt]];
            let b = [[FindVertices(d2+p,d1+q)[0]+m, FindVertices(d2+p,d1+q)[1]+n],[FindVertices(d2+p,d1-q)[0]+m, FindVertices(d2+p,d1-q)[1]+n],[FindVertices(d2-p,d1-q)[0]+m, FindVertices(d2-p,d1-q)[1]+n],[FindVertices(d2-p,d1+q)[0]+m, FindVertices(d2-p,d1+q)[1]+n]];
            
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    let val = i<3 ? i+1 : 0;
                    let val2 = j<3 ? j+1 : 0;
                    if (intersects(...a[i],...a[val],...b[j],...b[val2])) {
                        yes = false;
                        
                        if (names[k] == "checkturn") {
                            yes = true;
                            turned = true;
                            return;
                        }
                        
                        if (names[k] == "finish") {
                            let task = document.getElementById("task");
                            task.innerHTML = "You won";
                            alert("You won Congrats! More challenge mode levels will be coming soon, with new updates!\n\n\nJai AIMU");
                            return;
                        }
                        
                        alert("Car crashed! You lost! More challenge mode levels will be coming soon, with new updates!\n\n\nJai AIMU");
                        //drawLine(b[j],b[val2]);
                        return;
                    }
                }
            }
        }
    }
}


function FindVertices(x,y,rot=rotx) {
    
    return [x*Math.cos(rot*Math.PI/180) - y*Math.sin(rot*Math.PI/180), x*Math.sin(rot*Math.PI/180) + y*Math.cos(rot*Math.PI/180)];
}

function intersects(a,b,c,d,p,q,r,s) {
    var det, gamma, lambda;
    
    det = (c-a) * (s-q) - (r-p) * (d-b);
    
    if (det === 0) {
       return false;
    }
    
    else {
        lambda = ((s-q) * (r-a) + (p-r) * (s-b)) / det;
        gamma = ((b-d) * (r-a) + (c-a) * (s-b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}

function drawLine(a, b) {
    points.innerHTML = "";
    let val = ((a[0]-b[0])**2 + (a[1]-b[1])**2)**(1/2);
    
    for (let i = 0; i < val; i+=2) {
        let x = (a[0]*i + b[0]*(val-i))/val;
        let y = (a[1]*i + b[1]*(val-i))/val;
        
        if (x < screen.width && x > 0 && y > 0 && y < screen.height) {
            points.innerHTML += `<div style = 'position:absolute;top:${y}px;left:${x}px;height:4px;width:4px;background:red;'></div>`;
        }
    }
}

function TaskDefiner() {
    let task = document.getElementById("task");
    let d = document.getElementById("checkdist");
    
    let x = (((parseFloat(player.style.top) - parseFloat(d.style.top))**2 + (parseFloat(player.style.left) - parseFloat(d.style.left))**2)**(1/2)-100)/8;
    
    if (!turned) {
        if (x > 25 && x < 250) {
            task.innerHTML = "Take a U turn in "+parseInt(x)+"m";
        }
        else if (x >= 250) {
            task.innerHTML = "Move straight ahead!";
        }
        else {
            task.innerHTML = "Take a U turn";
        }
    }
    else {
        let finish = document.getElementById("finish");
        let x = (((parseFloat(player.style.top) - parseFloat(finish.style.top))**2 + (parseFloat(player.style.left) - parseFloat(finish.style.left) - parseFloat(finish.style.width)/2)**2)**(1/2) - 170);
        
        if (x > 0) {
            task.innerHTML = "Move straight for "+parseInt(x/8)+"m";
        }
        else {
            task.innerHTML = "You won";
        } 
    }
}
