class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.setIdentity();
    }
    
    setIdentity() {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8]  = 0; e[12] = 0;
        e[1] = 0; e[5] = 1; e[9]  = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }
    
    setPerspective(fovy, aspect, near, far) {
        const e = this.elements;
        const rd = Math.PI / 180;
        const s = Math.sin(fovy * rd);
        const ct = Math.cos(fovy * rd) / s;
        const nf = 1 / (near - far);
        
        e[0] = ct / aspect; e[4] = 0;  e[8]  = 0;           e[12] = 0;
        e[1] = 0;           e[5] = ct; e[9]  = 0;           e[13] = 0;
        e[2] = 0;           e[6] = 0;  e[10] = (far + near) * nf; e[14] = 2 * far * near * nf;
        e[3] = 0;           e[7] = 0;  e[11] = -1;          e[15] = 0;
        return this;
    }
    
    setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        const e = this.elements;
        let fx = centerX - eyeX;
        let fy = centerY - eyeY;
        let fz = centerZ - eyeZ;
        
        let rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
        fx *= rlf; fy *= rlf; fz *= rlf;
        
        let sx = fy * upZ - fz * upY;
        let sy = fz * upX - fx * upZ;
        let sz = fx * upY - fy * upX;
        
        let rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
        sx *= rls; sy *= rls; sz *= rls;
        
        const ux = sy * fz - sz * fy;
        const uy = sz * fx - sx * fz;
        const uz = sx * fy - sy * fx;
        
        e[0] = sx; e[4] = ux; e[8]  = -fx; e[12] = 0;
        e[1] = sy; e[5] = uy; e[9]  = -fy; e[13] = 0;
        e[2] = sz; e[6] = uz; e[10] = -fz; e[14] = 0;
        e[3] = 0;  e[7] = 0;  e[11] = 0;   e[15] = 1;
        
        return this.translate(-eyeX, -eyeY, -eyeZ);
    }
    
    setTranslate(x, y, z) {
        const e = this.elements;
        e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
        e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
        e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
        e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
        return this;
    }
    
    translate(x, y, z) {
        const e = this.elements;
        e[12] += e[0] * x + e[4] * y + e[8]  * z;
        e[13] += e[1] * x + e[5] * y + e[9]  * z;
        e[14] += e[2] * x + e[6] * y + e[10] * z;
        e[15] += e[3] * x + e[7] * y + e[11] * z;
        return this;
    }
    
    scale(x, y, z) {
        const e = this.elements;
        e[0] *= x; e[4] *= y; e[8]  *= z;
        e[1] *= x; e[5] *= y; e[9]  *= z;
        e[2] *= x; e[6] *= y; e[10] *= z;
        e[3] *= x; e[7] *= y; e[11] *= z;
        return this;
    }
    
    rotate(angle, x, y, z) {
        const radian = Math.PI * angle / 180;
        const c = Math.cos(radian);
        const s = Math.sin(radian);
        const nc = 1 - c;
        const len = Math.sqrt(x*x + y*y + z*z);
        x /= len; y /= len; z /= len;
        
        const m = new Float32Array([
            x*x*nc + c,   x*y*nc + z*s, x*z*nc - y*s, 0,
            x*y*nc - z*s, y*y*nc + c,   y*z*nc + x*s, 0,
            x*z*nc + y*s, y*z*nc - x*s, z*z*nc + c,   0,
            0,            0,            0,            1
        ]);
        
        return this.multiply(new Matrix4().set(m));
    }
    
    multiply(other) {
        const a = this.elements;
        const b = other.elements;
        const c = new Float32Array(16);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                c[i*4 + j] = a[i*4] * b[j] + a[i*4 + 1] * b[4 + j] + 
                           a[i*4 + 2] * b[8 + j] + a[i*4 + 3] * b[12 + j];
            }
        }
        
        this.elements = c;
        return this;
    }
    
    set(elements) {
        for (let i = 0; i < 16; i++) {
            this.elements[i] = elements[i];
        }
        return this;
    }
    
    setInverseOf(other) {
        const s = other.elements;
        const d = this.elements;
        const inv = new Float32Array(16);
        
        inv[0] = s[5]*s[10]*s[15] - s[5]*s[11]*s[14] - s[9]*s[6]*s[15] + s[9]*s[7]*s[14] + s[13]*s[6]*s[11] - s[13]*s[7]*s[10];
        inv[4] = -s[4]*s[10]*s[15] + s[4]*s[11]*s[14] + s[8]*s[6]*s[15] - s[8]*s[7]*s[14] - s[12]*s[6]*s[11] + s[12]*s[7]*s[10];
        inv[8] = s[4]*s[9]*s[15] - s[4]*s[11]*s[13] - s[8]*s[5]*s[15] + s[8]*s[7]*s[13] + s[12]*s[5]*s[11] - s[12]*s[7]*s[9];
        inv[12] = -s[4]*s[9]*s[14] + s[4]*s[10]*s[13] + s[8]*s[5]*s[14] - s[8]*s[6]*s[13] - s[12]*s[5]*s[10] + s[12]*s[6]*s[9];
        inv[1] = -s[1]*s[10]*s[15] + s[1]*s[11]*s[14] + s[9]*s[2]*s[15] - s[9]*s[3]*s[14] - s[13]*s[2]*s[11] + s[13]*s[3]*s[10];
        inv[5] = s[0]*s[10]*s[15] - s[0]*s[11]*s[14] - s[8]*s[2]*s[15] + s[8]*s[3]*s[14] + s[12]*s[2]*s[11] - s[12]*s[3]*s[10];
        inv[9] = -s[0]*s[9]*s[15] + s[0]*s[11]*s[13] + s[8]*s[1]*s[15] - s[8]*s[3]*s[13] - s[12]*s[1]*s[11] + s[12]*s[3]*s[9];
        inv[13] = s[0]*s[9]*s[14] - s[0]*s[10]*s[13] - s[8]*s[1]*s[14] + s[8]*s[2]*s[13] + s[12]*s[1]*s[10] - s[12]*s[2]*s[9];
        inv[2] = s[1]*s[6]*s[15] - s[1]*s[7]*s[14] - s[5]*s[2]*s[15] + s[5]*s[3]*s[14] + s[13]*s[2]*s[7] - s[13]*s[3]*s[6];
        inv[6] = -s[0]*s[6]*s[15] + s[0]*s[7]*s[14] + s[4]*s[2]*s[15] - s[4]*s[3]*s[14] - s[12]*s[2]*s[7] + s[12]*s[3]*s[6];
        inv[10] = s[0]*s[5]*s[15] - s[0]*s[7]*s[13] - s[4]*s[1]*s[15] + s[4]*s[3]*s[13] + s[12]*s[1]*s[7] - s[12]*s[3]*s[5];
        inv[14] = -s[0]*s[5]*s[14] + s[0]*s[6]*s[13] + s[4]*s[1]*s[14] - s[4]*s[2]*s[13] - s[12]*s[1]*s[6] + s[12]*s[2]*s[5];
        inv[3] = -s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11] - s[5]*s[3]*s[10] - s[9]*s[2]*s[7] + s[9]*s[3]*s[6];
        inv[7] = s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11] + s[4]*s[3]*s[10] + s[8]*s[2]*s[7] - s[8]*s[3]*s[6];
        inv[11] = -s[0]*s[5]*s[11] + s[0]*s[7]*s[9] + s[4]*s[1]*s[11] - s[4]*s[3]*s[9] - s[8]*s[1]*s[7] + s[8]*s[3]*s[5];
        inv[15] = s[0]*s[5]*s[10] - s[0]*s[6]*s[9] - s[4]*s[1]*s[10] + s[4]*s[2]*s[9] + s[8]*s[1]*s[6] - s[8]*s[2]*s[5];
        
        const det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
        if (det === 0) return this;
        
        const invDet = 1.0 / det;
        for (let i = 0; i < 16; i++) {
            d[i] = inv[i] * invDet;
        }
        
        return this;
    }
    
    transpose() {
        const e = this.elements;
        let t;
        t = e[1];  e[1]  = e[4];  e[4]  = t;
        t = e[2];  e[2]  = e[8];  e[8]  = t;
        t = e[3];  e[3]  = e[12]; e[12] = t;
        t = e[6];  e[6]  = e[9];  e[9]  = t;
        t = e[7];  e[7]  = e[13]; e[13] = t;
        t = e[11]; e[11] = e[14]; e[14] = t;
        return this;
    }
}