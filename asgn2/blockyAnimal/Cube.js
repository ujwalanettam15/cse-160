class Cube {
    constructor() {
        this.type = 'cube';
        //this.position = [0, 0, 0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.segments = 10;
        //this.size = 5;
        this.matrix = new Matrix4();
    }

    render() {
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;
        //var segments = this.segments;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        //var d = this.size / 200.0;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        //let angleStep=360/this.segments;
        //for(var angle = 0; angle < 360; angle+=angleStep) {
            //let centerPt = [xy[0], xy[1]];
            //let angle1 = angle;
            //let angle2 = angle+angleStep;
            //let vec1=[Math.cos(angle1*Math.PI/180)*d, Math.sin(angle1*Math.PI/180)*d];
            //let vec2=[Math.cos(angle2*Math.PI/180)*d, Math.sin(angle2*Math.PI/180)*d];
            //let pt1 = [centerPt[0]+vec1[0], centerPt[1]+vec1[1]];
            //let pt2 = [centerPt[0]+vec2[0], centerPt[1]+vec2[1]];

            //drawTriangle( [xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
            gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
            drawTriangle3D([0.0,0.0,0.0, 1.0,1.0,0.0, 1.0,0.0,0.0])
            drawTriangle3D([0.0,0.0,0.0, 0.0,1.0,0.0, 1.0,1.0,0.0])

            
            //fill in cube top, bottom, left, right, front, back
            //right
            gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]*.9);
            drawTriangle3D([1.0,0.0,0.0, 1.0,1.0,1.0, 1.0,0.0,1.0])
            drawTriangle3D([1.0,0.0,0.0, 1.0,1.0,0.0, 1.0,1.0,1.0])

            //left
            gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]*.6);
            drawTriangle3D([0.0,0.0,0.0, 0.0,0.0,1.0, 0.0,1.0,0.0])
            drawTriangle3D([0.0,0.0,1.0, 0.0,1.0,0.0, 0.0,1.0,1.0])

            //back
            gl.uniform4f(u_FragColor, rgba[0]*.3, rgba[1]*.3, rgba[2]*.3, rgba[3]*.3);
            drawTriangle3D([1.0,0.0,1.0, 0.0,0.0,1.0, 0.0,1.0,1.0])
            drawTriangle3D([1.0,0.0,1.0, 1.0,1.0,1.0, 0.0,1.0,1.0])

            //top
            gl.uniform4f(u_FragColor, rgba[0]*.7, rgba[1]*.7, rgba[2]*.7, rgba[3]*.7);
            drawTriangle3D([0.0,1.0,0.0, 1.0,1.0,0.0, 0.0,1.0,1.0])
            drawTriangle3D([1.0,1.0,0.0, 1.0,1.0,1.0, 0.0,1.0,1.0])

            //BOTTOM
            gl.uniform4f(u_FragColor, rgba[0]*.2, rgba[1]*.2, rgba[2]*.2, rgba[3]*.2);
            drawTriangle3D([0.0,0.0,0.0, 1.0,0.0,0.0, 0.0,0.0,1.0])
            drawTriangle3D([1.0,0.0,0.0, 1.0,0.0,1.0, 0.0,0.0,1.0])

    }
}
