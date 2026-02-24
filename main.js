// main.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 1. Configuración Inicial (Escena, Cámara, Renderizador, Luces) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122); // Un color de fondo oscuro y elegante

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Habilitamos sombras para un toque más realista
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras más suaves
document.body.appendChild(renderer.domElement);

// Controles para orbitar la cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- Iluminación (esencial para ver los materiales PBR) ---
// Luz ambiental suave
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);

// Luz principal direccional (que proyecta sombra)
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 5, 3);
dirLight.castShadow = true;
dirLight.receiveShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
const d = 10;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 15;
scene.add(dirLight);

// Una segunda luz de relleno para evitar sombras muy duras
const fillLight = new THREE.PointLight(0x4466ff, 0.5);
fillLight.position.set(-3, 2, 4);
scene.add(fillLight);

// Un plano para el suelo y apreciar mejor las sombras
const planeGeometry = new THREE.CircleGeometry(8, 32);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x336699, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.1 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// Una pequeña cuadrícula para referencia visual
const gridHelper = new THREE.GridHelper(10, 20, 0xaaaaaa, 0x444444);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// --- 2. Cargar Múltiples Modelos con GLTFLoader ---
const loader = new GLTFLoader();
const modelsToLoad = [
    { path: 'models/Duck.glb', position: { x: -2.5, y: 0, z: 1 }, scale: 2 }, // Ejemplo: Pato
    { path: 'models/MaterialSphere.glb', position: { x: 0, y: 0, z: 1 }, scale: 1 }, // Ejemplo: Esfera de materiales
    { path: 'models/Chair.glb', position: { x: 2.5, y: 0, z: 1.5 }, scale: 0.5 } // Ejemplo: Silla
];

let loadedCount = 0;
const infoDiv = document.getElementById('info');

modelsToLoad.forEach(modelInfo => {
    loader.load(
        modelInfo.path,
        (gltf) => {
            const model = gltf.scene;

            // --- 3. Aplicar Transformaciones (Posición, Rotación, Escala) ---
            model.position.set(modelInfo.position.x, modelInfo.position.y, modelInfo.position.z);
            model.scale.set(modelInfo.scale, modelInfo.scale, modelInfo.scale);
            // Rotación aleatoria para que no todos miren al frente
            model.rotation.y = Math.random() * Math.PI * 2;

            // --- 4. Usar traverse() para Modificar Materiales Individualmente ---
            model.traverse((child) => {
                if (child.isMesh) {
                    // Habilitamos sombras en cada malla
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // ¡Experimentamos con los materiales!
                    if (Array.isArray(child.material)) {
                        // Si tiene múltiples materiales, iteramos sobre ellos
                        child.material.forEach(mat => modifyMaterial(mat, modelInfo.path));
                    } else {
                        // Si tiene un solo material
                        modifyMaterial(child.material, modelInfo.path);
                    }
                }
            });

            scene.add(model);
            loadedCount++;
            infoDiv.textContent = `Modelos cargados: ${loadedCount}/${modelsToLoad.length}`;

            console.log(`Modelo cargado y modificado: ${modelInfo.path}`);
        },
        (xhr) => {
            // Progreso (opcional)
            console.log(`${modelInfo.path} cargando: ${(xhr.loaded / xhr.total * 100)}%`);
        },
        (error) => {
            console.error(`Error cargando ${modelInfo.path}:`, error);
            infoDiv.textContent = `Error cargando uno de los modelos. Revisa la consola.`;
        }
    );
});

// Función auxiliar para modificar propiedades de material y ver resultados
function modifyMaterial(material, modelPath) {
    // Para ver el efecto, haremos cambios condicionales según el modelo
    if (modelPath.includes('Duck')) {
        // Al pato lo haremos un poco más metálico y de color amarillento
        if (material.map) {
            // Si ya tiene una textura, no podemos cambiarle el color fácilmente, pero sí la metalness/roughness
            material.metalness = 0.3;
            material.roughness = 0.4;
            material.emissive = new THREE.Color(0x332200); // Un pequeño brillo cálido
        }
    } else if (modelPath.includes('Sphere')) {
        // La esfera de materiales: haremos que su color base sea rojizo y más rugoso
        if (!material.map) {
            // Si no tiene textura, cambiamos el color
            material.color.setHex(0xff5533);
        }
        material.roughness = 0.8;
        material.metalness = 0.1; // Casi dieléctrico
    } else if (modelPath.includes('Chair')) {
        // La silla: la hacemos más oscura y brillante (muy rugosa, pero metálica)
        if (!material.map) {
            material.color.setHex(0x226688);
        }
        material.metalness = 0.9;
        material.roughness = 0.2;
    }

    // Ejemplo de cambio de propiedad que se ve en todos: activar el wireframe para ver la geometría
    // material.wireframe = true; // Descomenta esta línea para ver un efecto radical.

    console.log('Material modificado:', material);
}

// --- 5. Bucle de Animación ---
function animate() {
    requestAnimationFrame(animate);

    // Pequeña animación para los modelos (opcional, para dar vida)
    // Podríamos rotarlos lentamente
    // scene.children.forEach(child => {
    //     if (child.isGroup || child.isMesh) {
    //         // No rotar el suelo ni la cuadrícula
    //         if (child !== plane && child !== gridHelper) {
    //             child.rotation.y += 0.001;
    //         }
    //     }
    // });

    controls.update(); // Actualizar controles

    renderer.render(scene, camera);
}

animate();

// --- 6. Manejar el redimensionamiento de la ventana ---
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}