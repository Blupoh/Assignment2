var canvasWidth = 960;
var canvasHeight = 450;

paper.install(window);


window.onload = function()
{
	paper.setup("mainCanvas");

	flock = new Flock();
	for(var i=0; i<55; i++)
	{
		var boid = new Boid(new Point(canvasWidth/2+(Math.random()*100+50), canvasHeight/2+(Math.random()*100+50)));
		boid.init();
		flock.addBoid(boid);
	}

	view.onFrame = function(event){
		flock.run();
	}
}

this.addEventListener("mousedown", function (e) {
	if (e.button === 0) {
		var boid = new Boid(new Point(e.x, e.y/2));
		boid.init();
		flock.addBoid(boid);
		 
		}
		if (e.button === 2) {
		var pred = new Pred(new Point(e.x, e.y/2));
		pred.init();
		flock.addBoid(pred);
		
		}
       
    }, false);

this.addEventListener("contextmenu", function (e) {
	e.preventDefault();
		

}, false);

// -------------------------------------
// ---- Flock Class BEGIN

Flock = function()
{
	this.boids = new Array();

	this.run = function()
	{
		if(this.boids){
			for(var i=0; i<this.boids.length; i++)
			{
				this.boids[i].run(this.boids);
			}
		}
	}

	this.addBoid = function(boid)
	{
		this.boids.push(boid);
		//console.log(this.boids.length);
	}

}

plusOrMinus = function()
{
	return Math.random() < 0.5 ? -1 : 1;
}


// ---- Flock Class END
// -------------------------------------

// -------------------------------------
// ---- Boid Class BEGIN

Boid = function(location)
{
	
	this.shape = new Group();

	this.accVector = new Path();
	this.body = new Path();

	this.location = location;
	this.velocity = new Point();
	this.acceleration = new Point(0,0);

	this.type = 2;
	this.dead = false;
	
	var pathRadius = 3;
	var maxSpeed = 4;
	var maxForce = 0.05;

	var orientation = 0;
	var lastOrientation = 0;
	var lastLocation;

	this.init = function()
	{
		this.velocity.x = plusOrMinus();
		this.velocity.y = plusOrMinus();

		//console.log(this.velocity.x + ' ' + this.velocity.y + ' ' + (this.velocity.angle + 90));

		this.body.strokeColor = 'white';
		this.body.strokeWidth = 2;

		this.body.add(new Point(0, -pathRadius*2));
		this.body.add(new Point(-pathRadius, pathRadius*2));
		this.body.add(new Point(pathRadius, pathRadius*2));	

		this.body.position = this.location;
		this.body.fillColor = new RgbColor(255,255,255, 0.5);

		this.body.closed = true;

		this.shape.addChild(this.body);
	}

	this.run = function(boids)
	{
		this.flock(boids);
		this.update();
		this.borders();
		this.render();
	}

	this.flock = function(boids)
	{
		var separation = this.separate(boids);
		var alignment = this.align(boids);
		var cohesion = this.cohesion(boids);

		separation.length *= 1.5;
		alignment.length *= 1.0;
		cohesion.length *= 1.0;
	
		this.acceleration = this.acceleration.add(separation);
		this.acceleration = this.acceleration.add(alignment);
		this.acceleration = this.acceleration.add(cohesion);

	}

	this.update = function()
	{
		if (this.dead != true) {
		lastLocation = this.location.clone();

		this.velocity.x += this.acceleration.x;
		this.velocity.y += this.acceleration.y;
		this.velocity.length = Math.min( maxSpeed, this.velocity.length );

		this.location.x += this.velocity.x;
		this.location.y += this.velocity.y;

		this.acceleration.length = 0;
		}
		//else {
		//this.location.x = -10;
		//this.location.y = -10;
		//console.log("dead");
		//}
		
	}

	this.seek = function(target)
	{
		var steer = this.steer(target, false);
		this.acceleration.x += steer.x;
		this.acceleration.y += steer.y; 
	}

	this.arrive = function(target)
	{
		var steer = this.steer(target, true);
		this.acceleration.x += steer.x;
		this.acceleration.y += steer.y; 
	}

	this.steer = function(target, slowdown)
	{
		var steer = new Point(0,0);
		var desired	= new Point( target.x - this.location.x, target.y - this.location.y );
		var distance = desired.length;

		if(distance > 0)
		{
			if((slowdown) && (distance < 100.0)) desired.length = maxSpeed * (distance/100);
			else desired.length = maxSpeed;

			steer = desired.subtract(this.velocity);

			// Limit Steer to maxForce
			steer.length = Math.min( maxForce, steer.length );
		}
		return steer;
	}

	var acc = 0;
	var oacc = 0;
	var ang = 0;

	this.render = function()
	{
	//if(this.dead != true) {
		var locVector = new Point( this.location.x - lastLocation.x, this.location.y - lastLocation.y );
		orientation = (locVector.angle+90);
		this.shape.position = this.location.clone();
		this.shape.rotate(orientation - lastOrientation);
		lastOrientation = orientation;
		//console.log("alive");
		
		//console.log("dead");
	//	}
	}

	this.borders = function()
	{
		if(this.location.x < -pathRadius) this.location.x = canvasWidth + pathRadius;
		if(this.location.y < -pathRadius) this.location.y = canvasHeight + pathRadius;
		if(this.location.x > canvasWidth+pathRadius) this.location.x = -pathRadius;
		if(this.location.y > canvasHeight+pathRadius) this.location.y = -pathRadius;

	}

	this.separate = function(boids)
	{
		var desiredSeparation = 20.0;
		var steer = new Point(0,0);

		var count = 0;

		for(var i=0; i<boids.length; i++)
		{
			var other = boids[i];
			var distance = this.location.getDistance(other.location);
			var type = other.type
			
			// if((distance < 10) && (other.type === 0)){
				//boids.remove(this);
				// console.log("here");
			// }
			
			if((distance > 0) && (distance < desiredSeparation))
			{
				var diffVector = this.location.subtract(other.location);
				diffVector = diffVector.normalize();
				diffVector.divide(distance);

				steer.x += diffVector.x;
				steer.y += diffVector.y;
				count++;
			}
			
			
			
		}

		if(count > 0){
			steer.length /= count;
		}

		if(steer.length > 0){
			steer = steer.normalize();
			steer = steer.multiply(maxSpeed);
			steer.x -= this.velocity.x;
			steer.y -= this.velocity.y;

			steer.length = Math.min( maxForce, steer.length );
		}

		return steer;

	}

	this.align = function(boids)
	{
		var neighbDist = 25.0;
		var steer = new Point(0, 0);
		var count = 0;
		for(var i=0; i<boids.length; i++)
		{
			var other = boids[i];
			var distance = this.location.getDistance(other.location);
			if((distance.length > 0) && (distance.length < neighbDist))
			{
				steer.x += other.velocity.x;
				steer.y += other.velocity.y;
				count++;
			}
		}

		if(count > 0)
		{
			steer.length /= count;
		}

		if(steer.length > 0)
		{
			steer = steer.normalize();
			steer = steer.multiply(maxSpeed);
			steer.x -= this.velocity.x;
			steer.y -= this.velocity.y;

			steer.length = Math.min( maxForce, steer.length );
		}

		return steer;
	}

	this.cohesion = function(boids)
	{
		var neighbDist = 25.0;	
		var sum = new Point(0,0);
		var count = 0;

		for(var i=0; i<boids.length; i++)
		{
			var other = boids[i];
			var distance = this.location.getDistance(other.location);
			
			if((distance > 0) && (distance < neighbDist))
			{
				sum.x += other.velocity.x;
				sum.y += other.velocity.y;
				count++;
			}	
		}

		if(count > 0)
		{
			sum.length /= count;
			return this.steer(sum, false);
		}
		return sum;
	}


}

Pred = function(location)
{
	this.shape = new Group();

	this.accVector = new Path();
	this.body = new Path();

	this.location = location;
	this.velocity = new Point();
	this.acceleration = new Point(0,0);

	this.type = 0;
	
	var pathRadius = 8;
	var maxSpeed = 4;
	var maxForce = -2.5;

	var orientation = 0;
	var lastOrientation = 0;
	var lastLocation;

	this.init = function()
	{
		this.velocity.x = plusOrMinus();
		this.velocity.y = plusOrMinus();

		//console.log("pred");

		this.body.strokeColor = 'red';
		this.body.strokeWidth = 2;

		this.body.add(new Point(0, -pathRadius*2));
		this.body.add(new Point(-pathRadius, pathRadius*2));
		this.body.add(new Point(pathRadius, pathRadius*2));	

		this.body.position = this.location;
		this.body.fillColor = new RgbColor(255,255,255, 0.5);

		this.body.closed = true;

		this.shape.addChild(this.body);
	}

	this.run = function(boids)
	{
		this.flock(boids);
		this.update();
		this.borders();
		this.render();
	}

	this.flock = function(boids)
	{
		var separation = this.separate(boids);
		var alignment = this.align(boids);
		var cohesion = this.cohesion(boids);

		separation.length *= -1.0;
		alignment.length *= 0.1;
		cohesion.length *= 0.15;
	
		this.acceleration = this.acceleration.add(separation);
		this.acceleration = this.acceleration.add(alignment);
		this.acceleration = this.acceleration.add(cohesion);

	}

	this.update = function()
	{
		lastLocation = this.location.clone();

		this.velocity.x += this.acceleration.x;
		this.velocity.y += this.acceleration.y;
		this.velocity.length = Math.min( maxSpeed, this.velocity.length );

		this.location.x += this.velocity.x;
		this.location.y += this.velocity.y;

		this.acceleration.length = 0;
	}

	this.seek = function(target)
	{
		var steer = this.steer(target, false);
		this.acceleration.x += steer.x;
		this.acceleration.y += steer.y; 
	}

	this.arrive = function(target)
	{
		var steer = this.steer(target, true);
		this.acceleration.x += steer.x;
		this.acceleration.y += steer.y; 
	}

	this.steer = function(target, slowdown)
	{
		var steer = new Point(0,0);
		var desired	= new Point( target.x - this.location.x, target.y - this.location.y );
		var distance = desired.length;

		if(distance > 0)
		{
			if((slowdown) && (distance < 100.0)) desired.length = maxSpeed * (distance/100);
			else desired.length = maxSpeed;

			steer = desired.subtract(this.velocity);

			// Limit Steer to maxForce
			steer.length = Math.min( maxForce, steer.length );
		}
		return steer;
	}

	var acc = 0;
	var oacc = 0;
	var ang = 0;

	this.render = function()
	{
		var locVector = new Point( this.location.x - lastLocation.x, this.location.y - lastLocation.y );
		orientation = (locVector.angle+90);
		this.shape.position = this.location.clone();
		this.shape.rotate(orientation - lastOrientation);
		lastOrientation = orientation;
	}

	this.borders = function()
	{
		if(this.location.x < -pathRadius) this.location.x = canvasWidth + pathRadius;
		if(this.location.y < -pathRadius) this.location.y = canvasHeight + pathRadius;
		if(this.location.x > canvasWidth+pathRadius) this.location.x = -pathRadius;
		if(this.location.y > canvasHeight+pathRadius) this.location.y = -pathRadius;

	}

	this.separate = function(boids)
	{
		var desiredSeparation = 15.0;
		var steer = new Point(0,0);

		var count = 0;

		for(var i=0; i<boids.length; i++)
		{
			var other = boids[i];
			var distance = this.location.getDistance(other.location);

			if((distance < 15) && (other.type === 2)){
				other.dead = true;
				other.location.x = -100;
				other.location.y = -300;
				//boids.splice(i,1);
				//console.log("here");
			}
			if((distance > 0) && (distance < desiredSeparation))
			{
				var diffVector = this.location.subtract(other.location);
				diffVector = diffVector.normalize();
				diffVector.divide(distance);

				steer.x += diffVector.x;
				steer.y += diffVector.y;
				count++;
			}
		}

		if(count > 0){
			steer.length /= count;
		}

		if(steer.length > 0){
			steer = steer.normalize();
			steer = steer.multiply(maxSpeed);
			steer.x -= this.velocity.x;
			steer.y -= this.velocity.y;

			steer.length = Math.min( maxForce, steer.length );
		}

		return steer;

	}

	this.align = function(boids)
	{
		var neighbDist = 25.0;
		var steer = new Point(0, 0);
		var count = 0;
		for(var i=0; i<boids.length; i++)
		{
			var other = boids[i];
			var distance = this.location.getDistance(other.location);
			if((distance.length > 0) && (distance.length < neighbDist))
			{
				steer.x += other.velocity.x;
				steer.y += other.velocity.y;
				count++;
			}
		}

		if(count > 0)
		{
			steer.length /= count;
		}

		if(steer.length > 0)
		{
			steer = steer.normalize();
			steer = steer.multiply(maxSpeed);
			steer.x -= this.velocity.x;
			steer.y -= this.velocity.y;

			steer.length = Math.min( maxForce, steer.length );
		}

		return steer;
	}

	this.cohesion = function(boids)
	{
		var neighbDist = 25.0;	
		var sum = new Point(0,0);
		var count = 0;

		for(var i=0; i<boids.length; i++)
		{
			var other = boids[i];
			var distance = this.location.getDistance(other.location);
			
			if((distance > 0) && (distance < neighbDist))
			{
				sum.x += other.velocity.x;
				sum.y += other.velocity.y;
				count++;
			}	
		}

		if(count > 0)
		{
			sum.length /= count;
			return this.steer(sum, false);
		}
		return sum;
	}


}
// ---- Flock Class END
// -------------------------------------
