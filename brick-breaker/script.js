const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let gameStarted=false;
let ballLaunched=false;
let waitingNextLevel=false;
let level=1;

let paddle = {x:380,w:140,h:12};
let balls=[];
let bricks=[], drops=[];
let lives=3;

let keys={left:false,right:false};

const BASE_SPEED = 7;

let bigBallActive=false;
let bigBallTimer=null;

const powerMap = {
 FAST:"⚡", SLOW:"🐢", BIG_PADDLE:"📏",
 BIG_BALL:"🔴", MULTI:"🎯"
};

// CONTROLS
document.addEventListener("keydown",e=>{
 if(e.code==="ArrowLeft"||e.code==="KeyA") keys.left=true;
 if(e.code==="ArrowRight"||e.code==="KeyD") keys.right=true;

 if(e.code==="Space"){
   if(!gameStarted){
     startGame();
   }
   else if(waitingNextLevel){
     level++;
     waitingNextLevel=false;

     balls=[createBall()];
     bricks=[];
     drops=[];
     createLevel();

     document.getElementById("msg").innerHTML="Level "+level;
     setTimeout(()=>document.getElementById("msg").innerHTML="",1500);

     ballLaunched=false;
   }
   else if(!ballLaunched){
     ballLaunched=true;
     document.getElementById("msg").innerHTML="";
   }
 }
});

document.addEventListener("keyup",e=>{
 if(e.code==="ArrowLeft"||e.code==="KeyA") keys.left=false;
 if(e.code==="ArrowRight"||e.code==="KeyD") keys.right=false;
});

// START
function startGame(){
 gameStarted=true;
 ballLaunched=false;
 waitingNextLevel=false;
 level=1;
 lives=3;

 paddle={x:380,w:140,h:12};

 balls=[createBall()];
 bricks=[];
 drops=[];

 createLevel();
 document.getElementById("msg").innerHTML="";
}

// BALL
function createBall(){
 return {
   x:450,
   y:540,
   dx:BASE_SPEED*(Math.random()>0.5?1:-1),
   dy:-BASE_SPEED,
   r:7
 };
}

// LEVEL
function createLevel(){
 bricks=[];

 let rows = (level===1)?10:12;

 let limits = (level===1)
 ? {FAST:3,SLOW:3,MULTI:5,BIG_BALL:3,BIG_PADDLE:3}
 : {FAST:1,SLOW:1,MULTI:1,BIG_BALL:1,BIG_PADDLE:1};

 let count = {FAST:0,SLOW:0,MULTI:0,BIG_BALL:0,BIG_PADDLE:0};

 for(let i=0;i<20;i++){
   for(let j=0;j<rows;j++){
     bricks.push({
       x:80+i*35,
       y:80+j*20,
       w:28,h:14,
       special:false,
       type:null
     });
   }
 }

 let indices=[...Array(bricks.length).keys()];
 indices.sort(()=>Math.random()-0.5);

 let types=["FAST","SLOW","MULTI","BIG_BALL","BIG_PADDLE"];

 indices.forEach(i=>{
   let available=types.filter(t=>count[t]<limits[t]);
   if(available.length===0) return;

   if(Math.random()<0.25){
     let type=available[Math.floor(Math.random()*available.length)];
     bricks[i].special=true;
     bricks[i].type=type;
     count[type]++;
   }
 });
}

// COLLISION
function collideBallRect(b,r){
 return (
   b.x+b.r>r.x &&
   b.x-b.r<r.x+r.w &&
   b.y+b.r>r.y &&
   b.y-b.r<r.y+r.h
 );
}

// UPDATE
function update(){
 if(!gameStarted) return;

 const speed=26;

 if(keys.left) paddle.x-=speed;
 if(keys.right) paddle.x+=speed;

 paddle.x=Math.max(0,Math.min(900-paddle.w,paddle.x));

 if(!ballLaunched){
   balls.forEach(b=> b.x=paddle.x+paddle.w/2);
   return;
 }

 balls.forEach((b,index)=>{

   b.x+=b.dx;
   b.y+=b.dy;

   if(b.x-b.r<0){ b.x=b.r; b.dx=Math.abs(b.dx); }
   if(b.x+b.r>900){ b.x=900-b.r; b.dx=-Math.abs(b.dx); }
   if(b.y-b.r<0){ b.y=b.r; b.dy=Math.abs(b.dy); }

   if(collideBallRect(b,{x:paddle.x,y:550,w:paddle.w,h:paddle.h})){
     b.y=550-b.r;
     b.dy=-Math.abs(b.dy);
     b.dx += (Math.random()-0.5)*2;
   }

   if(b.y>600){
     balls.splice(index,1);
   }

   for(let i=bricks.length-1;i>=0;i--){
     let br=bricks[i];
     if(collideBallRect(b,br)){
       b.dy*=-1;

       if(br.special){
         drops.push({x:br.x,y:br.y,type:br.type,dy:3});
       }

       bricks.splice(i,1);
     }
   }
 });

 if(bricks.length===0 && !waitingNextLevel){
   if(level===1){
     waitingNextLevel=true;
     ballLaunched=false;
     document.getElementById("msg").innerHTML="Level 1 Complete 🎉<br>Press SPACE";
   } else {
     gameStarted=false;
     document.getElementById("msg").innerHTML="Game Complete 🎉";
   }
 }

 if(balls.length===0){
   lives--;
   if(lives>0){
     document.getElementById("msg").innerHTML="Lives left: "+lives;
     balls=[createBall()];
     ballLaunched=false;
   } else {
     gameStarted=false;
     document.getElementById("msg").innerHTML="Game Over<br>Press SPACE";
   }
 }

 drops.forEach((d,i)=>{
   d.y+=d.dy;

   if(collideBallRect({x:d.x,y:d.y,r:10},{x:paddle.x,y:550,w:paddle.w,h:paddle.h})){
     applyPower(d.type);
     drops.splice(i,1);
   }

   if(d.y>600) drops.splice(i,1);
 });

 document.getElementById("lives").innerText="❤️ ".repeat(lives);
}

// POWERS
function applyPower(type){

 if(type==="BIG_PADDLE"){
   paddle.w=210;
   setTimeout(()=>paddle.w=140,6000);
 }

 if(type==="MULTI"){
   if(balls.length>5) return;

   let newBalls=[];
   balls.forEach(b=>{
     let speed=Math.sqrt(b.dx*b.dx+b.dy*b.dy)*1.2;

     [-40,0,40].forEach(a=>{
       let rad=a*Math.PI/180;
       newBalls.push({
         x:b.x,y:b.y,
         dx:speed*Math.sin(rad),
         dy:-Math.abs(speed*Math.cos(rad)),
         r:b.r
       });
     });
   });

   balls=newBalls;
 }

 if(type==="BIG_BALL"){
   if(bigBallActive) clearTimeout(bigBallTimer);
   else{
     balls.forEach(b=>b.r=14);
     bigBallActive=true;
   }

   bigBallTimer=setTimeout(()=>{
     balls.forEach(b=>b.r=7);
     bigBallActive=false;
   },6000);
 }

 if(type==="FAST"){
   balls.forEach(b=>{b.dx*=1.5;b.dy*=1.5;});
   setTimeout(()=>balls.forEach(b=>{b.dx/=1.5;b.dy/=1.5;}),6000);
 }

 if(type==="SLOW"){
   balls.forEach(b=>{b.dx*=0.6;b.dy*=0.6;});
   setTimeout(()=>balls.forEach(b=>{b.dx/=0.6;b.dy/=0.6;}),6000);
 }
}

// DRAW
function draw(){
 if(!gameStarted) return;

 ctx.clearRect(0,0,900,600);

 ctx.strokeStyle="cyan";
 ctx.strokeRect(0,0,900,600);

 ctx.font="bold 28px Arial";
 ctx.fillStyle="cyan";
 ctx.textAlign="center";
 ctx.fillText("LEVEL "+level,450,30);

 balls.forEach(b=>{
   ctx.beginPath();
   ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
   ctx.fillStyle="white";
   ctx.fill();
 });

 ctx.fillStyle="cyan";
 ctx.fillRect(paddle.x,550,paddle.w,paddle.h);

 bricks.forEach(b=>{
   ctx.fillStyle=(level===1)?"#00aaff":"#ff5733";
   ctx.fillRect(b.x,b.y,b.w,b.h);

   if(b.special){
     ctx.fillStyle="white";
     ctx.font="12px Arial";
     ctx.fillText(powerMap[b.type],b.x+5,b.y+12);
   }
 });

 drops.forEach(d=>{
   ctx.font="24px Arial";
   ctx.fillText(powerMap[d.type],d.x,d.y);
 });
}

// LOOP
function loop(){
 update();
 draw();
 requestAnimationFrame(loop);
}
loop();
