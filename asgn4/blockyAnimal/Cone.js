class Cone {
    constructor(segments = 20, radius = 1.0, height = 1.0) {
      this.type     = 'cone';
      this.color    = [1.0, 0.5, 0.0, 1.0];  // default orange
      this.segments = segments;
      this.radius   = radius;
      this.height   = height;
      this.matrix   = new Matrix4();
    }
  
    render() {
      const rgba = this.color;
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const apex      = [0.0, this.height, 0.0];
      const baseCenter= [0.0, 0.0, 0.0];
      const step      = 2 * Math.PI / this.segments;
  
      for (let i = 0; i < this.segments; i++) {
        const θ1 = i * step;
        const θ2 = (i + 1) * step;
        const p1 = [Math.cos(θ1) * this.radius, 0.0, Math.sin(θ1) * this.radius];
        const p2 = [Math.cos(θ2) * this.radius, 0.0, Math.sin(θ2) * this.radius];

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3D([
          apex[0],      apex[1],      apex[2],
          p1[0],        p1[1],        p1[2],
          p2[0],        p2[1],        p2[2]
        ]);
  
        gl.uniform4f(
          u_FragColor,
          rgba[0] * 0.7,
          rgba[1] * 0.7,
          rgba[2] * 0.7,
          rgba[3]
        );
        drawTriangle3D([
          baseCenter[0], baseCenter[1], baseCenter[2],
          p2[0],         p2[1],         p2[2],
          p1[0],         p1[1],         p1[2]
        ]);
      }
    }
  }
  