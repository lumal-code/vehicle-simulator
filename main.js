import { initRenderer } from "./graphics/renderer.js";
import { isKeyDown, initInput } from "./utilities/input.js";
import { Vehicle } from "./objects/updatedVehicle.js";
import { Terrain } from "./objects/terrain.js";
import { Tire } from "./objects/tire.js";

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const velocityElement = document.querySelector('#velocity');

const renderer = initRenderer(gl);

initInput();

const vehicle = new Vehicle(gl);
//when the image loads, reset the texture (stolen from https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html)
vehicle.tex.image.onload = () => {
    vehicle.tex.width = vehicle.tex.image.width;
    vehicle.tex.height = vehicle.tex.image.height;
    vehicle.width = vehicle.tex.width / 10;
    vehicle.height = vehicle.tex.height / 10;
    //console.log(vehicle.width);
    for (let i = 0; i < 4; i++) {
        vehicle.tires[i] = new Tire(
            vehicle.x, 
            vehicle.y, 
            vehicle.width, 
            vehicle.height, 
            vehicle.width * 0.3, 
            vehicle.height * 0.5, 
            i
        );
    }
}

//1 point of difference in terrain generation will equal 5 meters
let terrain = new Terrain(gl);

//reset car button function
const resetCarBtn = document.getElementById("reset car");
resetCarBtn.addEventListener('click', () => vehicle.resetCar());

//reset car button function
const resetTerrainBtn = document.getElementById("reset terrain");
resetTerrainBtn.addEventListener('click', (e) => {
    console.log("resetting terrain");
    terrain = new Terrain(gl);
});

let lastTime = 0;
let totalTime = 0;

function runGame(now) {
    let deltaTime = (now - lastTime) / 1000;
    totalTime += deltaTime;
    lastTime = now;
    //get input
    vehicle.reset();
    if (isKeyDown('w')) {
        vehicle.accelerate(deltaTime);
    }
    if (isKeyDown('s')) {
        vehicle.brake(deltaTime);
    }
    if (isKeyDown('a')) {
        vehicle.turnLeft(deltaTime);
    }
    if (isKeyDown('d')) {
        vehicle.turnRight(deltaTime);
    }
    //update car
    vehicle.update(deltaTime, terrain);

    //update info on web page
    velocityElement.innerHTML = "Current Velocity: " + vehicle.velocity.length() * 2.237;

    //draw loop
    terrain.drawBackground(renderer);
    renderer.drawGrid(gl.canvas.width, gl.canvas.height, 100);
    vehicle.draw(renderer);
    requestAnimationFrame(runGame);
}

requestAnimationFrame(runGame);