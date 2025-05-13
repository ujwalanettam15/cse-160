//
// Shaders
//
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position =
      u_ProjectionMatrix * u_viewMatrix *
      u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

  var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;

  uniform sampler2D u_Sampler0;  // brick wall
  uniform sampler2D u_Sampler1;  // pacman
  uniform sampler2D u_Sampler2;  // grass
  uniform sampler2D u_Sampler3;  // wood

  uniform int u_whichTexture;

  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    }
    else if (u_whichTexture == 0) {
      // brick wall
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
    else if (u_whichTexture == 1) {
      // pacman image
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    }
    else if (u_whichTexture == 2) {
      // grass ground
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    }
    else if (u_whichTexture == 3) {
      // wood blocks
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    }
    else {
      // fallback
      gl_FragColor = u_FragColor;
    }
  }`;


let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
//let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_viewMatrix;
let u_GlobalRotateMatrix;
let u_whichTexture;
let u_texWeight;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let cubeVertexUVBuffer = null;  
let frameCount = 0;
let fpsLastTime = 0;
let currentFps = 0;
let g_walls = [];
let g_pellets = []; 
let WORLD_SIZE = 32;
let dragging = false;
let lastX = -1, lastY = -1;
let g_yaw   = 0;  
let g_pitch = 0; 

let blocksAdded    = 0;
let blocksDeleted  = 0;
let pelletsEaten   = 0;
let initialPelletCount = 0;

const WALL_TEXTURE_SRC = './brick_wall.png';
const GRASS_TEXTURE_SRC = './grass.png';
const WOOD_TEXTURE_SRC  = './wood.png';
let woodTexture   = null;
let wallTexture = null;
let pacmanTexture = null;
let grassTexture  = null;


const pacmanMap = [
  "########################",
  "#........#......#......#",
  "#.####.#.#.####.#.####.#",
  "#.#  #.#.#.#  #.#.#  #.#",
  "#.####.#.#.####.#.####.#",
  "#......................#",
  "########################"
];

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl');
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV       = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor         = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_whichTexture      = gl.getUniformLocation(gl.program, 'u_whichTexture');
  u_texWeight         = gl.getUniformLocation(gl.program, 'u_texWeight');
  u_ModelMatrix       = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix        = gl.getUniformLocation(gl.program, 'u_viewMatrix');
  u_ProjectionMatrix  = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_GlobalRotateMatrix= gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_Sampler0          = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1          = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2          = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3          = gl.getUniformLocation(gl.program, 'u_Sampler3');

  gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
  return true;
}

const POINT    = 0;
const TRIANGLE = 1;
const CIRCLE   = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; 
let g_selectedSize  = 5.0; 
let g_selectedType  = POINT; 
let g_globalAngle = 0.0;
let g_yellowAngle = 0.0;
let g_magentaAngle = 0.0;
let g_yellowAnimation = false; 
let g_magentaAnimation = false;

function addActionsForHtmlUI() {

  canvas.onmousedown = ev => {
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
  };

  canvas.onmouseup   = ev => { dragging = false; };

  canvas.onmousemove = ev => {
    if (!dragging) return;
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;

    g_yaw   += dx * 0.5;
    g_pitch += dy * 0.5;
    lastX = ev.clientX;
    lastY = ev.clientY;
    renderAllShapes();
  };
}

function initTextures() {
  const wallImg = new Image();
  wallImg.onload = () => {
    wallTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);         
    gl.bindTexture(gl.TEXTURE_2D, wallTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB,
                  gl.UNSIGNED_BYTE, wallImg);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler0, 0);            
    renderAllShapes();                  
  };
  wallImg.src = WALL_TEXTURE_SRC;
}


function initPacmanTexture() {
  const img = new Image();
  img.onload = () => {
    pacmanTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);            
    gl.bindTexture(gl.TEXTURE_2D, pacmanTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      gl.RGBA, gl.UNSIGNED_BYTE, img
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler1, 1);               
    renderAllShapes();                        
  };
  img.src = 'pacman.jpg';  
}

function initGrassTexture() {
  const img = new Image();
  img.onload = () => {
    grassTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, grassTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(
      gl.TEXTURE_2D, 0,
      gl.RGB, gl.RGB, gl.UNSIGNED_BYTE,
      img
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler2, 2);
    renderAllShapes();
  };
  img.src = GRASS_TEXTURE_SRC;
}

function initWoodTexture() {
  const img = new Image();
  img.onload = () => {
    woodTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(
      gl.TEXTURE_2D, 0,
      gl.RGB, gl.RGB, gl.UNSIGNED_BYTE,
      img
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler3, 3);
    renderAllShapes();
  };
  img.src = WOOD_TEXTURE_SRC;
}

function buildPellets() {
  g_pellets = [];

  const rows    = pacmanMap.length;
  const cols    = pacmanMap[0].length;
  const pelletY = -0.75 + 0.2;
  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      if (pacmanMap[z][x] === '.') {
        const p = new Cube();
        p.textureNum = -2;         
        p.color      = [1, 1, 0, 1]; 
        p.matrix.setIdentity()
                .translate(
                  x - cols/2 + 0.5,
                  pelletY,
                  z - rows/2 + 0.5
                )
                .scale(0.1, 0.1, 0.1);

        g_pellets.push(p);
      }
    }
  }
  initialPelletCount     = g_pellets.length;
  pelletsEaten           = 0;
  document.getElementById('pelletsEaten').textContent = pelletsEaten;
}


function eatPellets() {
  const threshold = 0.5;
  const px = g_camera.eye.elements[0];
  const pz = g_camera.eye.elements[2];

  for (let i = g_pellets.length - 1; i >= 0; i--) {
    const m = g_pellets[i].matrix.elements;
    const dx = m[12] - px, dz = m[14] - pz;
    if (Math.hypot(dx, dz) < threshold) {
      g_pellets.splice(i, 1);
      pelletsEaten++;
      document.getElementById('pelletsEaten').textContent = pelletsEaten;
      if (pelletsEaten === initialPelletCount) {
        document.getElementById('winMessage').style.display = 'inline';
      }
    }
  }
}


let quadBuffer;
function initQuadBuffers() {
  const verts = new Float32Array([
    // x, y, z,   u, v
    -0.5,  0.5, 0,  0,1,
     0.5,  0.5, 0,  1,1,
    -0.5, -0.5, 0,  0,0,
     0.5,  0.5, 0,  1,1,
     0.5, -0.5, 0,  1,0,
    -0.5, -0.5, 0,  0,0,
  ]);
  quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
}

function buildWorld() {
  g_walls = [];                     
  const groundTop = -0.75 + 0.1;     

  const rows = pacmanMap.length;
  const cols = pacmanMap[0].length;

  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      if (pacmanMap[z][x] === "#") {
        const cube = new Cube();
        cube.textureNum = 0;            
        cube.color      = [1,1,1,1];    
        cube.matrix.setTranslate(
          x - cols  / 2,              
          groundTop,                  
          z - rows / 2           
        );

        g_walls.push(cube);
      }
    }
  }
}

function sendTextureToGLSL(image) {
    var texture = gl.createTexture();
    if(!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.uniform1i(u_Sampler0, 0);
    console.log(u_Sampler0);
    console.log('finished loadTexture');

}  

function initCubeBuffers() {                                             
  const data = new Float32Array([
    // front face
     0,0,0,  0,0,    1,1,0, 1,1,    1,0,0, 1,0,
     0,0,0,  0,0,    0,1,0, 0,1,    1,1,0, 1,1,
    // right face
     1,0,0,  0,0,    1,0,1, 1,0,    1,1,1, 1,1,
     1,0,0,  0,0,    1,1,1, 1,1,    1,1,0, 0,1,
    // back face
     1,0,1,  0,0,    0,1,1, 1,1,    0,0,1, 1,0,
     1,0,1,  0,0,    1,1,1, 1,1,    0,1,1, 0,1,
    // left face
     0,0,1,  0,0,    0,1,0, 1,1,    0,0,0, 1,0,
     0,0,1,  0,0,    0,1,1, 0,1,    0,1,0, 1,0,
    // top face
     0,1,0,  0,0,    1,1,1, 1,1,    0,1,1, 0,1,
     0,1,0,  0,0,    1,1,0, 1,0,    1,1,1, 1,1,
    // bottom face
     0,0,0,  0,0,    1,0,0, 1,0,    0,0,1, 0,1,
     1,0,0,  1,0,    1,0,1, 1,1,    0,0,1, 0,1,
  ]);

  cubeVertexUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  const FSIZE = data.BYTES_PER_ELEMENT;

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);
}             

function modifyBlockInFront(isAdding) {
  console.log('modifyBlockInFront called, isAdding =', isAdding);

  const grid      = WORLD_SIZE;  
  const half      = grid / 2;     
  const groundTop = -0.75 + 0.1;

  const dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
  const dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
  const len = Math.hypot(dx, dz);
  if (len === 0) {
    console.warn('forward vector length is zero');
    return;
  }
  const ux = dx / len, uz = dz / len;
  const wx = g_camera.eye.elements[0] + ux;
  const wz = g_camera.eye.elements[2] + uz;
  const mapX = Math.round(wx + half);
  const mapZ = Math.round(wz + half);
  if (mapX < 0 || mapX >= grid || mapZ < 0 || mapZ >= grid) {
    console.log('outside world bounds, aborting');
    return;
  }
  const x0 = mapX - half;
  const z0 = mapZ - half;
  console.log('world position x0, z0 =', x0, z0);

  if (isAdding) {
    const exists = g_walls.some(c => {
      const m = c.matrix.elements;
      return Math.abs(m[12] - x0) < 1e-3 && Math.abs(m[14] - z0) < 1e-3;
    });
    console.log('exists already?', exists);
    if (!exists) {
      const cube = new Cube();
      cube.textureNum = 3;
      cube.color      = [1,1,1,1];
      cube.matrix.setTranslate(x0, groundTop, z0);
      g_walls.push(cube);
      blocksAdded++;
      document.getElementById('blocksAdded').textContent = blocksAdded;
      console.log('added block; total walls =', g_walls.length);
    }
  } else {
    let deleted = false;
    for (let i = g_walls.length - 1; i >= 0; i--) {
      const m = g_walls[i].matrix.elements;
      if (Math.abs(m[12] - x0) < 1e-3 && Math.abs(m[14] - z0) < 1e-3) {
        g_walls.splice(i, 1);
        blocksDeleted++;
        document.getElementById('blocksDeleted').textContent = blocksDeleted;
        console.log('deleted block; total walls =', g_walls.length);
        deleted = true;
        break;
      }
    }
    if (!deleted) {
      console.log('no block found to delete at this spot');
    }
  }
}

console.log("Registering keydown");
function keydown(ev) {
  console.log('keydown:', ev.key);
  switch(ev.key.toLowerCase()) {
    case 'arrowright': g_camera.right();      break;
    case 'arrowleft':  g_camera.left();       break;
    case 'arrowup':    g_camera.forward();    break;
    case 'arrowdown':  g_camera.back();       break;
    case 'q':          g_camera.panLeft();  break;
    case 'e':          g_camera.panRight(); break;
    case 'b': modifyBlockInFront(true);  break; 
    case 'd': modifyBlockInFront(false); break;
  }
  renderAllShapes();
}
window.addEventListener('keydown', keydown);
document.onkeydown = keydown;

function main() {
  setupWebGL();  
  if (!connectVariablesToGLSL()) return;

  addActionsForHtmlUI();
  document.onkeydown = keydown;
  initCubeBuffers(); 
  initQuadBuffers();
  initTextures(gl);
  initGrassTexture();
  initWoodTexture();  
  gl.clearColor(0,0,0,1);
  buildWorld();
  buildPellets();
  requestAnimationFrame(tick);
  renderAllShapes();
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;
let g_shapesList = [];

function click(ev) {
  let [x,y] = convertCoordinatesEventToGl(ev);

  let shape;
  if(g_selectedType == POINT) {
    shape = new Point(); 
  } else if(g_selectedType == TRIANGLE) {
    shape = new new_Triangle();
  } else {
    shape = new Circle(); 
  }

  shape.position = [x, y]; 
  shape.color    = g_selectedColor.slice();
  shape.size     = g_selectedSize;
  g_shapesList.push(shape);

  renderAllShapes();
}

function convertCoordinatesEventToGl(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)  / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))  / (canvas.height/2);

  return [x,y];
}
var g_camera = new Camera();

/*
var g_map = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,1],
];
*/


const g_map = [
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
];


function drawMap() {
  var body = new Cube();
  for(i=0; i<2; i++) {
    for(x=0; x<32; x++) {
      for(y=0; y<32; y++) {
        if(x==0 || x==31 || y==0 || y==31) {
          body.color = [0.8, 1.0, 1.0, 1.0];
          body.matrix.setTranslate(x-16, 0, y-16);
          body.matrix.scale(0.4, 0.4, 0.4);
          body.matrix.translate(0, -0.75, 0);
          body.renderfaster();
        }
      }
    }
}
}

//var g_eye = [0,0,3];
//var g_at = [0,0,-100];
//var g_up = [0,1,0];

function renderAllShapes() {
  gl.clearColor(0.5, 0.7, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projMat = new Matrix4();
  projMat.setPerspective(
    50,                            
    canvas.width / canvas.height,    // aspect ratio
    1,                               // near clipping plane
    100                              // far clipping plane
  );
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  const viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2],
    g_camera.at.elements[0],
    g_camera.at.elements[1],
    g_camera.at.elements[2],
    g_camera.up.elements[0],
    g_camera.up.elements[1],
    g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  const globalRotMat = new Matrix4()
    .rotate(g_yaw,   0, 1, 0)
    .rotate(g_pitch, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  const ground = new Cube();
  ground.textureNum = 2;        // grass
  ground.color      = [1,1,1,1]; // ignored when textured
  ground.matrix.setIdentity()
                .translate(-WORLD_SIZE/2, -0.75, -WORLD_SIZE/2)
                .scale(WORLD_SIZE, 0.1, WORLD_SIZE);
  ground.render();

  for (const pellet of g_pellets) {
    pellet.render();
  }
  for (const wall of g_walls) {
    wall.render();
  }
}

function tick() {
  const now = performance.now();
  frameCount++;
  if (now - fpsLastTime >= 500) {
    currentFps   = frameCount * 1000 / (now - fpsLastTime);
    fpsLastTime  = now;
    frameCount   = 0;
    document.getElementById('fps').textContent =
      currentFps.toFixed(1) + ' FPS';
  }
  eatPellets();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function sendTextToHTMLElement(text, htmlID) {
  var htmlElement = document.getElementById(htmlID);
  if (!htmlElement) {
    console.log('Failed to retrieve the HTML element with id: ' + htmlID);
    return;
  }
  htmlElement.innerHTML = text;
}
