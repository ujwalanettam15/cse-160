const cubeVerts = new Float32Array([
  -0.5,-0.5, 0.5,  0,0,  0,0,1,
   0.5,-0.5, 0.5,  1,0,  0,0,1,
   0.5, 0.5, 0.5,  1,1,  0,0,1,
  -0.5,-0.5, 0.5,  0,0,  0,0,1,
   0.5, 0.5, 0.5,  1,1,  0,0,1,
  -0.5, 0.5, 0.5,  0,1,  0,0,1,
  
   0.5,-0.5,-0.5,  0,0,  0,0,-1,
  -0.5,-0.5,-0.5,  1,0,  0,0,-1,
  -0.5, 0.5,-0.5,  1,1,  0,0,-1,
   0.5,-0.5,-0.5,  0,0,  0,0,-1,
  -0.5, 0.5,-0.5,  1,1,  0,0,-1,
   0.5, 0.5,-0.5,  0,1,  0,0,-1,
  
  -0.5, 0.5, 0.5,  0,0,  0,1,0,
   0.5, 0.5, 0.5,  1,0,  0,1,0,
   0.5, 0.5,-0.5,  1,1,  0,1,0,
  -0.5, 0.5, 0.5,  0,0,  0,1,0,
   0.5, 0.5,-0.5,  1,1,  0,1,0,
  -0.5, 0.5,-0.5,  0,1,  0,1,0,
  
  -0.5,-0.5,-0.5,  0,0,  0,-1,0,
   0.5,-0.5,-0.5,  1,0,  0,-1,0,
   0.5,-0.5, 0.5,  1,1,  0,-1,0,
  -0.5,-0.5,-0.5,  0,0,  0,-1,0,
   0.5,-0.5, 0.5,  1,1,  0,-1,0,
  -0.5,-0.5, 0.5,  0,1,  0,-1,0,
  
   0.5,-0.5, 0.5,  0,0,  1,0,0,
   0.5,-0.5,-0.5,  1,0,  1,0,0,
   0.5, 0.5,-0.5,  1,1,  1,0,0,
   0.5,-0.5, 0.5,  0,0,  1,0,0,
   0.5, 0.5,-0.5,  1,1,  1,0,0,
   0.5, 0.5, 0.5,  0,1,  1,0,0,
  
  -0.5,-0.5,-0.5,  0,0,  -1,0,0,
  -0.5,-0.5, 0.5,  1,0,  -1,0,0,
  -0.5, 0.5, 0.5,  1,1,  -1,0,0,
  -0.5,-0.5,-0.5,  0,0,  -1,0,0,
  -0.5, 0.5, 0.5,  1,1,  -1,0,0,
  -0.5, 0.5,-0.5,  0,1,  -1,0,0,
]);

let cubeVertexBuffer;

class Cube {
  constructor() {
      this.type = 'cube';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.normalMatrix = new Matrix4();
      this.textureNum = -2;
  }
  
  render() {
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
      this.normalMatrix.setInverseOf(this.matrix);
      this.normalMatrix.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
      
      const FSIZE = cubeVerts.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
      gl.enableVertexAttribArray(a_Position);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
      gl.enableVertexAttribArray(a_UV);
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
      gl.enableVertexAttribArray(a_Normal);
      
      gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
  
  renderfast() {
      this.render();
  }
  
  renderfaster() {
      this.render();
  }
}

function initCubeBuffers() {
  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
}

function drawCube(modelMatrix, color, textureNum) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  
  let normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.uniform1i(u_whichTexture, textureNum);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  
  const FSIZE = cubeVerts.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
  gl.enableVertexAttribArray(a_Normal);
  
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}