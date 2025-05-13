class Camera{
    constructor() {
        this.eye = new Vector3([0,0,3]);
        this.at = new Vector3([0,0,-100]);
        this.up = new Vector3([0,1,0]);
    }

    forward() {
        let f = new Vector3();
        f.sub(this.eye);
        f.set(this.at);
        f.normalize();
        this.at.add(f);
        this.eye.add(f);
    }

    back() {
        /*let f = new Vector3(this.at);
        f.sub(this.eye).normalize();
        this.eye.add(f); 
        this.at.add(f);
        */
        let f = new Vector3();
        f.sub(this.at);
        f.set(this.eye);
        //f = f.divide(f.length());
        f.normalize();
        this.at.add(f);
        this.eye.add(f);
        
    }

    left() {
        let f = new Vector3();
        f.set(this.at)
         .sub(this.eye)
         .normalize();
        let s = Vector3.cross(this.up, f)
                   .normalize();
    
        this.eye.add(s);
        this.at.add(s);
      }
    
      right() {
        // forward vector f
        let f = new Vector3();
        f.set(this.at)
         .sub(this.eye)
         .normalize();
    
        // side = f × up
        let s = Vector3.cross(f, this.up)
                   .normalize();
    
        this.eye.add(s);
        this.at.add(s);
      }
      panLeft() {
        /*
        Compute the forward vector  f = at - eye;
    Rotate the vector f by alpha (decide a value) degrees around the up vector.
    Create a rotation matrix: rotationMatrix.setRotate(alpha, up.x, up.y, up.z).
    Multiply this matrix by f to compute f_prime = rotationMatrix.multiplyVector3(f);
    Update the "at"vector to be at = eye + f_prime;
        */
        let f = new Vector3();
        f.set(this.at).sub(this.eye);
    
        let rotationMatrix = new Matrix4();
        const alpha = 5; 
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye).add(f_prime);
      }

      panRight() {
        /*
        Same idea as panLeft, but rotate u by -alpha degrees around the up vector.
        */

        let f = new Vector3();
        f.set(this.at).sub(this.eye); 

        let rotationMatrix = new Matrix4();
        const alpha = -5;
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye).add(f_prime);


      }
}
