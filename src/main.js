import './style.css';

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

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
    color: 0x111111,
    metalness: 0.8,
    roughness: 0.2,
});

const lenseGlassMaterial = new THREE.MeshStandardMaterial({
    name: 'LenseGlass',
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transparent: true,
    opacity: 0.25,
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 3
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

// Animate
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()  
