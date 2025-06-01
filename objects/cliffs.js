import { makeSquareRect } from "../utilities/collision.js";

export class Cliff {
    constructor(startX, startY, canvasWidth, canvasHeight) {
        const x = startX + Math.random()*(canvasWidth - startX);
        const y = startY + Math.random()*(canvasHeight - startY);
        const length = Math.random() * 100 + 100;
        const width = Math.random() * 50 + 50;

        this.rect = makeSquareRect(x,y,width,length);
        console.log(this.rect);
    }

    draw(renderer) {
        renderer.drawCliff(this.rect[0], this.rect[1], this.rect[2], this.rect[3]);
    }
}
