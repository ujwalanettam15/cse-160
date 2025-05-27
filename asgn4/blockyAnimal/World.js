const VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
attribute vec3 a_Normal;

varying vec2 v_UV;
varying vec3 v_Normal;
varying vec3 v_WorldPos;
varying vec3 v_NormalWorld;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_NormalMatrix;

void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    
    v_UV = a_UV;
    v_Normal = a_Normal;
    
    vec4 worldPos = u_ModelMatrix * a_Position;
    v_WorldPos = worldPos.xyz;
    
    v_NormalWorld = normalize(mat3(u_NormalMatrix) * a_Normal);
}`;

const FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
varying vec3 v_Normal;
varying vec3 v_WorldPos;
varying vec3 v_NormalWorld;

uniform vec4 u_FragColor;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform sampler2D u_Sampler3;
uniform int u_whichTexture;

uniform vec3 u_LightPos;
uniform vec3 u_LightColor;
uniform vec3 u_CameraPos;
uniform vec3 u_SpotlightDir;
uniform float u_SpotlightCutoff;
uniform float u_SpotlightFocus;
uniform bool u_ShowNormals;
uniform bool u_UseLighting;
uniform bool u_UseSpotlight;

void main() {
    if (u_ShowNormals) {
        gl_FragColor = vec4((v_NormalWorld + 1.0) / 2.0, 1.0);
        return;
    }
    
    vec4 baseColor;
    if (u_whichTexture == -2) {
        baseColor = u_FragColor;
    } else if (u_whichTexture == 0) {
        baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
        baseColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
        baseColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
        baseColor = texture2D(u_Sampler3, v_UV);
    } else {
        baseColor = u_FragColor;
    }
    
    if (!u_UseLighting) {
        gl_FragColor = baseColor;
        return;
    }
    
    vec3 normal = normalize(v_NormalWorld);
    vec3 lightDir = normalize(u_LightPos - v_WorldPos);
    vec3 viewDir = normalize(u_CameraPos - v_WorldPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    
    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * u_LightColor;
    
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_LightColor;
    
    float specularStrength = 0.5;
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * u_LightColor;
    
    vec3 lighting = ambient + diffuse + specular;
    
    if (u_UseSpotlight) {
        vec3 spotDir = normalize(u_SpotlightDir);
        float spotCos = dot(-lightDir, spotDir);
        float spotCutoffCos = cos(radians(u_SpotlightCutoff));
        
        if (spotCos > spotCutoffCos) {
            float spotFactor = pow(spotCos, u_SpotlightFocus);
            lighting *= spotFactor;
        } else {
            lighting = ambient;
        }
    }
    
    vec3 result = lighting * baseColor.rgb;
    gl_FragColor = vec4(result, baseColor.a);
}`;

let canvas, gl;
let a_Position, a_UV, a_Normal;
let u_FragColor, u_ModelMatrix, u_ProjectionMatrix, u_ViewMatrix, u_GlobalRotateMatrix;
let u_whichTexture, u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;
let u_LightPos, u_LightColor, u_CameraPos, u_ShowNormals, u_UseLighting, u_NormalMatrix;
let u_SpotlightDir, u_SpotlightCutoff, u_SpotlightFocus, u_UseSpotlight;

let g_lightPos = [3, 5, 3];
let g_lightColor = [1, 1, 1];
let g_spotlightDir = [0, -1, 0];
let g_spotlightCutoff = 15.0;
let g_spotlightFocus = 32.0;
let g_showNormals = false;
let g_useLighting = true;
let g_useSpotlight = false;
let g_animateLight = false;

let g_camera = {
    eye: [0, 2, 8],
    at: [0, 0, 0],
    up: [0, 1, 0],
    angle: 45,
    distance: 8,
    height: 2
};

let g_globalAngle = 45;
let g_startTime = performance.now() / 1000.0;
let g_mouseX = 0, g_mouseY = 0;
let g_isDragging = false;
let g_lastX = 0, g_lastY = 0;

function initShaders(gl, vshader, fshader) {
    const program = createProgram(gl, vshader, fshader);
    if (!program) return false;
    
    gl.useProgram(program);
    gl.program = program;
    return true;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const vShader = loadShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vShader || !fShader) return null;
    
    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('Failed to link program: ' + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('Failed to compile shader: ' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('Failed to get WebGL context');
        return false;
    }
    gl.enable(gl.DEPTH_TEST);
    return true;
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return false;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    
    u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
    u_ShowNormals = gl.getUniformLocation(gl.program, 'u_ShowNormals');
    u_UseLighting = gl.getUniformLocation(gl.program, 'u_UseLighting');
    u_SpotlightDir = gl.getUniformLocation(gl.program, 'u_SpotlightDir');
    u_SpotlightCutoff = gl.getUniformLocation(gl.program, 'u_SpotlightCutoff');
    u_SpotlightFocus = gl.getUniformLocation(gl.program, 'u_SpotlightFocus');
    u_UseSpotlight = gl.getUniformLocation(gl.program, 'u_UseSpotlight');

    return true;
}

function initTextures() {
    const texData0 = new Uint8Array([255, 100, 50, 255]);
    const tex0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    const texData1 = new Uint8Array([100, 50, 255, 255]);
    const tex1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    const texData2 = new Uint8Array([50, 200, 50, 255]);
    const tex2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    const texData3 = new Uint8Array([200, 200, 50, 255]);
    const tex3 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, tex3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData3);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

function updateCamera() {
    const angleRad = g_camera.angle * Math.PI / 180;
    g_camera.eye[0] = Math.sin(angleRad) * g_camera.distance;
    g_camera.eye[1] = g_camera.height;
    g_camera.eye[2] = Math.cos(angleRad) * g_camera.distance;
}

function setupEventHandlers() {
    const toggleLighting = document.getElementById('toggleLighting');
    if (toggleLighting) {
        toggleLighting.onclick = function() {
            g_useLighting = !g_useLighting;
            this.textContent = g_useLighting ? 'Disable Lighting' : 'Enable Lighting';
        };
    }
    
    const toggleNormals = document.getElementById('toggleNormals');
    if (toggleNormals) {
        toggleNormals.onclick = function() {
            g_showNormals = !g_showNormals;
            this.textContent = g_showNormals ? 'Hide Normals' : 'Show Normals';
        };
    }
    
    const animateLight = document.getElementById('animateLight');
    if (animateLight) {
        animateLight.onclick = function() {
            g_animateLight = !g_animateLight;
            this.textContent = g_animateLight ? 'Stop Animation' : 'Animate Light';
        };
    }
    
    const toggleSpotlight = document.getElementById('toggleSpotlight');
    if (toggleSpotlight) {
        toggleSpotlight.onclick = function() {
            g_useSpotlight = !g_useSpotlight;
            this.textContent = g_useSpotlight ? 'Disable Spotlight' : 'Enable Spotlight';
        };
    }
    
    ['lightX', 'lightY', 'lightZ'].forEach((id, index) => {
        const slider = document.getElementById(id);
        const valueSpan = document.getElementById(id + 'Val');
        if (slider && valueSpan) {
            slider.oninput = function() {
                g_lightPos[index] = parseFloat(this.value);
                valueSpan.textContent = parseFloat(this.value).toFixed(1);
            };
        }
    });
    
    ['lightR', 'lightG', 'lightB'].forEach((id, index) => {
        const slider = document.getElementById(id);
        const valueSpan = document.getElementById(id + 'Val');
        if (slider && valueSpan) {
            slider.oninput = function() {
                g_lightColor[index] = parseFloat(this.value);
                valueSpan.textContent = parseFloat(this.value).toFixed(2);
            };
        }
    });
    
    const cameraAngle = document.getElementById('cameraAngle');
    const cameraAngleVal = document.getElementById('cameraAngleVal');
    if (cameraAngle && cameraAngleVal) {
        cameraAngle.oninput = function() {
            g_camera.angle = parseFloat(this.value);
            cameraAngleVal.textContent = this.value;
            updateCamera();
        };
    }
    
    const cameraDistance = document.getElementById('cameraDistance');
    const cameraDistanceVal = document.getElementById('cameraDistanceVal');
    if (cameraDistance && cameraDistanceVal) {
        cameraDistance.oninput = function() {
            g_camera.distance = parseFloat(this.value);
            cameraDistanceVal.textContent = parseFloat(this.value).toFixed(1);
            updateCamera();
        };
    }
    
    const cameraHeight = document.getElementById('cameraHeight');
    const cameraHeightVal = document.getElementById('cameraHeightVal');
    if (cameraHeight && cameraHeightVal) {
        cameraHeight.oninput = function() {
            g_camera.height = parseFloat(this.value);
            cameraHeightVal.textContent = parseFloat(this.value).toFixed(1);
            updateCamera();
        };
    }
    
    const spotCutoff = document.getElementById('spotCutoff');
    const spotCutoffVal = document.getElementById('spotCutoffVal');
    if (spotCutoff && spotCutoffVal) {
        spotCutoff.oninput = function() {
            g_spotlightCutoff = parseFloat(this.value);
            spotCutoffVal.textContent = this.value;
        };
    }
    
    const spotFocus = document.getElementById('spotFocus');
    const spotFocusVal = document.getElementById('spotFocusVal');
    if (spotFocus && spotFocusVal) {
        spotFocus.oninput = function() {
            g_spotlightFocus = parseFloat(this.value);
            spotFocusVal.textContent = this.value;
        };
    }
    
    canvas.onmousedown = function(ev) {
        g_isDragging = true;
        g_lastX = ev.clientX;
        g_lastY = ev.clientY;
    };
    
    canvas.onmouseup = function() {
        g_isDragging = false;
    };
    
    canvas.onmousemove = function(ev) {
        if (!g_isDragging) return;
        
        const deltaX = ev.clientX - g_lastX;
        const deltaY = ev.clientY - g_lastY;
        
        g_camera.angle += deltaX * 0.5;
        g_camera.height += deltaY * 0.01;
        
        g_camera.height = Math.max(-5, Math.min(10, g_camera.height));
        
        document.getElementById('cameraAngle').value = g_camera.angle % 360;
        document.getElementById('cameraAngleVal').textContent = Math.round(g_camera.angle % 360);
        document.getElementById('cameraHeight').value = g_camera.height;
        document.getElementById('cameraHeightVal').textContent = g_camera.height.toFixed(1);
        
        updateCamera();
        
        g_lastX = ev.clientX;
        g_lastY = ev.clientY;
    };
    
    document.onkeydown = function(ev) {
        const speed = 0.2;
        switch(ev.key.toLowerCase()) {
            case 'w':
                g_camera.distance = Math.max(1, g_camera.distance - speed);
                break;
            case 's':
                g_camera.distance = Math.min(20, g_camera.distance + speed);
                break;
            case 'a':
                g_camera.angle -= 2;
                break;
            case 'd':
                g_camera.angle += 2;
                break;
            case 'arrowup':
                g_camera.height += speed;
                break;
            case 'arrowdown':
                g_camera.height -= speed;
                break;
            case 'arrowleft':
                g_camera.angle -= 1;
                break;
            case 'arrowright':
                g_camera.angle += 1;
                break;
        }
        
        g_camera.height = Math.max(-5, Math.min(10, g_camera.height));
        
        document.getElementById('cameraAngle').value = g_camera.angle % 360;
        document.getElementById('cameraAngleVal').textContent = Math.round(g_camera.angle % 360);
        document.getElementById('cameraDistance').value = g_camera.distance;
        document.getElementById('cameraDistanceVal').textContent = g_camera.distance.toFixed(1);
        document.getElementById('cameraHeight').value = g_camera.height;
        document.getElementById('cameraHeightVal').textContent = g_camera.height.toFixed(1);
        
        updateCamera();
    };
}

function renderScene() {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
    
    const viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye[0], g_camera.eye[1], g_camera.eye[2],
        g_camera.at[0], g_camera.at[1], g_camera.at[2],
        g_camera.up[0], g_camera.up[1], g_camera.up[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
    
    const globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    gl.uniform3fv(u_LightPos, g_lightPos);
    gl.uniform3fv(u_LightColor, g_lightColor);
    gl.uniform3fv(u_CameraPos, g_camera.eye);
    gl.uniform3fv(u_SpotlightDir, g_spotlightDir);
    gl.uniform1f(u_SpotlightCutoff, g_spotlightCutoff);
    gl.uniform1f(u_SpotlightFocus, g_spotlightFocus);
    gl.uniform1i(u_ShowNormals, g_showNormals);
    gl.uniform1i(u_UseLighting, g_useLighting);
    gl.uniform1i(u_UseSpotlight, g_useSpotlight);
    
    let lightCube = new Cube();
    lightCube.color = [1, 1, 0, 1];
    lightCube.matrix.setTranslate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    lightCube.matrix.scale(0.2, 0.2, 0.2);
    lightCube.render();
    
    let ground = new Cube();
    ground.color = [0.3, 0.6, 0.3, 1];
    ground.textureNum = 2;
    ground.matrix.setTranslate(0, -1, 0);
    ground.matrix.scale(10, 0.1, 10);
    ground.render();
    
    let walls = [
        { pos: [0, 2, -5], scale: [10, 4, 0.1], color: [0.6, 0.6, 0.8, 1], tex: 1 },
        { pos: [-5, 2, 0], scale: [0.1, 4, 10], color: [0.8, 0.6, 0.6, 1], tex: 0 },
        { pos: [5, 2, 0], scale: [0.1, 4, 10], color: [0.6, 0.8, 0.6, 1], tex: 2 }
    ];
    
    walls.forEach(wall => {
        let wallCube = new Cube();
        wallCube.color = wall.color;
        wallCube.textureNum = wall.tex;
        wallCube.matrix.setTranslate(wall.pos[0], wall.pos[1], wall.pos[2]);
        wallCube.matrix.scale(wall.scale[0], wall.scale[1], wall.scale[2]);
        wallCube.render();
    });
    
    let cubes = [
        { pos: [-2, 0, 0], color: [0.8, 0.4, 0.2, 1], tex: 0 },
        { pos: [2, 0, 0], color: [0.2, 0.4, 0.8, 1], tex: -2 },
        { pos: [0, 0, 2], color: [0.6, 0.2, 0.8, 1], tex: 1 },
        { pos: [-1, 1, -1], color: [0.8, 0.8, 0.2, 1], tex: 3 }
    ];
    
    cubes.forEach(cube => {
        let cubeObj = new Cube();
        cubeObj.color = cube.color;
        cubeObj.textureNum = cube.tex;
        cubeObj.matrix.setTranslate(cube.pos[0], cube.pos[1], cube.pos[2]);
        cubeObj.render();
    });
    
    let spheres = [
        { pos: [0, 0, -2], scale: 1, color: [1, 0.2, 0.2, 1] },
        { pos: [0, 2, 0], scale: 1.2, color: [0.2, 1, 0.2, 1] },
        { pos: [3, 0.5, 3], scale: 0.8, color: [0.2, 0.2, 1, 1] }
    ];
    
    spheres.forEach(sphere => {
        let sphereObj = new Sphere();
        sphereObj.color = sphere.color;
        sphereObj.matrix.setTranslate(sphere.pos[0], sphere.pos[1], sphere.pos[2]);
        sphereObj.matrix.scale(sphere.scale, sphere.scale, sphere.scale);
        sphereObj.render();
    });
}

function animate() {
    const now = performance.now() / 1000.0;
    
    if (g_animateLight) {
        g_lightPos[0] = Math.cos(now) * 4;
        g_lightPos[2] = Math.sin(now) * 4;
        
        document.getElementById('lightX').value = g_lightPos[0];
        document.getElementById('lightXVal').textContent = g_lightPos[0].toFixed(1);
        document.getElementById('lightZ').value = g_lightPos[2];
        document.getElementById('lightZVal').textContent = g_lightPos[2].toFixed(1);
    }
    
    g_spotlightDir = [
        -g_lightPos[0], 
        -g_lightPos[1] + 1, 
        -g_lightPos[2]
    ];
    const len = Math.sqrt(g_spotlightDir[0]*g_spotlightDir[0] + 
                         g_spotlightDir[1]*g_spotlightDir[1] + 
                         g_spotlightDir[2]*g_spotlightDir[2]);
    g_spotlightDir[0] /= len;
    g_spotlightDir[1] /= len;
    g_spotlightDir[2] /= len;
    
    renderScene();
    requestAnimationFrame(animate);
}

function main() {
    if (!setupWebGL()) return;
    if (!connectVariablesToGLSL()) return;
    
    setupEventHandlers();
    initCubeBuffers();
    initTextures();
    updateCamera();
    
    requestAnimationFrame(animate);
}

window.onload = main;