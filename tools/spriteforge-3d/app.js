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
let recipe = {type:"magic",height:5,width:2.8,roof:1.5,material:"stone",detail:3,showGround:true,showShadows:true};
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
  // Stylized fantasy cat-wizard tower. All parts are real editable Three.js meshes.
  const group=new THREE.Group();
  const stone=mat(0x9a9188), stoneLight=mat(0xc9b9a7), stoneDark=mat(0x5c514b);
  const blue=mat(0x153a9b,0.62), blueLight=mat(0x285bd5,0.48), gold=mat(0xf4b832,0.34);
  const wood=mat(0x704326), woodLight=mat(0xa66a32), glass= new THREE.MeshStandardMaterial({color:0xffbd45,emissive:0xff8a12,emissiveIntensity:1.25,roughness:0.28});
  const fur=mat(0xd97828,0.92), cream=mat(0xffe7c4,0.95), pink=mat(0xe98e83,0.8);
  const dark=mat(0x30243a), green=mat(0x7bc52e,0.42), eye= new THREE.MeshStandardMaterial({color:0x8de52c,roughness:0.18,metalness:0.05});
  const magic= new THREE.MeshStandardMaterial({color:0x19caff,emissive:0x007dff,emissiveIntensity:2.1,roughness:0.18,metalness:0.18});
  const add=(g,m,x,y,z,sx=1,sy=1,sz=1,rz=0)=>{
    const o=addMesh(group,g,m,x,y,z);o.scale.set(sx,sy,sz);o.rotation.z=rz;return o;
  };
  const ball=(m,x,y,z,sx,sy,sz)=>add(new THREE.SphereGeometry(1,24,18),m,x,y,z,sx,sy,sz);
  const box=(m,x,y,z,sx,sy,sz,bevel=0)=>{
    const g=new THREE.BoxGeometry(sx,sy,sz);
    const o=add(g,m,x,y,z);
    if(bevel){o.geometry.computeVertexNormals();}
    return o;
  };
  const h=5.15, baseY=0;
  // Floating garden plinth and chunky masonry foundation.
  add(new THREE.CylinderGeometry(2.25,2.42,0.34,12),stoneDark,0,0.17,0);
  add(new THREE.CylinderGeometry(2.12,2.22,0.22,12),green,0,0.39,0);
  for(let i=0;i<12;i++){
    const a=i*Math.PI*2/12;
    const b=add(new THREE.BoxGeometry(0.72,0.48,0.55),i%3===0?stoneLight:stoneDark,Math.cos(a)*2.02,0.24,Math.sin(a)*2.02);
    b.rotation.y=-a;
  }
  // Tower shaft with individually placed stone blocks.
  add(new THREE.CylinderGeometry(1.58,1.88,3.05,12),stone,0,1.98,0);
  add(new THREE.CylinderGeometry(1.68,1.78,0.2,12),stoneDark,0,0.62,0);
  add(new THREE.CylinderGeometry(1.72,1.72,0.18,12),stoneLight,0,3.43,0);
  for(let row=0;row<4;row++){
    const y=0.95+row*0.66;
    for(let i=0;i<12;i++){
      const a=(i+(row%2)*0.5)*Math.PI*2/12;
      const r=1.69;
      const b=box(i%4===0?stoneLight:stoneDark,Math.sin(a)*r,y,Math.cos(a)*r,0.78,0.48,0.22);
      b.rotation.y=a;
    }
  }
  // Arched doorway, wooden door and paw medallion.
  box(wood,0,1.02,1.72,0.84,1.42,0.12);
  const arch=add(new THREE.TorusGeometry(0.43,0.12,10,24,Math.PI),stoneLight,0,1.73,1.76);
  arch.rotation.z=Math.PI;
  box(woodLight,0,0.37,1.8,1.05,0.16,0.34);
  ball(gold,0,1.0,1.81,0.22,0.22,0.08);
  // Warm windows on the front and sides.
  for(const a of [0,Math.PI/2,-Math.PI/2]){
    const x=Math.sin(a)*1.59,z=Math.cos(a)*1.59;
    box(dark,x,2.35,z,0.43,0.72,0.12);
    box(glass,x,2.35,z+0.07,0.29,0.57,0.04);
    box(gold,x,2.35,z+0.1,0.045,0.61,0.035);
    box(gold,x,2.35,z+0.1,0.32,0.045,0.035);
  }
  // Upper turret ring and crenellations.
  add(new THREE.CylinderGeometry(1.55,1.55,0.2,12),stoneDark,0,3.62,0);
  add(new THREE.CylinderGeometry(1.48,1.48,0.18,12),stoneLight,0,3.76,0);
  for(let i=0;i<10;i++){
    const a=i*Math.PI*2/10;
    const b=box(stoneLight,Math.cos(a)*1.38,4.03,Math.sin(a)*1.38,0.48,0.56,0.42);
    b.rotation.y=-a;
  }
  // Front blue pennant with gold paw motif.
  box(blue,0,3.02,1.77,0.62,1.05,0.08);
  box(gold,0,3.55,1.83,0.7,0.08,0.08);
  ball(gold,0,3.05,1.84,0.16,0.18,0.045);
  for(const [x,y] of [[-.16,3.25],[.16,3.25],[-.11,2.88],[.11,2.88]])ball(gold,x,y,1.85,0.07,0.08,0.035);
  // Cat body, robe, tail and paws inside the turret.
  ball(fur,0.0,4.56,-0.05,0.75,0.82,0.62);
  ball(blue,0.0,4.52,0.32,0.68,0.58,0.48);
  const tail=add(new THREE.TorusGeometry(0.48,0.19,12,24,Math.PI*1.35),fur,-0.66,4.56,-0.22);
  tail.rotation.set(Math.PI/2,0,0.35);
  ball(cream,-0.25,4.12,0.55,0.23,0.17,0.23);
  ball(cream,0.38,4.12,0.56,0.23,0.17,0.23);
  // Head and cheeks.
  ball(fur,0,5.36,0.32,0.79,0.72,0.66);
  ball(cream,0,5.12,0.82,0.53,0.34,0.24);
  ball(cream,-0.35,5.18,0.79,0.3,0.25,0.22);
  ball(cream,0.35,5.18,0.79,0.3,0.25,0.22);
  // Ears, inner ear and green eyes.
  const earL=add(new THREE.ConeGeometry(0.31,0.62,3),fur,-0.52,5.88,0.3,1,1,1,-0.2);
  const earR=add(new THREE.ConeGeometry(0.31,0.62,3),fur,0.52,5.88,0.3,1,1,1,0.2);
  ball(pink,-0.52,5.82,0.48,0.14,0.23,0.07);
  ball(pink,0.52,5.82,0.48,0.14,0.23,0.07);
  ball(cream,-0.29,5.45,0.88,0.2,0.25,0.12);
  ball(cream,0.29,5.45,0.88,0.2,0.25,0.12);
  ball(eye,-0.29,5.48,0.985,0.14,0.18,0.065);
  ball(eye,0.29,5.48,0.985,0.14,0.18,0.065);
  ball(dark,-0.27,5.48,1.04,0.055,0.12,0.035);
  ball(dark,0.31,5.48,1.04,0.055,0.12,0.035);
  ball(pink,0,5.22,1.045,0.09,0.065,0.045);
  // Wizard hat: broad brim, tapered crown, curled tip, gold stars and moon.
  const brim=add(new THREE.CylinderGeometry(1.03,1.03,0.13,48),blue,-0.02,6.02,0.25,1,1,0.72);
  brim.rotation.x=0.04;
  const crown=add(new THREE.ConeGeometry(0.72,1.22,32),blue,0.0,6.62,0.22,1,1,0.82,-0.12);
  const hatBand=add(new THREE.TorusGeometry(0.68,0.075,10,36),gold,0,6.17,0.22,1,1,0.82);
  hatBand.rotation.x=Math.PI/2;
  ball(gold,-0.48,6.34,0.75,0.11,0.11,0.07);
  ball(gold,0.18,6.65,0.79,0.13,0.13,0.07);
  // crescent moon emblem built from two overlapping spheres.
  ball(gold,0.46,6.7,0.78,0.22,0.25,0.07);
  ball(blue,0.55,6.77,0.85,0.18,0.22,0.08);
  // Staff held in the cat's right paw; the orb is attached to the staff, not a projectile.
  const staff=add(new THREE.CylinderGeometry(0.055,0.075,1.75,12),wood,0.72,5.03,0.72);
  staff.rotation.z=-0.28;
  ball(cream,0.63,4.72,0.88,0.2,0.16,0.18);
  const claw=add(new THREE.TorusGeometry(0.22,0.055,8,20),woodLight,0.74,5.91,0.75);
  claw.rotation.x=Math.PI/2;
  ball(magic,0.78,6.18,0.75,0.34,0.34,0.34);
  const halo=add(new THREE.TorusGeometry(0.46,0.045,10,40),magic,0.78,6.18,0.75);
  halo.rotation.x=0.7;halo.rotation.y=0.4;
  // Small crystal clusters, grass, flowers and lanterns around the plinth.
  for(const [x,z,s] of [[-1.62,0.65,0.48],[1.55,0.7,0.55],[1.35,-1.05,0.34]]){
    const c=add(new THREE.OctahedronGeometry(s,0),magic,x,0.62+s*0.55,z,0.7,1.4,0.7);
    c.rotation.y=0.4;
  }
  for(const [x,z] of [[-1.55,-0.55],[1.58,-0.48],[-0.8,1.65],[0.9,1.58]]){
    ball(green,x,0.62,z,0.24,0.1,0.2);
    ball(gold,x+0.08,0.68,z,0.08,0.08,0.08);
  }
  for(const x of [-1.05,1.05]){
    box(dark,x,1.85,1.66,0.18,0.32,0.16);
    ball(glass,x,1.86,1.78,0.13,0.18,0.09);
    add(new THREE.ConeGeometry(0.18,0.12,12),dark,x,2.1,1.78);
  }
  group.position.y=0.12;
  return group;
}
function rebuild(){
  while(modelGroup.children.length){
    const child=modelGroup.children.pop();
    child.traverse(o=>{if(o.geometry)o.geometry.dispose(); if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
  }
  modelGroup.add(makeTower(recipe));
  const size=8.7;
  camera.left=-size/2; camera.right=size/2; camera.top=size/2; camera.bottom=-size/2; camera.updateProjectionMatrix();
  updateCamera();
  document.getElementById("objectTitle").textContent="Кот-маг · Башня волшебника";
  render();
}
function updateCamera(){
  const targetY=3.25;
  camera.position.set(cameraRadius*Math.sin(phi)*Math.cos(theta),targetY+cameraRadius*Math.cos(phi),cameraRadius*Math.sin(phi)*Math.sin(theta));
  camera.lookAt(0,targetY,0);
}
function render(){renderer.render(scene,camera);}
function resize(){
  const w=wrap.clientWidth,h=wrap.clientHeight;
  renderer.setSize(w,h,false);
  const aspect=w/h, size=8.7;
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
  const aspect=1,size=8.7;
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
setStatus("3D-модель кота-мага создана · PNG и GLB готовы к экспорту");