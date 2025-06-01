import { createPerlinTexture } from "../utilities/perlin-noise.js";
import { Cliff } from "./cliffs.js";
import { Vec2 } from "../utilities/vector.js";

export class Terrain {
    constructor(gl) {
        //this.terrain = createStandardTexture(gl, gl.canvas.width, gl.canvas.height);
        this.terrain = createPerlinTexture(gl, gl.canvas.width, gl.canvas.height);
        this.cliffs = [new Cliff(0,0,gl.canvas.width/2,gl.canvas.height/2),
            new Cliff(gl.canvas.width/2,gl.canvas.height/2,gl.canvas.width,gl.canvas.height)];
        this.gl = gl;
    }

    drawBackground(renderer) {
        renderer.drawBackground(this.terrain.tex);
        for (const cliff of this.cliffs) {
            cliff.draw(renderer);
        }
    }

    heightAtPixel(x, y) {
        return this.terrain.data[this.gl.canvas.width * Math.floor(y) + Math.floor(x)];
    }

    checkCollision(vehicle) {
        for (const cliff of this.cliffs) {
            if (colliding(vehicle, cliff.rect)) {
                return true;
            }
        }
        return false;
    }
}

function colliding(vehicle, rect) {
    let offsetVec = new Vec2(vehicle.centerX, vehicle.centerY);
    offsetVec = offsetVec.rotate(vehicle.drivingAngle)
    const centerVec = new Vec2(vehicle.x, vehicle.y);

    const widthVec = new Vec2(vehicle.height, 0).rotate(vehicle.drivingAngle);
    const heightVec = new Vec2(0, vehicle.width).rotate(vehicle.drivingAngle);

    const tLVec = centerVec.subtract(offsetVec);
    const bLVec = tLVec.add(widthVec);
    const bRVec = bLVec.add(heightVec);
    const tRVec = tLVec.add(heightVec);

    const points = [tLVec, bLVec, bRVec, tRVec];

    let xColliding = false;
    let yColliding = false;
    for (const point of points) {
        if (point.x > rect[0].x && point.x < rect[2].x) {
            xColliding = true;
        }
        if (point.y > rect[0].y && point.y < rect[2].y) {
            yColliding = true;
        }
        if (xColliding && yColliding) {
            return true;
        }
    }
    return false;
}