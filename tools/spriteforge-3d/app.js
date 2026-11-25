import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const canvas = document.getElementById("viewport");
const wrap = document.getElementById("viewportWrap");
const statusEl = document.getElementById("status");
const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.OrthographicCamera(-5,5,5,-5,0.1,100);
let theta = Math.PI / 4;
let phi = Math.atan(Math.sqrt(2));
let cameraRadius = 13;
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xd9e8ff,0x51402f,2.0));
const keyLight = new THREE.DirectionalLight(0xffe6c7,3.1);
keyLight.position.set(-7,11,8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024,1024);
keyLight.shadow.camera.left = -10; keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10; keyLight.shadow.camera.bottom = -10;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x8bbcff,1.0);
fillLight.position.set(7,5,-6); scene.add(fillLight);

let modelGroup = new THREE.Group();
scene.add(modelGroup);
let recipe = {type:"archer",height:5,width:2.8,roof:1.5,material:"stone",detail:2,showGround:true,showShadows:true};
const palettes = {
  stone:{main:0x8b9298,light:0xb2b5b3,dark:0x535d66,roof:0x59636c,trim:0xc1b9a5},
  sand:{main:0xb99b70,light:0xd4bd91,dark:0x786044,roof:0x786044,trim:0xe0c99d},
  dark:{main:0x555d68,light:0x7d8791,dark:0x303944,roof:0x343d49,trim:0x9aa5ad},
  fortress:{main:0xc2c0b4,light:0xe0ddd0,dark:0x85877f,roof:0x68717a,trim:0xf0e9d5}
};
function mat(color,roughness=0.88){return new THREE.MeshStandardMaterial({color,roughness,metalness:0.02});}
function addMesh(group,geometry,material,x,y,z,cast=true,receive=true){
  const mesh=new THREE.Mesh(geometry,material); mesh.position.set(x,y,z);
  mesh.castShadow=cast; mesh.receiveShadow=receive; group.add(mesh); return mesh;
}
function makeTower(p){
  const group=new THREE.Group();
  const pal=palettes[p.material];
  const stone=mat(pal.main), stoneLight=mat(pal.light), stoneDark=mat(pal.dark), roofMat=mat(pal.roof), trim=mat(pal.trim);
  const w=p.width, h=p.height, baseH=0.34, bodyH=h-p.roof-baseH;
  const baseR=w*0.57, bodyR=w*0.43, topR=w*0.36;
  addMesh(group,new THREE.CylinderGeometry(baseR,baseR*1.08,baseH,8),stoneDark,0,baseH/2,0);
  addMesh(group,new THREE.CylinderGeometry(bodyR,baseR*0.93,bodyH,8),stone,0,baseH+bodyH/2,0);
  addMesh(group,new THREE.CylinderGeometry(topR*1.18,topR*1.18,0.22,8),trim,0,baseH+bodyH+0.08,0);
  const battlementY=baseH+bodyH+0.28;
  const count=p.detail===1?6:(p.detail===2?8:10);
  for(let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2;
    const block=addMesh(group,new THREE.BoxGeometry(0.34,0.48,0.34),stoneLight,Math.cos(a)*(topR*1.03),battlementY,Math.sin(a)*(topR*1.03));
    block.rotation.y=-a;
  }
  const roofY=baseH+bodyH+0.37;
  if(p.type==="magic"){
    addMesh(group,new THREE.CylinderGeometry(topR*0.84,topR*1.25,p.roof*0.45,8),roofMat,0,roofY+p.roof*0.2,0);
    const crystal=addMesh(group,new THREE.OctahedronGeometry(w*0.25,0),mat(0x65d8ed,0.25),0,roofY+p.roof*0.78,0);
    crystal.rotation.y=Math.PI/4;
  }else{
    addMesh(group,new THREE.ConeGeometry(topR*1.5,p.roof,8),roofMat,0,roofY+p.roof/2,0);
    if(p.type==="cannon"){
      const barrel=addMesh(group,new THREE.CylinderGeometry(0.17,0.23,1.15,8),mat(0x39434d,0.48),0,roofY+0.18,topR*0.75);
      barrel.rotation.x=Math.PI/2.7;
      const muzzle=addMesh(group,new THREE.CylinderGeometry(0.23,0.23,0.16,8),trim,0,roofY+0.43,topR*1.08);
      muzzle.rotation.x=Math.PI/2.7;
    }
  }
  const doorH=Math.min(1.35,h*0.28), doorW=w*0.24;
  const door=addMesh(group,new THREE.BoxGeometry(doorW,doorH,0.08),mat(0x33271f),0,doorH/2+0.02,bodyR*0.98);
  door.position.z=bodyR*0.98;
  addMesh(group,new THREE.BoxGeometry(doorW*1.22,0.12,0.13),trim,0,doorH+0.05,bodyR*1.02);
  const windowCount=p.detail===1?1:(p.detail===2?2:3);
  for(let row=0;row<windowCount;row++){
    const y=baseH+bodyH*(0.34+row*0.23);
    for(let side=0;side<4;side++){
      const a=side*Math.PI/2+Math.PI/4;
      const r=bodyR*0.94;
      const win=addMesh(group,new THREE.BoxGeometry(0.22,0.43,0.07),mat(0x273341),Math.sin(a)*r,y,Math.cos(a)*r,false);
      win.rotation.y=a;
      if(p.detail>=2){
        const lintel=addMesh(group,new THREE.BoxGeometry(0.3,0.07,0.09),stoneLight,Math.sin(a)*r,y+0.24,Math.cos(a)*r,false);
        lintel.rotation.y=a;
      }
    }
  }
  if(p.detail>=2){
    for(let level=0;level<2;level++){
      const yy=baseH+bodyH*(0.18+level*0.62);
      addMesh(group,new THREE.CylinderGeometry(bodyR*1.025,bodyR*1.025,0.11,8),trim,0,yy,0);
    }
  }
  if(p.showGround){
    addMesh(group,new THREE.CylinderGeometry(w*0.78,w*0.84,0.18,8),stoneDark,0,-0.09,0);
  }
  if(p.showShadows){
    const shadowMat=new THREE.MeshBasicMaterial({color:0x050a12,transparent:true,opacity:0.22,depthWrite:false});
    const shadow=addMesh(group,new THREE.CircleGeometry(w*0.88,32),shadowMat,0,-0.175,0,false,false);
    shadow.rotation.x=-Math.PI/2;
  }
  group.position.y=0.18;
  return group;
}
function rebuild(){
  while(modelGroup.children.length){
    const child=modelGroup.children.pop();
    child.traverse(o=>{if(o.geometry)o.geometry.dispose(); if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
  }
  modelGroup.add(makeTower(recipe));
  const size=Math.max(recipe.height,recipe.width*2.7)+2.4;
  camera.left=-size/2; camera.right=size/2; camera.top=size/2; camera.bottom=-size/2; camera.updateProjectionMatrix();
  updateCamera();
  document.getElementById("objectTitle").textContent=recipe.type==="archer"?"Лучная башня":recipe.type==="cannon"?"Пушечная башня":"Магическая башня";
  render();
}
function updateCamera(){
  const targetY=recipe.height*0.43;
  camera.position.set(cameraRadius*Math.sin(phi)*Math.cos(theta),targetY+cameraRadius*Math.cos(phi),cameraRadius*Math.sin(phi)*Math.sin(theta));
  camera.lookAt(0,targetY,0);
}
function render(){renderer.render(scene,camera);}
function resize(){
  const w=wrap.clientWidth,h=wrap.clientHeight;
  renderer.setSize(w,h,false);
  const aspect=w/h, size=Math.max(recipe.height,recipe.width*2.7)+2.4;
  camera.left=-size*aspect/2; camera.right=size*aspect/2; camera.top=size/2; camera.bottom=-size/2;
  camera.updateProjectionMatrix(); render();
}
function readControls(){
  recipe.type=document.getElementById("towerType").value;
  recipe.height=Number(document.getElementById("height").value);
  recipe.width=Number(document.getElementById("width").value);
  recipe.roof=Math.min(Number(document.getElementById("roof").value),recipe.height-1.34);
  document.getElementById("roof").value=String(recipe.roof);
  recipe.material=document.getElementById("material").value;
  recipe.detail=Number(document.getElementById("detail").value);
  recipe.showGround=document.getElementById("showGround").checked;
  recipe.showShadows=document.getElementById("showShadows").checked;
  document.getElementById("heightValue").textContent=recipe.height.toFixed(2);
  document.getElementById("widthValue").textContent=recipe.width.toFixed(1);
  document.getElementById("roofValue").textContent=recipe.roof.toFixed(1);
  document.getElementById("detailValue").textContent=["","Низкая","Средняя","Высокая"][recipe.detail];
  rebuild();
}
["towerType","height","width","roof","material","detail","showGround","showShadows"].forEach(id=>{
  document.getElementById(id).addEventListener("input",readControls);
  document.getElementById(id).addEventListener("change",readControls);
});
document.getElementById("resetCamera").addEventListener("click",()=>{theta=Math.PI/4;phi=Math.atan(Math.sqrt(2));cameraRadius=13;updateCamera();render();});
document.getElementById("randomize").addEventListener("click",()=>{
  const types=["archer","cannon","magic"],materials=Object.keys(palettes);
  recipe.type=types[Math.floor(Math.random()*types.length)];
  recipe.material=materials[Math.floor(Math.random()*materials.length)];
  recipe.height=Number((3.5+Math.random()*4).toFixed(2));
  recipe.width=Number((2.2+Math.random()*1.8).toFixed(1));
  recipe.roof=Number((0.9+Math.random()*1.7).toFixed(1));
  recipe.detail=1+Math.floor(Math.random()*3);
  ["towerType","material","height","width","roof","detail"].forEach(id=>document.getElementById(id).value=recipe[id]);
  readControls();
});
function setStatus(s){statusEl.textContent=s;}
document.getElementById("exportPng").addEventListener("click",()=>{
  setStatus("Подготовка PNG…");
  const oldW=wrap.clientWidth,oldH=wrap.clientHeight;
  const oldPixel=renderer.getPixelRatio();
  renderer.setPixelRatio(1); renderer.setSize(512,512,false);
  const aspect=1,size=Math.max(recipe.height,recipe.width*2.7)+2.4;
  camera.left=-size*aspect/2;camera.right=size*aspect/2;camera.top=size/2;camera.bottom=-size/2;camera.updateProjectionMatrix();
  render();
  renderer.domElement.toBlob(blob=>{
    if(!blob){setStatus("Не удалось создать PNG");resize();renderer.setPixelRatio(oldPixel);return;}
    downloadBlob(blob,"spriteforge-tower-512.png");
    setStatus("PNG экспортирован · 512×512 · RGBA");
    renderer.setPixelRatio(oldPixel);resize();
  },"image/png");
});
document.getElementById("exportGlb").addEventListener("click",()=>{
  setStatus("Экспорт 3D-модели…");
  const exporter=new GLTFExporter();
  exporter.parse(modelGroup,result=>{
    const blob=new Blob([result],{type:"model/gltf-binary"});
    downloadBlob(blob,"spriteforge-tower.glb");
    setStatus("GLB экспортирован");
  },error=>{console.error(error);setStatus("Ошибка экспорта GLB");},{binary:true,onlyVisible:true});
});
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("SpriteForge3D",1);
    req.onupgradeneeded=()=>req.result.createObjectStore("recipes",{keyPath:"id",autoIncrement:true});
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
document.getElementById("savePreset").addEventListener("click",async()=>{
  try{
    const db=await openDb(),tx=db.transaction("recipes","readwrite");
    tx.objectStore("recipes").add({name:document.getElementById("objectTitle").textContent,recipe:{...recipe},createdAt:new Date().toISOString()});
    tx.oncomplete=()=>{setStatus("Рецепт сохранён в библиотеку устройства");db.close();};
    tx.onerror=()=>{setStatus("Не удалось сохранить рецепт");db.close();};
  }catch(e){console.error(e);setStatus("Хранилище недоступно");}
});
const pointers=new Map();let lastX=0,lastY=0,lastPinch=0;
wrap.addEventListener("pointerdown",e=>{wrap.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastX=e.clientX;lastY=e.clientY;if(pointers.size===2){const a=Array.from(pointers.values());lastPinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
wrap.addEventListener("pointermove",e=>{
  if(!pointers.has(e.pointerId))return;
  const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){theta-=(e.clientX-lastX)*0.009;phi=Math.max(0.18,Math.min(1.35,phi+(e.clientY-lastY)*0.008));}
  else if(pointers.size===2){const a=Array.from(pointers.values()),dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(lastPinch)cameraRadius=Math.max(7,Math.min(25,cameraRadius+(lastPinch-dist)*0.035));lastPinch=dist;}
  lastX=e.clientX;lastY=e.clientY;updateCamera();render();
});
["pointerup","pointercancel","lostpointercapture"].forEach(ev=>wrap.addEventListener(ev,e=>{pointers.delete(e.pointerId);if(pointers.size<2)lastPinch=0;}));
wrap.addEventListener("wheel",e=>{cameraRadius=Math.max(7,Math.min(25,cameraRadius+e.deltaY*0.012));updateCamera();render();},{passive:true});
window.addEventListener("resize",resize);
window.addEventListener("online",()=>document.getElementById("networkState").textContent="ONLINE");
window.addEventListener("offline",()=>document.getElementById("networkState").textContent="OFFLINE");
rebuild();
setStatus("3D-модель создана · можно менять параметры");