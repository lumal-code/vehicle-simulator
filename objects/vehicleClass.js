import { loadImageAndCreateTextureInfo } from "../image-handler.js";
import { Tire } from "./tire.js";
import { Battery } from "./battery.js";
import { Vec2 } from "../vector.js";

export class Vehicle {
    constructor(gl) {
        this.PIXELS_TO_METERS = 5;
        this.x = 100;
        this.y = 100;
        this.tex = loadImageAndCreateTextureInfo(gl, '../resources/car.png');
        this.width = this.tex.width / 10;
        this.height = this.tex.height / 10;
        this.centerX = this.width * 0.3;
        this.centerY = this.height * 0.5;
        this.tires = [];
        for (let i = 0; i < 4; i++) {
            this.tires[i] = new Tire(this.x, this.y, this.tex.height, this.tex.width, this.centerX, this.centerY, i);
        }
        this.battery = new Battery(100, gl); //10kWh
        this.velocity = 0;
        this.acceleration = 0;
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
        this.F_engine = 12000; 
        this.curF_engine = 0;
        this.F_brake = 12000;
        this.curF_brake = 0;
        this.r = 0.3;
        this.n = 0.25;
        this.C = 0.29
        this.rho = 1.225;
        this.A = 2.2;
        this.N = this.m*this.g*Math.cos(this.theta);
        this.C_r = 0.015;
        this.C_bf;
    }

    calculateNormalForce(m, g, theta) {
        return m*g*Math.cos(theta);
    }
    
    calculateDragForce(C, rho, A, v) {
        return 0.5 * C * rho * A * v**2;
    }
    
    calculateRollingResistance(C_r, N) {
        return 4*C_r*N;
    }
    
    calculateGravity(m, g, theta) {
        return m*g*Math.sin(theta);
    }

    updateDrivingAngle(vehicle, dt) {
        if (Math.abs(vehicle.steeringAngle) < 0.1) {
            return 0;
        }
        const turnRadius = 2.5 / Math.tan(vehicle.steeringAngle);
        const centripetalForce = vehicle.m * vehicle.velocity * vehicle.velocity / turnRadius;
        const mu = 0.9;
        const F_grip = vehicle.g * vehicle.m * mu;
        const angularVelocity = vehicle.velocity / turnRadius; // rad/s
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
            this.drivingAngle, 
            this.x, 
            this.y, 
            this.width, 
            this.height,
            this.width * 0.3,
            this.height * 0.5
        );

        this.battery.drawBattery(renderer);
    }

    reset() {
        this.curF_engine = 0;
        this.curF_brake = 0;
        this.turning = false;
    }

    accelerate() {
        if (this.battery.batteryLeft > 0) {
            this.curF_engine = this.F_engine;
        }
    }

    turnRight(dt) {
        this.steeringAngle -= this.steeringRate * dt;
        this.turning = true;
        if (this.steeringAngle < -this.maxSteering) {
            this.steeringAngle = -this.maxSteering;
        }
    }

    turnLeft(dt) {
        this.steeringAngle += this.steeringRate * dt;
        this.turning = true;
        if (this.steeringAngle > this.maxSteering) {
            this.steeringAngle = this.maxSteering;
        }
    }

    brake() {
        this.curF_brake = this.F_brake;
    }

    update(dt, terrain) {
        //console.log("TIRES:");
        // for (let i = 0; i < 4; i++) {
        //     this.tires[i].update(this.x, this.y, this.drivingAngle, terrain);
        //     //console.log("Tire " + i + ": [" + this.tires[i].x + ", " + this.tires[i].y + "] with a height of " + this.tires[i].height);
        // }
        // let o = (this.tires[0].height + this.tires[1].height) / 2 - (this.tires[2].height + this.tires[3].height) / 2;
        // let h = this.height;
        // if (o > h) {
        //     o = h;
        // } else if (o < -h) {
        //     o = -h;
        // }
        // this.theta = Math.asin(o/h);

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

        const returnRate = 4; // higher = snappier return
        if (!this.turning) {
            this.steeringAngle += -this.steeringAngle * returnRate * dt;
        }

        const totalResistingForce = this.curF_brake + F_drag + F_rr;

        this.acceleration = (this.curF_engine - Math.sign(this.velocity) * F_gravity - Math.sign(this.velocity) * totalResistingForce) / this.m;
        
        this.velocity = this.velocity + this.acceleration * dt;


        this.distance += this.velocity * dt;

        this.battery.updateBattery(this.velocity, this.curF_engine, dt, this.PIXELS_TO_METERS);
        
        this.drivingAngle += this.updateDrivingAngle(this, dt);
        //console.log(this.drivingAngle);
        this.x += Math.cos(this.drivingAngle) * this.velocity * dt * this.PIXELS_TO_METERS;
        this.y += -Math.sin(this.drivingAngle) * this.velocity * dt * this.PIXELS_TO_METERS;
    }
}