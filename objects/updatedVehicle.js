import { loadImageAndCreateTextureInfo } from "../utilities/image-handler.js";
import { Tire } from "./tire.js";
import { Battery } from "./battery.js";
import { Vec2 } from "../utilities/vector.js";

export class Vehicle {
    constructor(gl, batteryEl) {
        this.PIXELS_TO_METERS = 5;
        this.spawnX = 100;
        this.spawnY = 500;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.tex = loadImageAndCreateTextureInfo(gl, '/vehicle-simulator/newcar.png', this);
        this.width = 1; //wait for image to load and then reset to real values
        this.height = 1;
        this.centerX = 1;
        this.centerY = 1;
        this.wheelbase = 2.5;
        this.tires = [];
        for (let i = 0; i < 4; i++) {
            this.tires[i] = new Tire(this, this.x, this.y, this.height, this.width, this.centerX, this.centerY, i);
        }
        this.battery = new Battery(10, gl, batteryEl); //10kWh
        this.velocity = new Vec2(0,0);
        this.acceleration = new Vec2(0,0);
        this.distance = 0;
        this.sliding = false;
        this.turning = false;
        this.drivingAngle = Math.PI / 2;
        this.steeringAngle = 0;
        this.steeringRate = 1;
        this.maxSteering = Math.PI / 6;
        this.slipAmount = 0;
        this.angleVec = new Vec2(0,0);
        this.g = 9.81;
        this.m = 1800;
        this.engine_force_mag = 12000; 
        this.brake_force_mag = 12000;
        this.n = 0.25;
        this.C = 0.29;
        this.rho = 1.225;
        this.A = 2.2;
        this.N = this.m*this.g*Math.cos(this.angleVec);
        this.C_r = 0.02;
        this.forces = {
            curF_engine: new Vec2(0,0),
            curF_brake: new Vec2(0,0),
            F_drag: 0,
            F_gravity: 0,
            F_lf: 0,
            F_rr: 0,
        };
        this.forcesDraw = {
            curF_engine: false,
            curF_brake: false,
            F_drag: false,
            F_gravity: false,
            F_lf: false,
            F_rr: false,
        }
    }

    updateSize(width, height) {
        //adjust the size so that it fits the picture properly
        //these numbers were just adjusted until it worked
        this.width = width / 12;
        this.height = height / 12;
        this.centerX = this.width * 0.5;
        this.centerY = this.height * 0.3;

        this.initializeTires();
    }

    calculateNormalForce(m, g, angleVec) {
        const mag = Math.sqrt(angleVec.x * angleVec.x + angleVec.y * angleVec.y);
        return m*g*Math.cos(mag);
    }
    
    calculateDragForce(C, rho, A, v) {
        if (this.velocity.length() < 0.01) return new Vec2(0,0);
        const mag = 0.5 * C * rho * A * v.length()**2;
        return this.velocity.normalize().scale(-1 * mag);
    }
    
    calculateRollingResistance(C_r, N) {
        if (this.velocity.length() < 0.01) return new Vec2(0,0);
        const mag = 4*C_r*N;
        const forward = new Vec2(1,0).rotate(this.drivingAngle).normalize();
        const dir = this.velocity.dot(forward);
        return forward.scale(Math.sign(dir) * -mag);
    }
    
    calculateGravityVec(m, g, angleVec, forwardVec, latVec) {
        return forwardVec.scale(this.calcGrav(m,g,angleVec.y)).add(latVec.scale(this.calcGrav(m,g,angleVec.x)));
    }

    calcGrav(m,g,angle) {
        return m*g*Math.sin(angle);
    }

    //honestly used chatgpt for this because there are a couple intricacies. i got most of the way there, but I didn't have lat_direction.
    calculateLateralFriction(N) {
        if (this.velocity.length() < 0.01) return new Vec2(0,0);
        const forward = new Vec2(1,0).rotate(this.drivingAngle).normalize();
        const lateral = new Vec2(-forward.y, forward.x).normalize();
        const lat_direction = lateral.dot(this.velocity);
        const frictionMag = 3 * N; 
        const force = lateral.scale(-Math.sign(lat_direction) * frictionMag); 
        return force;
    }

    updateDrivingAngle(vehicle, dt) {
        if (Math.abs(vehicle.steeringAngle) < 0.1) {
            return 0;
        }
        const speedFactor = Math.min(vehicle.velocity.length() / 10, 1);
        const turnRadius = this.wheelbase / Math.tan(vehicle.steeringAngle);
        const angularVelocity = vehicle.velocity.length() / turnRadius; // rad/s
        return angularVelocity * dt * speedFactor;
    }

    draw(renderer) {
        renderer.drawVehicle(
            this.tex.texture, 
            (Math.PI / 2) - this.drivingAngle, 
            this.x, 
            this.y, 
            this.width, 
            this.height,
            this.centerX,
            this.centerY
        );

        for(const [name, value] of Object.entries(this.forcesDraw)) {
            if (value) {
                this.forces[name].draw(renderer, [1.0, 0.0, 0.0], this.x, this.y);
            }
        }
    }

    resetCar() {
        this.forces.curF_engine = this.forces.curF_engine.scale(0);
        this.forces.curF_brake = this.forces.curF_brake.scale(0);
        this.turning = false;
        this.velocity = new Vec2(0,0);
        this.acceleration = new Vec2(0,0);
        this.drivingAngle = 0;
        this.battery.chargeBattery();

        this.x = this.spawnX;
        this.y = this.spawnY;
    }

    reset() {
        this.forces.curF_engine = this.forces.curF_engine.scale(0);
        this.forces.curF_brake = this.forces.curF_brake.scale(0);
        this.turning = false;
    }

    accelerate() {
        if (this.battery.batteryLeft > 0) {
            this.forces.curF_engine = new Vec2(
                this.engine_force_mag * Math.cos(this.drivingAngle), 
                this.engine_force_mag * Math.sin(this.drivingAngle)
            );
        }
    }

    turnRight(dt) {
        this.steeringAngle += this.steeringRate * dt;
        this.turning = true;
        if (this.steeringAngle < -this.maxSteering || this.steeringAngle > this.maxSteering) {
            this.steeringAngle = Math.sign(this.steeringAngle) * this.maxSteering;
        }
    }

    turnLeft(dt) {
        this.steeringAngle -= this.steeringRate * dt;
        this.turning = true;
        if (this.steeringAngle < -this.maxSteering || this.steeringAngle > this.maxSteering) {
            this.steeringAngle = Math.sign(this.steeringAngle) * this.maxSteering;
        }
    }

    brake() {
        if (this.velocity.length() > 0.01) {
            this.forces.curF_brake = this.velocity
                .normalize()
                .scale(-this.brake_force_mag);
        } else {
            this.forces.curF_brake = new Vec2(0,0);
        }
    }

    update(dt, terrain) {
        if(isNaN(this.velocity.length())) {
            this.resetCar();
        }

        for (let i = 0; i < 4; i++) {
            this.tires[i].update(this, this.x, this.y, this.drivingAngle, terrain);
        }

        const frontAvg = (this.tires[0].height + this.tires[1].height) / 2;
        const rearAvg = (this.tires[2].height + this.tires[3].height) / 2;
        const leftAvg  = (this.tires[0].height + this.tires[2].height) / 2;
        const rightAvg = (this.tires[1].height + this.tires[3].height) / 2;

        const slopeX = Math.atan2((leftAvg - rightAvg), this.width);
        const slopeY = Math.atan2(frontAvg - rearAvg, this.wheelbase * this.PIXELS_TO_METERS);

        this.angleVec = new Vec2(slopeX, slopeY);

        const forward = new Vec2(Math.cos(this.drivingAngle), Math.sin(this.drivingAngle));
        const lat = new Vec2(forward.y, -forward.x);

        this.forces.F_gravity = this.calculateGravityVec(this.m, this.g, this.angleVec, forward, lat);

        this.N = this.calculateNormalForce(this.m, this.g, this.angleVec);
        this.forces.F_drag = this.calculateDragForce(
            this.C,
            this.rho,
            this.A,
            this.velocity
        );

        this.forces.F_rr = this.calculateRollingResistance(
            this.C_r,
            this.N
        );

        this.forces.F_lf = this.calculateLateralFriction(
            this.N
        )

        const returnRate = 4;
        if (!this.turning) {
            this.steeringAngle += -this.steeringAngle * returnRate * dt;
        }
        const totalForce = this.forces.curF_engine
            .clone()
            .add(this.forces.curF_brake)
            .add(this.forces.F_rr)
            .add(this.forces.F_gravity)
            .add(this.forces.F_drag)
            .add(this.forces.F_lf);

        this.acceleration = totalForce.scale(dt/this.m);
        
        this.velocity = this.velocity
            .clone()
            .add(this.acceleration);

        this.battery.updateBattery(this.velocity, this.forces.curF_engine, dt, this.PIXELS_TO_METERS);
        
        this.drivingAngle += this.updateDrivingAngle(this, dt);
        this.x += this.velocity.x * dt * this.PIXELS_TO_METERS;
        this.y += this.velocity.y * dt * this.PIXELS_TO_METERS;
    }

    initializeTires() {
        this.tires = [];
        for (let i = 0; i < 4; i++) {
            this.tires[i] = new Tire(this.x, this.y, this.width, this.height, this.centerX, this.centerY, i);
        }
    }
}