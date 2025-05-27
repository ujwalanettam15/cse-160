// Sphere class with normals
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
      // Set uniforms
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
      // Calculate normal matrix
      this.normalMatrix.setInverseOf(this.matrix);
      this.normalMatrix.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
      
      // Generate sphere vertices
      let vertices = [];
      let normals = [];
      let uvs = [];
      
      for (let lat = 0; lat <= this.segments; lat++) {
        const theta = lat * Math.PI / this.segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let lon = 0; lon <= this.segments; lon++) {
          const phi = lon * 2 * Math.PI / this.segments;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
          
          const x = cosPhi * sinTheta;
          const y = cosTheta;
          const z = sinPhi * sinTheta;
          
          vertices.push(x * 0.5, y * 0.5, z * 0.5);
          normals.push(x, y, z); // For a unit sphere, normal = position
          uvs.push(lon / this.segments, lat / this.segments);
        }
      }
      
      // Generate triangles
      for (let lat = 0; lat < this.segments; lat++) {
        for (let lon = 0; lon < this.segments; lon++) {
          const first = lat * (this.segments + 1) + lon;
          const second = first + this.segments + 1;
          
          // First triangle
          const v1 = [vertices[first * 3], vertices[first * 3 + 1], vertices[first * 3 + 2]];
          const v2 = [vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2]];
          const v3 = [vertices[first * 3 + 3], vertices[first * 3 + 4], vertices[first * 3 + 5]];
          
          const n1 = [normals[first * 3], normals[first * 3 + 1], normals[first * 3 + 2]];
          const n2 = [normals[second * 3], normals[second * 3 + 1], normals[second * 3 + 2]];
          const n3 = [normals[first * 3 + 3], normals[first * 3 + 4], normals[first * 3 + 5]];
          
          const uv1 = [uvs[first * 2], uvs[first * 2 + 1]];
          const uv2 = [uvs[second * 2], uvs[second * 2 + 1]];
          const uv3 = [uvs[first * 2 + 2], uvs[first * 2 + 3]];
          
          drawTriangleWithNormals(v1, v2, v3, n1, n2, n3, uv1, uv2, uv3);
          
          // Second triangle
          const v4 = [vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2]];
          const v5 = [vertices[second * 3 + 3], vertices[second * 3 + 4], vertices[second * 3 + 5]];
          const v6 = [vertices[first * 3 + 3], vertices[first * 3 + 4], vertices[first * 3 + 5]];
          
          const n4 = [normals[second * 3], normals[second * 3 + 1], normals[second * 3 + 2]];
          const n5 = [normals[second * 3 + 3], normals[second * 3 + 4], normals[second * 3 + 5]];
          const n6 = [normals[first * 3 + 3], normals[first * 3 + 4], normals[first * 3 + 5]];
          
          const uv4 = [uvs[second * 2], uvs[second * 2 + 1]];
          const uv5 = [uvs[second * 2 + 2], uvs[second * 2 + 3]];
          const uv6 = [uvs[first * 2 + 2], uvs[first * 2 + 3]];
          
          drawTriangleWithNormals(v4, v5, v6, n4, n5, n6, uv4, uv5, uv6);
        }
      }
    }
  }
  
  function drawTriangleWithNormals(v1, v2, v3, n1, n2, n3, uv1, uv2, uv3) {
    // Create vertex data
    const vertices = new Float32Array([
      v1[0], v1[1], v1[2],
      v2[0], v2[1], v2[2],
      v3[0], v3[1], v3[2]
    ]);
    
    const normals = new Float32Array([
      n1[0], n1[1], n1[2],
      n2[0], n2[1], n2[2],
      n3[0], n3[1], n3[2]
    ]);
    
    const uvs = new Float32Array([
      uv1[0], uv1[1],
      uv2[0], uv2[1],
      uv3[0], uv3[1]
    ]);
    
    // Create and bind buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
    
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }