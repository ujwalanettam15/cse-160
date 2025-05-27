// Camera class
class Camera {
  constructor() {
    this.eye = new Vector3([0, 0, 3]);
    this.at = new Vector3([0, 0, -100]);
    this.up = new Vector3([0, 1, 0]);
  }
  
  forward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(0.2);
    this.eye.add(f);
    this.at.add(f);
  }
  
  back() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(0.2);
    this.eye.sub(f);
    this.at.sub(f);
  }
  
  left() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(0.2);
    this.eye.add(s);
    this.at.add(s);
  }
  
  right() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(0.2);
    this.eye.sub(s);
    this.at.sub(s);
  }
  
  panLeft() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    
    let rotMatrix = new Matrix4();
    rotMatrix.setRotate(5, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    let f_new = rotMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_new);
  }
  
  panRight() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    
    let rotMatrix = new Matrix4();
    rotMatrix.setRotate(-5, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    let f_new = rotMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_new);
  }
}