import './style.css';

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { PMREMGenerator } from 'three';
import Stats from 'stats.js'
import GUI from 'lil-gui'
import { createGalaxy } from './Galaxy.js'



/**
 * Stats
 */
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)




// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Materials
 */
const glossPlasticMaterial = new THREE.MeshStandardMaterial({
    name: 'GlossPlastic',
    color: new THREE.Color(0.02, 0.02, 0.02), // nero realistico
    metalness: 0.0,
    roughness: 0.15, // lucido ma plastico
    envMapIntensity: 1.2,
});


const lenseGlassMaterial = new THREE.MeshPhysicalMaterial({
    name: 'LenseGlass',
    color: new THREE.Color(1, 1, 1),
    metalness: 0,
    roughness: 0.05,

    transmission: 1.0,   // vetro vero
    thickness: 0.2,      // spessore lente
    ior: 1.5,            // indice rifrazione vetro
    transparent: true,

    envMapIntensity: 1.5,
    clearcoat: 0.1,
    clearcoatRoughness: 0.05,
});



/**
 * Models
 */
let model;

gltfLoader.load('/models/MetaDisplay4.glb', (gltf) => {

    console.log('Model loaded', gltf.scene)
    model = gltf.scene;

    gltf.scene.traverse((child) => {
        if (!child.isMesh) return;

        console.log(child.name)

        if (child.name === 'Cube') {
            child.material = glossPlasticMaterial
        }

        if (child.name === 'Cube_1' || child.name === 'Cameras') {
            child.material = lenseGlassMaterial
        }
    })

    model.position.y = -3.2;
    model.position.x = -1;
    scene.add(gltf.scene)
})


/**
 * Galaxy
 */
// GUI
const gui = new GUI()

// GALASSIA
const galaxy = createGalaxy(scene, gui)
galaxy.position.set(0, 0.5, 1.5)
galaxy.rotation.x = Math.PI / 2;



// Axes helper
scene.add(new THREE.AxesHelper(5))


/**
 * Lights
 **/
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)



// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 5, -10);   // più indietro
camera.lookAt(0, 0, 0);
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
scene.background = null;
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;


/**
 * HDRI
 **/
// Crea PMREMGenerator
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

async function loadHDR() {
    const loader = new HDRLoader();
    try {
        const texture = await loader.loadAsync('/textures/studio.hdr');

        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
        // scene.background = envMap;

        texture.dispose();
        pmremGenerator.dispose();
    } catch (err) {
        console.error('Errore caricamento HDR:', err);
    }
}

loadHDR();



// Animate
const clock = new THREE.Clock()

const tick = () => {

    stats.begin()

    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    stats.end()
}

tick()  
