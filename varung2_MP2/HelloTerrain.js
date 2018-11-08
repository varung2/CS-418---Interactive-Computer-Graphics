
/**
 * @file A simple WebGL example drawing central Illinois style terrain
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global The angle of rotation around the y axis */
var viewRot = 10;

/** @global A glmatrix vector to use for transformations */
var transformVec = vec3.create();    

// Initialize the vector....
vec3.set(transformVec,0.0,0.0,-2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(3.0,4.0,4.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(-0.249,-0.498,-.830);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,3,3];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.6,0.6,0.6];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [0.5,0.5,0.5];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0,0,0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.3];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

//Fog Variables
var Fogstate = false;
var fogSlider;

//Flying Variables
var velocity = 1.0;
var delta_v = 0.0;
//Quaternion for rotation
var angle = Math.PI/200; //angle to rotate in degrees
var orientation = [0.0, 0.0, 0.0, 1.0];
var rotMatrix = mat4.create();


//-------------------------------------------------------------------------

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
											false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
	mat3.fromMat4(nMatrix,mvMatrix);
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
	var copy = mat4.clone(mvMatrix);
	mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
	uploadModelViewMatrixToShader();
	uploadNormalMatrixToShader();
	uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
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
		} catch(e) {}
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

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

	shaderProgram.fogDensity = gl.getUniformLocation(shaderProgram, "uFogDensity");
	shaderProgram.fogOn = gl.getUniformLocation(shaderProgram, "FogOn");

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
	shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
	shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
	shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
	shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
	shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
	shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
	shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
	gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
	gl.uniform1f(shaderProgram.fogDensity, fogSlider);
	gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
	gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
	myTerrain = new Terrain(7,-5.0,5.0,-5.0,5.0);
	myTerrain.generateTerrain(0.7, 1.0);
	// myTerrain.printBuffers();
	myTerrain.loadBuffers();
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
	var transformVec = vec3.create();

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// We'll use perspective 
	mat4.perspective(pMatrix,degToRad(45), 
									 gl.viewportWidth / gl.viewportHeight,
									 0.1, 200.0);

	// We want to look down -z, so create a lookat point in that direction    
	vec3.add(viewPt, eyePt, viewDir);

	var orig_view = [3];
	var orig_up = [3];
	vec3.copy(orig_view, viewDir);
	vec3.copy(orig_up, up);

	vec3.transformQuat(viewDir, orig_view, orientation);
	vec3.transformQuat(up, orig_up, orientation);
	orientation = [0.0, 0.0, 0.0, 1.0]; // reset orientation

	// Then generate the lookat matrix and initialize the MV matrix to that view
	mat4.lookAt(mvMatrix,eyePt,viewPt,up);    

	// mat4.fromQuat(rotMatrix, orientation);
	// mat4.multiply(mvMatrix, mvMatrix, rotMatrix);

	//Draw Terrain
	mvPushMatrix();
	vec3.set(transformVec,0.0,-0.25,-2.0);
	mat4.translate(mvMatrix, mvMatrix,transformVec);
	mat4.rotateY(mvMatrix, mvMatrix, degToRad(viewRot));
	mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));

	setMatrixUniforms();
	setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
	
	if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
	{ 
		setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular); 
		myTerrain.drawTriangles();
	}
	
	if(document.getElementById("wirepoly").checked)
	{
		setMaterialUniforms(shininess,kAmbient,kEdgeBlack,kSpecular);
		myTerrain.drawEdges();
	}

	if(document.getElementById("wireframe").checked)
	{
		setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
		myTerrain.drawEdges();
	}
	mvPopMatrix();
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
function startup() {
	canvas = document.getElementById("myGLCanvas");
	gl = createGLContext(canvas);
	setupShaders();
	setupBuffers();
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	tick();
}

//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
	requestAnimFrame(tick);
	FogDensityInput();
	update_position();
	draw();
}

// gets the value of the slider and stores it in fogslider variable
function FogDensityInput() {
	fogSlider = (document.getElementById("fog_range").value)/260.0;
}

document.onkeypress = keypress;

//updates the position based on the velocity
function update_position() {
	//update the velocity
	velocity = velocity + delta_v;
	delta_v = 0.0;
	
	var speed_scale = 0.003;
	//update the position
	eyePt[0] = eyePt[0] + speed_scale*velocity*viewDir[0];
	eyePt[1] = eyePt[1] + speed_scale*velocity*viewDir[1];
	eyePt[2] = eyePt[2] + speed_scale*velocity*viewDir[2];
}
 
// handles keypresses
function keypress(evt) {

	//calculate the crossproduct for doing pitch up and down
	var x = [3];
	cross_product(up, viewDir, x);

		//pitch up
	if (evt.key == 'w' || (evt.key == 'W')) {
		console.log("Pitch up!");
		//implementation 2
		// quat.rotateX(orientation, temp, -Math.PI/200);

		//implementation 1
		// console.log("Orientation = (", orientation[0], ", ", orientation[1], ", ", orientation[2], ", ", orientation[3], ") ");
		// var axis = [0.0*c, 1.0*c, 0.0*c, -w];
		// // normalize(axis);
		// // console.log("axis = (", axis[0], ", ", axis[1], ", ", axis[2], ", ", axis[3], ")");
		// quat.conjugate(conj, axis);
		// // console.log("conj = (", conj[0], ", ", conj[1], ", ", conj[2], ", ", conj[3], ")");
		// quat.multiply(out, axis, quat_look_at);
		// quat.multiply(out2, out, conj);
		// console.log("prev viewDir = (", quat_look_at[0], ", ", quat_look_at[1], ", ", quat_look_at[2], ", ", quat_look_at[3], ")");
		// console.log("final viewDir = (", out[0], ", ", out[1], ", ", out[2], ", ", out[3], ")");
		// normalize(out2);
		// viewDir[0] = out2[0];
		// viewDir[1] = out2[1];
		// viewDir[2] = out2[2];

		//implementation 3
		quat.setAxisAngle(orientation, x, -angle);
		// quat.copy(orientation, temp);
		
		//pitch down
	} else if ((evt.key == 's') || (evt.key == 'S')) {
		console.log("Pitch down!");
		quat.setAxisAngle(orientation, x, angle);

		//roll left
	} else if (evt.key == 'a' || (evt.key == 'A')) {
		console.log("Roll left!");
		quat.setAxisAngle(orientation, viewDir, -angle);

		//roll right
	} else if (evt.key == 'd' || (evt.key == 'D')) {
		console.log("Roll right!");
		quat.setAxisAngle(orientation, viewDir, angle);
	} 


	//Handle Speed
	else if (evt.key == '-' || (evt.key == '_')) {
		console.log("Slow down!");
		console.log("Speed = ", velocity);
		delta_v = -0.2;
	} else if (evt.key == '+' || (evt.key == '=')) {
		console.log("Gotta go fast!");
		console.log("Speed = ", velocity);
		delta_v = 0.2;
	}
	//Toggle Fog 
	else if (evt.key == 'f' || (evt.key == 'F')) {
		if (Fogstate) {
			//turns fog off
			Fogstate = false;
			gl.uniform1f(shaderProgram.fogOn, 0.0);
		}
		else {
			//turns fog on
			Fogstate = true;
			gl.uniform1f(shaderProgram.fogOn, 2.0);
		}
		console.log("Fogstate: ", Fogstate);
	}
}
