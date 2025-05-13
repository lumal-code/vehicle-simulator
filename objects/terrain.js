import { createPerlinTexture } from "../utilities/perlin-noise.js";

export class Terrain {
    constructor(gl) {
        //this.terrain = createStandardTexture(gl, gl.canvas.width, gl.canvas.height);
        this.terrain = createPerlinTexture(gl, gl.canvas.width, gl.canvas.height);
        this.gl = gl;
    }

    drawBackground(renderer) {
        renderer.drawBackground(this.terrain.tex);
    }

    heightAtPixel(x, y) {
        return this.terrain.data[this.gl.canvas.width * Math.floor(y) + Math.floor(x)];
    }
}

// export function initTerrain(gl, renderer) {
//     //const terrain = createPerlinTexture(gl, gl.canvas.width, gl.canvas.height);
//     const terrain = createStandardTexture(gl, gl.canvas.width, gl.canvas.height)
//     return {
//         drawBackground: () => {
//             renderer.drawBackground(terrain.tex);
//         },
//         heightAtPixel: (x,y) => {
//             return terrain.data[gl.canvas.width * Math.floor(y) + Math.floor(x)];
//         }
//     }
// }
function createStandardTexture(gl, width, height) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const data = new Uint8Array(width * height);

    const maxHeight = 255;
    const hillRadius = Math.min(width, height) / 2; // How big each hill is

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Distance to each corner
            const dTopLeft = Math.hypot(x, y);
            const dTopRight = Math.hypot(width - x, y);
            const dBottomLeft = Math.hypot(x, height - y);
            const dBottomRight = Math.hypot(width - x, height - y);

            // Take the closest corner
            const d = Math.min(dTopLeft, dTopRight, dBottomLeft, dBottomRight);

            // If within the hill radius, height is based on distance
            let value = 0;
            if (d < hillRadius) {
                value = maxHeight * (1 - d / hillRadius);
            }

            value = Math.max(0, Math.min(255, Math.floor(value)));
            data[width * y + x] = value;
        }
    }

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        width,
        height,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, null);
    return { data, tex };
}


