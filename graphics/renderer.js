import { m3 } from "../utilities/matrix.js";

export function initRenderer(gl) {
    const backgroundProgram = initShaderProgram(gl, backgroundVertexShaderSource(), backgroundFragmentShaderSource());
    const backgroundProgramInfo = {
        program: backgroundProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(backgroundProgram, "aPosition"),
          texCoordLoc: gl.getAttribLocation(backgroundProgram, 'aTexCoords'),
        },
        uniformLocations: {
            matrixLoc: gl.getUniformLocation(backgroundProgram, 'uMatrix'),
            textureLoc: gl.getUniformLocation(backgroundProgram, 'uSampler'),
            colors: gl.getUniformLocation(backgroundProgram, 'colors'),
        }
    };

    const vehicleProgram = initShaderProgram(gl, vehicleVertexShaderSource(), vehicleFragmentShaderSource());
    const vehicleProgramInfo = {
        program: vehicleProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(vehicleProgram, "aPosition"),
          texCoordLoc: gl.getAttribLocation(vehicleProgram, 'aTexCoords'),
        },
        uniformLocations: {
            matrixLoc: gl.getUniformLocation(vehicleProgram, 'uMatrix'),
            textureLoc: gl.getUniformLocation(vehicleProgram, 'uSampler'),
        }
    };

    const batteryProgram = initShaderProgram(gl, vehicleVertexShaderSource(), vehicleFragmentShaderSource());
    const batteryProgramInfo = {
        program: batteryProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(batteryProgram, "aPosition"),
          texCoordLoc: gl.getAttribLocation(batteryProgram, 'aTexCoords'),
        },
        uniformLocations: {
            matrixLoc: gl.getUniformLocation(batteryProgram, 'uMatrix'),
            textureLoc: gl.getUniformLocation(batteryProgram, 'uSampler'),
        }
    };

    return {
        drawQuad: (x, y, width, height) => {
            const gridProgram = initShaderProgram(gl, gridVertexShaderSource(), gridFragmentShaderSource());
            const gridProgramInfo = {
                program: gridProgram,
                attribLocations: {
                  vertexPosition: gl.getAttribLocation(gridProgram, "aPosition"),
                },
            };

            const x1 = (x / gl.canvas.width) * 2 - 1;
            const y1 = 1 - (y / gl.canvas.height) * 2;
            const x2 = ((x+width) / gl.canvas.width) * 2 - 1;
            const y2 = 1 - ((y + height) / gl.canvas.height) * 2;

            gl.useProgram(gridProgramInfo.program);
            const vertexBufferData = new Float32Array([
                x1, y1,
                x2, y1,
                x2,  y2,
                x1, y2,
            ]);

            const elementIndexData = new Uint8Array([
                0,1,2,
                2,3,0,
            ]);

            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertexBufferData, gl.STATIC_DRAW);
            gl.vertexAttribPointer(gridProgramInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gridProgramInfo.attribLocations.vertexPosition);

            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elementIndexData, gl.STATIC_DRAW);

            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
        },

        drawBackground: (backgroundTex) => {
            gl.useProgram(backgroundProgram);

            //colors were created using ChatGPT
            const colors = [
                255, 255, 255,   // bright peak snow
                180, 255, 170,   // pale grass / alpine green
                40, 80, 30,      // forest green / shadows
                10, 20, 10,      // almost black
                0, 0, 0,         // black base (for deep valleys)
                0, 0, 0,
                0, 0, 0,        // duplicate for safe indexing
            ];
        
            normalizeColor(colors);
        
            gl.uniform3fv(backgroundProgramInfo.uniformLocations.colors, colors);

            let matrix = m3.orthographic(0, gl.canvas.width, gl.canvas.height, 0);
            matrix = m3.multiply(matrix, m3.scaling(1, -1));
            matrix = m3.multiply(matrix, m3.translation(0, -gl.canvas.height));
            matrix = m3.multiply(matrix, m3.translation(0, 0));
            matrix = m3.multiply(matrix, m3.scaling(gl.canvas.width, gl.canvas.height));

            drawImage(gl, backgroundProgramInfo, backgroundTex, 0, 0, gl.canvas.width, gl.canvas.height, matrix);
        },
        /* draws a vehicle
        * param rotateX xLocation in pixels from origin of image of where to rotate off of
        * param rotateY yLocation in pixels from origin of image of where to rotate off of
        */
        drawVehicle: (vehicleTex, rot, x, y, width, height, rotateX, rotateY) => {
            gl.useProgram(vehicleProgram);

            let matrix = m3.orthographic(0, gl.canvas.width, 0, gl.canvas.height);
            matrix = m3.multiply(matrix, m3.translation(x, y));
            matrix = m3.multiply(matrix, m3.rotation(rot)); 
            matrix = m3.multiply(matrix, m3.translation(-rotateX, rotateY));
            matrix = m3.multiply(matrix, m3.rotation(Math.PI / 2)); // math.pi / 2 to account for the fact that my image starts facing up 
            matrix = m3.multiply(matrix, m3.translation(0, height));
            matrix = m3.multiply(matrix, m3.scaling(width, -height));

            drawImage(gl, vehicleProgramInfo, vehicleTex, x, y, width, height, matrix);
        },

        drawGrid: (width, height, step) => {
            const gridProgram = initShaderProgram(gl, gridVertexShaderSource(), gridFragmentShaderSource());
            const gridProgramInfo = {
                program: gridProgram,
                attribLocations: {
                  vertexPosition: gl.getAttribLocation(gridProgram, "aPosition"),
                },
            };

            gl.useProgram(gridProgramInfo.program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            const positionArr = [];
            for (let j = 0; j < width / step; j++) {
                const xClip = (j*step / gl.canvas.width) * 2 - 1;
                positionArr[4*j] = xClip;
                positionArr[4*j+1] = -1;
                positionArr[4*j+2] = xClip;
                positionArr[4*j+3] = 1;
            }
            for (let j = 0; j < height / step; j++) {
                const yClip = (j*step / gl.canvas.height) * 2 - 1;
                positionArr.push(-1);
                positionArr.push(yClip);
                positionArr.push(1);
                positionArr.push(yClip);
            }
            //console.log(positionArr.length);
            const positions = new Float32Array(positionArr);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(gridProgramInfo.attribLocations.vertexPosition);
            gl.vertexAttribPointer(gridProgramInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, positionArr.length / 2);
        },

        // drawTire: () => {
        //     const gridProgram = initShaderProgram(gl, gridVertexShaderSource(), gridFragmentShaderSource());
        //     const gridProgramInfo = {
        //         program: gridProgram,
        //         attribLocations: {
        //           vertexPosition: gl.getAttribLocation(gridProgram, "aPosition"),
        //         },
        //     };

        //     gl.drawArrays(gl.PO, 0, positionArr.length / 2);
        // },

        drawBattery: (tex, x, y, width, height) => {
            gl.useProgram(batteryProgram);
            
            let matrix = m3.orthographic(0, gl.canvas.width, 0, gl.canvas.height);
            matrix = m3.multiply(matrix, m3.translation(x, y));
            matrix = m3.multiply(matrix, m3.translation(0, height));
            matrix = m3.multiply(matrix, m3.scaling(width, -height));

            drawImage(gl, batteryProgramInfo, tex, x, y, width, height, matrix);
        }
    }
}

function drawImage (gl, programInfo, texture, x, y, width, height, matrix) {
    if (gl.isTexture(texture)) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
    } else {
        createTexture(texture);
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(programInfo.attribLocations.texCoordLoc);
    gl.vertexAttribPointer(programInfo.attribLocations.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix3fv(programInfo.uniformLocations.matrixLoc, false, matrix);

    gl.uniform1i(programInfo.uniformLocations.textureLoc, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
} 

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }
  
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
          `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createTexture(img) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return tex;
}

function normalizeColor(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = arr[i] / 255;
    }
}

function backgroundVertexShaderSource() {
    return `#version 300 es

    in vec2 aPosition;
    in vec2 aTexCoords;
    
    uniform mat3 uMatrix;

    out vec2 vTexCoords;

    void main() {
        vec3 pos = uMatrix * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        vTexCoords = aTexCoords;
    }`;
}

function backgroundFragmentShaderSource() {
    return `#version 300 es

    precision mediump float;

    in vec2 vTexCoords;

    uniform sampler2D uSampler;
    uniform vec3 colors[5];

    out vec4 fragColor;

    vec3 colorGradient(float l) {
        float scaled = l * 4.0;            // range [0, 4]
        int index = int(floor(scaled));    // base index
        float t = fract(scaled);           // fractional part = interpolation factor

        // Clamp to avoid going out of bounds
        index = clamp(index, 0, 3);        // max index is 3, so we can access index+1

        return mix(colors[index], colors[index + 1], t);
    }

    vec3 contourLines(float l) {
        if (mod(100.0*l, 2.0) < 0.1) {
            return vec3(0.2);
        } else {
            return colorGradient(l);
        }
    }

    void main() {
        float lightness = texture(uSampler, vTexCoords).r;
        fragColor = vec4(contourLines( lightness ), 1.0);
    }`;
}

function vehicleVertexShaderSource() {
    return `#version 300 es

    in vec2 aPosition;
    in vec2 aTexCoords;
    
    uniform mat3 uMatrix;

    out vec2 vTexCoords;

    void main() {
        vec3 pos = uMatrix * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        vTexCoords = aTexCoords;
    }`;
}

function vehicleFragmentShaderSource() {
    return `#version 300 es

    precision mediump float;

    in vec2 vTexCoords;

    uniform sampler2D uSampler;

    out vec4 fragColor;

    void main() {
        vec4 texColor = texture(uSampler, vTexCoords);
        if (texColor.a < 0.1) discard;
        fragColor = texColor;
    }`;
}

function gridVertexShaderSource() {
    return `#version 300 es

    in vec2 aPosition;

    void main() {
        gl_Position = vec4(aPosition.xy, 0.0, 1.0);
    }`;
}

function gridFragmentShaderSource() {
    return `#version 300 es

    precision mediump float;

    out vec4 fragColor;

    void main() {
        fragColor = vec4(0.0,0.0,0.0,1.0);
    }`;
}