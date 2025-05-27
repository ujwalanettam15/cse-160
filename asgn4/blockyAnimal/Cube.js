// Updated Cube class with normals
class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.textureNum = -2;
  }
  
  render() {
    // Set uniforms
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    // Calculate normal matrix (inverse transpose of model matrix)
    this.normalMatrix.setInverseOf(this.matrix);
    this.normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
    
    // Bind the cube buffer and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexUVBuffer);
    
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
    gl.enableVertexAttribArray(a_Normal);
    
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
  
  renderfast() {
    // Legacy render method for compatibility
    this.render();
  }
  
  renderfaster() {
    // Legacy render method for compatibility
    this.render();
  }
}