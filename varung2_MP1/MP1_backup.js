/**
 * @file A simple WebGL example drawing an L shape
 * @author Eric Shaffer <shaffer1@eillinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var block_i_vertices;
var canvas_vertices;
var trail_flag_vertices;
var flag_overlay_vertices;

/** @global The WebGL buffer holding the vertex colors */
var block_i_color_buffer;
var canvas_color_buffer;
var flag_color_buffer;
var overlay_color_buffer;

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {
      console.log("No Context detected!");
    }
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}

/**
 * Populate buffers with data
 */
function setupBuffers() {
  block_i_vertices = gl.createBuffer();
  canvas_vertices = gl.createBuffer();
  trail_flag_vertices = gl.createBuffer();
  flag_overlay_vertices = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, block_i_vertices);
  gl.bindBuffer(gl.ARRAY_BUFFER, canvas_vertices);
  gl.bindBuffer(gl.ARRAY_BUFFER, trail_flag_vertices);
  gl.bindBuffer(gl.ARRAY_BUFFER, flag_overlay_vertices);
  var Block_I = [
          /*  Applying the scaling by dividing by the largest vertex
              which is 9 for the width and height
          */

          //Top of block "I"
          -(3/9),  (4/9),  0.0,     
          (3/9),  (4/9),  0.0,
          (1.5/9),  (2/9),  0.0,
          (3/9),  (4/9),  0.0,     
          (3/9),  (2/9),  0.0,
          (1.5/9),  (2/9),  0.0,
          -(3/9),  (4/9),  0.0, 
          -(1.5/9),  (2/9),  0.0,
          (1.5/9),  (2/9),  0.0,
          -(3/9),  (4/9),  0.0, 
          -(3/9),  (2/9),  0.0,
          -(1.5/9),  (2/9),  0.0,

          //Center of block I
          -(1.5/9),  (2/9),  0.0, 
          (1.5/9),  (2/9),  0.0,
          -(1.5/9),  -(2/9),  0.0,
          (1.5/9),  (2/9),  0.0, 
          (1.5/9),  -(2/9),  0.0,
          -(1.5/9),  -(2/9),  0.0,

          //Bottom of block "I"
          -(3/9),  -(2/9),  0.0,     
          -(1.5/9),  -(2/9),  0.0,
          -(3/9),  -(4/9),  0.0,
          -(1.5/9),  -(2/9),  0.0,     
          (1.5/9),  -(2/9),  0.0,
          -(3/9),  -(4/9),  0.0,
          (1.5/9),  -(2/9),  0.0, 
          -(3/9),  -(4/9),  0.0,
          -(3/9),  -(4/9),  0.0,
          (1.5/9),  (-2/9),  0.0, 
          (3/9),  (-2/9),  0.0,
          (3/9),  (-4/9),  0.0
  ];
  var Canvas = [];
  var Flag = [];
  var Flag_Overlay = [];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Block_I), gl.STATIC_DRAW);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Canvas), gl.STATIC_DRAW);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Flag), gl.STATIC_DRAW);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Flag_Overlay), gl.STATIC_DRAW);

  //TODO: ADD sizes and number of items for other arrays
  block_i_vertices.itemSize = 3;
  block_i_vertices.numberOfItems = 30;
  

  block_i_color = gl.createBuffer();
  // canvas_color_buffer = gl.createBuffer();
  // flag_color_buffer = gl.createBuffer();
  // overlay_color_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, block_i_color);
  // gl.bindBuffer(gl.ARRAY_BUFFER, canvas_color_buffer);
  // gl.bindBuffer(gl.ARRAY_BUFFER, flag_color_buffer);
  // gl.bindBuffer(gl.ARRAY_BUFFER, overlay_color_buffer);

  var i_color = [
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.1, 0.7, 1.0,
        1.0, 0.0, 0.0, 1.0
  ];
  var canvas_color = [];
  var flag_color = [];
  var overlay_color = [];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(i_color), gl.STATIC_DRAW);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(canvas_color), gl.STATIC_DRAW);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flag_color), gl.STATIC_DRAW);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(overlay_color), gl.STATIC_DRAW);

  //TODO: add item sizes and number of items for color_buffers
  block_i_color_buffer.itemSize = 4;
  block_i_color_buffer.numItems = 30;  


}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  
  //Draw canvas first
  // gl.bindBuffer(gl.ARRAY_BUFFER, canvas_vertices);
  // gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, canvas_vertices.itemSize, gl.FLOAT, false, 0, 0);
  // gl.bindBuffer(gl.ARRAY_BUFFER, canvas_color_buffer);
  // gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, canvas_color_buffer.itemSize, gl.FLOAT, false, 0, 0);
  // gl.drawArrays(gl.TRIANGLES, 0, canvas_vertices.numberOfItems);

  //draw block I
  gl.bindBuffer(gl.ARRAY_BUFFER, block_i_vertices);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, block_i_vertices.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, block_i_color_buffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, block_i_color_buffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, block_i_vertices.numberOfItems);

  //draw the flags
  // gl.bindBuffer(gl.ARRAY_BUFFER, trail_flag_vertices);
  // gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, trail_flag_vertices.itemSize, gl.FLOAT, false, 0, 0);
  // gl.bindBuffer(gl.ARRAY_BUFFER, flag_color_buffer);
  // gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, flag_color_buffer.itemSize, gl.FLOAT, false, 0, 0);
  // gl.drawArrays(gl.TRIANGLES, 0, trail_flag_vertices.numberOfItems);

  //draw the white overlay over the flags
  // gl.bindBuffer(gl.ARRAY_BUFFER, flag_overlay_vertices);
  // gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, flag_overlay_vertices.itemSize, gl.FLOAT, false, 0, 0);
  // gl.bindBuffer(gl.ARRAY_BUFFER, overlay_color_buffer);
  // gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, overlay_color_buffer.itemSize, gl.FLOAT, false, 0, 0);
  // gl.drawArrays(gl.TRIANGLES, 0, flag_overlay_vertices.numberOfItems);

}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  draw();
}
