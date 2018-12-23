
/**
 * @file A simple WebGL example for viewing meshes read from OBJ files
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;
var skyProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

var rotMatrix = mat4.create();

var rrMatrix = mat4.create();

var invViewMat = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global An object holding the geometry for a 3D mesh */
var myMesh;
var myCube;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,1.0,1.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,7,7];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.2,0.2,0.2];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0.3,0.3,0.3];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [90.0/255.0,100.0/255.0,200.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.9,0.9,0.9];
/** @global Shininess exponent for Phong reflection */
var shininess = 7;
/** @global Edge color f0r wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

// for texture
var cubeImage0;
var cubeImage1;
var cubeImage2;
var cubeImage3;
var cubeImage4;
var cubeImage5;
var cubeImages = [cubeImage0, cubeImage1, cubeImage2, cubeImage3, cubeImage4, cubeImage5]
var cubeMap;

var texturesLoaded = 0;


//Model parameters
var eulerY = 0;
var del_rr_eulerY = 0;
var Obj_eulerY = 0;
var del_obj_eulerY = 0;
var shading_type = 1.0;

//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
	console.log("Getting text file");
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.onload = () => resolve(xhr.responseText);
		xhr.onerror = () => reject(xhr.statusText);
		xhr.send();
		console.log("Made promise");  
	});
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {

	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function uploadViewMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, vMatrix);

	mat4.invert(invViewMat, vMatrix);

	// console.log("View Matrix To Shader: ");
	// console.log(invViewMat);
	// console.log(vMatrix);
	
	//TODO:	upload rotation matrix
	// var reverseRotMatrix = mat4.create();
	// mat4.copy(reverseRotMatrix, reverseRotMatrix);
	// mat4.invert(reverseRotMatrix, reverseRotMatrix);

	gl.uniformMatrix4fv(shaderProgram.rotationMatrixUniform, false, rotMatrix);

	gl.uniformMatrix4fv(shaderProgram.rrMatrixUniform, false, rrMatrix);

	gl.uniformMatrix4fv(shaderProgram.invviewMatrixUniform, false, invViewMat);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
	mat3.fromMat4(nMatrix,mvMatrix);
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader2() {
	gl.uniformMatrix4fv(skyProgram.mvMatrixUniform, false, mvMatrix);
}
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader2() {
	gl.uniformMatrix4fv(skyProgram.pMatrixUniform, false, pMatrix);
}
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader2() {
	mat3.fromMat4(nMatrix,mvMatrix);
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);
	gl.uniformMatrix3fv(skyProgram.nMatrixUniform, false, nMatrix);
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
function setMatrixUniforms_SHADER_1() {
		uploadModelViewMatrixToShader();
		uploadNormalMatrixToShader();
		uploadProjectionMatrixToShader();
		uploadViewMatrixToShader();
}

function setMatrixUniforms_SHADER_2() {
	uploadModelViewMatrixToShader2();
		uploadNormalMatrixToShader2();
		uploadProjectionMatrixToShader2();
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

	skyShader_V = loadShaderFromDOM("skybox-vs");
	skyShader_F = loadShaderFromDOM("skybox-fs");
	
	shaderProgram = gl.createProgram();
	skyProgram = gl.createProgram();

	gl.attachShader(skyProgram, skyShader_V);
	gl.attachShader(skyProgram, skyShader_F);
	gl.linkProgram(skyProgram);

	if (!gl.getProgramParameter(skyProgram, gl.LINK_STATUS)) {
		alert("Failed to setup sky shaders");
	}

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Failed to setup normal shaders");
	}

	//enable sky box shaders
	skyProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(skyProgram.vertexPositionAttribute);

	skyProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(skyProgram.vertexNormalAttribute);

	skyProgram.mvMatrixUniform = gl.getUniformLocation(skyProgram, "uMVMatrix");
	skyProgram.pMatrixUniform = gl.getUniformLocation(skyProgram, "uPMatrix");
	skyProgram.nMatrixUniform = gl.getUniformLocation(skyProgram, "uNMatrix");

	//enable regular object shaders
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.invviewMatrixUniform = gl.getUniformLocation(shaderProgram, "uInvMatrix");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.shader_type = gl.getUniformLocation(shaderProgram, "shader_type");
	shaderProgram.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "uViewMat");

	shaderProgram.rotationMatrixUniform = gl.getUniformLocation(shaderProgram, "uRotMatrix");
	shaderProgram.rrMatrixUniform = gl.getUniformLocation(shaderProgram, "uRRMatrix");

	shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
	shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
	shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
	shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
	shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
	shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
	shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
	shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");

	gl.useProgram(shaderProgram);
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
function setupMesh(filename) {

	myMesh = new TriMesh();
	myMesh.setisObj(true);
	
	myPromise = asyncGetFile(filename);
	// We define what to do when the promise is resolved with the then() call,
	// and what to do when the promise is rejected with the catch() call
	myPromise.then((retrievedText) => {
			myMesh.loadFromOBJ(retrievedText);
			console.log("Yay! got the Object");
	}).catch((reason) => {console.log('Handle rejected promise ('+reason+') here.');});
}

function setupSky() {

	myCube = new TriMesh();
	myPromise = asyncGetFile("cube.obj");
		// We define what to do when the promise is resolved with the then() call,
		// and what to do when the promise is rejected with the catch() call
		myPromise.then((retrievedText) => {
				myCube.loadFromOBJ(retrievedText);
				console.log("Yay! got the Object");
		}).catch((reason) => {console.log('Handle rejected promise ('+reason+') here.');});
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw_skybox() { 
		// console.log("function draw")
		gl.useProgram(skyProgram);
		// gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

		// We'll use perspective 
		mat4.perspective(pMatrix,degToRad(45), 
										 gl.viewportWidth / gl.viewportHeight,
										 0.1, 500.0);

		// We want to look down -z, so create a lookat point in that direction    
		vec3.add(viewPt, eyePt, viewDir);
		
		// Then generate the lookat matrix and initialize the view matrix to that view
		mat4.lookAt(vMatrix,eyePt,viewPt,up);


		
		//Draw Mesh
		if (myCube.loaded() == true){
				mvPushMatrix();
				mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY));

				mat4.rotateY(rrMatrix, rrMatrix, degToRad(-del_rr_eulerY)); //rotate the matrix based on the relative change
				del_rr_eulerY = 0; //reset the change

				mat4.multiply(mvMatrix,vMatrix,mvMatrix);
				setMatrixUniforms_SHADER_2();
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
				gl.uniform1i(gl.getUniformLocation(skyProgram, "uCubeSampler"), 0);

				if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
				{
						myCube.drawTriangles();
				}
		
				if(document.getElementById("wirepoly").checked)
				{   
						myCube.drawEdges();
				}   

				if(document.getElementById("wireframe").checked)
				{
						myCube.drawEdges();
				}   
				mvPopMatrix();
		}
}

function draw_object() { 
		// console.log("function draw")
		gl.useProgram(shaderProgram);
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// We'll use perspective 
		mat4.perspective(pMatrix,degToRad(45), 
										 gl.viewportWidth / gl.viewportHeight,
										 0.1, 500.0);

		// vec3.rotateY(viewPt, viewPt, vec3(0.0, 0.0, 0.0), degToRad(0.0));

		// We want to look down -z, so create a lookat point in that direction    
		vec3.add(viewPt, eyePt, viewDir);
		
		//Rotate the eyepoint and the view point to generate the correct specular
		// vec3.rotateY(eyePt, eyePt, vec3(0.0, 0.0, 0.0), degToRad(-del_obj_eulerY));

		// Then generate the lookat matrix and initialize the view matrix to that view
		mat4.lookAt(vMatrix,eyePt,viewPt,up);

		//Draw Mesh
		if (myMesh.loaded() == true){
				mvPushMatrix();
				
				//Rotating the light with respect to the object so it does not move when we rotate the object alone
				var temp_light = vec3.fromValues(lightPosition[0], lightPosition[1], lightPosition[2]);
				var origin = vec3.fromValues(0.0, 0.0, 0.0);
				vec3.rotateY(temp_light, temp_light, origin, degToRad(-del_obj_eulerY));

				mat4.rotateY(rotMatrix, rotMatrix, degToRad(-del_obj_eulerY));

				lightPosition[0] = temp_light[0];
				lightPosition[1] = temp_light[1];
				lightPosition[2] = temp_light[2];
				Obj_eulerY += del_obj_eulerY;
				del_obj_eulerY = 0;


				mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY + Obj_eulerY));

				mat4.multiply(mvMatrix,vMatrix,mvMatrix);
				setMatrixUniforms_SHADER_1();
				setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
				gl.uniform1i(gl.getUniformLocation(shaderProgram, "uCubeSampler"), 0);

				if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
				{
						setMaterialUniforms(shininess,kAmbient,
																kTerrainDiffuse,kSpecular); 
						myMesh.drawTriangles();
				}
		
				if(document.getElementById("wirepoly").checked)
				{   
						setMaterialUniforms(shininess,kAmbient,
																kEdgeBlack,kSpecular);
						myMesh.drawEdges();
				}   

				if(document.getElementById("wireframe").checked)
				{
						setMaterialUniforms(shininess,kAmbient,
																kEdgeWhite,kSpecular);
						myMesh.drawEdges();
				}   
				mvPopMatrix();
		}	
}

//----------------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetImage(url, face) {
	console.log("Getting image");
	return new Promise((resolve, reject) => {
		cubeImages[face] = new Image();
		cubeImages[face].onload = () => resolve({url, status: 'ok'});
		cubeImages[face].onerror = () => reject({url, status: 'error'});
		cubeImages[face].src = url
		console.log("Made promise");  
	});
}
/**
 * Setup a promise to load a texture
 */
function setupPromise(filename, face) {
		myPromise = asyncGetImage(filename, face);
		// We define what to do when the promise is resolved with the then() call,
		// and what to do when the promise is rejected with the catch() call
		myPromise.then((status) => {
				handleTextureLoaded(cubeImages[face], face)
				console.log("Yay! got the file");
		})
		.catch(
				// Log the rejection reason
			 (reason) => {
						console.log('Handle rejected promise ('+reason+') here.');
				});
}

/**
 * Creates textures for application to cube.
 */
function setupTextures() {
	cubeMap = gl.createTexture();
	setupPromise("pos-z.png", 0);
	setupPromise("neg-z.png", 1);
	setupPromise("pos-y.png", 2);
	setupPromise("neg-y.png", 3);
	setupPromise("pos-x.png", 4);
	setupPromise("neg-x.png", 5);
}

/**
 * Texture handling. Generates mipmap and sets texture parameters.
 * @param {Object} image Image for cube application
 * @param {Number} face Which face of the cubeMap to add texture to
 */
function handleTextureLoaded(image, face) {
	console.log("handleTextureLoaded, image = " + image);
	texturesLoaded++;

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

	switch(face) {
		case 0:
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			break;
		case 1:
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			break;
		case 2:
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			break;
		case 3:
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			break;
		case 4:
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			break;
		case 5:
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			break;
		default:
			break;
	}
	if (texturesLoaded == 6) {
		gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	}
	// Clamping
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	// Filtering
	// gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}
//----------------------------------------------------------------------------------
//Code to handle user interaction
var currentlyPressedKeys = {};

function handleKeyDown(event) {
	// console.log("Key down ", event.key, " code ", event.code);
	currentlyPressedKeys[event.key] = true;
	if (currentlyPressedKeys["a"] || currentlyPressedKeys["A"]) {
			// key A
			eulerY-= 1;
			del_rr_eulerY -= 1;
	} else if (currentlyPressedKeys["d"] || currentlyPressedKeys["D"]) {
			// key D
			eulerY+= 1;
			del_rr_eulerY += 1;
	} 

	if (currentlyPressedKeys["ArrowUp"]){
			// Up cursor key
			event.preventDefault();
			eyePt[2]+= 0.01;
	} else if (currentlyPressedKeys["ArrowDown"]){
			event.preventDefault();
			// Down cursor key
			eyePt[2]-= 0.01;
	} 

	//handle the object rotation
	if (currentlyPressedKeys["q"] || currentlyPressedKeys["Q"]) {
		del_obj_eulerY -= 1;
	} else if (currentlyPressedKeys["e"] || currentlyPressedKeys["E"]) {
		del_obj_eulerY += 1;
	}

	//handle the shading
	if (currentlyPressedKeys["r"] || currentlyPressedKeys["R"]) {
		gl.useProgram(shaderProgram);
		console.log("Toggle shading");
		if (shading_type < 0.0) {
			gl.uniform1f(shaderProgram.shader_type, 1.0);
			shading_type = 1.0;
		}
		else {
			gl.uniform1f(shaderProgram.shader_type, -1.0);
			shading_type = -1.0;
		}
	}


}

function handleKeyUp(event) {
				//console.log("Key up ", event.key, " code ", event.code);
				currentlyPressedKeys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
function startup() {
	canvas = document.getElementById("myGLCanvas");
	gl = createGLContext(canvas);
	setupShaders();
	setupTextures();
	setupMesh("teapot.obj");
	setupSky();
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	tick();
}

//----------------------------------------------------------------------------------
/**
	* Update any model transformations
	*/
function animate() {
	 //console.log(eulerX, " ", eulerY, " ", eulerZ); 
	 document.getElementById("eY").value=eulerY;
	 document.getElementById("eZ").value=eyePt[2];   
}


//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
		requestAnimFrame(tick);
		animate();
		draw_object();
		draw_skybox();
}

