const path = require("path");
const { GetJSONFromFile } = require("./mapi");
let barWidth = barWidthB = bpLength = bpbLength = dWaveform = dVisualizer = 0;
let title = album = artist = next = "";
let chibis = [];
let sceneObject = [];

class Chibi {
	name;
	image;
	x;
	y;
	dx;
	dy;
	width;
	height;
	mood = "happy";
	moodCooldown = 0;
	state = Chibi.states[0];
	stateComplete = true;
	stateCooldown = 0;
	objective = 0;
	selected = false;
	animationList = {};
	lastAnimation = 0;
	currentAnimation = 0;
	frame = 0;
	frameTick;
	frameTickUp = 0;
	right = false;
	attachedObject = [];
	energy = 100;
	target = null;

	constructor(name, img, json) {
		this.name = name;
		this.x  = 0;
		this.y  = 0;
		this.dx = 0;
		this.dy = 0;
		this.height 		= json.height;
		this.width  		= json.width;
		this.animationList 	= json.animations;
		this.frameTick 		= json.frameTick;

		var t = document.createElement("img");
		t.src = img;
		this.image = t;
	}

	attachObject(cObj) {
		var r = this.attachedObject.push(cObj);
		this.attachedObject[r-1].parent = this;
	}

	show(value) {
		for(let i = 0; i < this.attachedObject.length; i++) {
			if(this.attachedObject[i].name == value) {
				this.attachedObject[i].visible = true;
				break;
			}
		}
	}

	hide(value) {
		for(let i = 0; i < this.dependencies.length; i++) {
			if(this.attachedObject[i].name == value) {
				this.attachedObject[i].visible = false;
				break;
			}
		}
	}

	getObject(value) {
		for(let i = 0; i < this.attachedObject.length; i++) {
			if(this.attachedObject[i].name == value) {
				return this.attachedObject[i];
				break;
			}
		}
	}

	static animations = [
		"idle",
		"running",
		"barking"
	];

	static states = [
		"idle",
		"normal",
		"excited",
		"asking",
		"gEat",
		"gSleep",
		"sleeping",
		"asked",
		"talking"
	];

	static moods = [
		"happy",
		"angry",
		"sleepy",
		"hungry"
	]
}

class cObject {
	name;
	image;
	relx;
	rely;
	x;
	y;
	height;
	width;
	frameCount;
	frame = 0;
	frameTick;
	frameTickUp = 0;
	visible = false;
	dependencies = [];

	constructor(name, img, json) {
		this.name = name;
		this.frameTickUp 	= 0;
		this.frameCount 	= json.frameCount;
		this.frameTick 		= json.frameTick;
		this.height 		= json.height || 0;
		this.width 			= json.width || 0;
		this.relx 			= json.x || 0;
		this.rely 			= json.y || 0;
		var dep 			= json.dependencies || [];

		if(dep.length > 1) {
			for(let i = 0; i < dep.length; i++) {
				var dObj = new cObject(dep[i], 
					path.join(__dirname, `assets/sprites/dependencies/${name}/${dep[i]}.png`),
					GetJSONFromFile(path.join(__dirname, `assets/sprites/dependencies/${name}/${dep[i]}.json`)));
				dObj.name = dep[i];
				dObj.parent = this;
				this.dependencies.push(dObj);
			}
		}

		var ig = document.createElement("img");
		ig.src = img;
		this.image = ig;
	}

	show(value = "") {
		if(value == "") {
			this.visible = true;
		} else {
			for(let i = 0; i < this.dependencies.length; i++) {
				if(this.dependencies[i].name == value) {
					this.visible = true;
					this.dependencies[i].visible = true;
					break;
				}
			}
		}
	}

	hide(value = "") {
		if(value == "") {
			this.visible = false;
		} else {
			for(let i = 0; i < this.dependencies.length; i++) {
				if(this.dependencies[i].name == value) {
					this.dependencies[i].visible = false;
					break;
				}
			}
		}
	}

	allVisible() {
		this.visible = true
		for(let i = 0; i < this.dependencies.length; i++) {
			this.dependencies[i].allVisible();
		}
	}

	hideAll() {
		this.visible = false
		for(let i = 0; i < this.dependencies.length; i++) {
			this.dependencies[i].hideAll();
		}
	}

	update(unit) {
		this.frameTickUp += unit;
		if(this.frameTickUp >= this.frameTick) {
			this.frameTickUp = 0;
			this.frame++;
		}

		if(this.frame >= this.frameCount) {
			this.frame = 0;
		}
		
		for(let i = 0; i < this.dependencies.length; i++) {
			this.dependencies[i].update(unit);
		}
	}

	draw(ctx) {
		var sx = this.width*this.frame;
		this.x = this.relx + this.parent.x;
		this.y = this.rely + this.parent.y;
		if(this.visible) {
			ctx.drawImage(
				this.image,
				sx,
				0,
				this.width,
				this.height,
				Math.round(this.x), 
				Math.round(this.y),
				this.width,
				this.height
			);

			for(let i = 0; i < this.dependencies.length; i++) {
				this.dependencies[i].draw(ctx);
			}
		}
	}
}

function appendChibi(chibi) {
	chibi.y = 1000;
	chibis.push(chibi);
}

function setTitle(value) {
	title = value;
}

function setAlbum(value) { 
	album = value;
}

function setArtist(value) {
	artist = value;
}

function setNextTitle(value) {
	next = value;
}

function changeBarWidth(_nWidth, _nWidthB=_nWidth) {
	barWidth = _nWidth;
	barWidthB= _nWidthB;
}

function min(arr) {
	var max = arr[0];
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] < max) {
			max = arr[i];
		} 
	}
	return max;
}
function max(arr) {
	var max = arr[0];
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] > max) {
			max = arr[i];
		} 
	}
	return max;
}

function fatOne(arr) { 
	var max = arr[0].y;
	var mxv = 0;

	for (let i = 1; i < arr.length; i++) {
		if (arr[i].y < max) {
			max = arr[i].y;
			mxv = arr[i].x;
		} 
	} 
	 
	return [max, mxv];
} 

function getAverage(array, start, end) {
	var S=0;
	for(let i = 0; i < end; i++) {
		S+=array[i];
	}

	return S/(end - start);
}

function getAverageColor() {
	var fhx = 0;
	for(let i = 0; i < 8; i++) {
		var w = ctx.getImageData(Math.trunc(Math.random()*canvas.width), Math.trunc(Math.random()*canvas.height), 0, 0);
		console.log(w);
	}
}

function vwTOpx(value) {
	var w = window,
	  d = document,
	  e = d.documentElement,
	  g = d.getElementsByTagName('body')[0],
	  x = w.innerWidth || e.clientWidth || g.clientWidth;
   
	var result = (x*value)/100;
	return(result);
}

function vhTOpx(value) {
	var w = window,
	  d = document,
	  e = d.documentElement,
	  g = d.getElementsByTagName('body')[0],
	  y = w.innerHeight || e.clientHeight || g.clientHeight;
   
	var result = (y*value)/100;
	return(result);
}

function changeVisSize(canvas) {
	var w = vwTOpx(50);
	var h = vhTOpx(60);

	if(w > 1024) w = 1024;
	//if(h > 450) h = 450;
	canvas.width = w;
	canvas.height = h;
	canvas.style.width = `${w}px`;
	canvas.style.height = `${h}px`;

	changeBarWidth(Math.trunc(w/(bpLength-2)), Math.trunc(w/(bpbLength-2)));
}

function renderFrame(visualiser, canvas, ctx) {
	//requestAnimationFrame(() => renderFrame(visualiser, canvas, ctx))
	
	let x = 0;
	let bp = [];
	let bpb = [];

	function drawText(x,y,value="Sample Text",font="consolas",size="12",color="white") {
		ctx.font = `${size}px ${font}`;
		ctx.fillStyle = color;
		ctx.fillText(value, x, y)
	}	
	
	function drawBezier(bp, filled, offsetBottom=0, offsetRight=0, spacing=1, color="white") {
		ctx.beginPath();
		ctx.setLineDash([]);
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 4;
		// move to the first point
		ctx.moveTo(0-barWidth/2, canvas.height- ctx.lineWidth-offsetBottom);
		for (var i = 0; i < bp.length-1; i++)
		{
			var xc = (bp[i].x + bp[i + 1].x) / 2;
			var yc = (bp[i].y + bp[i + 1].y) / 2;
			//ctx.quadraticCurveTo(bp[i].x+i*spacing+barWidth/2-offsetRight, bp[i].y-offsetBottom, xc+i*spacing+1+barWidth/2-offsetRight, yc-offsetBottom);
			ctx.quadraticCurveTo(bp[i].x+i*spacing+barWidth/2-offsetRight, bp[i].y+canvas.height-ctx.lineWidth-offsetBottom, xc+i*spacing+1+barWidth/2-offsetRight, yc + canvas.height - ctx.lineWidth - offsetBottom);
			
		}
		// curve through the last two bp
		ctx.quadraticCurveTo(bp[bp.length-1].x+bp.length*spacing+barWidth/2-offsetRight, bp[bp.length-1].y+canvas.height- ctx.lineWidth-offsetBottom, canvas.width+barWidth/2, canvas.height- ctx.lineWidth-offsetBottom);
		if(filled) {
			ctx.lineTo(canvas.width, canvas.height-offsetBottom);
			ctx.lineTo(0, canvas.height-offsetBottom);
			ctx.fill();
		} else {
			ctx.stroke();
		}
		ctx.closePath();
	}
	
	function drawBar(p, offsetRight, offsetBottom, pointOffset) {
		for(var i = 0; i < p.length; i++) {
			var dy = p[i].y-pointOffset;
			if(dy > -barWidth/1.5) dy=-barWidth/1.5;
			ctx.beginPath();
			ctx.roundRect(p[i].x + i - offsetRight, canvas.height - offsetBottom, barWidth / 2, dy, [40]);
			var h = 300 + p[i].y;
			var s = 100 + "%";
			var l = -p[i].y < 64 ? -p[i].y * 50 / 64 + "%" : "50%";
			ctx.fillStyle = "hsl(" + h + "," + s + "," + l + ")";
			ctx.fill();
		}
	}
	
	function drawLine(bp) {
		ctx.beginPath();
		ctx.strokeStyle = "white";
		ctx.lineWidth = 4;
	
		ctx.moveTo(bp[0].x, bp[0].y+canvas.height);
		for (var i = 1; i < bp.length; i++)
		{
			ctx.lineTo(bp[i].x+i, bp[i].y+canvas.height);
		}
		ctx.stroke();
		ctx.closePath();
	}
	
	function drawTangent(bp, bpb = []) {
	
		var ma = fatOne(bp.slice(0, Math.trunc(bp.length/2)));
		var mb = fatOne(bp.slice(Math.trunc(bp.length/2), bp.length));
	
		if(bpb.length > 1) {
			var g = bpb.slice(0, Math.trunc(bpb.length/2));
			var h = bpb.slice(Math.trunc(bpb.length/2, bpb.length));
			g.push({x: ma[1], y: ma[0]});
			h.push({x: mb[1], y: mb[0]});
			ma = fatOne(g);
			mb = fatOne(h);
		}
		
		ctx.beginPath();
		ctx.strokeStyle = "#DCF2F1";
		ctx.lineWidth = 2;
		ctx.setLineDash([100, 2]);
		
		ctx.moveTo(0, ma[0]+2);
		ctx.lineTo(canvas.width+1, mb[0]+2);
		ctx.stroke();
		ctx.closePath();
	}
	
	function drawWave(data) {
		ctx.lineWidth=2;
		const sliceWidth = (canvas.width * 1) / data.length;
		let x = 0;
	
		for (let i = 0; i < data.length; i++) {
			const v = data[i] * 150.0;
			const y = canvas.height - 37 + v;
	
			if (i === 0) {
			ctx.moveTo(x, y);
			} else {
			ctx.lineTo(x, y);
			}
			x += sliceWidth;
		}
	
		ctx.lineTo(canvas.width, canvas.height - 37);
		ctx.stroke();
	}

	function getRange(data, start, end, threshold, amplification = 1, spacing = 1) {
		var p = [];
		for (var i = start; i < end; i++) {
			var barHeight = data[i] + 140 + i*.1;
			if (barHeight < 0) barHeight = 0;
			barHeight *= amplification;
			if(barHeight < threshold) barHeight = 0;
			else {
				barHeight -= threshold;
			}
	
			p.push({x: x, y: (canvas.height - barHeight)-4});
			x += spacing;
		}
	
		return p;
	}

	function getRangeNormalized(data, start, end, threshold, norme = -20, spacing = 1) {
		var p = [];
		
		for (var i = start; i < end; i++) {
			//var barHeight = canvas.height - ((2-((data[i]/norme)-2))*threshold-threshold+4) //(threshold*(data[i]/norme)) + threshold + 4;
			if(barHeight > canvas.height - 4) barHeight = canvas.height - 4;
			p.push({x: x, y: barHeight});
			x += spacing;
		}
	
		return p;
	}

	function getPointsUInt8(data, start, end, ceiling = 100, spacing = 1) {
		var p = [];
		for(let i = start; i < end; i++) {
			barHeight = (data[i]/255)*ceiling;
			p.push({x: x, y: -barHeight});
			x += spacing;
		}
		return p;
	}

	function getAllPointNormalized(data, ceiling) {
		var scale = Math.log(visualiser.analyser.fftSize/2 - 1) / canvas.width;
		var p = [];
		for(let i = 0; i < data.length; i++) {
			let x = Math.floor(Math.log(i)/scale);
			barHeight = (data[i]/255)*ceiling;
			p.push({x: x, y:-barHeight});
		}
		return p;
	}

	var waveOffset = 0;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if(visualiser.mode == "none") return;
	if(visualiser.showWaveform || visualiser.showChibi) {
		waveOffset = 90;
	}
	
	ctx.setLineDash([]);

	switch(visualiser.mode) {
		case "bar":
		case "bezier":
		case "bBezier":
		case "fSBezier":
		case "line":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(... getPointsUInt8(dataArray, 0, 58, 300, barWidth));
			bpLength = bp.length;
			//bp.push(... getRange(dataArray, 0, 58, 1100 + diffVolume, 11.5, barWidth));
			//bp.push(... getRangeNormalized(dataArray, 0, 58, 125, -30, barWidth));
			break;
		case "tOFBezier":
		case "oFBezier":
		case "fBezier":
			var dataArray = visualiser.getVisualiserUIntData()
			// bp.push(... getAllPointNormalized(dataArray, 225));
			// bpb.push(... getAllPointNormalized(dataArray, 225));
			bp.push(... getPointsUInt8(dataArray, 1, 12, 225, barWidth));
			bpb.push(... getPointsUInt8(dataArray, 0, 24, 150, barWidthB));
			bpLength = bp.length;
			bpbLength = bpb.length;
			break;

		case "off":
		default:
			break;
	}

	switch(visualiser.mode) {
		case "bar":
			drawBar(bp, -barWidth/2, waveOffset + 10, 0);
			break;
		case "bBezier":
			drawBar(bp, -barWidth/2, waveOffset + 10, -75);
			drawBezier(bp, false, waveOffset + 10, -barWidth/4, 1, "white");
			break;
		case "bezier":
			drawBezier(bp, false, 196);
			break;
		case "tOFBezier":
			drawTangent(bp, bpb);
		case "oFBezier":
			drawBezier(bp, true, waveOffset + 10, barWidth, 1, "#365486");
		case "fBezier":
			drawBezier(bpb, true, waveOffset + 10, bpb[0].x+barWidth, 1, "#7FC7D9");
			break;
		case "fSBezier":
			drawBezier(bp, true);
			drawBezier(bp, false);
			break;
		case "line":
			drawLine(bp);
			break;
		case "off":
		default:
			break;
	}

	
	var tftSize = Math.trunc(canvas.width/title.length*1.25-2)
	var ta = `${artist} // ${album}`;
	var taSize = Math.trunc(canvas.width/(ta.length))
	if(tftSize < 32)  tftSize = 32
	if(tftSize > 300) tftSize = 300
	
	drawText(0, 25+taSize/2, ta, "MPLUS1Code", `${taSize}`);
	drawText(0, 75+tftSize/1.25, title, "MPLUS1Code", `${tftSize}`);
	ctx.beginPath();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.moveTo(0, canvas.height - waveOffset - 1);
	ctx.lineTo(canvas.width, canvas.height - waveOffset - 1);
	ctx.stroke();

	if(visualiser.showWaveform) {
		var dataArray = visualiser.getWaveformData();
		drawWave(dataArray);
	}

	if(visualiser.showChibi) {
		var unit = 60 / visualiser.refreshRate;
		for(let i = 0; i < sceneObject.length; i++) {
			sceneObject[i].update(unit);
			sceneObject[i].draw(ctx);
		}

		for(let i = 0; i < chibis.length; i++) {
			chibis[i].dy += .1;
			chibis[i].dx = 0;
			chibis[i].stateCooldown -= unit;
			chibis[i].moodCooldown -= unit;
			chibis[i].frameTickUp += unit;
			chibis[i].energy = 100;
			
			if(chibis[i].stateCooldown < 0 && chibis[i].stateComplete) {
				chibis[i].stateCooldown = 600;
				var ns = 0;
				if(chibis[i].energy <= 0) {
					ns = 6
				} else if(chibis[i].energy <= 15) {
					if(r < 0.25) {
						ns = Math.round(Math.random() * 3);
					} else {
						ns = Math.round(Math.random() * (5 - 4) + 4);
					}
				} else if (chibis[i].energy <= 50) {
					var r = Math.random();
					if(r < 0.25) {
						ns = Math.round(Math.random() * (5 - 4) + 4);
					} else {
						ns = Math.round(Math.random() * 3);
					}
				} else {
					if(Math.random() > 0.10) {
						ns = Math.round(Math.random());
					} else {
						ns = Math.round(Math.random() * (3 - 2) + 2)
					}
				}

				
				chibis[i].state = Chibi.states[ns];
				chibis[i].stateComplete = false;

				switch(chibis[i].state) {
					case "normal":
						chibis[i].objective = Math.round(Math.random()*(canvas.width-1-chibis[i].width) + chibis[i].width);
						break;
					case "excited":
						if(chibis[i].animationList["barking"] == 0) {
							chibis[i].stateComplete = 1;
							chibis[i].stateCooldown = 0;
						}
						chibis[i].stateCooldown = 240;
						break;
					case "gEat":

						break;
					case "asking":
						chibis[i].stateCooldown = 100;
						break;

					case "idle":
					default:
						chibis[i].stateCooldown = 180;
						break;
				}
			}

			switch(chibis[i].state) {
				case "normal":
					if(!(chibis[i].x < chibis[i].objective && chibis[i].x + chibis[i].width > chibis[i].objective)) {
						if(chibis[i].objective >= chibis[i].x) {
							chibis[i].energy -= unit/100;
							chibis[i].dx = unit;
						} 
						if(chibis[i].objective <= chibis[i].x) {
							chibis[i].energy -= unit/100;
							chibis[i].dx = -unit;
						}
					} else {
						chibis[i].stateComplete = true;
					}
					break;
				case "excited":
					if(chibis[i].animationList["barking"] == 0) {
						chibis[i].stateComplete = 1;
						chibis[i].stateCooldown = 0;
					}
					break;
				case "asking":
					var sbb = chibis[i].getObject("speechBubble");
					if(chibis[i].stateCooldown > 0) {
						if(!sbb.visible) {
							chibis[i].moodTimer = 10000;
							sbb.hideAll();
							sbb.show("asking")
						}

						if(chibis[i].target == null) {
							for(let j = 0; j < chibis.length; j++) {
								if(chibis[j].state == "talking" || chibis[j].state == "asking" ) continue;
	
								if(Math.abs(chibis[j].x - chibis[i].x) < 200) {
									
									chibis[j].state = "asked";
									chibis[j].stateComplete = false;
									chibis[j].stateCooldown = 60
									chibis[j].target = chibis[i];
									chibis[i].target = chibis[j];
									break;
								}
							}
						}
					} else {
						sbb.hideAll();
						chibis[i].stateComplete = true;
					}
					break;
				case "asked":
					var sbb = chibis[i].getObject("speechBubble");
					if(chibis[i].stateCooldown > 0) {
						chibis[i].moodTimer = 10000;
						sbb.hideAll();
						sbb.show("asked");

					} else {
						sbb.hideAll();
						chibis[i].state = "talking";
						chibis[i].stateCooldown = 900;
						chibis[i].stateComplete = true;
						chibis[i].target.state = "talking";
						chibis[i].target.stateCooldown = 900;
						chibis[i].target.stateComplete = true;
					}
					break;
				case "talking":
					if(chibis[i].x - chibis[i].target.x > 0) {
						chibis[i].right = 0;
					} else if (chibis[i].x - chibis[i].target.x < 0) {
						chibis[i].right = 1;
					}

					if(Math.abs(chibis[i].x - chibis[i].target.x) > 80) {
						if(chibis[i].right) {
							chibis[i].dx = unit;
						} else {
							chibis[i].dx = -unit;
						}
					} else if(Math.abs(chibis[i].x - chibis[i].target.x) < 80) {
						if(chibis[i].right) {
							chibis[i].dx = -unit;
						} else {
							chibis[i].dx = unit;
						}
					} else {
						if(chibis[i].moodCooldown < 0) {
							var sbb = chibis[i].getObject("speechBubble");
							chibis[i].moodTimer = 120;
							chibis[i].moodCooldown = Math.round(Math.random() * (240 - 120) + 120);
							sbb.hideAll();
							var conv = ["happy", "angry", "question", "love", "hungry", "sleepy"];
							sbb.show(conv[Math.round(Math.random() * (conv.length-1))]);
						}
					}

					if(chibis[i].stateCooldown == 0) {
						chibis[i].target = null;
					}
					break;
				case "idle":
				default:
					chibis[i].stateComplete = true;
					break;
			}

			if(chibis[i].dx != 0) {
				if(chibis[i].dx > 0.01) {
					chibis[i].right = 1;
				} else if (chibis[i].dx < -0.01) {
					chibis[i].right = 0;
				}
				chibis[i].currentAnimation = 1;
			} else {
				if(chibis[i].state === "excited" && !chibis[i].stateComplete) {
					chibis[i].currentAnimation = 2;
				} else {
					chibis[i].currentAnimation = 0;
				}
			}

			if(chibis[i].moodTimer < 0) {
				chibis[i].getObject("speechBubble").hideAll();
			} else {
				chibis[i].moodTimer -= unit;
			}

			if(chibis[i].lastAnimation != chibis[i].currentAnimation) {
				chibis[i].lastAnimation = chibis[i].currentAnimation;
				chibis[i].frameTickUp = 0;
				chibis[i].frame = 0;
			}
			if(chibis[i].frameTickUp >= chibis[i].frameTick) {
				chibis[i].frameTickUp = 0;
				chibis[i].frame++;
			} 
			if(chibis[i].frame > chibis[i].animationList[Chibi.animations[chibis[i].currentAnimation]]-1) {
				chibis[i].frame = 0;
				if(chibis[i].state == "excited") {
					chibis[i].stateComplete = 1;
				}
			} 

			var sy = chibis[i].height*chibis[i].frame;
			var sx = chibis[i].width*chibis[i].currentAnimation;
			if(chibis[i].right) {
				sx += (chibis[i].width) * 3;
			}

			chibis[i].x += chibis[i].dx;
			chibis[i].y += chibis[i].dy;
			if(chibis[i].x < 0) chibis[i].x = 0;
			if(chibis[i].y < 0) chibis[i].y = 0;
			if(chibis[i].x + chibis[i].width > canvas.width) chibis[i].x = canvas.width-chibis[i].width;
			if(chibis[i].y + chibis[i].height > canvas.height) chibis[i].y = canvas.height-chibis[i].height;

			ctx.drawImage(
				chibis[i].image,
				sx,
				sy,
				chibis[i].width,
				chibis[i].height,
				Math.round(chibis[i].x), 
				Math.round(chibis[i].y),
				chibis[i].width,
				chibis[i].height
			);

			for(let j = 0; j < chibis[i].attachedObject.length; j++) {
				let cObj = chibis[i].attachedObject[j];
				cObj.update(unit);
				cObj.draw(ctx);
			}

			// drawText(0+i*200, 340, `[NAME]	  (${chibis[i].name})`, "Fira Code", "12")
			// drawText(0+i*200, 354, `[ENERG] 	(${Math.round(chibis[i].energy)}%)`, "Fira Code", "12")
			// drawText(0+i*200, 368, `[STATE] 	(${chibis[i].state} ; ${Math.round(chibis[i].stateCooldown)})`, "Fira Code", "12")
			// drawText(0+i*200, 382, `[CA;TF]		(${chibis[i].currentAnimation} ; ${Math.round(chibis[i].frameTickUp)}/${chibis[i].frameTick} -> ${chibis[i].frame}/${chibis[i].animationList[Chibi.animations[chibis[i].currentAnimation]]-1})`, "Fira Code", "12")
			// drawText(0+i*200, 396, `[MOOD]		 (${chibis[i].mood} ; ${Math.round(chibis[i].moodCooldown)})`, "Fira Code", "12")
			// drawText(0+i*200, 410, `[ATTCH]		(${chibis[i].attachedObject.length})`, "Fira Code", "12")
		}
	}

	setTimeout(() => renderFrame(visualiser, canvas, ctx), visualiser.refreshTime);
}

module.exports = {
	changeBarWidth,
	setTitle,
	setAlbum,
	setArtist,
	setNextTitle,
	renderFrame,
	changeVisSize,
	Chibi,
	cObject,
	appendChibi,
	chibis
}