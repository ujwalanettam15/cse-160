//
// Shaders
//

//add a listener 
//for the mouse to rotate 
var VSHADER_SOURCE = `
  attribute vec4 a_Position; 
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() { 
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

let canvas, gl;
let a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;
let g_globalAngle = 0;
let moveAngle = 0;
let earsAngle = 0;
let headAngle = 0;
let floppyAngle = 0;
let g_yellowAnimation = false;
let g_startTime = performance.now() / 1000;
let g_jump       = false;
let g_jumpStart  = 0;
let g_yaw    = 0;     
let g_pitch  = 0;  
let dragging = false;
let lastX    = 0;
let lastY    = 0;
let frameCount   = 0;
let fpsLastTime  = performance.now();
let currentFps   = 0;
const jumpDur    = 0.5;   
const jumpHeight = 0.5;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) throw 'Failed to get WebGL';
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE))
    throw 'Failed to init shaders';
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
}

function addUI() {
  document.getElementById('animationYellowOnButton')
          .onclick  = () => g_yellowAnimation = true;
  document.getElementById('animationYellowOffButton')
          .onclick  = () => g_yellowAnimation = false;
  document.getElementById('angleSlide')
          .addEventListener('input', e => {
            g_globalAngle = e.target.value; 
          });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addUI();

  canvas.addEventListener('mousedown', e => {
    if (e.shiftKey) {
      g_jump      = true;
      g_jumpStart = performance.now()/1000;
    }
  });
  addMouseControl(); 
  gl.clearColor(0, 0, 0, 1);

  requestAnimationFrame(tick);

}

function addMouseControl() {
  canvas.addEventListener('mousedown', e => {
    dragging = true;
    lastX    = e.clientX;
    lastY    = e.clientY;
  });
  window.addEventListener('mouseup',   () => dragging = false);
  window.addEventListener('mouseout',  () => dragging = false);
  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    g_yaw   += dx * 0.5;   
    g_pitch += dy * 0.5;  
    lastX = e.clientX;   
    lastY = e.clientY;
  });
}

function tick() {
  const now = performance.now();
  frameCount++;
  if (now - fpsLastTime >= 500) {        
    currentFps  = frameCount * 1000 / (now - fpsLastTime);
    fpsLastTime = now;
    frameCount  = 0;

    const p = document.getElementById('fps');
    p.textContent = currentFps.toFixed(1) + ' FPS';
    p.style.color = currentFps < 10 ? 'red' : 'black';
  }

  const t             = now/1000 - g_startTime;
  const moveLegSlider = document.getElementById('moveLegSlider');
  const moveEarSlider = document.getElementById('moveEars');
  const moveHead      = document.getElementById('moveHead');
  const moveFloppy    = document.getElementById('moveFloppyEar');

  if (g_yellowAnimation) {
    const osc = 45 * Math.sin(t);
    moveAngle   = osc;
    earsAngle   = osc;
    headAngle   = osc;
    floppyAngle = osc;
  } else {
    moveAngle   = +moveLegSlider.value;
    earsAngle   = +moveEarSlider.value;
    headAngle   = +moveHead.value;
    floppyAngle = +moveFloppy.value;
  }

  renderAllShapes();
  requestAnimationFrame(tick);
}

function renderAllShapes() {
  const tNow = performance.now()/1000;
  let jumpOff = 0;
  if (g_jump) {
    const dt = tNow - g_jumpStart;
    if (dt < jumpDur) {
      jumpOff = Math.sin((dt/jumpDur)*Math.PI) * jumpHeight;
    } else {
      g_jump = false;
    }
  }
  const worldM = new Matrix4()
                  .rotate(g_yaw + g_globalAngle, 0, 1, 0) 
                  .rotate(g_pitch, 1, 0, 0)                
                  .translate(0, jumpOff, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, worldM.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const bodyPose = new Matrix4(worldM)
                      .translate(-0.15, -0.25, 0.6);
  drawCube(bodyPose, [0.55, 0.30, 0.35]);

  const faceEyeOffsetX = 0.15;
  const faceEyeOffsetY = 0.65;
  const faceEyeOffsetZ = 0.35*0.5 + 0.005;
  const eyeSize        = [0.05, 0.05, 0.05];

  const headPose = new Matrix4(bodyPose)
                     .translate(0.4, 0.30*0.6 + 0.25*0.5, 0.03)
                     .rotate(headAngle, 0, 0, 1);
  drawCube(headPose, [0.40, 0.25, 0.30]);

  const wx = 0.43, wy = 0.1, wz = faceEyeOffsetZ;
  const wlen = 0.25, wth = 0.005;
  for (const s of [-1,1]) {
    for (const r of [-1,1]) {
      const wm = new Matrix4(headPose)
                   .translate(wx-0.02, wy + r*0.03-0.02, s*wz-0.15)
                   .rotate(r*15*s, 1,0,0);
      drawCube(wm, [wth, wth, wlen], [0,0,0,1]);
    }
  }

  drawCube(headPose, [0.40, 0.25, 0.30]);

  const hatOffsetY   = 0.20 + 0.05;  
  const hatRadius    = 0.25;           
  const hatHeight    = 0.15;          
  const hatSegments  = 30;            

  const hatPose = new Matrix4(headPose)
                      .translate(0.15, hatOffsetY, 0.12)
                      .rotate(0, 0, 1, 0)    
                      .scale(hatRadius, hatHeight, hatRadius);

  drawCone(hatPose, hatSegments, 1.0, 1.0, [0.8, 0.1, 0.1, 1.0]);

  for (const s of [-1,1]) {
    const eyeM = new Matrix4(headPose)
                   .translate(faceEyeOffsetX+0.26,
                              faceEyeOffsetY-0.48,
                              0.2*s*faceEyeOffsetZ+0.13);
    drawCube(eyeM, eyeSize, [0,0,0,1]);
  }

  const earOffsetX = 0.08, earOffsetY = 0.25*0.6, earSize = [0.10,0.40,0.10];
  let earMatrix;
  for (const s of [-1,1]) {
    const em = new Matrix4(headPose)
                 .translate(0, earOffsetY, s*earOffsetX+0.1)
                 .rotate(s*10, 1,0,0)
                 .rotate(earsAngle, 0,0,1);
    drawCube(em, earSize);
    earMatrix = new Matrix4(em)

  }

  //const earPose = new Matrix4(earMatrix)
                   //.translate(0, earOffsetY+0.1, 0.1)
                   //.rotate(earsAngle, 0,1,0);
  //drawCube(earPose, [0.1,0.1,0.1], [0,0,0,1]);
  
  const floppyEarPose = new Matrix4(earMatrix)
                         .translate(0, earOffsetY+0.1, 0.0)
                         .rotate(floppyAngle, 0, 0, 1);
  drawCube(floppyEarPose, [0.1, 0.3, 0.1]);
  

  const legSize = [0.12,0.18,0.12];
  const legX    = 0.55*0.5 - legSize[0]*0.5;
  const legY    = -0.30*0.2 - legSize[1]*0.5;
  const legZ    = 0.35*0.5 - legSize[2]*0.5;
  for (const sx of [-1,1]) {
    for (const sz of [-1,1]) {
      const lm = new Matrix4(bodyPose)
                   .translate(sx*legX+0.2, legY, sz*legZ+0.12)
                   .rotate(moveAngle,0,0,1);
      drawCube(lm, legSize);
    }
  }
}

function drawCube(pose, [sx,sy,sz], color=[1.0,0.75,0.80,1.0]) {
  const cube = new Cube();
  cube.color  = color;
  cube.matrix = new Matrix4(pose).scale(sx,sy,sz);
  cube.render();
}

function drawCone(pose, segments=20, radius=0.3, height=0.2, color=[1,0,0,1]) {
  const cone = new Cone(segments, radius, height);
  cone.color  = color;
  cone.matrix = new Matrix4(pose);
  cone.render();
}

main();