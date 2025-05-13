import { loadImageAndCreateTextureInfo } from "../utilities/image-handler.js";

export function initVehicle(gl, renderer) {
    const vehicleTex = loadImageAndCreateTextureInfo(gl, '../resources/car.png');

    const vehicle = {
        PIXELS_TO_METERS: 5,
        x: 0,
        y: 100,
        width: vehicleTex.width,
        height: vehicleTex.height,
        velocity: 0, // (m/s)
        acceleration: 0, //(m/s^2)
        distance: 0,
        sliding: false,
        turning: false,
        drivingAngle: 0, // (rad)
        steeringAngle: 0, //(rad)
        steeringRate: 1, //(rad/s)
        maxSteering: Math.PI / 6, //(rad)
        slipAmount: 0,
        theta: 0, //current angle of the car
        g: 9.81, // gravity (m/s^2)
        m: 1800, //mass (kg))
        F_engine: 12000, //max force of engine (N)
        curF_engine: 0,
        F_brake: 12000,//max force of braking (N)
        curF_brake: 0,
        r: 0.3, //wheel radius (m)
        n: 0.25, //gear ratio (1:4 in this case)
        C: 0.29, // coeff of air resistance
        rho: 1.225, // density of the air (kg/m^3)
        A: 2.2, //reference area of air drag (m^2)
        N: 0, //normal force calculated after (N)
        C_r: 0.015, //coeff of rolling resistance
        C_bf: 0.3, //coeff of brake friction
        draw: function() {
            renderer.drawVehicle(vehicleTex.texture, this.drivingAngle, this.x, this.y, this.width / 10, this.height / 10);
        },

        reset: function() {
            this.curF_engine = 0;
            this.curF_brake = 0;
            this.turning = false;
        },

        accelerate: function(dt) {
            this.curF_engine = this.F_engine;
        },

        turnRight: function(dt) {
            this.steeringAngle -= this.steeringRate * dt;
            this.turning = true;
            if (this.steeringAngle < -this.maxSteering) {
                this.steeringAngle = -this.maxSteering;
            }
        },

        turnLeft: function(dt) {
            this.steeringAngle += this.steeringRate * dt;
            this.turning = true;
            if (this.steeringAngle > this.maxSteering) {
                this.steeringAngle = this.maxSteering;
            }
        },

        brake: function(dt) {
            this.curF_brake = this.F_brake;
        },

        update: function(dt,terrain) {
            //update angle the car is driving at
            //TODO: the frontAvg has to change when the car is facing different directions.
            //console.log("[" + Math.floor(this.x) + ", " + Math.floor(this.y) + "]");

            //console.log(dHeight);
            //this.theta = Math.atan2(dHeight, this.height / 10);
            //console.log(this.theta);
            const F_drag = calculateDragForce(
                this.C,
                this.rho,
                this.A,
                this.velocity
            );

            const F_rr = calculateRollingResistance(
                this.C_r,
                this.N
            );

            const F_gravity = calculateGravity(
                this.m,
                this.g,
                this.theta
            )
            //console.log(F_gravity);
            const returnRate = 4; // higher = snappier return
            if (!this.turning) {
                this.steeringAngle += -this.steeringAngle * returnRate * dt;
            }

            const totalResistingForce = this.curF_brake + F_drag + F_rr + F_gravity;
            this.acceleration = (this.curF_engine - Math.sign(this.velocity) * totalResistingForce) / this.m;
            
            this.velocity = this.velocity + this.acceleration * dt;


            this.distance += this.velocity * dt;
            
            
            this.drivingAngle += updateDrivingAngle(this, dt);
            //console.log(this.drivingAngle);
            this.x += Math.cos(this.drivingAngle) * this.velocity * dt * this.PIXELS_TO_METERS;
            this.y += -Math.sin(this.drivingAngle) * this.velocity * dt * this.PIXELS_TO_METERS;
            // if (this.x > gl.canvas.width || this.x < 0) {
            //     this.x = 10;
            // }
            // if (this.y > gl.canvas.width || this.y < 0) {
            //     this.y = 300;
            // }
        },

        getVelocity: function() {
            return this.velocity;
        }
    }

    vehicle.N = calculateNormalForce(vehicle.m, vehicle.g, vehicle.theta)

    vehicleTex.image.onload = () => {
        vehicleTex.width = vehicleTex.image.width;
        vehicleTex.height = vehicleTex.image.height;
        vehicle.width = vehicleTex.width;
        vehicle.height = vehicleTex.height;
    }

    return vehicle;
}

function calculateNormalForce(m, g, theta) {
    return m*g*Math.cos(theta);
}

function calculateDragForce(C, rho, A, v) {
    return 0.5 * C * rho * A * v**2;
}

function calculateRollingResistance(C_r, N) {
    return 4*C_r*N;
}

function calculateGravity(m, g, theta) {
    return m*g*Math.sin(theta);
}

function updateDrivingAngle(vehicle, dt) {
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
//tire is 0-3 clockwise from the top left
function heightAtTire(x, y, width, height, tire) {
    const wheelX = this.x;
    const wheelY = this.y;
    if (tire = 0) {
        return terrain.heightAtPixel(this.x, this.y);
    } else if (tire = 1) {
        wheelX = this.x; 
    }
    terrain.heightAtPixel(this.x, this.y)
}