import { Terrain } from "./terrain.js";

export class Tire {
    //tire is a value from 0-3 clockwise from the top right tire
    //centerPointX is the x distance from the top left point of the car to the rotation center
    //centerPointY is the y distance from the top left point of the car to the rotation center
    constructor(x, y, carWidth, carHeight, centerPointX, centerPointY, tire) {
        let defaultDistX = 0;
        let defaultDistY = 0;
        if (tire < 2) {
            defaultDistX = carWidth - centerPointX - 10;
        } else {
            defaultDistX = -centerPointX + 10;
        }

        if (tire == 1 || tire == 2) {
            defaultDistY = -1*(carHeight - centerPointY) + 10;
        } else {
            defaultDistY = centerPointY - 15;
        }
        this.x = Math.round(x + defaultDistX);
        this.y = Math.round(y + defaultDistY);
        this.hypotenuse = Math.sqrt(defaultDistX*defaultDistX + defaultDistY * defaultDistY);
        this.defaultAngle = Math.atan2(defaultDistY, defaultDistX);
        this.height = 1;
    }

    update(x, y, theta, terrain) {
        this.x = Math.round(x + this.hypotenuse * Math.cos(theta + this.defaultAngle));
        this.y = Math.round(y + this.hypotenuse * Math.sin(theta + this.defaultAngle));
        this.height = terrain.heightAtPixel(this.x, this.y);
    }

    draw(renderer) {
        renderer.drawQuad(this.x, this.y, 5, 5);
    }
}