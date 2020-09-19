var W, H, ctx;

// quality variable. Standard quality - 1.00
var q = 2.00;

// rotation angle
var alpha = Math.PI/6;

onload = init
function init() {
  var canvas = document.querySelector('canvas');
  canvas.width = W = Math.round(q*window.innerWidth);
  canvas.height = H = Math.round(q*window.innerHeight);
  ctx = canvas.getContext('2d');
  
  canvas.onmousedown =
  canvas.ontouchstart = function(event) {
    startSlide(event.pageX || event.touches[0].pageX);
  }
  canvas.onmouseup =
  canvas.ontouchmove = function(event) {
    slideTo(event.pageX || event.touches[0].pageX);
  }
  
  animate();
}

var request;
function animate() {
  request = window.requestAnimationFrame(animate);
  
  var step = 0.25, size = W/10, t = Date.now()/3e3;
  var b = Math.PI/8;
  var phase = Math.PI/120*document.querySelector('#phase').value;
  if(document.querySelector('#rotate').checked)
    slide(1);
  var ca = Math.cos(alpha), sa = Math.sin(alpha);
  
  ctx.clearRect(0, 0, W, H);
  
  ctx.strokeStyle = 'rgba(128,128,128,0.7)';
  for(var x = -5; x <= 5; x++)
    drawLine(size*x, -size*5, 0, size*x, size*5, 0);
  for(var y = -5; y <= 5; y++)
    drawLine(-size*5, size*y, 0, size*5, size*y, 0);
  
  if(document.querySelector('#show-magnetic').checked)
  for(var x = -5; x <= 5; x += step) {
    var y = Math.sin(Math.PI*(x-t));
    if(~~x == x) ctx.strokeStyle = 'lightblue';
    else ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
    drawArrow(size*x, 0, size*y, 0);
  }
  
  if(document.querySelector('#show-electric').checked)
  for(var x = -5; x <= 5; x += step) {
    var z = Math.sin(Math.PI*(x-t)+phase);
    if(~~x == x) ctx.strokeStyle = 'yellow';
    else ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
    drawArrow(size*x, 0, 0, size*z);
  }
  
  if(document.querySelector('#show-polar').checked)
  for(var x = -5; x <= 5; x += step) {
    var y = Math.sin(Math.PI*(x-t));
    var z = Math.sin(Math.PI*(x-t)+phase);
    if(~~x == x) ctx.strokeStyle = 'pink';
    else ctx.strokeStyle = 'rgba(255, 192, 203, 0.6)';
    drawArrow(size*x, 0, size*y, size*z);
  }
  
  function drawArrow(x, y, dy, dz) {
    ctx.beginPath();
    var p0 = project(x, y, 0);
    var p1 = project(x, y+dy, dz);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.arc(p1.x, p1.y, q, 0, 2*Math.PI);
    ctx.stroke();
  }
  
  function drawLine(x0, y0, z0, x1, y1, z1) {
    ctx.beginPath();
    var p0 = project(x0, y0, z0);
    var p1 = project(x1, y1, z1);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
  
  function project(x, y, z) {
    return {
      x: W/2 + x*ca - y*sa,
      y: H/2 - (x*sa + y*ca)*Math.sin(b) - z*Math.cos(b)
    }
  }
}

onresize = resize
function resize() {
  window.cancelAnimationFrame(request);
  init();
}

// sliding motion
var slideX;
function startSlide(x) {
  slideX = x;
}

function slideTo(x) {
  var dx = x - slideX;
  slideX = x;
  slide(dx);
}

function slide(dx) {
  alpha += dx/200;
}