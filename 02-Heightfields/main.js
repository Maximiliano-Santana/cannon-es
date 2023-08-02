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
camera.position.set(7, 8, 13);

//Renderer
const canvas = document.querySelector('.experience');
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Axes helper
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

//Controls 
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true;
orbitControls.target = new THREE.Vector3(0, 2, 0);

//Materials 
const whiteMaterial = new THREE.MeshStandardMaterial({wireframe:true});

//Lights
const rectAreaLight = new THREE.RectAreaLight('#ffffff', 0.5, 5, 5);
rectAreaLight.position.set(0, 5, 0)
rectAreaLight.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(rectAreaLight);

scene.add(new THREE.AmbientLight('#ffffff', 0.5));

//cube 
const sphereMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1), 
  whiteMaterial
)

// ------------------------------ Creating and understanding heightfields------------------------------------------

//Create the object that cointains the information we need 
const terrainProperties = {
  size: 10,
  subdivisions: 1
}

//First create the mesh of the plane thats going to pass the heights to the heightfield shape
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(terrainProperties.size, terrainProperties.size, terrainProperties.subdivisions, terrainProperties.subdivisions),
  whiteMaterial
)
//Now put the plane on the scene
floorMesh.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI/2);
sphereMesh.position.set(0, 9, 0)


//------------------------------------------Physics----------------------------------------------
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
  allowSleep: true,
});
world.broadphase = new CANNON.SAPBroadphase(world);

const sphereShape = new CANNON.Sphere(1);
const cubeBody = new CANNON.Body({
  mass: 5,
  shape: sphereShape,
})
cubeBody.position.copy(sphereMesh.position);
world.addBody(cubeBody);

scene.add(sphereMesh, floorMesh);

//Hago que el plano tenga alturas aleatorias
for (let i = 0; i < floorMesh.geometry.attributes.position.array.length/3; i++){
  //This way we can get the x y ans z values of each vertex
  const x = i*3 + 0
  const y = i*3 + 2
  const z = i*3 + 1

  floorMesh.geometry.attributes.position.array[y] = 0;
  // floorMesh.geometry.attributes.position.array[y] = Math.random();
}

//Create the matrix that will contain the heights information
let heightsMatrix = []


//Ahora tengo que insertar la informacion dentro de la matriz, para hacer eso primero obtengo los tamaños de la matriz
const matrixSizeX = terrainProperties.subdivisions+1 //Los tamaños son especificados por el numero de subdivisiones que tiene el plano y se suma uno para representar cada vertice
const matrixSizeZ = terrainProperties.subdivisions+1
//Con los tamaños de la matriz creare un loop para crear las respectivas columnas y filas
for (let i = 0; i < matrixSizeZ; i++){
  //Para cada fila ahora pusheare un nuevo arreglo
  heightsMatrix.push([]);

  //Ahora recorro cada fila e inserto un valor segun la columna correspondiente y el tamaño en X del arreglo
  for (let j = 0; j < matrixSizeX; j++){
    //Si nos damos cuenta las veces que itera i corresponde a la cantidad de vertices, de esta manera podemos hacer lo siguiente
    //Ahora asigno los valores correspondientes a 'x' 'y' y 'z' que coinsidan con los vertices segun el indice de i
    const x = i*3 + 0
    const y = i*3 + 2
    const z = i*3 + 1

    //Listo ahora pongo el valor de 'y' correspondiente a la posicion de la matriz
    heightsMatrix[i].push(floorMesh.geometry.attributes.position.array[y]);
  }
}

//Ahora que tengo la matriz correspondiente a las alturas del plano puedo crear el cuerpo del terreno

//Primero necesito crear la forma del campo con alturas, primero paso la matriz que obtuve anteriormente y como segundo paramentro paso las opciones, la mas importante para que los vertices coincidan con las alturas es el tamaño del espacio que hay entre cada vertice, para esto es tan sencillo como dividir el tamaño del terreno entre la cantidad de vertices 
const heightfieldShape = new CANNON.Heightfield(heightsMatrix, {
  elementSize: 1,
});

console.log(terrainProperties.size/matrixSizeX)

//Como el campo de alturas solo conoce las alturas en su respectiva 'x' y 'z', pero no conoce en que posicion del espacio esta cada columna o fila, este es creado con su vertice 0 en la posicion [0, 0] y este se extiende hacia +x y -z por lo que el origen no esta al centro, para alinearlo al origen en la posicion al crear el cuerpo simplemente lo desplazamos a la mitad de su tamaño total en los ejes x y z
const heightfieldBody = new CANNON.Body({mass: 0})
heightfieldBody.addShape(heightfieldShape);
heightfieldBody.position.set(0, -1, 0)
world.addBody(heightfieldBody)



console.log(heightfieldBody.position)
console.log(floorMesh.position)




const clock = new THREE.Clock();
let lastTime = 0;

const tick = ()=>{
  //Delta time 
  const time = clock.getElapsedTime();
  const deltaTime = time - lastTime;
  lastTime = time;


  
  //Update physics world
  world.step(1/60, deltaTime, 3);
  
  sphereMesh.position.copy(cubeBody.position);
  sphereMesh.quaternion.copy(cubeBody.quaternion);
  
  //Update controls
  orbitControls.update()

  //Render
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
}

tick();