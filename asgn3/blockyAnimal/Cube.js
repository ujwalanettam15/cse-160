class Cube{
    constructor(){
      this.type='cube';
      //this.position = [0.0, 0.0, 0.0];
      this.color = [1.0,1.0,1.0,1.0];
      //this.size = 5.0;
      //this.segments = 10;
      this.matrix = new Matrix4();
      this.textureNum=0;
      this.cubeVerts32= new Float32Array([
        0,0,0 , 1,1,0, 1,0,0,
        0,0,0, 0,1,0, 1,1,0,
        0,1,0, 0,1,1, 1,1,1,
        0,1,0, 1,1,1, 1,1,0,
        1,1,0, 1,1,1, 1,0,1,
        1,1,0, 1,0,1, 1,0,0,
        0,1,0, 0,1,1, 0,0,0,
        0,0,0, 0,1,1, 0,0,1,
        0,0,0, 0,0,1, 1,0,1,
        0,0,0, 1,0,1, 1,0,0,
        0,0,1, 1,1,1, 1,0,1,
        0,0,1, 0,1,1, 1,1,1
      ]);
  
      this.cubeVerts= [
        0,0,0 , 1,1,0, 1,0,0,
        0,0,0, 0,1,0, 1,1,0,
        0,1,0, 0,1,1, 1,1,1,
        0,1,0, 1,1,1, 1,1,0,
        1,1,0, 1,1,1, 1,0,1,
        1,1,0, 1,0,1, 1,0,0,
        0,1,0, 0,1,1, 0,0,0,
        0,0,0, 0,1,1, 0,0,1,
        0,0,0, 0,0,1, 1,0,1,
        0,0,0, 1,0,1, 1,0,0,
        0,0,1, 1,1,1, 1,0,1,
        0,0,1, 0,1,1, 1,1,1
      ];
    }

    render() {
        // set texture or color
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor,
          this.color[0],
          this.color[1],
          this.color[2],
          this.color[3]
        );
        // model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
        // bind the single VBO:
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexUVBuffer);
        gl.uniform1i(u_whichTexture, this.textureNum);
    
        // draw all 36 verts
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    renderfast() {
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;
        //var segments = this.segments;

        //gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        //var d = this.size / 200.0;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
       var alrverts=[];
       //front
       allverts=alrverts.concat([0.0,0.0,0.0, 1.0,1.0,0.0, 1.0,0.0,0.0]);
       allverts=alrverts.concat([0.0,0.0,0.0, 0.0,1.0,0.0, 1.0,1.0,0.0]);

         //top
       allverts=alrverts.concat([0.0,1.0,0.0, 0.0,1.0,1.0, 1.0,1.0,1.0]);
       allverts=alrverts.concat([0.0,1.0,0.0, 1.0,1.0,1.0, 1.0,1.0,0.0]);
    
        //right
        allverts=alrverts.concat([1.0,1.0,0.0, 1.0,1.0,1.0, 1.0,0.0,0.0]);
        allverts=alrverts.concat([1.0,0.0,0.0, 1.0,1.0,1.0, 1.0,0.0,1.0]);

        //left 
        allverts=allverts.concat([0,1,0, 0,1,1, 0,0,0]);
        allverts=allverts.concat([0,0,0, 0,1,1, 0,0,1]);

        allverts=allverts.concat([0,0,0, 0,0,1, 1,0,1 ]);
        allverts=allverts.concat([0,0,0, 1,0,1, 1,0,0 ]);

        // Back of cube
        //gl.uniform4f(u_Fr agColor, rgba[0]*.5, rgba[1]*.5, rgba[2]*.5, 1);
        allverts=allverts.concat([0,0,1, 1,1,1, 1,0,1 ]);
        allverts=allverts.concat([0,0,1, 0,1,1, 1,1,1 ]);
        drawTriangle3D(allverts);
    }
    renderfaster() {
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;
      
        // Pass the texture number
        gl.uniform1i(u_whichTexture, -2);
       
        // Pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      
        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
        //if (g_vertexBuffer == null) {
          initTriangle3D();
        //}
      
        // gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      
        // Write data into the buffer object
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allverts), gl.DYNAMIC_DRAW);
        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeVerts), gl.DYNAMIC_DRAW);
        gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts32, gl.DYNAMIC_DRAW);
      
        gl.drawArrays(gl.TRIANGLES, 0, 36);
      }
      
}