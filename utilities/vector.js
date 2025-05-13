export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get angle() {
        return Math.atan2(this.y, this.x);
    }

    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    static add(a, b) {
        return a.add(b);
    }

    subtract(other) {
        return this.add(new Vec2(-other.x, -other.y));
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    scale(scale) {
        return new Vec2(this.x * scale, this.y * scale);
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    normalize() {
        if (this.length() === 0) {
            return new Vec2(0,0);
        }
        return new Vec2(this.x / this.length(), this.y / this.length());
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }
}