import * as THREE from 'three';
// import OrbitControls from 'three-orbit-controls';
let OrbitControls = require('three-orbit-controls')(THREE);
import WindowResize from 'three-window-resize';

let camera, controls, scene, renderer;
let container, stats, GUI;

const DIMENSIONS = 200;

const SPHERE_RADIUS = 2;
const SPHERE_MASS = 2.0;
const amountOfSpheres = 200;
let balls = [];

const EYE_CANDY_RADIUS = 8;
const EYE_CANDY_MASS = 8.0;
const amountOfEyeCandies = 1;
let eyeCandies = [];

let initGraphics = () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    //CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = DIMENSIONS * 2.5;

    //CONTROLS THE CAMERA
    controls = new OrbitControls(camera, container);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.addEventListener('change', render);

    //SCENE
    scene = new THREE.Scene();
    scene.add(createCube());
    for(let i = 0; i < amountOfSpheres; i++) {
        scene.add(createSphere());
    }
    for(let k = 0; k < amountOfEyeCandies; k++) {
        scene.add(eyeCandy());
    }

    //RENDERER
    renderer = new THREE.WebGLRenderer({alpha: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //EVENTS
    WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ //only works on chrome and firefox
        charCode: 'm'.charCodeAt(0)
    });

    //KEYBOARD EVENTS
    document.addEventListener('keydown', keyboardEvents, false);

    container.appendChild(renderer.domElement);
    stats = new Stats();
    container.appendChild(stats.dom);

    //GUI
    displayGUI();
};

// Creating a cube with a set dimension
let createCube = () => {
    let geometry = new THREE.CubeGeometry(DIMENSIONS, DIMENSIONS, DIMENSIONS);
    let material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true
    });
    let mesh = new THREE.Mesh(geometry, material);
    return new THREE.BoxHelper(mesh, 0xffffff);
};

//Creates a sphere with a random position and a random velocity with a set radius
let createSphere = () => {
    let geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
    let material = new THREE.MeshBasicMaterial({
        color: 0x0000ff
    });
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.set((Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2));
    mesh.velocity = new THREE.Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1);

    balls.push(mesh);
    return mesh;
};

//Creates a big sphere with a random position and a random velocity with a set radius
let eyeCandy = () => {
    let geometry = new THREE.SphereGeometry(EYE_CANDY_RADIUS, 32, 32);
    let material = new THREE.MeshBasicMaterial({
        color: 0xff0000
    });
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.set((Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2),
        (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2));
    mesh.velocity = new THREE.Vector3(0, 0, 0);

    eyeCandies.push(mesh);
    return mesh;
};

//Check to see if the position of the ball doesn't go past the wall and also check to see if it's velocity is less than or greater than 0 so it doesn't spike past and get stuck by the edge of the wall
let checkWallBoundaries = (current) => {
    if(current.position.x >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.x > 0 || current.position.x <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.x < 0)
        current.velocity.setX(-current.velocity.x);

    if(current.position.y >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.y > 0 || current.position.y <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.y < 0)
        current.velocity.setY(-current.velocity.y);

    if(current.position.z >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.z > 0 || current.position.z <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.z < 0)
        current.velocity.setZ(-current.velocity.z);
};

//Check to see if the spheres distance is less than both their radius combined which indicates they intersected
let intersects = (sphere, other) => {
    let x1 = sphere.position.x;
    let x2 = other.position.x;

    let y1 = sphere.position.y;
    let y2 = other.position.y;

    let z1 = sphere.position.z;
    let z2 = other.position.z;

    if ((x1 - x2) >= (sphere.geometry.parameters.radius + other.geometry.parameters.radius) || (y1 - y2) >= (sphere.geometry.parameters.radius + other.geometry.parameters.radius) || (z1 - z2) >= (sphere.geometry.parameters.radius + other.geometry.parameters.radius))
        return false;

    let distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));

    return (distance < (sphere.geometry.parameters.radius + other.geometry.parameters.radius));
};

//Look for any collisions between spheres and if there is apply elastic collision
let checkSphereCollision = (current) => {
    for(let i = current + 1; i < balls.length; i++) {
        if(intersects(balls[current], balls[i])) {
            //Used elastic collision formula
            //v1 = (v1*(m1-m2))/(m1+m2) + (2*v2*m2)/(m1+m2)
            //v2 = (2*v1*m1)/(m1+m2) - (v2*(m1-m2))/(m1+m2)
            let bVelx = (2 * SPHERE_MASS * balls[i].velocity.x) / (SPHERE_MASS + SPHERE_MASS);
            let bVely = (2 * SPHERE_MASS * balls[i].velocity.y) / (SPHERE_MASS + SPHERE_MASS);
            let bVelz = (2 * SPHERE_MASS * balls[i].velocity.z) / (SPHERE_MASS + SPHERE_MASS);
            let b2Velx = (2 * balls[current].velocity.x * SPHERE_MASS) / (SPHERE_MASS + SPHERE_MASS);
            let b2Vely = (2 * balls[current].velocity.y * SPHERE_MASS) / (SPHERE_MASS + SPHERE_MASS);
            let b2Velz = (2 * balls[current].velocity.z * SPHERE_MASS) / (SPHERE_MASS + SPHERE_MASS);
            balls[current].velocity.x = bVelx;
            balls[current].velocity.y = bVely;
            balls[current].velocity.z = bVelz;
            balls[i].velocity.x = b2Velx;
            balls[i].velocity.y = b2Vely;
            balls[i].velocity.z = b2Velz;
        }
    }
};

//Look for any collisions between sphere and big sphere and if there is apply elastic collision
let checkCandySphereCollision = (current) => {
    for(let i = 0; i < eyeCandies.length; i++) {
        if(intersects(balls[current], eyeCandies[i])) {
            //Used elastic collision formula
            //v1 = (v1*(m1-m2))/(m1+m2) + (2*v2*m2)/(m1+m2)
            //v2 = (2*v1*m1)/(m1+m2) - (v2*(m1-m2))/(m1+m2)
            let bVelx = (balls[current].velocity.x * (SPHERE_MASS - EYE_CANDY_MASS)) / (EYE_CANDY_MASS + SPHERE_MASS) + (2 * EYE_CANDY_MASS * eyeCandies[i].velocity.x) / (SPHERE_MASS + EYE_CANDY_MASS);
            let bVely = (balls[current].velocity.y * (SPHERE_MASS - EYE_CANDY_MASS)) / (EYE_CANDY_MASS + SPHERE_MASS) + (2 * EYE_CANDY_MASS * eyeCandies[i].velocity.y) / (SPHERE_MASS + EYE_CANDY_MASS);
            let bVelz = (balls[current].velocity.z * (SPHERE_MASS - EYE_CANDY_MASS)) / (EYE_CANDY_MASS + SPHERE_MASS) + (2 * EYE_CANDY_MASS * eyeCandies[i].velocity.z) / (SPHERE_MASS + EYE_CANDY_MASS);
            let cVelx = (2 * balls[current].velocity.x * SPHERE_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) - (eyeCandies[i].velocity.x * (SPHERE_MASS - EYE_CANDY_MASS)) / (SPHERE_MASS + EYE_CANDY_MASS);
            let cVely = (2 * balls[current].velocity.y * SPHERE_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) - (eyeCandies[i].velocity.y * (SPHERE_MASS - EYE_CANDY_MASS)) / (SPHERE_MASS + EYE_CANDY_MASS);
            let cVelz = (2 * balls[current].velocity.z * SPHERE_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) - (eyeCandies[i].velocity.z * (SPHERE_MASS - EYE_CANDY_MASS)) / (SPHERE_MASS + EYE_CANDY_MASS);
            balls[current].velocity.x = bVelx;
            balls[current].velocity.y = bVely;
            balls[current].velocity.z = bVelz;
            eyeCandies[i].velocity.x = cVelx;
            eyeCandies[i].velocity.y = cVely;
            eyeCandies[i].velocity.z = cVelz;
        }
    }
};

//Displays a GUI with controls to toggle the visibility and color of the spheres
let displayGUI = () => {
    GUI = new dat.GUI();
    let param = {
        keys: function() {
            alert("H: Hides the controller" + "\n" + "Z: Enables and disables zoom" + "\n" + "P: Enables and disables pan" + "\n" + "R: Enables and disables rotation" + "\n" + "M: Enables FullScreen");
        },
        candyVisible: true,
        candyColor: "#ff0000",
        spheresVisible: true,
        spheresColor: "#0000ff"
    };

    GUI.add(param, 'keys').name("Key Controls");

    //Folder for candy controls
    let candy = GUI.addFolder("Bigger Particle");
    let visibleCandy = candy.add(param, 'candyVisible').name("Visible");
    visibleCandy.onChange(function (value) {
        for(let i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].visible = value;
        }
    });
    let colorCandy = candy.addColor(param, 'candyColor').name("Color");
    colorCandy.onChange(function (value) {
        for(let i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].material.color.setHex(value.replace("#", "0x"));
        }
    });
    candy.open();

    //Folder for balls controls
    let sphere = GUI.addFolder("Smaller Particles");
    let visibleSphere = sphere.add(param, 'spheresVisible').name("Visible");
    visibleSphere.onChange(function (value) {
        for(let i = 0; i < balls.length; i++) {
            balls[i].visible = value;
        }
    });
    let colorSphere = sphere.addColor(param, 'spheresColor').name("Color");
    colorSphere.onChange(function (value) {
        for(let i = 0; i < balls.length; i++) {
            balls[i].material.color.setHex(value.replace("#", "0x"));
        }
    });
    sphere.open();

    GUI.open();
};

//Add keyboard events
let keyboardEvents = () => {
    if(event.keyCode === 81) //letter Q toggles visibility of smaller spheres
        for(let i = 0; i < balls.length; i++)
            balls[i].visible = !balls[i].visible;

    if(event.keyCode === 87) //letter W toggles visibility of bigger sphere
        for(let k = 0; k < eyeCandies.length; k++)
            eyeCandies[k].visible = !eyeCandies[k].visible;

    if(event.keyCode === 90) //letter Z toggles zoom
        controls.enableZoom = !controls.enableZoom;

    if(event.keyCode === 80) //letter P toggles panning
        controls.enablePan = !controls.enablePan;

    if(event.keyCode === 82) //letter R toggles rotation
        controls.enableRotate = !controls.enableRotate;
};

let animate = () => {
    //goes through every ball and checks for wall boundaries and collision
    for(let i = 0; i < balls.length; i++) {
        balls[i].position.add(balls[i].velocity);
        checkWallBoundaries(balls[i]);
        checkSphereCollision(i);
        checkCandySphereCollision(i);
    }

    //checks to see if the big sphere collided with the wall
    for(let k = 0; k < eyeCandies.length; k++) {
        eyeCandies[k].position.add(eyeCandies[k].velocity);
        checkWallBoundaries(eyeCandies[k]);
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    controls.update();
    stats.update();
};

let render = () => {
    renderer.clear();
    renderer.render(scene, camera);
};

if(Detector.webgl) {
    initGraphics();
    animate();
} else {
    let warning = Detector.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}