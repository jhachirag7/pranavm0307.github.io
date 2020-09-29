window.onload=function(){
Swal.fire({
        icon: 'success',
        title: 'If you like,give a 👍',
        html: "make your own burger😋🍔,scroll items left for more🥦🧀🥓🍅🍳<br>you can change drinks also😁",
        footer: '&copy All rights reserved !'
    });
}
var t=45,e,start,calories=0;
        var cr=false;
        var end=true;
        var alt=true;
        function c(x,y,z){
            if(end){
            start=-15;
            var co=document.getElementById("content");
            var cal=document.getElementById("cal");
            e=document.createElement("div");
            co.appendChild(e);
            e.className=x;
            if(x=="finish"){
                end=false;
                alert("comment down your calories gained😁,have a nice day🙂");
            }
            //console.log(t);
            calories+=z;
            cal.innerHTML="Calories:"+calories+"kcal";
            if(x=="onion"){
                var f=document.createElement('div');
                co.appendChild(f);
                f.className=x;
                f.style.top=t+"%";
                f.style.transform="translate(23%,30%)";
            }
            if(x=="cheese"){
                if(cr){
                    e.style.height="40px";
                    e.style.width="50px";
                    e.style.transform="translateX(-50%) rotateZ(15deg)";
                    cr=false;
                }
                else{
                    e.style.height="50px";
                    e.style.width="40px";
                    e.style.transform="translateX(-50%) rotateZ(75deg)";
                    cr=true;
                }
            }
            var s=setInterval(function(){
                end=false;
                e.style.top=start+"%";
                start+=2;
                if(start>=t){
                    e.style.top=t+"%";
                    if(t<5 && alt){
                    alert("that's too heavy lets finish now");
                    //c('finish',100,1);
                    end=true;
                    alt=false;
                    }
                    t=t-y;
                    if(alt && x!="finish"){
                    end=true;}
                    clearInterval(s);
                }
            },1);
            }
        }
        var color;
        function d(v){
            var cup=document.getElementById("cup");
            cup.style.borderTop="75px solid "+v;
        }
