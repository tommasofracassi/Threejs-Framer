import * as THREE from 'three'

export function createGalaxy(scene, gui = null) {
    const galaxyGroup = new THREE.Group()
    scene.add(galaxyGroup)

    const parameters = {
        count: 150000,
        size: 25.0, // Aumentato per lo shader
        radius: 5,
        branches: 5,
        spin: 1,
        randomness: 0.2,
        randomnessPower: 3,
        insideColor: '#071bb0',
        outsideColor: '#a614ea'
    }

    let geometry = null
    let material = null
    let points = null
    let targetRandomness = parameters.randomness

    const generateGalaxy = () => {
        if (points !== null) {
            geometry.dispose()
            material.dispose()
            galaxyGroup.remove(points)
        }

        geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(parameters.count * 3)
        const colors = new Float32Array(parameters.count * 3)
        // Array per memorizzare la direzione casuale di ogni particella
        const randomnessScales = new Float32Array(parameters.count * 3)

        const colorInside = new THREE.Color(parameters.insideColor)
        const colorOutside = new THREE.Color(parameters.outsideColor)

        for (let i = 0; i < parameters.count; i++) {
            const i3 = i * 3
            const radius = Math.random() * parameters.radius
            const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2
            const spinAngle = radius * parameters.spin

            // Posizione "perfetta" sui rami
            positions[i3] = Math.cos(branchAngle + spinAngle) * radius
            positions[i3 + 1] = 0
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius

            // Calcoliamo la "direzione del caos" per questa particella
            randomnessScales[i3] = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius
            randomnessScales[i3 + 1] = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius
            randomnessScales[i3 + 2] = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius

            const mixedColor = colorInside.clone().lerp(colorOutside, radius / parameters.radius)
            colors[i3] = mixedColor.r
            colors[i3 + 1] = mixedColor.g
            colors[i3 + 2] = mixedColor.b
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessScales, 3))

       material = new THREE.ShaderMaterial({
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            transparent: true,
            vertexColors: true,
            uniforms: {
                uTime: { value: 0 },
                uSize: { value: 40.0 }, // Aumentato leggermente
                uRandomness: { value: parameters.randomness }
            },
            vertexShader: `
                uniform float uSize;
                uniform float uRandomness;
                attribute vec3 aRandomness;
                varying vec3 vColor;

                void main() {
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    
                    // Movimento casuale
                    modelPosition.xyz += aRandomness * uRandomness;

                    vec4 viewPosition = viewMatrix * modelPosition;
                    gl_Position = projectionMatrix * viewPosition;

                    // Dimensione del punto con un minimo garantito (per non sparire)
                    gl_PointSize = uSize * (1.0 / - viewPosition.z);
                    vColor = color;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float strength = distance(gl_PointCoord, vec2(0.5));
                    strength = 1.0 - strength;
                    
                    // pow più basso = particelle più "piene" e visibili
                    strength = pow(strength, 3.0); 

                    // Moltiplichiamo il colore per 2.0 o 3.0 per renderlo brillante 
                    // anche se c'è il tone mapping ACESFilmic
                    vec3 finalColor = vColor * strength * 2.5;

                    gl_FragColor = vec4(finalColor, strength);
                }
            `
        })

        points = new THREE.Points(geometry, material)
        galaxyGroup.add(points)
    }

    // Passiamo il renderer per calcolare correttamente la dimensione punti (uSize)
    const renderer = new THREE.WebGLRenderer() // placeholder, verrà passato dall'esterno o preso globalmente

    generateGalaxy()

    const update = (elapsedTime) => {
        // Aggiorniamo il lerp del valore target
        parameters.randomness = THREE.MathUtils.lerp(parameters.randomness, targetRandomness, 0.05)
        
        // AGGIORNIAMO SOLO LA UNIFORM: la GPU farà il resto!
        if(material) {
            material.uniforms.uRandomness.value = parameters.randomness
            material.uniforms.uTime.value = elapsedTime
        }
    }

    const increaseRandomness = () => {
        targetRandomness = Math.min(targetRandomness + 1, 1)
    }

    if (gui) {
        gui.add(parameters, 'randomness', 0, 1, 0.001).onChange(v => targetRandomness = v)
    }

    return {
        instance: galaxyGroup,
        update,
        increaseRandomness
    }
}