class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = -2;
        this.segments = 16;
    }
    
    render() {
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        this.normalMatrix.setInverseOf(this.matrix);
        this.normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
        
        for (let lat = 0; lat < this.segments; lat++) {
            for (let lon = 0; lon < this.segments; lon++) {
                const lat0 = Math.PI * lat / this.segments - Math.PI/2;
                const lat1 = Math.PI * (lat+1) / this.segments - Math.PI/2;
                const lon0 = 2 * Math.PI * lon / this.segments;
                const lon1 = 2 * Math.PI * (lon+1) / this.segments;
                
                const vertices = new Float32Array([
                    Math.cos(lat0) * Math.cos(lon0), Math.sin(lat0), Math.cos(lat0) * Math.sin(lon0),
                    Math.cos(lat1) * Math.cos(lon0), Math.sin(lat1), Math.cos(lat1) * Math.sin(lon0),
                    Math.cos(lat0) * Math.cos(lon1), Math.sin(lat0), Math.cos(lat0) * Math.sin(lon1),
                    
                    Math.cos(lat1) * Math.cos(lon0), Math.sin(lat1), Math.cos(lat1) * Math.sin(lon0),
                    Math.cos(lat1) * Math.cos(lon1), Math.sin(lat1), Math.cos(lat1) * Math.sin(lon1),
                    Math.cos(lat0) * Math.cos(lon1), Math.sin(lat0), Math.cos(lat0) * Math.sin(lon1),
                ]);
                
                for (let i = 0; i < vertices.length; i++) {
                    vertices[i] *= 0.5;
                }
                
                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(a_Position);
                
                gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(a_Normal);
                
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
    }
}

function drawSphere(modelMatrix, color, segments) {
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    gl.uniform1i(u_whichTexture, -2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    
    for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
            const lat0 = Math.PI * lat / segments - Math.PI/2;
            const lat1 = Math.PI * (lat+1) / segments - Math.PI/2;
            const lon0 = 2 * Math.PI * lon / segments;
            const lon1 = 2 * Math.PI * (lon+1) / segments;
            
            const vertices = new Float32Array([
                Math.cos(lat0) * Math.cos(lon0), Math.sin(lat0), Math.cos(lat0) * Math.sin(lon0),
                Math.cos(lat1) * Math.cos(lon0), Math.sin(lat1), Math.cos(lat1) * Math.sin(lon0),
                Math.cos(lat0) * Math.cos(lon1), Math.sin(lat0), Math.cos(lat0) * Math.sin(lon1),
                
                Math.cos(lat1) * Math.cos(lon0), Math.sin(lat1), Math.cos(lat1) * Math.sin(lon0),
                Math.cos(lat1) * Math.cos(lon1), Math.sin(lat1), Math.cos(lat1) * Math.sin(lon1),
                Math.cos(lat0) * Math.cos(lon1), Math.sin(lat0), Math.cos(lat0) * Math.sin(lon1),
            ]);
            
            for (let i = 0; i < vertices.length; i++) {
                vertices[i] *= 0.5;
            }
            
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_Position);
            
            gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_Normal);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
}