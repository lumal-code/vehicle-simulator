export var m3 = {
    identity: () => {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ];
    },

    orthographic: (left, right, bottom, top) => {
        return [
            2 / (right - left), 0, 0,
            0, -2 / (top - bottom), 0,
            -(right + left) / (right - left), (top + bottom) / (top - bottom), 1
        ];
    },

    multiply: function(b, a) {
        const c = new Array(9).fill(0);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                for (let k = 0; k < 3; k++) {
                    c[3*row + col] += a[row*3+k]*b[k*3 + col];
                }
            }
        }
        return c;
    },

    translation: function(tx, ty) {
        return [
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1,
        ];
    },
     
    rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
            c,-s, 0,
            s, c, 0,
            0, 0, 1,
        ];
    },
    
    scaling: function(sx, sy) {
        return [
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1,
        ];
    },
}