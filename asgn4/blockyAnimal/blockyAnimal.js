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

// fragment shader: flat‐color path only
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else {
      // never used in this example
      gl_FragColor = texture2D(u_Sampler0, v_UV);
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
let cubeVertexUVBuffer = null;  
let frameCount = 0;
let fpsLastTime = 0;
let currentFps = 0;
let g_walls = [];
let WORLD_SIZE = 32;
let dragging = false;
let lastX = -1, lastY = -1;
let g_yaw   = 0;  
let g_pitch = 0; 
const WALL_TEXTURE_SRC = './brick_wall.jpg';
let wallTexture = null;
let pacmanTexture = null;


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

  // initialize u_ModelMatrix to identity
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
  // start drag
  canvas.onmousedown = ev => {
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
  };
  // end drag
  canvas.onmouseup   = ev => { dragging = false; };
  // on drag, update yaw/pitch
  canvas.onmousemove = ev => {
    if (!dragging) return;
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;
    // adjust sensitivity as you like:
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
    gl.activeTexture(gl.TEXTURE0);          // <- bind to unit 0
    gl.bindTexture(gl.TEXTURE_2D, wallTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB,
                  gl.UNSIGNED_BYTE, wallImg);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler0, 0);            // tell the shader “sampler0 == unit 0”
    renderAllShapes();                      // first render once it’s ready
  };
  wallImg.src = WALL_TEXTURE_SRC;
}

function initPacmanTexture() {
  const img = new Image();
  img.onload = () => {
    pacmanTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);              // use unit 1
    gl.bindTexture(gl.TEXTURE_2D, pacmanTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      gl.RGBA, gl.UNSIGNED_BYTE, img
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler1, 1);                // sampler1 → unit 1
    renderAllShapes();                          // redraw once loaded
  };
  img.src = 'pacman.jpg';  // your JPG path
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
  g_walls = [];                         // clear old walls
  const groundTop = -0.75 + 0.1;        // top of your green plane

  const rows = pacmanMap.length;
  const cols = pacmanMap[0].length;

  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      if (pacmanMap[z][x] === "#") {
        const cube = new Cube();
        cube.textureNum = 0;             // brick texture
        cube.color      = [1,1,1,1];     // ignored when textured

        // center the layout around (0,0), and lift to groundTop
        cube.matrix.setTranslate(
          x - cols  / 2,                 // X
          groundTop,                     // Y
          z - rows / 2                  // Z
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
  // position attribute (3 floats)
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);
  // uv attribute (2 floats)
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);
}             

function modifyBlockInFront(isAdding) {
  const rows = pacmanMap.length,
        cols = pacmanMap[0].length;

  // 1) Get flat look-vector
  const dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
  const dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;

  // 2) March one unit forward from the eye
  const wx = g_camera.eye.elements[0] + ux;
  const wz = g_camera.eye.elements[2] + uz;

  // 3) Map world coords → pacmanMap indices
  const mapX = Math.round(wx + cols/2);
  const mapZ = Math.round(wz + rows/2);

  // 4) Out-of-bounds guard
  if (mapZ < 0 || mapZ >= rows || mapX < 0 || mapX >= cols) return;

  // compute the same groundTop & centering you use in buildWorld()
  const groundTop = -0.75 + 0.1;
  const x0 = mapX - cols/2;
  const z0 = mapZ - rows/2;

  if (isAdding) {
    // 5a) Add a new brick cube
    const cube = new Cube();
    cube.textureNum = 0;            // brick texture
    cube.color      = [1,1,1,1];    // ignored when textured
    cube.matrix.setTranslate(x0, groundTop, z0);
    g_walls.push(cube);

    // (optional) keep your map data in sync
    let row = pacmanMap[mapZ].split('');
    row[mapX] = '#';
    pacmanMap[mapZ] = row.join('');

  } else {
    // 5b) Remove the cube at that spot
    for (let i = g_walls.length - 1; i >= 0; i--) {
      const m = g_walls[i].matrix.elements;
      // m[12] is x-translate, m[14] is z-translate
      if (Math.abs(m[12] - x0) < 0.001 && Math.abs(m[14] - z0) < 0.001) {
        g_walls.splice(i, 1);
        break;
      }
    }
    // (optional) update your map data
    let row = pacmanMap[mapZ].split('');
    row[mapX] = '.';
    pacmanMap[mapZ] = row.join('');
  }
}

function keydown(ev) {
  console.log('keydown:', ev.key);
  switch(ev.key.toLowerCase()) {
    case 'arrowright': g_camera.right();      break;
    case 'arrowleft':  g_camera.left();       break;
    case 'arrowup':    g_camera.forward();    break;
    case 'arrowdown':  g_camera.back();       break;
    case 'a':          modifyBlockInFront(true);  break;
    case 'd':          modifyBlockInFront(false); break;
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
  gl.clearColor(0,0,0,1);
  buildWorld();
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
  // 1) Clear the screen to sky color & depth buffer
  gl.clearColor(0.5, 0.7, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 2) Set up the projection matrix
  const projMat = new Matrix4();
  projMat.setPerspective(
    50,                                // fov
    canvas.width / canvas.height,     // aspect
    1,                                 // near
    100                                // far
  );
  gl.uniformMatrix4fv(
    u_ProjectionMatrix,
    false,
    projMat.elements
  );

  // 3) Set up the camera (view) matrix
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
  gl.uniformMatrix4fv(
    u_ViewMatrix,
    false,
    viewMat.elements
  );

  // 4) Build & upload the global-rotation matrix from mouse yaw/pitch
  const globalRotMat = new Matrix4()
    .rotate(g_yaw,   0, 1, 0)    // yaw around world Y
    .rotate(g_pitch, 1, 0, 0);   // pitch around world X
  gl.uniformMatrix4fv(
    u_GlobalRotateMatrix,
    false,
    globalRotMat.elements
  );

  // 5) Draw the ground plane, centered under the walls
  const ground = new Cube();
  ground.textureNum = -2;                  // solid-color mode
  ground.color      = [0.4, 0.8, 0.4, 1.0];
  ground.matrix.setIdentity();
  ground.matrix
    .translate(-WORLD_SIZE/2, -0.75, -WORLD_SIZE/2)
    .scale(WORLD_SIZE, 0.1, WORLD_SIZE);
  ground.render();

  // 6) Draw every wall cube in g_walls
  for (const w of g_walls) {
    w.render();
  }
}


function tick() {
  const now = performance.now();
  frameCount++;
  if (now - fpsLastTime >= 500) {
    currentFps = frameCount * 1000 / (now - fpsLastTime);
    fpsLastTime = now;
    frameCount = 0;
    document.getElementById('fps').textContent = currentFps.toFixed(1) + ' FPS';
  }
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
