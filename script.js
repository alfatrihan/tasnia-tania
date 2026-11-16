const $=s=>[...document.querySelectorAll(s)],G=id=>document.getElementById(id);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),seg=(p,a,b)=>clamp((p-a)/(b-a)),ease=t=>1-Math.pow(1-t,3);
const cv=G('fx'),cx=cv.getContext('2d');let W,H;
function size(){const D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D;cx.setTransform(D,0,0,D,0,0)}
addEventListener('resize',size);size();
const PAL=['#f8bcd3','#ee8fb5','#ffd6e4','#e57aa8','#d9b8f2'];
function petal(L,w){cx.beginPath();cx.moveTo(0,0);cx.bezierCurveTo(w,-L*.3,w*.9,-L*.9,0,-L);cx.bezierCurveTo(-w*.9,-L*.9,-w,-L*.3,0,0);cx.closePath()}
function flower(x,y,R,b,rot,layers,n,a){
 if(R<1||a<=0)return;cx.save();cx.translate(x,y);
 for(let l=0;l<layers;l++){const lb=ease(clamp(b*1.5-l*.28));if(lb<=0)continue;
  const L=R*(1-l*.17)*(.35+.65*lb),w=L*(.42+.2*lb),cnt=n+l*2;
  const g=cx.createLinearGradient(0,0,0,-L);g.addColorStop(0,'#c2467f');g.addColorStop(.55,'#ee8fb5');g.addColorStop(1,'#ffd9e6');
  cx.fillStyle=g;cx.strokeStyle='rgba(255,230,240,.4)';cx.lineWidth=1;cx.globalAlpha=a*(.8+.2*l/layers);
  for(let i=0;i<cnt;i++){cx.save();cx.rotate(rot*(l%2?-1:1)+i*6.2832/cnt+l*.35);petal(L,w);cx.fill();cx.stroke();cx.restore()}}
 cx.globalAlpha=a;const c=cx.createRadialGradient(0,0,0,0,0,R*.16);c.addColorStop(0,'#ffe9a8');c.addColorStop(1,'#e8a86a00');cx.fillStyle=c;cx.beginPath();cx.arc(0,0,R*.16,0,6.3);cx.fill();cx.restore()}
const P=[],B=[];let ptr={x:-999,y:-999},sv=0,lastY=scrollY,lastT=0;
function spawn(x,y,burst,amb){const a=Math.random()*6.283,s=burst?2+Math.random()*5:0;P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(burst?2:0),r:Math.random()*6.3,vr:(Math.random()-.5)*.06,s:5+Math.random()*9,ph:Math.random()*6.3,c:PAL[Math.random()*5|0],a:1,amb})}
for(let i=0;i<34;i++)spawn(Math.random()*W,Math.random()*H,0,1);
addEventListener('pointermove',e=>{ptr.x=e.clientX;ptr.y=e.clientY;const n=Date.now();if(e.pointerType==='mouse'&&n-lastT>70){lastT=n;spawn(e.clientX,e.clientY,0,0)}});
addEventListener('click',e=>{if(e.target.closest('button,.flip,input,a,.env'))return;B.push({x:e.clientX,y:e.clientY,t:0,R:24+Math.random()*28,rot:Math.random()*6});for(let i=0;i<14;i++)spawn(e.clientX,e.clientY,1,0)});
function vine(side,Y){const x0=side?W-(W<700?8:26):(W<700?8:26),d=side?-1:1,X=y=>x0+d*(Math.sin(y*.013+side)*10+6);
 cx.beginPath();for(let y=0;y<=Y;y+=6)y?cx.lineTo(X(y),y):cx.moveTo(X(y),y);cx.strokeStyle='rgba(155,184,154,.55)';cx.lineWidth=1.6;cx.stroke();
 for(let y=120+side*70;y<Y;y+=150){const x=X(y),b=clamp((Y-y)/160);cx.save();cx.translate(x,y);cx.rotate(d*.6);cx.fillStyle='rgba(155,184,154,.5)';cx.beginPath();cx.ellipse(d*10*b,0,12*b,4*b,0,0,6.3);cx.fill();cx.restore();flower(x+d*14,y-6,(W<700?9:13)*b,b,y*.01,2,5,.9)}}
const hero=G('home'),core=G('core'),c1=G('c1'),c2=G('c2'),cue=G('cue'),bar=G('bar');
function draw(t){
 cx.clearRect(0,0,W,H);
 const dy=scrollY-lastY;lastY=scrollY;sv+=(dy-sv)*.15;
 const sp=scrollY/((document.documentElement.scrollHeight-innerHeight)||1);
 const hs=hero.offsetHeight-H,p=clamp(scrollY/hs),fade=1-seg(scrollY,hs,hs+H*.8);
 bar.style.transform='scaleX('+sp+')';
 vine(0,clamp(sp*1.15)*H);vine(1,clamp(sp*1.15)*H);
 const R=Math.min(W,H)*(W<700?.4:.36),fx=W/2+(ptr.x>0?(ptr.x-W/2)*.015:0),fy=H*.44,b=ease(seg(p,0,.62));
 if(fade>0){flower(fx,fy,R*(.55+.45*b),b,scrollY*.0011+t*.00005,4,8,fade);
  const cs=R*.5*seg(p,.45,.72);core.style.cssText='left:'+fx+'px;top:'+fy+'px;width:'+cs+'px;height:'+cs+'px;opacity:'+fade}
 c1.style.opacity=seg(p,.02,.12)*(1-seg(p,.36,.46));c1.style.transform='translateY('+(1-seg(p,.02,.12))*24+'px)';
 const o2=seg(p,.62,.8);c2.style.opacity=o2;c2.style.transform='translateY('+(1-o2)*30+'px)';cue.style.opacity=1-seg(p,0,.04);
 for(let i=P.length-1;i>=0;i--){const q=P[i];
  const dx=q.x-ptr.x,dyy=q.y-ptr.y,d=Math.hypot(dx,dyy);if(d<110&&d>0){q.vx+=dx/d*.7;q.vy+=dyy/d*.4}
  q.vx*=.98;q.vy=q.vy*.98+.035;if(q.vy>1.5&&q.amb)q.vy=1.5;
  q.x+=q.vx+Math.sin(t*.0012+q.ph)*.5;q.y+=q.vy-sv*.35;q.r+=q.vr;
  if(q.amb){if(q.y>H+20){q.y=-20;q.x=Math.random()*W}if(q.y<-40)q.y=H+20}else{q.a-=.005;if(q.a<=0||q.y>H+30){P.splice(i,1);continue}}
  cx.save();cx.translate(q.x,q.y);cx.rotate(q.r);cx.globalAlpha=(q.amb?.55:.9)*q.a;cx.fillStyle=q.c;petal(q.s,q.s*.5);cx.fill();cx.restore()}
 for(let i=B.length-1;i>=0;i--){const o=B[i];o.t+=.016;flower(o.x,o.y,o.R,ease(Math.min(1,o.t/1.3)),o.rot+o.t*.25,2,6,o.t>5?1-(o.t-5):1);if(o.t>6)B.splice(i,1)}
 $('.flip[data-speed]').forEach(f=>{const r=f.getBoundingClientRect(),q=clamp((H-r.top)/(H+r.height));f.style.transform='translateY('+(.5-q)*f.dataset.speed+'px)'});
 const tl=G('tl'),tr=tl.getBoundingClientRect();tl.style.setProperty('--p',clamp((H*.7-tr.top)/tr.height));
 $('.words').forEach(e=>{const q=clamp((H*.85-e.getBoundingClientRect().top)/(H*.45)),ws=e.children,n=ws.length*q;for(let i=0;i<ws.length;i++)ws[i].classList.toggle('lit',i<n)});
 requestAnimationFrame(draw)}
requestAnimationFrame(draw);
$('.words').forEach(e=>e.innerHTML=e.textContent.split(' ').map(w=>'<span class="w">'+w+' </span>').join(''));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.2,rootMargin:'0px 0px -8% 0px'});
$('.rv').forEach(e=>io.observe(e));
const links=$('#nav a');
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>{const on=a.getAttribute('href')==='#'+e.target.id;a.classList.toggle('on',on);if(on)a.scrollIntoView({inline:'center',block:'nearest'})})}),{threshold:.35}).observe(hero);
$('main section').forEach(s=>new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>{const on=a.getAttribute('href')==='#'+s.id;a.classList.toggle('on',on);if(on)a.scrollIntoView({inline:'center',block:'nearest'})})}),{threshold:.35}).observe(s));
$('.flip').forEach(f=>f.onclick=()=>f.classList.toggle('on'));
const Q=['"I am not angry. I am just right, loudly."','"Add something she always says."','"Tears are just drops of something I feel deeply."','"Add another of her sayings here."','"Add her funniest line here."'];
Q.forEach((q,i)=>{const b=document.createElement('button');b.style.transform='rotate('+(i-2)*14+'deg)';b.dataset.r=(i-2)*14;b.innerHTML='<svg viewBox="0 0 40 70"><use href="#pt"/></svg>';
 b.onclick=()=>{b.classList.add('used');G('qbox').innerHTML='<span>'+q+'</span>';for(let k=0;k<8;k++){const r=b.getBoundingClientRect();spawn(r.left+20,r.top+30,1,0)}};G('pet').appendChild(b)});
const rng=G('rng'),ml=G('mlabel'),L=['Calm as a lake','Slightly stubborn','Fully committed to being right','Immovable, like a mountain'];
const meter=()=>{const v=+rng.value;ml.textContent=L[v<25?0:v<55?1:v<85?2:3]};rng.oninput=meter;meter();
let ran=0;new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!ran){ran=1;const t0=performance.now();(function f(t){const k=clamp((t-t0)/2200);rng.value=Math.round(72*ease(k));meter();if(k<1)requestAnimationFrame(f)})(t0)}}),{threshold:.6}).observe(rng);
G('env').onclick=()=>{const e=G('env');e.classList.add('open');G('hint').style.display='none';setTimeout(()=>{G('paper').classList.add('show');for(let i=0;i<30;i++)spawn(Math.random()*W,H*.3,1,0)},900)};
