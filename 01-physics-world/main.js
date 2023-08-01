import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import * as CANNON from 'cannon-es'

import GUI from 'lil-gui';

//Size 
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

//Loaders 

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (progress) =>{
  console.log(progress);
}
loadingManager.onLoad = ()=>{
  console.log('assets loaded');
}

const textureLoader = new THREE.TextureLoader(loadingManager)

//Resize 

window.addEventListener('resize', ()=>{
  //Update Sizes 
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  //Update camera 
  camera.aspect = sizes.width/sizes.height;
  camera.updateProjectionMatrix();

  //Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


//Scene
const scene = new THREE.Scene();

//Camera
const camera = new THREE.PerspectiveCamera(50, sizes.width/sizes.height, 0.01, 100);
camera.position.set(0, 3, 5);

//Renderer
const canvas = document.querySelector('.experience');
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Controls 
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true;
orbitControls.target = new THREE.Vector3(0, 2, 0);

//Materials 
const whiteMaterial = new THREE.MeshStandardMaterial({});

//Lights
const rectAreaLight = new THREE.RectAreaLight('#ffffff', 0.5, 5, 5);
rectAreaLight.position.set(0, 5, 0)
rectAreaLight.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(rectAreaLight);

scene.add(new THREE.AmbientLight('#ffffff', 0.5));

//cube 
const cubeMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1), 
  whiteMaterial
)

const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  whiteMaterial
)

floorMesh.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI/2));
cubeMesh.position.y = 2

scene.add(cubeMesh, floorMesh);

//Tick function
const clock = new THREE.Clock();


const tick = ()=>{
  //Update controls
  orbitControls.update()

  //Render
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
}

tick();