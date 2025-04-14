//
// Shaders
//
var VSHADER_SOURCE = `
  attribute vec4 a_Position; 
  uniform float u_Size;
  void main() { 
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT    = 0;
const TRIANGLE = 1;
const CIRCLE   = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; 
let g_selectedSize  = 5.0; 
let g_selectedType  = POINT; 

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = function() {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  };
  document.getElementById('red').onclick = function() {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  };
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };
  document.getElementById('triButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };
  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };

  document.getElementById('redSlide').addEventListener('mouseup', function() {
    g_selectedColor[0] = this.value / 100;
  });
  document.getElementById('greenSlide').addEventListener('mouseup', function() {
    g_selectedColor[1] = this.value / 100;
  });
  document.getElementById('blueSlide').addEventListener('mouseup', function() {
    g_selectedColor[2] = this.value / 100;
  });

  document.getElementById('sizeSlide').addEventListener('mouseup', function() {
    g_selectedSize = this.value;
  });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL(); 

  addActionsForHtmlUI(); 
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if(ev.buttons == 1) click(ev);
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  renderAllShapes();
}

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

function renderAllShapes() {
  let startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT);
  drawHouse();

  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }

  let duration = performance.now() - startTime;
  sendTextToHTMLElement(
    'numdot: ' + g_shapesList.length +
    ' | ms: '  + Math.floor(duration) +
    ' | fps: ' + Math.floor(1000/duration),
    'fps'
  );
}

function drawHouse() {
  gl.uniform4f(u_FragColor, 0.0, 0.8, 0.0, 1.0);
  drawTriangle([-1.0, -1.0,  1.0, -1.0,  1.0, -0.5]);
  drawTriangle([-1.0, -1.0,  1.0, -0.5, -1.0, -0.5]);

  gl.uniform4f(u_FragColor, 0.7, 0.5, 0.3, 1.0);
  drawTriangle([-0.6, -0.5,  0.0, -0.5,  0.0,  0.0]);
  drawTriangle([-0.6, -0.5,  0.0,  0.0,  -0.6, 0.0]);

  gl.uniform4f(u_FragColor, 0.9, 0.1, 0.1, 1.0);
  drawTriangle([-0.65, 0.0,  0.05, 0.0,  -0.30, 0.3]);

  gl.uniform4f(u_FragColor, 0.5, 0.2, 0.1, 1.0);
  drawTriangle([-0.55, -0.5, -0.45, -0.5, -0.45, -0.2]);
  drawTriangle([-0.55, -0.5, -0.45, -0.2, -0.55, -0.2]);

  gl.uniform4f(u_FragColor, 0.8, 0.8, 1.0, 1.0);
  drawTriangle([-0.4, -0.3, -0.2, -0.3, -0.2, -0.1]);
  drawTriangle([-0.4, -0.3, -0.2, -0.1, -0.4, -0.1]);

  drawTriangle([-0.15, -0.3, 0.0, -0.3, 0.0, -0.1]);
  drawTriangle([-0.15, -0.3, 0.0, -0.1, -0.15, -0.1]);

  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);
  drawTriangle([0.5,0.6,  0.6,0.6,  0.55,0.68]);
  drawTriangle([0.5,0.6,  0.55,0.68,0.45,0.68]);
  drawTriangle([0.5,0.6,  0.45, 0.68, 0.4, 0.6  ]);
  drawTriangle([0.5,0.6,  0.4, 0.6,  0.45, 0.52]);
  drawTriangle([0.5,0.6,  0.45,0.52,0.55,0.52]);
  drawTriangle([0.5,0.6,  0.55,0.52,0.6, 0.6  ]);

  gl.uniform4f(u_FragColor, 0.4, 0.2, 0.0, 1.0);
  drawTriangle([0.6, -0.6, 0.65, -0.6, 0.65, -0.4]);
  drawTriangle([0.6, -0.6, 0.65, -0.4, 0.6, -0.4]);

  gl.uniform4f(u_FragColor, 0.0, 0.5, 0.0, 1.0);
  drawTriangle([0.575, -0.4, 0.675, -0.4, 0.625, -0.20]);
  drawTriangle([0.575, -0.3, 0.675, -0.3, 0.625, -0.15]);
  drawTriangle([0.575, -0.2, 0.675, -0.2, 0.625, -0.05]);
}

function sendTextToHTMLElement(text, htmlID) {
  var htmlElement = document.getElementById(htmlID);
  if (!htmlElement) {
    console.log('Failed to retrieve the HTML element with id: ' + htmlID);
    return;
  }
  htmlElement.innerHTML = text;
}
