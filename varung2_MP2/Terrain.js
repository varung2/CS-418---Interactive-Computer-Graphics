/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
*/	
	constructor(div,minX,maxX,minY,maxY){
		this.div = Math.pow(2, div);
		this.size = this.div + 1;
		this.max = this.div;

		this.minX=minX;
		this.minY=minY;
		this.maxX=maxX;
		this.maxY=maxY;
		
		//Initializing the colors
		this.colorBlue = [3];
		this.colorBlue[0] = 58/256;
		this.colorBlue[1] = 117/256;
		this.colorBlue[2] = 188/256;

		this.colorSand = [3];
		this.colorSand[0] = 206/256;
		this.colorSand[1] = 192/256;
		this.colorSand[2] = 146/256;

		this.colorGrass = [3];
		this.colorGrass[0] = 141/256;
		this.colorGrass[1] = 224/256;
		this.colorGrass[2] = 159/256;

		this.colorTrees = [3];
		this.colorTrees[0] = 50/256;
		this.colorTrees[1] = 130/256;
		this.colorTrees[2] = 67/256;

		this.colorDarkTrees = [3];
		this.colorDarkTrees[0] = 42/256;
		this.colorDarkTrees[1] = 91/256;
		this.colorDarkTrees[2] = 39/256;

		this.colorMountain = [3];
		this.colorMountain[0] = 89/256;
		this.colorMountain[1] = 85/256;
		this.colorMountain[2] = 83/256;

		this.colorSnow = [3];
		this.colorSnow[0] = 234/256;
		this.colorSnow[1] = 234/256;
		this.colorSnow[2] = 234/256;
		// Height Buffer for generating terrain
		this.hBuffer = new Float32Array(this.size * this.size)

		// Color Buffer for vertices
		this.cBuffer = [];

		// Allocate vertex array
		this.vBuffer = [];
		// Allocate triangle array
		this.fBuffer = [];
		// Allocate normal array
		this.nBuffer = [];
		// Allocate array for edges so we can draw wireframe
		this.eBuffer = [];
		console.log("Terrain: Allocated buffers");
		
		this.generateTriangles();
		console.log("Terrain: Generated triangles");
		
		this.generateLines();
		console.log("Terrain: Generated lines");
		
		// Get extension for 4 byte integer indices for drwElements
		var ext = gl.getExtension('OES_element_index_uint');
		if (ext ==null){
			alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
		}
	}
	
	/**
		* Set the x,y,z coords of a vertex at location(i,j)
		* @param {Object} v an an array of length 3 holding x,y,z coordinates
		* @param {number} i the ith row of vertices
		* @param {number} j the jth column of vertices
	*/
	setVertex(v,i,j){
		//Your code here
		var vid = 3*(i*(this.div+1) + j);
		this.vBuffer[vid] = v[0];
		this.vBuffer[vid+1] = v[1];
		this.vBuffer[vid+2] = v[2];
	}
	
	/**
		* Return the x,y,z coordinates of a vertex at location (i,j)
		* @param {Object} v an an array of length 3 holding x,y,z coordinates
		* @param {number} i the ith row of vertices
		* @param {number} j the jth column of vertices
	*/
	getVertex(v,i,j){
		//Your code here
		var vid = 3*(i*(this.div+1) + j);
		// console.log("VID: ", vid);
		v[0] = this.vBuffer[vid];
		v[1] = this.vBuffer[vid+1];
		v[2] = this.vBuffer[vid+2];
	}
	
	/**
	* Send the buffer objects to WebGL for rendering 
	*/
	loadBuffers(){
		// Specify the vertex coordinates
		this.VertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
		this.VertexPositionBuffer.itemSize = 3;
		this.VertexPositionBuffer.numItems = this.numVertices;
		console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

		this.ColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.ColorBuffer);      
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cBuffer), gl.STATIC_DRAW);
		this.ColorBuffer.itemSize = 3;
		this.numColors = this.vBuffer.length/3;
		this.ColorBuffer.numItems = this.numColors;
		console.log("Loaded ", this.ColorBuffer.numItems, " colors");
	
		// Specify normals to be able to do lighting calculations
		this.VertexNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
		// console.log("Loaded: nBuffer = (", this.nBuffer[0], ", ", this.nBuffer[1], ", ", this.nBuffer[2], ") ");
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
				  gl.STATIC_DRAW);
		this.VertexNormalBuffer.itemSize = 3;
		this.VertexNormalBuffer.numItems = this.numVertices;
		console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
	
		// Specify faces of the terrain 
		this.IndexTriBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
				  gl.STATIC_DRAW);
		this.IndexTriBuffer.itemSize = 1;
		this.IndexTriBuffer.numItems = this.fBuffer.length;
		console.log("Loaded ", this.numFaces, " triangles");
	
		//Setup Edges  
		this.IndexEdgeBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
				  gl.STATIC_DRAW);
		this.IndexEdgeBuffer.itemSize = 1;
		this.IndexEdgeBuffer.numItems = this.eBuffer.length;
		
		console.log("triangulatedPlane: loadBuffers");
	}
	
	/**
	* Render the triangles 
	*/
	drawTriangles(){
		// Bind vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
						 gl.FLOAT, false, 0, 0);

		// Bind color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.ColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.ColorBuffer.itemSize, 
						 gl.FLOAT, false, 0, 0);

		// Bind normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
						   this.VertexNormalBuffer.itemSize,
						   gl.FLOAT, false, 0, 0);   
	
		//Draw 
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
		gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
	}
	
	/**
	* Render the triangle edges wireframe style 
	*/
	drawEdges(){
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
						 gl.FLOAT, false, 0, 0);

		// Bind normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
						   this.VertexNormalBuffer.itemSize,
						   gl.FLOAT, false, 0, 0);  

		gl.bindBuffer(gl.ARRAY_BUFFER, this.ColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.ColorBuffer.itemSize, 
						 gl.FLOAT, false, 0, 0);
	
		//Draw 
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
		gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
	}
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles(){
	//Your code here
	var x_amount = (this.maxX - this.minX) / this.div
	var y_amount = (this.maxY - this.minY) / this.div

	for (var i = 0; i <= this.div; i++) {
		for (var j = 0; j <= this.div; j++) {
			this.vBuffer.push(j*x_amount + this.minX)
			this.vBuffer.push(this.minY + i*y_amount)
			this.vBuffer.push(0)

			//causes bug when we would fix the normals
			// this.nBuffer.push(0)
			// this.nBuffer.push(0)
			// this.nBuffer.push(1)
		}
	}

	for (var i = 0; i < this.div; i++) {
		for (var j = 0; j < this.div; j++) {

			var vid = i*(this.div+1) + j

			this.fBuffer.push(vid)
			this.fBuffer.push(vid + this.div+1)
			this.fBuffer.push(vid + this.div+2)

			this.fBuffer.push(vid)
			this.fBuffer.push(vid+1)
			this.fBuffer.push(vid + this.div+2)
		}
	}
	
	this.numVertices = this.vBuffer.length/3;
	this.numColors = this.vBuffer.length/3;
	this.numFaces = this.fBuffer.length/3;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
	{
		
	// for(var i=0;i<this.numVertices;i++)
	// 	  {
	// 	   console.log("v ", this.vBuffer[i*3], " ", 
	// 						 this.vBuffer[i*3 + 1], " ",
	// 						 this.vBuffer[i*3 + 2], " ");
					   
	// 	  }
	
	  // for(var i=0;i<this.numFaces;i++)
		 //  {
		 //   console.log("f ", this.fBuffer[i*3], " ", 
			// 				 this.fBuffer[i*3 + 1], " ",
			// 				 this.fBuffer[i*3 + 2], " ");
					   
		 //  }

		for(var i = 0; i < this.numColors; i++) {
			console.log("c ", this.cBuffer[i*3], " ", this.cBuffer[i*3 + 1], " ", this.cBuffer[i*3 + 2], " ");
		}

		console.log("Creating Test Buffer");
		var testbuf = new Float32Array(this.cBuffer);

		for(var i = 0; i < this.numColors; i++) {
			console.log("Test Buffer:  ", testbuf[i*3], " ", testbuf[i*3 + 1], " ", testbuf[i*3 + 2], " ");
		}
		
	}

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines(){
	var numTris=this.fBuffer.length/3;
	for(var f=0;f<numTris;f++)
	{
		var fid=f*3;
		this.eBuffer.push(this.fBuffer[fid]);
		this.eBuffer.push(this.fBuffer[fid+1]);
		
		this.eBuffer.push(this.fBuffer[fid+1]);
		this.eBuffer.push(this.fBuffer[fid+2]);
		
		this.eBuffer.push(this.fBuffer[fid+2]);
		this.eBuffer.push(this.fBuffer[fid]);
	}
}

/** get_height()
 * returns the height of the vertex given by x & y coordinates
 */
get_height(x, y) {
	if (x < 0 || x > this.max || y < 0 || y > this.max) return -1;
	return this.hBuffer[x + this.size * y];
}
/** set_height()
 * sets the height of the vertex given by x & y coordinates to the value
 */
set_height(x, y, val) {
	if (x < 0 || x > this.max || y < 0 || y > this.max) return -1;
	this.hBuffer[x + this.size * y] = val;
	return 0;
}

/** generateTerrain()
 * This function is a wraper function that initializes the corners of the plane
 * and starts the diamond square algorithim. After the alorithm is done, it parses
 *	the height buffer and fixes the normals, and finally attaches colors to the position
 *  of the vertices and sets the color buffer.
 * {inputs}: roughness - sets the general roughness of the terrain during the diamond square algorithm
 * 			 scaling - scales the final heights when copying (used for testing)
 */
generateTerrain(roughness, scaling){
	this.set_height(0, 0, this.max*Math.random());
	this.set_height(this.max, 0, this.max * Math.random());
	this.set_height(this.max, this.max, 0);
	this.set_height(0, this.max, this.max * Math.random());
	this.diam_sq(this.max, roughness);
	this.copy_heights(scaling);
	this.fix_normals();
	this.apply_colors();
}

/** diam_sq()
 * recursive algorithm which impliments the diamond square algorithm, almost like another wrapper function
 */
diam_sq(size, rough) {
	var x, y;
	var half = size/2;
	var scale = rough * size;

	//return if we've recursed the maximum depth (when the square = a vertex)
	if (half < 1) return;

	//loop for the diamond step
	for (y = half; y < this.max; y += size) {
		for (x = half; x < this.max; x += size) {
			this.diamond(x, y, half, Math.random() * scale * 2 - scale);
		}
	}

	//loop for the square step
	for (y = 0; y <= this.max; y += half) {
		for (x = (y+half)%size; x <= this.max; x += size) {
			this.square(x, y, half, Math.random() * scale * 2 - scale);
		}
	}

	//recurse one depth further
	this.diam_sq(size/2, rough);
}

/** diamond()
 * diamond step of the algorithm
 */
diamond(x, y, size, offset) {
	var avg;
	var a, b, c, d;
	a = this.get_height(x - size, y - size); //bottom left
	b = this.get_height(x + size, y - size); //bottom right
	c = this.get_height(x + size, y + size); //upper right
	d = this.get_height(x - size, y + size); //upper left

	avg = (a + b + c + d) / 4;
	// if (x == y) {
	// 	console.log("diamond | avg (x == y) = ", avg);
	// } else {
	// 	console.log("diamond | avg = ", avg);
	// }
	this.set_height(x, y, avg + offset);
}

/** square()
 * takes the 4 corners of the square and averages them into x, y
 */
square(x, y, size, offset) {
	var avg;
	var a, b, c, d;
	a = this.get_height(x, y - size); //bottom
	b = this.get_height(x + size, y); //right
	c = this.get_height(x, y + size); //top
	d = this.get_height(x - size, y); //left

	avg = (a + b + c + d) / 4;
	// if (x == y) {
	// 	console.log("square | avg (x == y) = ", avg);
	// } else {
	// 	console.log("square | avg = ", avg);
	// }
	this.set_height(x, y, avg + offset);
}

/** copy_heights()
 * copies the heights from the height buffer (used in algorithm) back to the verticies
 */
copy_heights(scaling) {
	var x, y;
	for (x = 0; x < this.size; x++) {
		for (y = 0; y < this.size; y++) {
			var vid = 3*(y*this.size + x);
			if (this.hBuffer[x + this.size * y] < 0) {
				this.vBuffer[vid+2] = 0;
			} else {
				this.vBuffer[vid+2] = scaling*((this.hBuffer[x + this.size * y])/this.max);
			}
		}
	}
}

/** fix_normals()
 * creates the normals for the vertices and 
 */
fix_normals() {
	//variables for looping through the verticies, vectors, and etc.
	var x, y, i, j, k;
	var range = 3;

	//variables for holding the vectors to later calculate the normals

	//loop for rows
	for (y = 0; y < this.size; y++) {
		//loop for x
		for (x = 0; x < this.size; x++) {
			var vector_arr = [];
			var normal_arr = [];

			var current = [3];
			this.getVertex(current, y, x); //stores current vertex in "current"

			var i = y+Math.floor(range/2);
			var j = x;
			var counter = 0;
			var State = 0;

			//calculate the surrounding vectors
			while(1) {
				var vector = [3];
				var v;
				switch(State) {
					//handle the top
					case 0:
						if (i > -1 && j > -1 && i < this.size && j < this.size) {
							// console.log("Entered TOP!");
							// console.log("Index: X(j): [", j, "] Y(i): [", i, "]");
							this.getVertex(vector, i, j);
							calc_vector(vector, vector, current);
							vector_arr.push(vector[0]);
							vector_arr.push(vector[1]);
							vector_arr.push(vector[2]);
						}

						if (counter == 1) {
							State = 1; //go to next state (Right)
							counter = 1;
							i--;
							break;
						}
						counter++
						j++
						break;

					//handle the right
					case 1:
						if (i > -1 && j > -1 && i < this.size && j < this.size) {
							// console.log("Entered RIGHT!");
							// console.log("Index: X(j): [", j, "] Y(i): [", i, "]");
							this.getVertex(vector, i, j);
							calc_vector(vector, vector, current);
							vector_arr.push(vector[0]);
							vector_arr.push(vector[1]);
							vector_arr.push(vector[2]);
						}
						if (counter == 1) {
							State = 2; //next state is Bottom
							counter = 0;
							j--;
							i--;
							break;
						}
						counter++
						i--
						break;

					//handle the bottom
					case 2:
						if (i > -1 && j > -1 && i < this.size && j < this.size) {
							// console.log("Entered BOTTOM!");
							// console.log("Index: X(j): [", j, "] Y(i): [", i, "]");
							this.getVertex(vector, i, j);
							calc_vector(vector, vector, current);
							vector_arr.push(vector[0]);
							vector_arr.push(vector[1]);
							vector_arr.push(vector[2]);
						}
						if (counter == 1) {
							State = 3;
							i++
							break;
						}
						counter++
						j--
						break;

					//handle the left
					case 3:
						if (i > -1 && j > -1 && i < this.size && j < this.size) {
							// console.log("Entered LEFT!");
							// console.log("Index: X(j): [", j, "] Y(i): [", i, "]");
							this.getVertex(vector, i, j);
							calc_vector(vector, vector, current);
							vector_arr.push(vector[0]);
							vector_arr.push(vector[1]);
							vector_arr.push(vector[2]);
						}
						State = 4;
						break;
					default:
						// console.log("Invalid Arg in Switch!");
						break;
				}

				//if we are in the last
				if (State == 4) break;
			}

			//Here we calculate the normals for the vectors we calculated above
			var len = vector_arr.length/3;
			// console.log("Length of Vector: ", len);
			//we do axb = n
			var a = [3];
			var b = [3];
			var c = [3];
			// console.log("Begin Loop, length = ", len);
			for (k = 0; k < len; k++) {
				if (k == len-1 && len > 3) {
					// console.log("1st | Vector# [", 0,"]. v<x, y, z>: <", vector_arr[0*3],", ", vector_arr[0*3 + 1],", ", vector_arr[0*3 + 2], ">");
					// console.log("1st | Vector# [", k,"]. v<x, y, z>: <", vector_arr[k*3],", ", vector_arr[k*3 + 1],", ", vector_arr[k*3 + 2], ">");
				/** |------- get x ------|--------- get y -----------|----------- get z----------|*/
					a[0] = vector_arr[0  ]; a[1] = vector_arr[      1]; a[2] = vector_arr[      2]; //first vector
					b[0] = vector_arr[k*3]; b[1] = vector_arr[k*3 + 1]; b[2] = vector_arr[k*3 + 2]; //second vector

					//calculate the cross product
					c[0] = a[1]*b[2] - a[2]*b[1]; // c_x = a_y*b_z - a_z*b_y
					c[1] = a[2]*b[0] - a[0]*b[2]; // etc. 
					c[2] = a[0]*b[1] - a[1]*b[0];

					if ((a[0] != -b[0]) && (a[1] != -b[1])) {
						normalize(c);
						normal_arr.push(c[0]);
						normal_arr.push(c[1]);
						normal_arr.push(c[2]);
						// console.log("1st | Normal (x,y,z) = (", c[0],", ", c[1],", ", c[2],")");
					}
				} 

				if (k < len-1){
					// console.log("2nd | Vector# [", k,"]. v<x, y, z>: <", vector_arr[k*3],", ", vector_arr[k*3 + 1],", ", vector_arr[k*3 + 2], ">");
					// console.log("2nd | Vector# [", k+1,"]. v<x, y, z>: <", vector_arr[(k+1)*3],", ", vector_arr[(k+1)*3 + 1],", ", vector_arr[(k+1)*3 + 2], ">");
				/** |-------- get x ----------|--------- get y ---------------|-------------- get z----------|*/
					a[0] = vector_arr[(k+1)*3]; a[1] = vector_arr[(k+1)*3 + 1]; a[2] = vector_arr[(k+1)*3 + 2]; //first vector
					b[0] = vector_arr[k*3    ]; b[1] = vector_arr[k*3     + 1]; b[2] = vector_arr[k*3     + 2]; //second vector

					//calculate the cross product
					c[0] = a[1]*b[2] - a[2]*b[1]; // c_x = a_y*b_z - a_z*b_y
					c[1] = a[2]*b[0] - a[0]*b[2]; // etc. 
					c[2] = a[0]*b[1] - a[1]*b[0];

					if ((a[0] != -b[0]) && (a[1] != -b[1])) {
						normalize(c);
						normal_arr.push(c[0]);
						normal_arr.push(c[1]);
						normal_arr.push(c[2]);
						// console.log("2nd | Normal (x,y,z) = (", c[0],", ", c[1],", ", c[2],")");
					}
				}
			}

			//After creating the set of normal vectors for the faces, we average them (by adding and dividing like normal)
			var n = [3]; //place where we store our averaged normal
			average_vec_3(normal_arr, n);
			normalize(n);
			// console.log("Averaged Normal = (", n[0],", ", n[1],", ", n[2],")");

			this.nBuffer.push(n[0]);
			this.nBuffer.push(n[1]);
			this.nBuffer.push(n[2]);

		}
	}
}

/** apply_colors()
 * applies the colors for the vertices based on the height 
 */
apply_colors() {
	var i, j;
	//loop through the vertices and modify the color buffer
	for (i = 0; i < this.size; i++) {
		for (j = 0; j < this.size; j++) {
			var v = [3];
			// console.log("Index: X(j): [", j, "] Y(i): [", i, "]");
			this.getVertex(v, i, j);
			// console.log("Colors | GetVertex (x,y,z) = (", v[0],", ", v[1],", ", v[2],")");
			if (v[2] == 0.0) { //check if z coordinate is zero
				this.cBuffer.push(this.colorBlue[0]);
				this.cBuffer.push(this.colorBlue[1]);
				this.cBuffer.push(this.colorBlue[2]);
				// this.cBuffer.push(1.0); //alpha
			} else if (v[2] > 0.0 && v[2] < 0.1) {
				this.cBuffer.push(this.colorSand[0]);
				this.cBuffer.push(this.colorSand[1]);
				this.cBuffer.push(this.colorSand[2]);
			} else if (v[2] >= 0.1 && v[2] < 0.2) {
				this.cBuffer.push(this.colorGrass[0]);
				this.cBuffer.push(this.colorGrass[1]);
				this.cBuffer.push(this.colorGrass[2]);
			} else if (v[2] >= 0.2 && v[2] < 0.5) {
				this.cBuffer.push(this.colorTrees[0]);
				this.cBuffer.push(this.colorTrees[1]);
				this.cBuffer.push(this.colorTrees[2]);
			} else if (v[2] >= 0.5 && v[2] < 0.7) {
				this.cBuffer.push(this.colorDarkTrees[0]);
				this.cBuffer.push(this.colorDarkTrees[1]);
				this.cBuffer.push(this.colorDarkTrees[2]);
			} else if (v[2] >= 0.7 && v[2] < 0.89) {
				this.cBuffer.push(this.colorMountain[0]);
				this.cBuffer.push(this.colorMountain[1]);
				this.cBuffer.push(this.colorMountain[2]);
			} else {
				//TODO: add other colors based on heights
				this.cBuffer.push(this.colorSnow[0]);
				this.cBuffer.push(this.colorSnow[1]);
				this.cBuffer.push(this.colorSnow[2]);
				// this.cBuffer.push(1.0);
			}
			// console.log("Colors | GetVertex (x,y,z) = (", v[0],", ", v[1],", ", v[2],")");
		}
	}
}

} //end of class

/** Calculates the vector given two points
 *	{Input} p2 - Destination point 
 *  {Input} p1 - Source point
 *  {Output} ret - array that vector is stored in
 */
function calc_vector(ret, p2, p1) {
	var x;
	for (x = 0; x < 3; x++) {
		ret[x] = p2[x] - p1[x];
	}
}

/** Normalizes the vector given 
 *	{Input} v - array which stores the vector to normalize
 */
function normalize(v) {
	var m = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
	v[0] /= m;
	v[1] /= m;
	v[2] /= m;
}

/** Averages a set of vectors
 *	{Input} v - array which stores the vectors to be averaged
 *				v is stored in a 3-space scheme, 	[[x], [y], [z], [x], [y], [z], [], ...
 												 	]
 *  {Output} out - array which stores the averaged vector
 */
function average_vec_3(v, out) {
	//initialize variables
	var i;
	var sum = [3];
	sum[0] = 0; sum[1] = 0; sum[2] = 0; 

	//add vectors
	for (i = 0; i < v.length/3; i++) {
		sum[0] += v[i*3 + 0];
		sum[1] += v[i*3 + 1];
		sum[2] += v[i*3 + 2]; 
	}
	//divide by number of vectors added
	out[0] = sum[0]/(v.length/3);
	out[1] = sum[1]/(v.length/3);
	out[2] = sum[2]/(v.length/3);
}

function cross_product(a, b, out) {
	//calculate the cross product
	out[0] = a[1]*b[2] - a[2]*b[1]; // c_x = a_y*b_z - a_z*b_y
	out[1] = a[2]*b[0] - a[0]*b[2]; // etc. 
	out[2] = a[0]*b[1] - a[1]*b[0];
}
