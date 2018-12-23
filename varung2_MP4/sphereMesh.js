/**
 * @fileoverview SphereMesh - A simple 3D surface mesh for for use with WebGL
 * @author Varun Govind
 */

class sphereMesh{
	//velocity, position, accel, col, radius, timestep
 	constructor(v, p, a, c, r, t){
 		this.velocity = v; //vector
 		this.position = p; //vector
 		this.acceleration = a; //vector
 		this.color = c; //vector
 		this.rad = r;
 		this.time = t; //time step
 	}

 	update_position(time, g){

 		//update the position
	 	this.position[0] += time*this.velocity[0];
	 	this.position[1] += time*this.velocity[1];
	 	this.position[2] += time*this.velocity[2];

	 	this.check_bounds(g); //check the boundaries

	 	this.position_correction(); //then correct the position if necessary

 		// console.log("New Position: ", this.position);
 	}

 	update_velocity(time, d) {

 		if (d > 0.0) { //update for drag factor
 			this.velocity[0] = time*this.acceleration[0] + this.velocity[0]*d;
	 		this.velocity[1] = time*this.acceleration[1] + this.velocity[1]*d;
	 		this.velocity[2] = time*this.acceleration[2] + this.velocity[2]*d;
 		} else { //update for no drag factor
	 		this.velocity[0] += time*this.acceleration[0];
	 		this.velocity[1] += time*this.acceleration[1];
	 		this.velocity[2] += time*this.acceleration[2];
 		}
 		// console.log("Acceleration: ", this.acceleration);
 	}

 	//gravity is a scalar, friction is also a scalar, time is a timestep
 	update_acceleration(gravity){
 		this.acceleration[1] = gravity;
 	}

 	update_sphere(g, f, t, real_time){
 		var time = this.time;
 		if (t == true) {
 			time = real_time;
 		} 

 		this.update_position(time);
 		this.update_velocity(time, f);
 		this.update_acceleration(g);
 	}

 	get_radius(){
 		return this.rad;
 	}

 	get_position(){
 		return this.position;
 	}


 	check_bounds(g){
 		var x_y_upper_bound = 40.0;
		var x_y_lower_bound = -40.0;
		var z_upper_bound = 50.0;
		var z_lower_bound = -49.0;
		var energy_loss = 0.98;

 		//checking the x bound
 		if(this.position[0] + this.rad > x_y_upper_bound || this.position[0] - this.rad < x_y_lower_bound) {
 			this.velocity[0] = -(this.velocity[0] * energy_loss); //loose 2% of energy when you hit a wall
 		}

 		//checking the y bound
 		if(this.position[1] + this.rad > x_y_upper_bound || this.position[1] - this.rad < x_y_lower_bound) {
 				
 			//special update if gravity is enabled
 			if (this.position[1] - this.rad < x_y_lower_bound && g > 0.0) {
 				this.velocity[1] = -(this.velocity[1]*0.78); //special energy loss for gravity to make the particles do less bounces	
 			} else {
 				this.velocity[1] = -(this.velocity[1]*energy_loss);
 			}
 			
 		}

 		//checking the z bounds
 		if(this.position[2] + this.rad > z_upper_bound || this.position[2] - this.rad < z_lower_bound) {
 			this.velocity[2] = -(this.velocity[2]*energy_loss);
 		}
 	}

 	//this corrects the position if it is too out of bounds, otherwise velocity will accelerate to zero
 	//the ball gets "stuck" at the edges of the box if this happens
 	position_correction(){
 		var x_y_upper_bound = 40.0;
		var x_y_lower_bound = -40.0;
		var z_upper_bound = 50.0;
		var z_lower_bound = -49.0;
		var add_factor = 0.01;

 		//y position correction
 		if (this.position[1] - this.rad < x_y_lower_bound) {
	 		this.position[1] = x_y_lower_bound + this.rad + add_factor;
	 	}

		if (this.position[1] + this.rad > x_y_upper_bound) {
	 		this.position[1] = x_y_upper_bound - this.rad - add_factor;
	 	}

	 	//x position correction
	 	if (this.position[0] + this.rad > x_y_upper_bound) {
	 		this.position[0] = x_y_upper_bound - this.rad - add_factor;
	 	}
	 	if (this.position[0] - this.rad < x_y_lower_bound) {
	 		this.position[0] = x_y_lower_bound + this.rad + add_factor;
	 	}

	 	//z correction
	 	if (this.position[2] + this.rad > z_upper_bound) {
	 		this.position[2] = z_upper_bound - this.rad - add_factor;
	 	}

	 	if (this.position[2] - this.rad < z_lower_bound) {
	 		this.position[2] = z_lower_bound + this.rad + add_factor;
	 	}

 	}


}


