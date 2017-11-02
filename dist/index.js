'use strict';

var _three = require('three');

var THREE = _interopRequireWildcard(_three);

var _threeWindowResize = require('three-window-resize');

var _threeWindowResize2 = _interopRequireDefault(_threeWindowResize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// import OrbitControls from 'three-orbit-controls';
var OrbitControls = require('three-orbit-controls')(THREE);


var camera = void 0,
    controls = void 0,
    scene = void 0,
    renderer = void 0;
var container = void 0,
    stats = void 0,
    GUI = void 0;

var DIMENSIONS = 200;

var SPHERE_RADIUS = 2;
var SPHERE_MASS = 2.0;
var amountOfSpheres = 200;
var balls = [];

var EYE_CANDY_RADIUS = 8;
var EYE_CANDY_MASS = 8.0;
var amountOfEyeCandies = 1;
var eyeCandies = [];

var initGraphics = function initGraphics() {
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
    for (var i = 0; i < amountOfSpheres; i++) {
        scene.add(createSphere());
    }
    for (var k = 0; k < amountOfEyeCandies; k++) {
        scene.add(eyeCandy());
    }

    //RENDERER
    renderer = new THREE.WebGLRenderer({ alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //EVENTS
    (0, _threeWindowResize2.default)(renderer, camera);
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
var createCube = function createCube() {
    var geometry = new THREE.CubeGeometry(DIMENSIONS, DIMENSIONS, DIMENSIONS);
    var material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true
    });
    var mesh = new THREE.Mesh(geometry, material);
    return new THREE.BoxHelper(mesh, 0xffffff);
};

//Creates a sphere with a random position and a random velocity with a set radius
var createSphere = function createSphere() {
    var geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
    var material = new THREE.MeshBasicMaterial({
        color: 0x0000ff
    });
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set((Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2), (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2), (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2));
    mesh.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);

    balls.push(mesh);
    return mesh;
};

//Creates a big sphere with a random position and a random velocity with a set radius
var eyeCandy = function eyeCandy() {
    var geometry = new THREE.SphereGeometry(EYE_CANDY_RADIUS, 32, 32);
    var material = new THREE.MeshBasicMaterial({
        color: 0xff0000
    });
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set((Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2), (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2), (Math.random() - 0.5) * (DIMENSIONS - geometry.parameters.radius * 2));
    mesh.velocity = new THREE.Vector3(0, 0, 0);

    eyeCandies.push(mesh);
    return mesh;
};

//Check to see if the position of the ball doesn't go past the wall and also check to see if it's velocity is less than or greater than 0 so it doesn't spike past and get stuck by the edge of the wall
var checkWallBoundaries = function checkWallBoundaries(current) {
    if (current.position.x >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.x > 0 || current.position.x <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.x < 0) current.velocity.setX(-current.velocity.x);

    if (current.position.y >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.y > 0 || current.position.y <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.y < 0) current.velocity.setY(-current.velocity.y);

    if (current.position.z >= DIMENSIONS / 2 - current.geometry.parameters.radius && current.velocity.z > 0 || current.position.z <= -DIMENSIONS / 2 + current.geometry.parameters.radius && current.velocity.z < 0) current.velocity.setZ(-current.velocity.z);
};

//Check to see if the spheres distance is less than both their radius combined which indicates they intersected
var intersects = function intersects(sphere, other) {
    var x1 = sphere.position.x;
    var x2 = other.position.x;

    var y1 = sphere.position.y;
    var y2 = other.position.y;

    var z1 = sphere.position.z;
    var z2 = other.position.z;

    if (x1 - x2 >= sphere.geometry.parameters.radius + other.geometry.parameters.radius || y1 - y2 >= sphere.geometry.parameters.radius + other.geometry.parameters.radius || z1 - z2 >= sphere.geometry.parameters.radius + other.geometry.parameters.radius) return false;

    var distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));

    return distance < sphere.geometry.parameters.radius + other.geometry.parameters.radius;
};

//Look for any collisions between spheres and if there is apply elastic collision
var checkSphereCollision = function checkSphereCollision(current) {
    for (var i = current + 1; i < balls.length; i++) {
        if (intersects(balls[current], balls[i])) {
            //Used elastic collision formula
            //v1 = (v1*(m1-m2))/(m1+m2) + (2*v2*m2)/(m1+m2)
            //v2 = (2*v1*m1)/(m1+m2) - (v2*(m1-m2))/(m1+m2)
            var bVelx = 2 * SPHERE_MASS * balls[i].velocity.x / (SPHERE_MASS + SPHERE_MASS);
            var bVely = 2 * SPHERE_MASS * balls[i].velocity.y / (SPHERE_MASS + SPHERE_MASS);
            var bVelz = 2 * SPHERE_MASS * balls[i].velocity.z / (SPHERE_MASS + SPHERE_MASS);
            var b2Velx = 2 * balls[current].velocity.x * SPHERE_MASS / (SPHERE_MASS + SPHERE_MASS);
            var b2Vely = 2 * balls[current].velocity.y * SPHERE_MASS / (SPHERE_MASS + SPHERE_MASS);
            var b2Velz = 2 * balls[current].velocity.z * SPHERE_MASS / (SPHERE_MASS + SPHERE_MASS);
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
var checkCandySphereCollision = function checkCandySphereCollision(current) {
    for (var i = 0; i < eyeCandies.length; i++) {
        if (intersects(balls[current], eyeCandies[i])) {
            //Used elastic collision formula
            //v1 = (v1*(m1-m2))/(m1+m2) + (2*v2*m2)/(m1+m2)
            //v2 = (2*v1*m1)/(m1+m2) - (v2*(m1-m2))/(m1+m2)
            var bVelx = balls[current].velocity.x * (SPHERE_MASS - EYE_CANDY_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) + 2 * EYE_CANDY_MASS * eyeCandies[i].velocity.x / (SPHERE_MASS + EYE_CANDY_MASS);
            var bVely = balls[current].velocity.y * (SPHERE_MASS - EYE_CANDY_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) + 2 * EYE_CANDY_MASS * eyeCandies[i].velocity.y / (SPHERE_MASS + EYE_CANDY_MASS);
            var bVelz = balls[current].velocity.z * (SPHERE_MASS - EYE_CANDY_MASS) / (EYE_CANDY_MASS + SPHERE_MASS) + 2 * EYE_CANDY_MASS * eyeCandies[i].velocity.z / (SPHERE_MASS + EYE_CANDY_MASS);
            var cVelx = 2 * balls[current].velocity.x * SPHERE_MASS / (EYE_CANDY_MASS + SPHERE_MASS) - eyeCandies[i].velocity.x * (SPHERE_MASS - EYE_CANDY_MASS) / (SPHERE_MASS + EYE_CANDY_MASS);
            var cVely = 2 * balls[current].velocity.y * SPHERE_MASS / (EYE_CANDY_MASS + SPHERE_MASS) - eyeCandies[i].velocity.y * (SPHERE_MASS - EYE_CANDY_MASS) / (SPHERE_MASS + EYE_CANDY_MASS);
            var cVelz = 2 * balls[current].velocity.z * SPHERE_MASS / (EYE_CANDY_MASS + SPHERE_MASS) - eyeCandies[i].velocity.z * (SPHERE_MASS - EYE_CANDY_MASS) / (SPHERE_MASS + EYE_CANDY_MASS);
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
var displayGUI = function displayGUI() {
    GUI = new dat.GUI();
    var param = {
        keys: function keys() {
            alert("H: Hides the controller" + "\n" + "Z: Enables and disables zoom" + "\n" + "P: Enables and disables pan" + "\n" + "R: Enables and disables rotation" + "\n" + "M: Enables FullScreen");
        },
        candyVisible: true,
        candyColor: "#ff0000",
        spheresVisible: true,
        spheresColor: "#0000ff"
    };

    GUI.add(param, 'keys').name("Key Controls");

    //Folder for candy controls
    var candy = GUI.addFolder("Bigger Particle");
    var visibleCandy = candy.add(param, 'candyVisible').name("Visible");
    visibleCandy.onChange(function (value) {
        for (var i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].visible = value;
        }
    });
    var colorCandy = candy.addColor(param, 'candyColor').name("Color");
    colorCandy.onChange(function (value) {
        for (var i = 0; i < eyeCandies.length; i++) {
            eyeCandies[i].material.color.setHex(value.replace("#", "0x"));
        }
    });
    candy.open();

    //Folder for balls controls
    var sphere = GUI.addFolder("Smaller Particles");
    var visibleSphere = sphere.add(param, 'spheresVisible').name("Visible");
    visibleSphere.onChange(function (value) {
        for (var i = 0; i < balls.length; i++) {
            balls[i].visible = value;
        }
    });
    var colorSphere = sphere.addColor(param, 'spheresColor').name("Color");
    colorSphere.onChange(function (value) {
        for (var i = 0; i < balls.length; i++) {
            balls[i].material.color.setHex(value.replace("#", "0x"));
        }
    });
    sphere.open();

    GUI.open();
};

//Add keyboard events
var keyboardEvents = function keyboardEvents() {
    if (event.keyCode === 81) //letter Q toggles visibility of smaller spheres
        for (var i = 0; i < balls.length; i++) {
            balls[i].visible = !balls[i].visible;
        }if (event.keyCode === 87) //letter W toggles visibility of bigger sphere
        for (var k = 0; k < eyeCandies.length; k++) {
            eyeCandies[k].visible = !eyeCandies[k].visible;
        }if (event.keyCode === 90) //letter Z toggles zoom
        controls.enableZoom = !controls.enableZoom;

    if (event.keyCode === 80) //letter P toggles panning
        controls.enablePan = !controls.enablePan;

    if (event.keyCode === 82) //letter R toggles rotation
        controls.enableRotate = !controls.enableRotate;
};

var animate = function animate() {
    //goes through every ball and checks for wall boundaries and collision
    for (var i = 0; i < balls.length; i++) {
        balls[i].position.add(balls[i].velocity);
        checkWallBoundaries(balls[i]);
        checkSphereCollision(i);
        checkCandySphereCollision(i);
    }

    //checks to see if the big sphere collided with the wall
    for (var k = 0; k < eyeCandies.length; k++) {
        eyeCandies[k].position.add(eyeCandies[k].velocity);
        checkWallBoundaries(eyeCandies[k]);
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    controls.update();
    stats.update();
};

var render = function render() {
    renderer.clear();
    renderer.render(scene, camera);
};

if (Detector.webgl) {
    initGraphics();
    animate();
} else {
    var warning = Detector.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}
//# sourceMappingURL=index.js.map