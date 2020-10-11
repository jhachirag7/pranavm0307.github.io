
window.addEventListener("mouseover",play);
window.addEventListener("click",play);
function play() { document.getElementById("a").play();

}

setInterval(createSnowflake, 100);
function createSnowflake(){
    const snow_flake = document.createElement("b");
//snow_flake.classList.add("fas");
    snow_flake.innerHTML = "🦋";
  
snow_flake.classList.add("fa-snowflake");
snow_flake.style.left = Math.random() * window.innerWidth + "px";
snow_flake.style.animationDuration = Math.random() * 4 + 5 + "s";
snow_flake.style.opacity = Math.random();
snow_flake.style.fontsize = Math.random() * 15 + 10 + "px";
document.body.appendChild (snow_flake);

setTimeout(() => {
    snow_flake.remove();
},8000)
}

