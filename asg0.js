// DrawTriangle.js (c) 2012 matsuda
let canvas;
let ctx;
function main() {  
  // Retrieve <canvas> element
  canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var v1 = new Vector3([2.25, 2.25, 0.0]);

  //drawVector(v1, 'red');
  document.querySelector('#draw').onclick = function() {
    handleDrawEvent();
  };
  
}

function drawVector(v, color) {
  //var canvas = document.getElementById('example');  
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height / 2);
  ctx.lineTo(canvas.width / 2 + v.elements[0] * 20, canvas.height / 2 - v.elements[1] * 20);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent() {
  //var canvas = document.getElementById('example');  
  //const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  const v1 = new Vector3([document.getElementById('x-coor').value, document.getElementById('y-coor').value, 0.0]);
  const v2 = new Vector3([document.getElementById('x-coor2').value, document.getElementById('y-coor2').value, 0.0 ]);
  drawVector(v1, 'red');
  drawVector(v2, 'blue');
  console.log('test');
}

function handleDrawOperationEvent() 
{
  console.log(document.getElementById('x-coor').value);
  //var canvas = document.getElementById('example');  
  //const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const v1 = new Vector3([document.getElementById('x-coor').value, document.getElementById('y-coor').value, 0.0]);
  const v2 = new Vector3([document.getElementById('x-coor2').value, document.getElementById('y-coor2').value, 0.0]);
  drawVector(v1, 'red');
  drawVector(v2, 'blue');
  const selectOp = document.querySelector('#operation').value;
  let resultOp;
  let resultOp2;
  switch (selectOp) {
    case 'add':
      resultOp = v1.add(v2);
      break;
    case 'sub':
      resultOp = v1.sub(v2);
      break;
    case 'mul':
      const scalarMul = parseFloat(document.querySelector('#scalar').value);
      resultOp = v1.mul(scalarMul);
      resultOp2 = v2.mul(scalarMul);
      break;
    case 'div':
      const scalarDiv = parseFloat(document.querySelector('#scalar').value);
      resultOp = v1.div(scalarDiv);
      resultOp2 = v2.div(scalarDiv);
      break;
    case 'magnitude':
      console.log("v1 Magnitude:", v1.magnitude());
      console.log("v2 Magnitude:", v2.magnitude());
      // This should be calling magnitidue of v1 and v2
      v1.magnitude();
      v2.magnitude();
      drawVector(v1, 'green');
      drawVector(v2, 'green');
      break;
    case 'nor':
      v1.normalize();
      v2.normalize();
      console.log("v1 Normalize:", v1.normalize());
      console.log("v2 Normalize:", v2.normalize());
      drawVector(v1, 'green');
      drawVector(v2, 'green');
      break;
    case 'angle':
      const angle = angleBetween(v1, v2);
      console.log("Angle:", angle);
      break;
    case 'area':
      const area = areaTriangle(v1, v2);
      console.log("Area of triangle:", area);
      break;
    default:
      console.log('Invalid');
      return;
  }
  if (resultOp) {
    drawVector(resultOp, 'green');
  }
  if (resultOp2) {
    drawVector(resultOp2, 'green');
  }
} 

function angleBetween(v1, v2) {
  const dp = v1.dot(v2);
  const v1_mag = v1.magnitude();
  const v2_mag = v2.magnitude();
  var angle = dp / (v1_mag * v2_mag);
  angle = Math.min(1, Math.max(-1, angle)); 
  angle = Math.acos(angle); 
  var canvas = document.getElementById('example');  
  return angle;

}

function areaTriangle(v1, v2) {
  const cross = v1.cross(v2);
  var canvas = document.getElementById('example');  
  return 0.5 * cross.magnitude();

}