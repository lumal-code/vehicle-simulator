const p = createPermutationTable();

for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i];
}

const grad2 = [
    [ 1, 0], [-1, 0], [ 0, 1], [ 0,-1],
    [ 1, 1], [-1, 1], [ 1,-1], [-1,-1]
];

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
    return a + t * (b - a);
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
}

export function perlinNoise(x, y, p) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const dx = x - Math.floor(x);
    const dy = y - Math.floor(y);

    const u = fade(dx);
    const v = fade(dy);

    const AA = p[X] + Y;
    const AB = p[X + 1] + Y;
    const BA = p[X] + Y + 1;
    const BB = p[X + 1] + Y + 1;

    const gradAA = grad2[p[AA] % grad2.length];
    const gradAB = grad2[p[AB] % grad2.length];
    const gradBA = grad2[p[BA] % grad2.length];
    const gradBB = grad2[p[BB] % grad2.length];

    const dotAA = dot(gradAA, [dx, dy]);
    const dotAB = dot(gradAB, [dx - 1, dy]);
    const dotBA = dot(gradBA, [dx, dy - 1]);
    const dotBB = dot(gradBB, [dx - 1, dy - 1]);

    const x1 = lerp(dotAA, dotAB, u);
    const x2 = lerp(dotBA, dotBB, u);
    return lerp(x1, x2, v);
}

function octavePerlinNoise(x, y, octaves, persistance, lacunarity, p) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += perlinNoise(x * frequency, y * frequency, p) * amplitude;
        maxValue += amplitude;

        amplitude *= persistance;
        frequency *= lacunarity;
    }

    return total / maxValue;
}

export function printNoiseGrid(width, height, scale = 20) {
    for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
            const val = perlinNoise(x * scale, y * scale);
            const normalized = (val + 1) / 2;  // Map from [-1, 1] to [0, 1]
            row += normalized.toFixed(2) + ' ';
        }
        console.log(row.trim());
    }
}

export function generateNoiseTexture(width, height, scale = 0.002) {
    const data = new Uint8Array(width * height);
    const octaves = 4;
    const p = createPermutationTable();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const noise = octavePerlinNoise(x * scale, y * scale, octaves, 0.5, 2.0, p);
            const normalized = Math.floor(((noise + 1) / 2) * 255);
            data[width*y + x] = normalized;
        }
    }

    return data;
}

export function createPerlinTexture(gl, width, height) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const data = generateNoiseTexture(width, height);

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
    )

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, null);  // Clean up
    return {data, tex};
}

function createPermutationTable() {
    const perm = Array.from({ length: 256 }, (_, i) => i);

    for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    // Duplicate for overflow handling
    for (let i = 0; i < 256; i++) {
        perm[256 + i] = perm[i];
    }

    return perm;
}