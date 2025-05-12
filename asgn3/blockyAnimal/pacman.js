class Pacman {
    constructor() {
      this.position = [1, 0, 1]; // [x, y, z]
      this.color = [1, 1, 0, 1]; // Yellow
      this.model = new Cube();
    }
  
    move(dx, dz) {
        const [x, y, z] = this.position;
        const newX = x + dx;
        const newZ = z + dz;
        // inside bounds and not a wall?
        if (
          newZ >= 0 && newZ < g_map.length &&
          newX >= 0 && newX < g_map[0].length &&
          g_map[newZ][newX] === 0
        ) {
          this.position[0] = newX;
          this.position[2] = newZ;
        }
      }
  
    render() {
      this.model.color = this.color;
      this.model.textureNum = -2;
      this.model.matrix.setTranslate(
        this.position[0] - WORLD_SIZE / 2,
        0,
        this.position[2] - WORLD_SIZE / 2
      );
      this.model.matrix.scale(1, 1, 1);
      this.model.render();
    }
  }
  
  