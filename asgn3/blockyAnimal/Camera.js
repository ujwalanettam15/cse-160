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
        this.at .add(s);
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
        this.at .add(s);
      }
}
