import { loadImageAndCreateTextureInfo } from "../utilities/image-handler.js";
import { Tire } from "./tire.js";
import { Battery } from "./battery.js";
import { Vec2 } from "../utilities/vector.js";

export class Vehicle {
    constructor(gl) {
        this.PIXELS_TO_METERS = 5;
        this.spawnX = 100;
        this.spawnY = 500;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.tex = loadImageAndCreateTextureInfo(gl, '/vehicle-simulator/resources/car.png');
        this.width = this.tex.width / 10;
        this.height = this.tex.height / 10;
        this.centerX = this.width * 0.3;
        this.centerY = this.height * 0.5;
        this.wheelbase = 2.5;
        this.tires = [];
        for (let i = 0; i < 4; i++) {
            this.tires[i] = new Tire(this.x, this.y, this.height, this.width, this.centerX, this.centerY, i);
        }
        this.battery = new Battery(10, gl); //10kWh
        this.velocity = new Vec2(0,0);
        this.acceleration = new Vec2(0,0);
        this.distance = 0;
        this.sliding = false;
        this.turning = false;
        this.drivingAngle = 0;
        this.steeringAngle = 0;
        this.steeringRate = 1;
        this.maxSteering = Math.PI / 6;
        this.slipAmount = 0;
        this.theta = 0;
        this.g = 9.81;
        this.m = 1800;
        this.engine_force_mag = 12000; 
        this.curF_engine = new Vec2(0,0);
        this.brake_force_mag = 12000;
        this.curF_brake = new Vec2(0,0);
        this.r = 0.3;
        this.n = 0.25;
        this.C = 0.29;
        this.rho = 1.225;
        this.A = 2.2;
        this.N = this.m*this.g*Math.cos(this.theta);
        this.C_r = 0.02;
        this.C_bf;
    }

    calculateNormalForce(m, g, theta) {
        return m*g*Math.cos(theta);
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
    
    calculateGravity(m, g, theta) {
        const mag = m*g*Math.sin(theta);
        const gravity_dir = new Vec2(Math.sin(this.drivingAngle), Math.cos(this.drivingAngle)).normalize();
        return gravity_dir.scale(mag);
    }

    calculateLateralFriction(N) {
        if (this.velocity.length() < 0.01) return new Vec2(0,0);
        const forward = new Vec2(1,0).rotate(this.drivingAngle).normalize();
        const lateral = new Vec2(-forward.y, forward.x).normalize();
        const lat_direction = lateral.dot(this.velocity);
        const frictionMag = 0.9 * N; 
        const force = lateral.scale(-Math.sign(lat_direction) * frictionMag); //0.8 is coeff of lateral friction
        return force;
    }

    updateDrivingAngle(vehicle, dt) {
        if (Math.abs(vehicle.steeringAngle) < 0.1) {
            return 0;
        }
        const turnRadius = this.wheelbase / Math.tan(vehicle.steeringAngle);
        const centripetalForce = vehicle.m * vehicle.velocity.length() * vehicle.velocity.length() / turnRadius;
        const mu = 0.9;
        const F_grip = vehicle.g * vehicle.m * mu;
        const angularVelocity = vehicle.velocity.length() / turnRadius; // rad/s
        //console.log("sliding:", vehicle.sliding, "steeringAngle:", vehicle.steeringAngle, "velocity:", vehicle.velocity);
        const gripRatio = F_grip / Math.abs(centripetalForce); // < 1 if sliding
    
        //TODO: implement sliding
        if (gripRatio < 1) {
            vehicle.sliding = true;
            vehicle.slipAmount = 1 - gripRatio;  // from 0 (no slide) to near 1
            return angularVelocity * dt;
        } else {
            vehicle.sliding = false;
            vehicle.slipAmount = 0;
            return angularVelocity * dt;
        }
    }

    draw(renderer) {
        renderer.drawVehicle(
            this.tex.texture, 
            -this.drivingAngle, 
            this.x, 
            this.y, 
            this.width, 
            this.height,
            this.width * 0.3,
            this.height * 0.5
        );

        this.battery.drawBattery(renderer);
        /*
        for (let i = 0; i < this.tires.length; i++) {
            this.tires[i].draw(renderer);
        }*/
    }

    resetCar() {
        this.curF_engine = this.curF_engine.scale(0);
        this.curF_brake = this.curF_brake.scale(0);
        this.turning = false;
        this.velocity = new Vec2(0,0);
        this.acceleration = new Vec2(0,0);
        this.drivingAngle = 0;

        this.x = this.spawnX;
        this.y = this.spawnY;
    }

    reset() {
        this.curF_engine = this.curF_engine.scale(0);
        this.curF_brake = this.curF_brake.scale(0);
        this.turning = false;
    }

    accelerate() {
        if (this.battery.batteryLeft > 0) {
            this.curF_engine = new Vec2(
                this.engine_force_mag * Math.cos(this.drivingAngle), 
                this.engine_force_mag * Math.sin(this.drivingAngle)
            );
        }
    }

    turnRight(dt) {
        this.steeringAngle += this.steeringRate * dt;
        this.turning = true;
        if (this.steeringAngle < -this.maxSteering) {
            this.steeringAngle = -this.maxSteering;
        }
    }

    turnLeft(dt) {
        this.steeringAngle -= this.steeringRate * dt;
        this.turning = true;
        if (this.steeringAngle > this.maxSteering) {
            this.steeringAngle = this.maxSteering;
        }
    }

    brake() {
        if (this.velocity.length() > 0.01) {
            this.curF_brake = this.velocity
                .normalize()
                .scale(-this.brake_force_mag);
        } else {
            this.curF_brake = new Vec2(0,0);
        }
    }

    update(dt, terrain) {
        /* TODO: add gravity
        // //console.log("TIRES:");
        for (let i = 0; i < 4; i++) {
            this.tires[i].update(this.x, this.y, this.drivingAngle, terrain);
            //console.log("Tire " + i + ": [" + this.tires[i].x + ", " + this.tires[i].y + "] with a height of " + this.tires[i].height);
        }
        let o = (this.tires[0].height + this.tires[1].height) / 2 - (this.tires[2].height + this.tires[3].height) / 2;
        this.theta = Math.atan2(-o * 0.2, this.wheelbase); //0.2 means that each point of difference in terrain is about 20cm 
        */

        //console.log("o: " + (5*(this.tires[0].height + this.tires[1].height) / 2 - 5*(this.tires[2].height + this.tires[3].height) / 2));
        this.N = this.calculateNormalForce(this.m, this.g, this.theta);
        const F_drag = this.calculateDragForce(
            this.C,
            this.rho,
            this.A,
            this.velocity
        );

        const F_rr = this.calculateRollingResistance(
            this.C_r,
            this.N
        );

        const F_gravity = this.calculateGravity(
            this.m,
            this.g,
            this.theta
        )

        const F_lf = this.calculateLateralFriction(
            this.N
        )
        //console.log(F_gravity);
        const returnRate = 4; // higher = snappier return
        if (!this.turning) {
            this.steeringAngle += -this.steeringAngle * returnRate * dt;
        }
        const totalForce = this.curF_engine
            .clone()
            .add(this.curF_brake)
            .add(F_rr)
            .add(F_gravity)
            .add(F_drag)
            .add(F_lf);

        this.acceleration = totalForce.scale(dt/this.m);
        //console.log(this.acceleration);
        
        this.velocity = this.velocity
            .clone()
            .add(this.acceleration);

        //console.log("Should it slide: " + (((this.velocity.length()*this.velocity.length()) / (Math.abs(this.wheelbase / Math.tan(this.steeringAngle)) * this.g)) > 0.9));

        this.battery.updateBattery(this.velocity, this.curF_engine, dt, this.PIXELS_TO_METERS);
        
        this.drivingAngle += this.updateDrivingAngle(this, dt);
        //console.log(this.drivingAngle);
        this.x += this.velocity.x * dt * this.PIXELS_TO_METERS;
        this.y += this.velocity.y * dt * this.PIXELS_TO_METERS;
    }
}