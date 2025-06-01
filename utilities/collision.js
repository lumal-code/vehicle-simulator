import { Vec2 } from "./vector.js";

//creates a usable rectangle from x, y of top left point
export function makeRect(x, y, width, height, angle) {
    const forward = { x: Math.cos(angle), y: Math.sin(angle) };
    const right = { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) };

    // Corner 0: origin
    const p0 = { x: x, y: y };

    // Corner 1: forward
    const p1 = {
        x: p0.x + forward.x * height,
        y: p0.y + forward.y * height
    };

    // Corner 2: forward + right
    const p2 = {
        x: p1.x + right.x * width,
        y: p1.y + right.y * width
    };

    // Corner 3: right
    const p3 = {
        x: p0.x + right.x * width,
        y: p0.y + right.y * width
    };

    return [p0, p1, p2, p3];
}

//creates a usable rectangle from x, y of top left point
export function makeSquareRect(x, y, width, height) {

    // Corner 0: origin
    const p0 = { x: x, y: y };

    // Corner 1: forward
    const p1 = {
        x: p0.x + width,
        y: p0.y
    };

    // Corner 2: forward + right
    const p2 = {
        x: p1.x,
        y: p1.y + height
    };

    // Corner 3: right
    const p3 = {
        x: p0.x,
        y: p2.y,
    };

    return [p0, p1, p2, p3];
}