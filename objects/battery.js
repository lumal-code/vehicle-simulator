export class Battery {
    constructor(size, gl) {
        this.gl = gl;
        this.width = 200;
        this.height = 25;
        this.texInfo = new Uint8Array(this.width * this.height * 4);
        this.tex = this.createBatteryTexture(this.texInfo);
        this.size = size;
        this.batteryLeft = size;
        this.batteryColor = [255, 0, 0, 255];
        this.x = 550;
        this.y = 25;
        
    }

    updateBattery(velocity, F_engine, dt, pixelMeterRatio) {
        if (this.velocity != 0) {
            const work = F_engine.length() * (velocity.length() * dt * pixelMeterRatio); 
            this.batteryLeft -= work / 3600000;
            this.updateBatteryTexture();
        }

        this.batteryColor = [255 - 255 * this.batteryLeft / this.size, 255 * this.batteryLeft / this.size, 0, 255];
    }

    chargeBattery() {
        this.batteryLeft = this.size;
    }

    drawBattery(renderer) {
        renderer.drawBattery(this.tex, this.x, this.y, this.width, this.height);
    }

    updateBatteryTexture() {
        const batteryPixelX = Math.floor(this.width * (this.batteryLeft / this.size));
        for (let x = 0; x < batteryPixelX; x++) {
            for (let y = 0; y < this.height; y++) {
                let i = (this.width*y + x) * 4;
                this.texInfo[i] = this.batteryColor[0];
                this.texInfo[i + 1] = this.batteryColor[1];
                this.texInfo[i + 2] = this.batteryColor[2];
                this.texInfo[i + 3] = this.batteryColor[3];
            }
        }
    
        for (let x = batteryPixelX; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let i = (this.width*y + x) * 4;
                this.texInfo[i] = 0;
                this.texInfo[i + 1] = 0;
                this.texInfo[i + 2] = 0;
                this.texInfo[i + 3] = 255;
            }
        }
        //console.log("updated textre: " + this.texInfo);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
        this.gl.texSubImage2D(
            this.gl.TEXTURE_2D, 
            0, 
            0, 
            0, 
            this.width, 
            this.height, 
            this.gl.RGBA, 
            this.gl.UNSIGNED_BYTE, 
            this.texInfo
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    createBatteryTexture(texInfo) {
        const gl = this.gl;

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
    
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.width,
            this.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            texInfo
        )
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
        gl.bindTexture(gl.TEXTURE_2D, null);
    
        return tex;
    }
}