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
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();
/** @global The Projection matrix */
var pMatrix = mat4.create();


// global variables to modify the flag overlay vertices
var left_overlay_tri_y = -5.5;
var right_overlay_tri_y = -5.5;
var init_y_tri = -5.5;

//variable to keep time (used in animation)
var time = 0;

//affine transformation variables
var translate_x_block_i = 0;
var translate_y_block_i = 0;

//wave transformation for flags
var joint_left_1 = 0;
var joint_left_2 = 0;
var joint_left_3 = 0;
var single_left_1 = 0;
var single_left_2 = 0;
var single_left_3 = 0;

var joint_right_1 = 0;
var joint_right_2 = 0;
var joint_right_3 = 0;
var single_right_1 = 0;
var single_right_2 = 0;
var single_right_3 = 0;


/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

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
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * initialize buffers with initial position data
 */
function load_buffer() {
	//vertices for whole graphic
	vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	var vertexArray = [

		//block I--------------
		-(3/10) + translate_x_block_i,  (4/10) + translate_y_block_i ,  0.0,     
		(3/10) + translate_x_block_i,  (4/10) + translate_y_block_i,  0.0,
		(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		(3/10) + translate_x_block_i,  (4/10) + translate_y_block_i,  0.0,     
		(3/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		-(3/10) + translate_x_block_i,  (4/10) + translate_y_block_i,  0.0, 
		-(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		-(3/10) + translate_x_block_i,  (4/10) + translate_y_block_i,  0.0, 
		-(3/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		-(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,

		//Center of block I
		-(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0, 
		(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0,
		-(1.5/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,
		(1.5/10) + translate_x_block_i,  (2/10) + translate_y_block_i,  0.0, 
		(1.5/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,
		-(1.5/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,

		//Bottom of block "I"
		-(3/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,     
		-(1.5/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,
		-(3/10) + translate_x_block_i,  -(4/10) + translate_y_block_i,  0.0,
		-(1.5/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,     
		(1.5/10) + translate_x_block_i,  -(2/10) + translate_y_block_i,  0.0,
		-(3/10) + translate_x_block_i,  -(4/10) + translate_y_block_i,  0.0,
		(1.5/10) + translate_x_block_i,  (-2/10) + translate_y_block_i,  0.0, 
		(3/10) + translate_x_block_i,  (-2/10) + translate_y_block_i,  0.0,
		(3/10) + translate_x_block_i,  (-4/10) + translate_y_block_i,  0.0,
		(-3/10) + translate_x_block_i, (-4/10) + translate_y_block_i, 0.0,
		(1.5/10) + translate_x_block_i, (-2/10) + translate_y_block_i, 0.0,
		(3/10) + translate_x_block_i, (-4/10) + translate_y_block_i, 0.0,


		//blue canvas-------------
		(-8/10), (6.6/10), 0.0,
		(-6.6/10), (4/10), 0.0,
		(-8/10), (4/10), 0.0,

		(-8/10), (6.6/10), 0.0,
		(8/10), (6.6/10), 0.0,
		(-6.6/10), (4/10), 0.0,

		(-6.6/10), (4/10), 0.0,
		(8/10), (6.6/10), 0.0,
		(6.6/10), (4/10), 0.0,

		(8/10), (6.6/10), 0.0,
		(8/10), (4/10), 0.0,
		(6.6/10), (4/10), 0.0,

		(-6.6/10), (4/10), 0.0,
		(6.6/10), (4/10), 0.0,
		(-6.6/10), (-4/10), 0.0,

		(6.6/10), (4/10), 0.0,
		(-6.6/10), (-4/10), 0.0,
		(6.6/10), (-4/10), 0.0,

		//flag_overlay-----------
		(0.0/10), (-9.25/10), 0.0,
		(-6.6/10), (left_overlay_tri_y/10), 0.0,
		(-6.6/10), (-9.25/10), 0.0,

		(0.0/10), (-9.25/10), 0.0,
		(6.6/10), (right_overlay_tri_y/10), 0.0,
		(6.6/10), (-9.25/10), 0.0,

		//flags------------------
		//Right set of flags
		(0.6/10), (-4.5/10) + single_right_1, 0.0, 
		(1.8/10), (-4.5/10) + joint_right_1, 0.0,
		(0.6/10), (-9/10), 0.0,

		(0.6/10), (-9/10), 0.0,
		(1.8/10), (-4.5/10) + joint_right_1, 0.0,
		(1.8/10), (-9/10), 0.0,

		(3.0/10), (-4.5/10) + single_right_2, 0.0,
		(4.2/10), (-4.5/10) + joint_right_2, 0.0,
		(3.0/10), (-9/10), 0.0,

		(3.0/10), (-9/10), 0.0,
		(4.2/10), (-4.5/10) + joint_right_2, 0.0,
		(4.2/10), (-9/10), 0.0,

		(5.4/10), (-4.5/10) + single_right_3, 0.0,
		(6.6/10), (-4.5/10) + joint_right_3, 0.0,
		(5.4/10), (-9/10), 0.0,

		(5.4/10), (-9/10), 0.0,
		(6.6/10), (-4.5/10) + joint_right_3, 0.0,
		(6.6/10), (-9/10), 0.0,

		//Left set of flags
		(-0.6/10), (-4.5/10) + single_left_1, 0.0, 
		(-1.8/10), (-4.5/10) + joint_left_1, 0.0,
		(-0.6/10), (-9/10), 0.0,

		(-0.6/10), (-9/10), 0.0,
		(-1.8/10), (-4.5/10) + joint_left_1, 0.0,
		(-1.8/10), (-9/10), 0.0,

		(-3.0/10), (-4.5/10) + single_left_2, 0.0,
		(-4.2/10), (-4.5/10) + joint_left_2, 0.0,
		(-3.0/10), (-9/10), 0.0,

		(-3.0/10), (-9/10), 0.0,
		(-4.2/10), (-4.5/10) + joint_left_2, 0.0,
		(-4.2/10), (-9/10), 0.0,

		(-5.4/10), (-4.5/10) + single_left_3, 0.0,
		(-6.6/10), (-4.5/10) + joint_left_3, 0.0,
		(-5.4/10), (-9/10), 0.0,

		(-5.4/10), (-9/10), 0.0,
		(-6.6/10), (-4.5/10) + joint_left_3, 0.0,
		(-6.6/10), (-9/10), 0.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.DYNAMIC_DRAW);
	vertexPositionBuffer.itemSize = 3;
	vertexPositionBuffer.numberOfItems = 48+42;  

	//colors for whole graphic
	vertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	var colorArr = [
	  //block I colors
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,
	    1.0, 1.0, 1.0, 1.0,

	    //canvas color	
		0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
		0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,
	  0.0859375, 0.15625, 0.296875, 1.0,

	  //flag_overlay (background color)
	  1.0, 1.0, 1.0, 1.0,
	  1.0, 1.0, 1.0, 1.0,
	  1.0, 1.0, 1.0, 1.0,
	  1.0, 1.0, 1.0, 1.0,
	  1.0, 1.0, 1.0, 1.0,
	  1.0, 1.0, 1.0, 1.0,

	  //flag color
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,

	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	  0.90625, 0.2890625, 0.2109375, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArr), gl.STATIC_DRAW);
	vertexColorBuffer.itemSize = 4;
	vertexColorBuffer.numItems = 48+42;  
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.identity(mvMatrix);
	mat4.identity(pMatrix);
	// mat4.rotateX(mvMatrix, mvMatrix, rotX_Matrix);
	setMatrixUniforms();

	//draw figure
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);

}

/**
 * Startup function called from html code to start program.
 */
function startup() {
	//inital setup and create the gl context
	canvas = document.getElementById("myGLCanvas");
	gl = createGLContext(canvas);
	setupShaders(); 
	load_buffer();
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
	requestAnimFrame(tick);
	draw();
	animate();
}

/**
*	Animation to be called from tick:
*	Performs modification to vertices to create animation both afine and 
*/
function animate() {
	//non-affine transformations
	time = time+1 % 12;
	console.log("Frame", time);
	left_overlay_tri_y = init_y_tri + 0.2*Math.sin(1/5*time);
	right_overlay_tri_y = init_y_tri + 0.2*Math.sin(1/8*time - 3*Math.PI/time);

	//affine transformations
	//bounce the I around the blue canvas
	translate_x_block_i = 0.12*Math.sin(1/10*time);
	translate_y_block_i = 0.12*Math.abs(Math.sin(2/31*time)*Math.sin(8/31*time));

	//animate the streaming flags
	joint_left_1 = wave(-1.8, time);
	joint_left_2 = wave(-4.2, time);
	joint_left_3 = wave(-6.6, time);
	single_left_1 = wave(-0.6, time);
	single_left_2 = wave(-3.0, time);
	single_left_3 = wave(-5.4, time);

	joint_right_1 = wave(1.8, time);
	joint_right_2 = wave(4.2, time);
	joint_right_3 = wave(6.6, time);
	single_right_1 = wave(0.6, time);
	single_right_2 = wave(3.0, time);
	single_right_3 = wave(5.4, time);



	load_buffer();
}

/**
*	function used for the wave effect for the streaming flags
*/
function wave(pos, t) {
	return (0.05*Math.sin(2*Math.PI*pos/12 + t/20)) - 0.06;
}