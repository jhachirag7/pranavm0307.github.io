'use strict';

var fireworks = [];
var showArray = [];
var ctx, c;
var typeArray = ['ring','ball','rainbowRing','rainbowBall', 'twoColorRing', 'threeColorRing', 'twoColorBall', 'threeColorBall', 'trippleRing', 'doubleRing', 'streamerRing', 'streamerBall'];
var type = 'random';
var size = 'med';
var auto = true;
var show = false;
var manual = true;
var timeShow = 0;
var autoTime = {time:0, nextTime:0};
var timeDif;
var timeLast;
var EXPLOSION0 = "http://freesound.org/data/previews/38/38262_2518-lq.mp3";
var EXPLOSION1 = "http://freesound.org/data/previews/336/336006_4921277-lq.mp3";
var EXPLOSION2 = "http://freesound.org/data/previews/111/111308_197070-lq.mp3";
var EXPLOSION3 = "http://freesound.org/data/previews/38/38262_2518-lq.mp3";
var exp = [EXPLOSION0, EXPLOSION1, EXPLOSION2, EXPLOSION3];
var volumeInput = 0.5;
var timeAdjustment = 1000;


//The load function is called by the on load event handler after the page is loaded and constructs the canvas 2d context, initializes the canvas, establishes a resize of the canvas if the window is resized, and requests the first animation frame.
function load() {
  alert("          ***Read Me*** \n   This program allows you to click on the screen and have a firework launched up and explode where you click. You can also press the Auto button at the bottom of the screen to let the program launch fireworks for you. Press the Auto button again to turn this feature off. You can also press the Show button to play a premade show. Finally, also at be bottom of the screen there is a drop down list that you can use to choose which fireworks will be launched. \n \n   Thank you everyone for your support! I do appreciate the all of the feedback that I have received.");
  c = document.querySelector("canvas");
  ctx = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight - 60;
  ctx.fillStyle = 'hsla(0,0%,0%,1)';
  window.addEventListener('resize', function () {
    c.width = window.innerWidth;
    c.height = window.innerHeight - 60;
  }, false);
  buildFireworkShow();
  manualBackground();
  showBackground();
  autoBackground();
  window.requestAnimationFrame(draw);
}

function buildFireworkShow(){
    var x;
    var time;
    var xPos;
    var yPos;
    var showType;
    var launched;
    var firework;
    for( x = 0; x < 5; x++){
        time = x + 1.5;
        xPos = (x + 1)/6;
        yPos = 1-(x + 1)/6;
        showType = typeArray[x];
        launched = 0;
        firework = {time:time,xPos:xPos,yPos:yPos,type:showType,launched:launched};
        showArray.push(firework);
    }
    for( x = 0; x < 5; x++){
        time = x + 2;
        xPos = 1-(x + 1)/6;
        yPos = 1-(x + 1)/6;
        showType = typeArray[x];
        launched = 0;
        firework = {time:time,xPos:xPos,yPos:yPos,type:showType,launched:launched};
        showArray.push(firework);
    }
}
//The Time Adjust function works in conjunction with the slider bar down at the bottom to modify a variable which controls the scale at which time is reported to pass in the program.
function timeAdjust(newTimeAdjustment){
    timeAdjustment = newTimeAdjustment;
}
//The Draw function is the part of the program that takes data from the fireworks array object and uses it to make decisions on where to draw the different graphical elements defined in the fireworks array.
//Notice that a variable 'timeCurrent' is passed into the function. This is from the requestAnimationFrame method and is the time that the animation frame was drawn.
function draw(timeCurrent) {
//In this next portion the time that the animation frame was drawn is compared to the last time that the animation frame was drawn and and the time difference is calculated and scaled. This allows for smooth animations even if the program took longer to draw the frame than the update rate of the connected screen.
  if(!timeLast){
      timeLast=timeCurrent;
  }
  timeDif = timeCurrent - timeLast;
  timeLast = timeCurrent;
  timeDif /= timeAdjustment;
//This next function checks the state of the auto variable, which is controlled by the HTML button labeled "Auto" and if auto is something else than 0 or undefined, the program calls the auto fireworks function passing in the scaled amount of time between the last animation frame.
  if(auto){autoFireworks(timeDif);}
  if(show){playFireworkShow(timeDif);}
//The next few lines sets up a rectangle to be drawn over the previous animation frame and since the alpha value is low and the Global Composite Operation is set to multiply, this creates a sort of motion bluer effect where the previous frames are just slightly darkened but can still be seen, but eventually fade to black.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'hsla(0,0%,0%, '+ 8 * timeDif+')';
  ctx.fillRect(0, 0, c.width, c.height);
//This next portion of code sets the Global Composite Operation to source-over so that whatever is drawn next, will be drawn on top of what came before it without any regard to what was previously there.
  ctx.globalCompositeOperation = 'source-over';
//the forEach method is used here to evaluate each element of the fireworks array and have that element be used to provide data for drawing the desired particles
  fireworks.forEach(function (firework) {
//first the element in the fireworks array is checked if all of the time that it has to run has worn out if so the element is removed from the array
    if (firework.lifeTime < firework.time) {
      fireworks.splice(firework, 1);
    }else{
//Next some variables are set up that will be used to draw each ember.
        var twinkle;
        var emberXPos;
        var emberYPos;
        var grd;
//This if statement is only for computer users and if the firework is in the state of exploding for over a second and the chosen sound has not been played the playSound function is called passing in the desired sound index.
        if(firework.time > 1 && !firework.soundPlayed){
            //playSound(firework.sound);
            firework.soundPlayed = 1;
        }
//If the time held by the fireworks element is still negative a 'mortar' is drawn on the screen which starts on the bottom middle of the screen and moves to a predetermined location. The twinkle variable is used to determine a random value of which to modify the radius of the drawn circle, which gives a twinkling effect. Then the x and y positions of the mortar are calculated and will be used a couple of times. This is done here to increase efficiency due to using this number multiple times. Then the radial gradient is defined using the x and y position with the positions and color of the various gradient color stops following it. finally the gradient is passed to the fill style, the circle element is drawn in the desired position and the fill style is applied to that circle. Once the firework time reaches a positive value each element of the embers array, which is in the current element of the fireworks array, is used in a similar fashion to draw all of the particles in the firework as it explodes.
        if(firework.time < 0){
            twinkle = Math.random();
            emberXPos = firework.xPosStart - firework.time *(c.width / 2 - firework.xPosStart);
            emberYPos = firework.yPosStart + (Math.pow(-firework.time,2))*(c.height - firework.yPosStart);
            grd = ctx.createRadialGradient(emberXPos, emberYPos, 0, emberXPos, emberYPos, twinkle * 15);
            grd.addColorStop(0,  'hsla(45,100%,30%,0.65)');
            grd.addColorStop(0.2,  'hsla(45,100%,10%,0.5)');
            grd.addColorStop(0.4,  'hsla(45,100%,5%,0.2)');
            grd.addColorStop(1,  'hsla(0,0%,0%,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(emberXPos,
                emberYPos,
                twinkle* 15,
                0,
                Math.PI * 2);
            ctx.fill();
        }else{
            firework.embers.forEach(function (ember){
                twinkle = Math.random();
                emberXPos = (Math.sin(ember.angle - ember.phaseAngle)*(ember.distance *(1-ember.aspectFactor)) - Math.cos(ember.angle + ember.phaseAngle)*(ember.distance *(ember.aspectFactor)))*(firework.time/firework.lifeTime) * 1.6 + firework.xPosStart;
                emberYPos = -(Math.cos(ember.angle + ember.phaseAngle)*(ember.distance *(ember.aspectFactor)) + Math.sin(ember.angle - ember.phaseAngle)*(ember.distance *(1-ember.aspectFactor)))*(firework.time/firework.lifeTime) * 1.6 + firework.yPosStart + Math.pow(firework.time*2,3.5);
                grd = ctx.createRadialGradient(emberXPos, emberYPos, 0, emberXPos, emberYPos, twinkle * ember.emberSize);
                grd.addColorStop(0,  'hsla('+ember.color+','+ember.saturation+'%,80%,'+(firework.lifeTime - firework.time)/firework.lifeTime * 2+')');
                grd.addColorStop(0.1,  'hsla('+ember.color+','+ember.saturation+'%,50%,'+(firework.lifeTime - firework.time)/firework.lifeTime * 1+')');
                grd.addColorStop(0.2,  'hsla('+ember.color+','+ember.saturation+'%,50%,'+(firework.lifeTime - firework.time)/ firework.lifeTime * 0.3+')');
                grd.addColorStop(1,  'hsla(0,0%,0%,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(emberXPos,
                    emberYPos,
                    twinkle* ember.emberSize,
                    0,
                    Math.PI * 2);
                ctx.fill();
            });
        }
//Here the time that is held by the fireworks array element is updated in proportion to the scaled time that it took to draw the last animation frame
        firework.time += timeDif;
    }
  });
//Finally the function requests the next animation frame to be drawn calling itself to create a loop which the program will execute until the page is closed.
  window.requestAnimationFrame(draw);
}
function playFireworkShow(timeDif){
    timeShow += timeDif;
    showArray.forEach(function (firework){
        if(timeShow < 0.05){
            firework.launched = 0;
        }
        if((firework.time - timeShow) < -1 && !firework.launched){
            startFirework(firework.xPos,firework.yPos,firework.type);
            firework.launched = 1;
        }
    });
}
function manualFireworkStart(event){
    if(manual){
        var x = event.clientX / c.width;
        var y = event.clientY / c.height;
        startFirework(x,y); 
    }
}

//the startFirework function is asynchronously called either by clicking on the canvas or by the autoFireworks function. This function establishes a number of variables, places these variables into a JSON object, and then pushes that object into the fireworks array. This function is the root of how displaying a firework is started and where all of the information that the draw function needs to draw the firework comes from.
function startFirework(x,y,style){
    if(style){type = style}
    x *= c.width;
    y *= c.height;
    var sound = exp[Math.floor(Math.random() * exp.length)];
    var soundPlayed = 0;
    var time = -1;
    var lifeTime = 1.5;
    var embers = makeEmbers();
    var firework ={xPosStart:x,yPosStart:y,embers:embers,lifeTime:lifeTime,time:time,sound:sound,soundPlayed:soundPlayed};
    fireworks.push(firework);
}
//the fireworkType function is used in conjunction with the HTML select element to choose which style of fire work is constructed when the startFirework function is called
function fireworkType(select){
    if(select === null){
        return type;
    }else{
        type = select;
    }
}
//Currently the fireworkSize function is not being used the thought is to adjust the size of the firework but to be honest I just have not gotten around to it yet ;P
function fireworkSize(select){
    if(select === null){
        return size;
    }else{
        size = select;
    }
}
//The makeEmbers function is used to construct JSON objects that are placed into the embers array. these objects are then used to define the characteristics of the circle elements which make up the fire work visuals. The first part of the function just defines the variables that will be put into the JSON.
function makeEmbers(){
    var embers =[];
    var totalEmbers;
    var phaseShift;
    var distance;
    var ember;
    var angle;
    var color;
    var color1;
    var color2;
    var color3;
    var phaseAngle;
    var aspectFactor;
    var typeHold;
    var emberSize = Math.random() * 30 + 10;
    var saturation = 100;
//Next the Switch Case statement is used to select from a list of firework styles selected by the type variable with the default being set as random.
//Note that only a few of the cases are discussed. The other cases that are not discussed are similar to the ones that are to the point I do not think that they need to be discussed
    switch(type){
    case 'streamerRing':
        phaseAngle = Math.PI * 2 * (Math.random() - 0.5);
        aspectFactor = 0.5 - 3.9*(Math.pow(Math.random() - 0.5,3));
        totalEmbers = 20;
        phaseShift = Math.random() * Math.PI;
        for(var streamerTales = 1; streamerTales < 2000; streamerTales *= 5){
            distance = 150 / Math.pow(streamerTales,0.2);
            emberSize = 5 +50 / streamerTales;
            if(streamerTales == 1){
                color = Math.random() * 360;
            }else{
                color = 35;
            }
            for(ember = (streamerTales - 1)* totalEmbers; ember < totalEmbers * streamerTales; ember++){
                if(streamerTales == 1){
                    angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
                }else{
                    angle = embers[ember % totalEmbers].angle
                    saturation = 70;
                }
                embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
            }
        }
        break;
//the ring case is the base for all of the styles that have the word ring in them. In this case the phaseAngle and AspectFactor are used in the draw function to create an elliptical effect so that the firework does not seem to be facing directly towards the viewer at all times. Then the size of the array is defined by the totalEmbers variable, the scaled distance that the fireworks will travel is defined by the distance variable, the color is randomly chosen and set to the color variable, and the phaseShift variable is also randomly chosen and is used to adjust the angle that the embers element will travel along. Finally the for loop defines the given angle based upon the count of the for loop and the phaseShift, constructs the JSON and places in into the embers array. 
    case 'ring':
        phaseAngle = Math.PI * 2 * (Math.random() - 0.5);
        aspectFactor = 0.5 - 3.9*(Math.pow(Math.random() - 0.5,3));
        totalEmbers = 20;
        distance = 100;
        color = Math.random() * 360;
        phaseShift = Math.random() * Math.PI;
        for(ember = 0; ember < totalEmbers; ember++){
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
    case 'twoColorRing':
        phaseAngle = Math.PI * 2 * (Math.random() - 0.5);
        aspectFactor = 0.5 - 3.9*(Math.pow(Math.random() - 0.5,3));
        totalEmbers = 20;
        distance = 100;
        color1 = Math.random() * 360;
        color2 = Math.random() * 360;
        phaseShift = Math.random() * Math.PI;
        for(ember = 0; ember < totalEmbers; ember++){
            color = ember % 2;
            if(color == 0){
                color = color1;
            }else{
                color = color2;
            }
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
    case 'threeColorRing':
        phaseAngle = Math.PI * 2 * (Math.random() - 0.5);
        aspectFactor = 0.5 - 3.9*(Math.pow(Math.random() - 0.5,3));
        totalEmbers = 20;
        distance = 100;
        color1 = Math.random() * 360;
        color2 = Math.random() * 360;
        color3 = Math.random() * 360;
        phaseShift = Math.random() * Math.PI;
        for(ember = 0; ember < totalEmbers; ember++){
            color = ember % 3;
            if(color == 0){
                color = color1;
            }else if(color == 1){
                color = color2;
            }else{
                color = color3;
            }
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
    case 'rainbowRing':
        phaseAngle = Math.PI * 2 * (Math.random() - 0.5);
        aspectFactor = 0.5 - 3.9*(Math.pow(Math.random() - 0.5,3));
        totalEmbers = 20;
        distance = 100;
        phaseShift = Math.random() * Math.PI * 2;
        for(ember = 0; ember < totalEmbers; ember++){
            color = ember * 360 / totalEmbers;
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
//The doubleRing case first saves the current style of fireworks that is selected. Then it just recursively calls the makeEmbers function with the style set to ring and then adds the return to the embers array. Finally the type is set back to the style that was saved earlier. Basically this calls the makeEmbers function twice and puts the result of the function into the same array one after the other. then the 
    case'doubleRing':
        typeHold = type;
        type = 'ring';
        embers = makeEmbers();
        embers.push.apply(embers, makeEmbers());
        type = typeHold;
        break;
    case'trippleRing':
        typeHold = type;
        type = 'ring';
        embers = makeEmbers();
        embers.push.apply(embers, makeEmbers());
        embers.push.apply(embers, makeEmbers());
        type = typeHold;
        break;
    case 'streamerBall':
        phaseAngle = 0;
        aspectFactor = 0.5;
        totalEmbers = 50;
        color = Math.random() * 360;
        for(ember = 0; ember < totalEmbers; ember++){
            emberSize = 50;
            distance = Math.random() * 200;
            phaseShift = Math.random() * Math.PI / 4;
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        for(var streamerTales = 2; streamerTales < 150; streamerTales *=9){
            
            emberSize = 10+ 50 / streamerTales;
            color = 35;
            saturation = 70;
            for(ember = (streamerTales - 1)* totalEmbers; ember < totalEmbers * streamerTales; ember++){
                distance = embers[ember % totalEmbers].distance / Math.pow(streamerTales,0.2);
                angle = embers[ember % totalEmbers].angle;
                embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
            }
        }
        break;
//The Ball case is a lot like the ring case except due to the distance and phaseShift variables are defined as random for each of the embers array elements, each ember will fly out in a random direction to a random distance away from a central point.
    case'ball':
        phaseAngle = 0;
        aspectFactor = 0.5;
        color = Math.random() * 360;
        totalEmbers = 100;
        for(ember = 0; ember < totalEmbers; ember++){
            distance = Math.random() * 200;
            phaseShift = Math.random() * Math.PI / 4;
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
    case 'twoColorBall':
        phaseAngle = 0;
        aspectFactor = 0.5;
        color1 = Math.random() * 360;
        color2 = Math.random() * 360;
        totalEmbers = 100;
        for(ember = 0; ember < totalEmbers; ember++){
            color = ember % 3;
            if(color == 0){
                color = color1;
            }else{
                color = color2;
            }
            distance = Math.random() * 200;
            phaseShift = Math.random() * Math.PI / 4;
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
    case 'threeColorBall':
        phaseAngle = 0;
        aspectFactor = 0.5;
        color1 = Math.random() * 360;
        color2 = Math.random() * 360;
        color3 = Math.random() * 360;
        totalEmbers = 100;
        for(ember = 0; ember < totalEmbers; ember++){
            color = ember % 3;
            if(color == 0){
                color = color1;
            }else if(color == 1){
                color = color2;
            }else{
                color = color3;
            }
            distance = Math.random() * 200;
            phaseShift = Math.random() * Math.PI / 4;
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
    case 'rainbowBall':
        phaseAngle = 0;
        aspectFactor = 0.5;
        totalEmbers = 100;
        for(ember = 0; ember < totalEmbers; ember++){
            distance = Math.random() * 200;
            color = ember * 360 / totalEmbers;
            phaseShift = Math.random() * Math.PI * 2;
            angle = phaseShift + 2 * Math.PI * ember / totalEmbers;
            embers[ember] = {angle:angle, phaseShift:phaseShift, distance:distance, color:color, phaseAngle:phaseAngle, aspectFactor:aspectFactor, emberSize:emberSize, saturation:saturation};
        }
        break;
//In the default case a random style of firework is chosen and then the makeEmbers function is recursively called again to make the embers array with the randomly chosen style. Finally the type is set back to random which is not a valid case so the state case statement will go back to using the default case.
    default:
        type = typeArray [Math.floor(Math.random() * typeArray.length)];
        embers = makeEmbers ();
        type = 'random';
    
    }
//Finally the embers array is returned to the place where makeEmbers was last called from.
    return embers;
    
}
//The autoOnOff function is used in conjunction with the button labeled 'Auto' to toggle the autoFireworks on or off
function autoOnOff(){
    auto = !auto;
    if(show){show = false;}
    if(!manual){manual = true;}
    manualBackground();
    showBackground();
    autoBackground();
}
function showOnOff(){
    if(show){
        manual = true;
        type = 'random';
    }else{
        timeShow = 0;
        manual = false;
        auto = false;
    }
    show = !show;
    manualBackground();
    showBackground();
    autoBackground();
}
function manualOnOff(){
    if(!manual){
        show = false;
    }
    manual = !manual;
    manualBackground();
    showBackground();
}
//The autoFireworks function is used to call the startFireworks function without any arguments(this will make it so that the startFirework function will chose a random x,y coordinate to set the firework off at). The autoFirework also sets a random time interval at the end of which the startFirework function will be called again and a new random time interval will be set. The time is updated by the argument that was passed to the autoFirework Function when it was called.
function autoFireworks(timeDif){
    if(autoTime.time > autoTime.nextTime){
        autoTime.time = 0;
        autoTime.nextTime = Math.random() * 1.5 + 0.5;
        var x = ((c.width - 150) * Math.random() + 75) / c.width;
        var y = ((c.height - 225)* Math.random() + 100) / c.height;
        startFirework(x,y);
    }
    autoTime.time += timeDif;
}
//the playSound function constructs a new sound element, sets the path for where the sound file is located, sets the volume of which the sound should be played at and tells the sound to play. This final feature is not allowed on mobile devices, so this feature is not called unless the user uncomments line 69 of this code.
function playSound(sound) {
    var soundEfect = new Audio();
    soundEfect.src = sound;
    soundEfect.volume = volumeInput;
    soundEfect.play();
}
//The volumeAdjust function is used in conjunction with the range HTML element labeled 'volume' to adjust the volume at which sounds will be played at.
function volumeAdjust(nextVolume){
    volumeInput = nextVolume;
}
function manualBackground(){
    if(manual){
        document.getElementById('manualButton').style.background = 'rgb(80,80,80)';
        document.getElementById('manualButton').style.color = 'white';
    }else{
        document.getElementById('manualButton').style.background = 'black';
        document.getElementById('manualButton').style.color = 'gray';
    }
}
function autoBackground(){
    if(auto){
        document.getElementById('autoButton').style.background = 'rgb(80,80,80)';
        document.getElementById('autoButton').style.color = 'white';
    }else{
        document.getElementById('autoButton').style.background = 'black';
        document.getElementById('autoButton').style.color = 'gray';
    }
}
function showBackground(){
    if(show){
        document.getElementById('showButton').style.background = 'rgb(80,80,80)';
        document.getElementById('showButton').style.color = 'white';
    }else{
        document.getElementById('showButton').style.background = 'black';
        document.getElementById('showButton').style.color = 'gray';
    }
}
//This event listener waits until the entire page is loaded and then starts the program by running the load function.
window.addEventListener('load', load);
