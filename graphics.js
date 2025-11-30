let barWidth = barWidthB = bpLength = bpbLength = backa = timerStart = timerEnd = debugT = phiInc = laftFrameFPS = decalGlbl = 0;
let blurMax = brightMin = brightMax = maxBounce = 0;
let tiltx = tilty = 0;
let title = album = artist = mode = "";
let desp = background = undefined;
let ca = [];
let wData = [];
let dataArray = [];
let pDataArray = [];
let wfTest = [];
let pTme = [];
let animVar = {tGlow: 0, aGlow: 0};

let sillyFellaAct = new Image();
sillyFellaAct.src = "./assets/images/kex_actMode_rev.png"
let sillyFella = new Image();
sillyFella.src = "./assets/images/kex_passMode_rev.png";
// let testImageDist = new Image();
// testImageDist.src = "./assets/images/g.jpg";

const G_C = 6.674 * 1e-11;

class RectanglePhysics {

	constructor(_x = 0, _y = 0, _w = 2, _h = 2) {
		this.x = _x;
		this.y = _y;
		this.width = _w;
		this.height = _h;
		this.rotation = 0;
		this.points = [];
	}

	translateAdd(_dx, _dy) {
		for(let i = 0; i < this.points.length; i++) {
			this.points[i].x += _dx;
			this.points[i].y += _dy;
		}
	}

	updatePoints() {
		
		let left 	= -this.width	/2;
		let right 	= this.width	/2;
		let top 	= -this.height	/2;
		let bottom 	= this.height	/2;
		
		let cx = this.x + right;
		let cy = this.y + bottom;

		this.points = [
			{
				x: cx +( left*Math.cos(this.rotation)   -  top*Math.sin(this.rotation) ),
				y: cy +( (left*Math.sin(this.rotation))  +  top*Math.cos(this.rotation))
			},
			{
				x: cx +( right*Math.cos(this.rotation)  -  top*Math.sin(this.rotation) ),
				y: cy +( (right*Math.sin(this.rotation)) +  top*Math.cos(this.rotation) )
			},
			{
				x: cx +( right*Math.cos(this.rotation)  -  bottom*Math.sin(this.rotation) ),
				y: cy +( (right*Math.sin(this.rotation)) +  bottom*Math.cos(this.rotation) )
			},
			{
				x: cx +( left*Math.cos(this.rotation)   -  bottom*Math.sin(this.rotation) ),
				y: cy +( (left*Math.sin(this.rotation))  +  bottom*Math.cos(this.rotation) )
			}
		];
	}

}

class Vector2f {
	constructor(_x = 0, _y = 0) {
		this.x = _x;
		this.y = _y;
	}
 
	getMagnitude() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}

	getTheta() {
		return Math.acos((this.x)/this.getMagnitude());
	}

	static getAngle(_v1, _v2) {
		return Math.acos(
			(_v1.x*_v2.x + _v1.y*_v2.y) /
			(_v1.getMagnitude() * _v2.getMagnitude()));
	}

	static getMagnitude(_x, _y) {
		return Math.sqrt(_x*_x + _y*_y);
	}

}

let persona = {rect: new RectanglePhysics(), vecDisp: new Vector2f(), vecForce: new Vector2f(), vecHold: new Vector2f(), rot: 0, rotInert: 0, rotForce: 0, mass: 50, mcx: 0, mcy: 0}

function setPersona(img, width, height) {
	persona.img = img;
	persona.rect.height = height;
	persona.rect.width = width;
	persona.mcx = width/2;
	persona.mcy = height/2;
}

function roundTo(_value, _digit=1) {
	return Math.round(_value*Math.pow(10, _digit))/Math.pow(10, _digit);
}

function setBackground(value) {
	background = value;
}

function setTitle(value) {
	title = value;
}

function setAlbum(value) { 
	//album = value;
}

function setArtist(value) {
	artist = value;
}

function setNextTitle(value) {
	next = value;
}

function maxIndex(arr) {
	var max = arr[0];
	var ind = 0;
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] > max) {
			max = arr[i];
			ind = i;
		} 
	}
	return ind;
}

function fatOne(arr) { 
	var max = arr[0].y;
	var index = 0;

	for (let i = 1; i < arr.length; i++) {
		if (arr[i].y < max) {
			max = arr[i].y;
			index = i;
		} 
	} 
	 
	return index;
} 

function getAverage(array, start=0, end=array.length) {
	var S=0;
	for(let i = 0; i < end; i++) {
		S+=array[i];
	}

	return S/(end - start);
}

function groupPerN(data, grpSize) {
	let nGrp = data.length-1/grpSize;
	let remaining = data.length-1;
	let grpContainer = [];
	for(let i = 0; i < nGrp; i++) {
		var tGrp = [];
		for(let j = 0; j < grpSize; j++) {
			if(remaining == 0) break;
			tGrp.push(data[j+i*grpSize]);
			remaining--;
		}
		grpContainer.push(tGrp);
		if(remaining == 0) break;
	}
	return grpContainer;
}

function changeVisSize(canvas, vw = 58, vh = 68) {
	var w = Math.round(window.innerWidth*vw/100);
	var h = Math.round(window.innerHeight*vh/100);

	//if(w > 1024) w = 1024;
	//if(h > 450) h = 450;
	canvas.width = w;
	canvas.height = h;
	canvas.style.width = `${w}px`;
	canvas.style.height = `${h}px`;
	
	barWidth = Math.trunc(w/(bpLength-2));
	barWidthB= Math.trunc(w/(bpbLength-2));
}

function moveArrayC(_array, _value=1, _opp=false) {
	let _tArray = [..._array];
	let _objs = _tArray.splice(_array.length - _value, _array.length);
	_tArray.splice(0, 0, ..._objs);

	return _tArray;
}

function AABB(_x, _y, _tx, _ty, _tw, _th) {
	return (
		_x > _tx && _x < _tx + _tw
			&& _y > _ty
			&& _y < _ty + _th
		);
}

function renderFrame(visualiser, canvas, ctx) {
	
	let x = 0;
	let bp = [];
	let bpb = [];

	function drawText(x,y,value="Sample Text",font="consolas",size=12,color="white",shadow=0,shadowColor="#000",fontEffect="") {
		
		ctx.shadowColor=shadowColor;
		ctx.shadowBlur=shadow;
		ctx.fillStyle = color;
		ctx.font = `${fontEffect} ${size*1}px ${font}`;
		ctx.fillText(value, x, y)
		ctx.shadowBlur=0;
	}

	function getTextWidth(value, font="consolas", size=12) {
		ctx.font = `${size}px ${font}`;
		return ctx.measureText(value).width;
	}
	
	function drawBezier(bp, filled, offsetBottom=0, offsetRight=0, color="white", shadow=0, lWidth=2) {
		ctx.beginPath();
		ctx.setLineDash([]);
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = lWidth;
		ctx.shadowBlur=shadow;
		ctx.moveTo(bp[0].x+barWidth/2-offsetRight, bp[0].y+canvas.height-offsetBottom);
		for (var i = 1; i < bp.length-1; i++)
		{
			var xc = (bp[i].x + bp[i + 1].x) / 2;
			var yc = (bp[i].y + bp[i + 1].y) / 2;

			ctx.quadraticCurveTo(bp[i].x+barWidth/2-offsetRight, bp[i].y+canvas.height-offsetBottom, xc+1+barWidth/2-offsetRight, yc + canvas.height-offsetBottom);
			
		}
		//ctx.quadraticCurveTo(bp[bp.length-1].x+barWidth/2-offsetRight, bp[bp.length-1].y+canvas.height-offsetBottom, canvas.width+barWidth/2, canvas.height-offsetBottom);
		if(filled) {
			ctx.lineTo(canvas.width, canvas.height-offsetBottom);
			ctx.lineTo(0, canvas.height-offsetBottom);
			ctx.fill();
		} else {
			ctx.stroke();
		}
		ctx.closePath();
		ctx.shadowBlur=0;
	}

	function drawBezierDebug(bp, offsetBottom=0, offsetRight=0, size=4) {
		ctx.shadowBlur = 0
		ctx.lineWidth = 0;
		for (var i = 0; i < bp.length-1; i++)
		{
			var xc = (bp[i].x + bp[i + 1].x) / 2;
			var yc = (bp[i].y + bp[i + 1].y) / 2;
			
			ctx.fillStyle = "#00ff00";
			ctx.fillRect(bp[i].x+barWidth/2-offsetRight-size/2, bp[i].y+canvas.height-offsetBottom-size/2, size, size);
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(xc+1+barWidth/2-offsetRight-size/2, yc+canvas.height-offsetBottom-size/2, size, size);
		}
	}

	function drawRoundedRect(_x, _y, _dx, _dy, _round) {
		ctx.beginPath();
		ctx.roundRect(_x, _y, _dx, _dy, [_round]);
		ctx.fill();
		ctx.closePath();
	}
	
	function drawBar(p, offsetRight, offsetBottom, pointOffset, shadow = 0) {
		ctx.shadowBlur=shadow;
		ctx.fillStyle = "white"
		for(var i = 0; i < p.length; i++) {
			var dy = p[i].y-pointOffset;
			if(dy > -barWidth/4) dy=-barWidth/4;
			ctx.beginPath();
			ctx.roundRect(p[i].x - offsetRight + barWidth/32*i, canvas.height - offsetBottom, barWidth/4, dy, [40]);
			ctx.fill();
		}
		ctx.shadowBlur=0;
	}

	function drawBarVert(p, offsetRight, offsetBottom, pointOffset, shadow = 0) {
		ctx.shadowBlur=shadow;
		ctx.fillStyle = "white"
		for(var i = 0; i < p.length; i++) {
			var dx = (p[i].y-pointOffset)/2;
			
			var posx = (cwToPx(10) - dx) + .5;
			var posy = 

			ctx.beginPath();
			ctx.roundRect(posx, chToPx(20) + i * 10, dx*2, 6, [40]);
			ctx.fill();
		}
		ctx.shadowBlur=0;
	}

	function drawBarC(p, offsetRight, offsetBottom, pointOffset, shadow = 0) {
		ctx.shadowBlur=shadow;
		for(var i = 0; i < p.length; i++) {
			var dy = p[i].y-pointOffset;
			if(dy > -barWidth/4) dy=-barWidth/4;
			ctx.fillStyle = p[i].color;
			ctx.beginPath();
			ctx.roundRect(p[i].x - offsetRight + barWidth/32*i, canvas.height - offsetBottom, p[i].width, dy, [40]);
			ctx.fill();
		}
		ctx.shadowBlur=0;
	}

	function drawDebug(ceiling, vis) {
		
		var fData = vis.getVisualiserData();
		var mfx = maxIndex(fData);
		var dbfs = fData[mfx] + 11.89;
		var data = vis.getVisualiserUIntData();
		var mx = maxIndex(data);
		let hz = 0;
		
		function drawRectLines(_rect) {
			// let mdx = _dx/2;
			// let mdy = _dy/2;
			// let mx = _x + mdx;
			// let my = _y + mdy;
			// let thp = Math.acos(-mdx/Vector2f.getMagnitude(mdx, mdy));
			// let tsCos = Math.cos(thp)*Math.cos(_theta) - Math.sin(thp)*Math.sin(_theta);
			// let tsSin = Math.cos(thp)*Math.sin(_theta) + Math.sin(thp)*Math.cos(_theta);
			// let rx = -mdx*Math.cos(tsCos) - (-mdy)*Math.sin(tsCos);
			// let ry = mdx*Math.sin(tsSin) + mdy*Math.cos(tsSin);
			
			// let rx = -mdx*Math.cos(_theta) - (-mdy)*Math.sin(_theta);
			// let ry = mdx*Math.sin(_theta) + mdy*Math.cos(_theta);

			ctx.fillStyle = "red"
			for(let i = 0; i < _rect.points.length; i++) {
				ctx.fillRect(
					_rect.points[i].x-2,
					_rect.points[i].y-2,
					4,
					4
				);
			}
			
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(_rect.points[0].x, _rect.points[0].y);
			ctx.lineTo(_rect.points[1].x, _rect.points[1].y);
			ctx.lineTo(_rect.points[2].x, _rect.points[2].y);
			ctx.lineTo(_rect.points[3].x, _rect.points[3].y);
			ctx.lineTo(_rect.points[0].x, _rect.points[0].y);
			ctx.stroke();
		}

		function getForce(_data) {
			let tF = [];
			for(let i = 0; i < _data.length; i++) {

				let force = -(_data[i]-pDataArray[i])/255;

				tF.push({
					x: i+i*10, 
					y: force*ceiling, 
					width: 12,
					color: `rgb(${force*200}, ${100 - force*100}, ${200 - force*200})`
				});
			}
			return tF;
		}

		function getHFI(val) {
			return val*vHandle.audioCtx.sampleRate/vis.analyser.fftSize;
		}

		function getAverageFrequency(_data, _pos, _len=(_data.length-_pos)) {
			
			let sum = 0;
			let coef = 0;

			for(let i = _pos; i < _pos+_len; i++) {
				sum += i * vHandle.audioCtx.sampleRate/vis.analyser.fftSize * _data[i];
				coef += _data[i];
			}

			let rs = sum/(_len+coef);
			if(!isNaN(rs)) return rs;
			else return 0;
		}
		
		if(dbfs < -96) dbfs = -96;

		hz = getAverageFrequency(data, mx-1, 3);
		let amp = data[mx]/255;
		let color = `hsl(${0-6*(dbfs/3) + 5} 100% 50%)`;
		let value = getAverage(data, 0, Math.round(vis.analyser.fftSize/170.7))/255;
		//let forceData = getForce(data);

		ctx.fillStyle = "#000000c7";
		ctx.fillRect(canvas.width-cwToPx(55), chToPx(0), cwToPx(55), chToPx(42));
		drawText(canvas.width-cwToPx(54), chToPx(27.5), `${Math.round((vis.audioElem.duration - vis.audioElem.currentTime)*10)/10}`, "fira code", chToPx(25), "#ffffff10", 0, "#000", "italic");
		
		drawText(canvas.width-cwToPx(24), chToPx(5), `${roundTo(hz)}Hz`, "fira code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(24), chToPx(10), `${(Math.round((dbfs)*100)/100).toLocaleString('en-US', { minimumFractionDigits: 2 } )}dB`, "fira code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(24), chToPx(15), `${Math.round((-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))*100)/100}`, "fira code", chToPx(5), color, 2);
		
		let sineX = canvas.width-cwToPx(47.5);
		let sineY = chToPx(38.5);
		let phi = -Math.PI/2 + ((hz/visualiser.refreshRate) * Math.PI) % Math.PI;
		
		let size = cwToPx(0.75);

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(sineX + 20*size, sineY - 10, 2, 20)
		ctx.fillRect(sineX-2, sineY - 10, 2, 20)
		ctx.fillStyle = "#808080";
		ctx.fillRect(sineX, sineY-1, 20*size, 2);
		ctx.fillRect(sineX + 10*size - 1, sineY - 10, 2, 20);
		
		phiInc += phi;
		if(phiInc >= Math.PI*8192) {
			phiInc = 0;
		}
		
		ctx.beginPath();
		for(let i = 0; i < 200; i++) {
			ctx.quadraticCurveTo(sineX + i/10*size, sineY + (amp*2 * Math.sin((hz*2*Math.PI*i/1e4) + phiInc))*size, 
			sineX + (i+1)/10*size, sineY + (amp*2* Math.sin((hz*2*Math.PI*(i+1)/1e4) + phiInc))*size);
		}
		ctx.strokeStyle = "#dca0ff";
		ctx.stroke();

		drawText(canvas.width-cwToPx(54), chToPx(25), `A: ${Math.round(amp*100)/100}`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(54), chToPx(30), `ω: ${Math.round(hz*2*Math.PI)}rad`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(54), chToPx(35), `φ: ${Math.round(phi*10)/10}rad`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(54), chToPx(40), `t:`, "fira code", chToPx(5), "white", 2);
		
		drawText(canvas.width-cwToPx(24), chToPx(22.5), `PV: ${player.volume}`, "fira code", chToPx(2.5), "white", 2);
		drawText(canvas.width-cwToPx(24), chToPx(25), `RV: ${realVolume}`, "fira code", chToPx(2.5), "white", 2);
		drawText(canvas.width-cwToPx(14), chToPx(22.5), `TX: ${Math.round(tiltx*100)/100}`, "fira code", chToPx(2.5), "white", 2);
		drawText(canvas.width-cwToPx(14), chToPx(25), `TY: ${Math.round(tilty*100)/100}`, "fira code", chToPx(2.5), "white", 2);
		drawText(canvas.width-cwToPx(24), chToPx(30), `B:  ${Math.round((blurMax - blurMax*2*value)*100)/100}px`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(24), chToPx(35), `L:  ${Math.round((.4 + .8*value)*100)/100}`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(24), chToPx(40), `BK: ${Math.round(backa*100)/100}`, "fira code", chToPx(5), "white", 2);
		
		
		var coefx = Math.trunc(256/pTme.length);
		var graphY = chToPx(5);
		var graphX = canvas.width - cwToPx(52);
		drawText(graphX, graphY+80, "FPS", "fira code", 16, "white");
		ctx.fillRect(graphX, graphY, 1, 64);
		ctx.fillRect(graphX, graphY+64, coefx*pTme.length+1, 1);
		
		ctx.fillStyle = "grey";
		for(let i = 0; i < pTme.length; i++) {
			var h = pTme[i]/30*32;
			ctx.fillStyle = "#dbdbdb";
			if(h > 8) ctx.fillStyle = "#25b125";
			if(h > 16) ctx.fillStyle = "#c4c408";
			if(h > 32) ctx.fillStyle = "orange";
			if(h > 48) ctx.fillStyle = "#b61b1b";
			ctx.fillRect(graphX+1+coefx*i, graphY+64, coefx, -h);
		}
		
		drawText(graphX-20, graphY+37, "30", "fira code", 16, "yellow");
		ctx.fillRect(graphX, graphY+32, coefx*pTme.length+1, 1);
		drawText(graphX-20, graphY+53, "60", "fira code", 16, "lightgreen");
		ctx.fillRect(graphX, graphY+48, coefx*pTme.length+1, 1);
		
		drawText(16, canvas.height - data[mx]/255*ceiling - 4, `HEIGHT - ${Math.trunc(data[mx]/255*ceiling)}px (${Math.round(Math.trunc(data[mx]/255*ceiling)/canvas.height*1000)/10} ch)`, "fira code", 12, `rgba(255, 128, 0, ${data[mx]/64})`, 0);
		ctx.fillRect(16, canvas.height - data[mx]/255*ceiling - 1, canvas.width - 32, 2);
		drawText(16, canvas.height-ceiling-4, `CEILING`, "fira code", 12, `rgba(255, 64, 128, ${(data[mx]-175)/50})`, 0);
		ctx.fillRect(16, canvas.height-ceiling-1, canvas.width-32, 2);
		
		
		// ctx.imageSmoothingQuality = "high";
		
		// let deformX = deformY = 0;

		// let posX = canvas.width-cwToPx(10);
		// let posY = chToPx(42);

		// if(dbfs < -70) {

		// 	deformY = Math.abs(Math.sin(20*backa) * chToPx(1) + chToPx(29));
		// 	deformX = chToPx(32.5) + chToPx(32.5) * (1 - deformY/chToPx(30));
		// 	posX -= deformX/2;
		// 	posY -= deformY;
		// 	ctx.drawImage(sillyFella, posX, posY, deformX, deformY);
		// } else if(dbfs > -70) {

		// 	deformY = Math.abs(Math.sin(100*backa) * chToPx(2) + chToPx(28));
		// 	deformX = chToPx(32.5) + chToPx(32.5) * (1 - deformY/chToPx(30));
		// 	posX -= deformX/2;
		// 	posY -= deformY;
		// 	ctx.drawImage(sillyFellaAct, posX, posY, deformX, deformY);
		// }

		
		if(vis.visNotes) {
			function getColorFromValue(_array, _hz) {
				let arrayVec = Math.round(_hz/(vis.audioCtx.sampleRate/vis.analyser.frequencyBinCount));
				let coef = (_array[arrayVec]/255);
				if (coef < .3) return "black";
				if (coef < .4) return "#202020";
				else if (coef < .6) return "#808080";
				else return "white";
			}

			ctx.fillStyle = "#000000FF"
			ctx.fillRect(0, chToPx(57), cwToPx(100), chToPx(100), chToPx(43));

			let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
			let notesFreq = [16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87];

			for(let i = 0; i < 9; i++) {
				drawText(40, chToPx(64 + i*4), `σ${i}`, "fira code", 24, "white");
			}

			for(let i = 0; i < notes.length; i++) {
				//drawText(140 + i*100, chToPx(60), getColorFromValue(data, notesFreq[i]), "fira code", 12, "white");
				drawText(140 + i*100, chToPx(64), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]));
				drawText(140 + i*100, chToPx(68), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*2));
				drawText(140 + i*100, chToPx(72), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*4));
				drawText(140 + i*100, chToPx(76), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*8));
				drawText(140 + i*100, chToPx(80), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*16));
				drawText(140 + i*100, chToPx(84), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*32));
				drawText(140 + i*100, chToPx(88), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*64));
				drawText(140 + i*100, chToPx(92), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*128));
				drawText(140 + i*100, chToPx(96), `${notes[i]}`, "fira code", 24, getColorFromValue(data, notesFreq[i]*256));
			}
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

	function drawTrapeze(x, y, dx, dy, acc, color) {
		ctx.beginPath();
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 1;
		ctx.moveTo(x+acc, y);
		ctx.lineTo(x+dx+acc, y);
		ctx.lineTo(x+dx, y+dy);
		ctx.lineTo(x, y+dy);
		ctx.fill();
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
	
	function drawWave(x, y, sx, ox, data, dataGroups = 8, amp = 1, swm=1) {
		let dx = x;
		// var _jhz = maxIndex(dataArray)*visualiser.audioCtx.sampleRate/visualiser.analyser.fftSize;
		// var _decal = roundTo( ((visualiser.refreshRate-_jhz)*2*Math.PI)/2.33, 0);
		// decalGlbl += _decal;
		// if(decalGlbl > data.length) decalGlbl = 0;
		// if(-decalGlbl > data.length) decalGlbl = 0;
		// var e = groupPerN(moveArrayC(data, Math.abs(decalGlbl), (_decal < 0)), dataGroups);
		var e = groupPerN(data, roundTo(dataGroups));
		const sliceWidth = Math.round(sx / e.length);
		const ceiling = chToPx(25)
		
		for (let i = 0; i < e.length; i++) {
			let mx = (Math.max(... e[i]) - 128)/128 * ceiling * amp;
			let mn = (Math.min(... e[i]) - 128)/128 * ceiling * amp;
			
			if(Math.abs(mn - mx) < chToPx(1)) {
				mx = mx+chToPx(.5);
				mn = mn-chToPx(.5);
			}

			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .8)";
			// ctx.shadowBlur = 32;
			// ctx.shadowColor = `rgb(${(backa/2*Math.PI) * 255} ${-(backa/2*Math.PI) * 255 + 255} ${(backa/2*Math.PI) * 255})`;
			ctx.roundRect(dx + ox, y-mn, sliceWidth/swm, mn-mx, [40]);
			ctx.fill();
			dx += sliceWidth + 2;
		}
		ctx.fillStyle = "#FFF";
	}
 
	function drawWaveC(x, y, sx, data, dataGroups = 8, amp = 1, bufferSize=128, swm=1) {
		
		// var _jhz = maxIndex(dataArray)*vHandle.audioCtx.sampleRate/vis.analyser.fftSize;
		// var _decal = roundTo( (vis.refreshRate-_jhz)*2*Math.PI, 0);
		// decalGlbl = _jhz;

		// var e = groupPerN(moveArrayC(data, Math.abs(_decal), (_decal < 0)), dataGroups);
		var e = groupPerN(data, dataGroups);
		const ceiling = chToPx(25);
		
		for (let i = 0; i < e.length; i++) {
			let mx = (Math.max(... e[i]) - 128)/128 * ceiling * amp;
			let mn = (Math.min(... e[i]) - 128)/128 * ceiling * amp;
			
			if(Math.abs(mn - mx) < chToPx(1)) {
				mx = mx+chToPx(.75);
				mn = mn-chToPx(.75);
			}

			wfTest.push({y: y-mn, h: mn-mx});
			if(wfTest.length > bufferSize) {
				wfTest = wfTest.slice(wfTest.length - bufferSize);
			}

			// dx += sliceWidth + 2;
		}
		const sliceWidth = sx / wfTest.length;
		ctx.shadowBlur = 3;
		ctx.shadowColor = "#000";
		for(let i = 0; i < wfTest.length; i++) {
			
			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .85)";
			ctx.roundRect(x + sliceWidth * i , wfTest[i].y, sliceWidth/swm, wfTest[i].h, [40]);
			ctx.fill();
		}
		ctx.fillStyle = "#FFF";
		// drawText(0, 255, `wf buffer ln: ${wfTest.length} values`);
		// drawText(0, 267, `${e.length}`);
	}

	function drawWaveBezier(x, y, sx, data) {
		const ceiling = chToPx(40);
		var e = groupPerN(data, 8);
		const sliceWidth = Math.round(sx / e.length);
		let g = [];
		for (let i = 0; i < e.length; i++) {
			let pHeight = (getAverage(e[i])-128)/128 * ceiling;
			g.push({x: sliceWidth*i+2, y: pHeight})
		}
		
		drawBezier(g, false, y, x+barWidth/2, "rgb(255, 255, 255)", 2, 4);
	}

	function drawWaveBezierVert(x, y, sx, data) {
		const ceiling = cwToPx(10);
		var e = groupPerN(data, 8);
		const sliceHeight = Math.round(sx / e.length);
		let g = [];
		for (let i = 0; i < e.length; i++) {
			let pWidth = (getAverage(e[i])-128)/128 * ceiling;
			g.push({x: pWidth, y: sliceHeight*i+2})
		}
		
		drawBezier(g, false, y, x, "rgb(255, 255, 255)", 2, 4);
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
	
			p.push({x: x, y: -barHeight});
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

	function setPointUInt8(value, x, ceiling) {
		return { x: x, y: -(value/255)*ceiling };
	}

	function getPointsUInt8Log(data, start, end, width, ceiling = 100) {
		var p = [];
		x = 0;
		var scale = Math.log((end - start)-1) / width;
		for(let i = start; i < end; i++) {
			barHeight = (data[i]/255)*ceiling;
			x += (Math.floor(Math.log(i-start+2) / scale) - Math.floor(Math.log(i-start+1) / scale));
			p.push({x: x, y: -barHeight});
		}
		return p;
	}

	function halveData(data, coef) {
		let nData = [];
		for(let i = coef; i < data.length; i+=coef+1) {
			dataSum = 0;
			for(let j = 0; j < coef; j++) {
				dataSum += data[i-j];
			}
			nData.push(dataSum/(coef+1));
		}
		return nData;
	}

	function chToPx(value) {
		return Math.round((canvas.height*value)/100);
	}
	function cwToPx(value) {
		return Math.round((canvas.width*value)/100);
	}

	function writeFPS() {
		lastFrameFPS = 1/getAverage(pTme)*1000;
		document.getElementById("fps").textContent = `${Math.round((timerStart - timerEnd))}ms > ${Math.round(lastFrameFPS)}fps (${pTme.length})`;
		pTme.push(timerStart - timerEnd);
		if(pTme.length > 64) pTme = pTme.slice(1);

	}

	timerStart = window.performance.now();
	var paraOffsetX = 0;
	var paraOffsetY = 0;
	
	if(visualiser.parallaxBackground) {
		paraOffsetX = (visualiser.mouse.gx - window.innerWidth/2) / window.innerWidth;
		paraOffsetY = (visualiser.mouse.gy - window.innerHeight/2) / window.innerHeight * 1.77;
	}

	dataArray = visualiser.getVisualiserUIntData()
	let ampValue = getAverage(dataArray, 0, Math.round(visualiser.analyser.fftSize/170.7))/255;

	if(visualiser.beatWindow) {
		canvas.parentElement.style.scale = `${ampValue * .01 + 1}`;
	}

	if(visualiser.windowTilt) {
		var f = canvas.parentElement;
		var r = f.getBoundingClientRect();
		let tiltSpeed = 0.41666 * visualiser.refreshRate; // Adding the refresh rate as a coefficient deletes bouncing
		let tiltTarget = 1; // Tilt Target in degrees
		if(AABB(visualiser.mouse.gx, visualiser.mouse.gy, r.x, r.y, r.width, r.height)) {
			var cx = (visualiser.mouse.gx - r.x - r.width/2)/r.width;
			var cy = Math.round(visualiser.mouse.gy - r.y - r.height/2)/r.height;
			tiltx += (cx - tiltx/2)/(visualiser.refreshRate/tiltSpeed);
			tilty += (cy - tilty/2)/(visualiser.refreshRate/tiltSpeed);
			
		} else {
			tiltx += (0 - tiltx)/(visualiser.refreshRate/tiltSpeed);
			tilty += (0 - tilty)/(visualiser.refreshRate/tiltSpeed);
		}

		f.style.transform = `perspective(500px) rotateY(${Math.round(tiltx*100)/100}deg) rotateX(${-Math.round(tilty*100)/100}deg)`;
	}

	if(visualiser.bouncingBackground) {
		
		backa += (60/visualiser.refreshRate) / 750;
		if(backa >= Math.PI*2) backa = 0;
		var backgroundSize = 120 + maxBounce*ampValue;
		background.style.backgroundSize = `${backgroundSize}vw`
		background.style.filter = `url(#rgb-split) brightness(${ampValue * (brightMax - brightMin) + brightMin})  blur(${blurMax - blurMax*2*ampValue}px)`;
		background.style.backgroundPosition = `${(-(backgroundSize/2) + 50) - Math.cos(backa)*10 + paraOffsetX * 2}vw ${(-(backgroundSize/2) + 28.125) + Math.sin(backa)*20 + paraOffsetY * 2}vw`;
	} else {
		background.style.backgroundSize = `130vw`;
		background.style.filter = `brightness(.7) blur(10px)`;
		background.style.backgroundPosition = `center`;
	}

	if(visualiser.mode == "none") {
		canvas.style.display = "none";
		writeFPS();
		setTimeout(() => renderFrame(visualiser, canvas, ctx), visualiser.refreshTime);
		timerEnd = window.performance.now();
		return;
	}
	
	canvas.style.display = "block";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([]);
	
	switch(visualiser.mode) {
		case "freeView":

			var artistSize = getTextWidth(artist, fontg, cwToPx(8));
			var letterSize = canvas.width/title.length*1.5;
			if(letterSize > cwToPx(5)) {
				letterSize = cwToPx(5);
			}
			var titleSize = getTextWidth(title, fontg, letterSize);

			if(titleSize > canvas.width) {
				titleSize = canvas.width;
				letterSize = titleSize/title.length;
			}

			ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
			drawRoundedRect(cwToPx(50) - (cwToPx(1) + titleSize)/2, canvas.height - chToPx(13), cwToPx(1.2) + titleSize, chToPx(13), 0);
			var fontg = "BATMANTHICC"
			//drawText(0, chToPx(4), "Artist", fontg, cwToPx(2), "white", 8);
			//drawTrapeze(cwToPx(10), chToPx(2.5), cwToPx(24), chToPx(.6), 5, "white");
			
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";
			drawText(cwToPx(50), canvas.height, artist, fontg, cwToPx(2), "#A0E9FF", 0, 0, "bold");
			drawText(cwToPx(50), 
				canvas.height-letterSize/3, 
				title, 
				fontg, 
				Math.round(letterSize-1), 
				"#06dba0", 
				4, 
				`hsl(165, 100%, ${63*animVar.tGlow/(visualiser.refreshRate/3)}%)`, 
				"bold"
			);
			break
		
		default:
			var fontg = "BATMANTHICC"

			drawText(0, chToPx(4), "Artist", fontg, cwToPx(2), "white", 8);
			drawTrapeze(cwToPx(10), chToPx(2.5), cwToPx(24), chToPx(.6), 5, "white");
			drawText(0, chToPx(11), artist, fontg, cwToPx(4), "#A0E9FF", 8, `hsl(165, 100%, ${63*animVar.aGlow/(visualiser.refreshRate/3)}%)`, "bold");
			var artistSize = getTextWidth(artist, fontg, cwToPx(8));

			drawText(0, chToPx(25), "Title", fontg, cwToPx(3), "white", 6);
			drawTrapeze(cwToPx(10.5), chToPx(23.3), cwToPx(23.5), chToPx(.6), 5, "white");
			var letterSize = canvas.width/title.length*1.5;
			var titleSize = getTextWidth(title, fontg, letterSize) ;

			if(letterSize > chToPx(40)) {
				letterSize = chToPx(40);
			}

			if(titleSize > canvas.width) {
				titleSize = canvas.width;
				letterSize = titleSize/title.length;
			}
			
			drawText(0, 
				chToPx(26) + letterSize*0.8, 
				title, 
				fontg, 
				Math.round(letterSize-1), 
				/*"#4361EE"*/ "#06dba0", 
				4, 
				0, 
				"bold"
			);
			break;
	}

	
	var ceiling = 0;
	if(visualiser.breakRender) {
		background.style.backgroundSize = `150vw`;
		background.style.filter = `brightness(.7) blur(16px)`;
		background.style.backgroundPosition = `center`;
		return;
	}

	switch(visualiser.mode) {
		case "bar":
		case "bezier":
		case "bBezier":
		case "fSBezier":
		case "line":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(... getPointsUInt8(dataArray, 0, 40, chToPx(40), barWidth));
			bpLength = bp.length;
			ceiling = chToPx(40);
			break;
		
		case "freeView":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(... getPointsUInt8(dataArray, 0, 64, chToPx(40), barWidth));
			bpLength = bp.length;
			ceiling = chToPx(40);
			break;
		case "tOFBezier":
		case "oFBezier":
		case "fBezier":
			dataArray = visualiser.getVisualiserUIntData();
			bp.push(...  getPointsUInt8(dataArray, 1, 10,  chToPx(35),  barWidth ));
			bpb.push(... getPointsUInt8(dataArray, 0,  0,  0,  			barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0,  1,  chToPx(25),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0,  30, chToPx(45),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 30, 31, chToPx(25),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 31, 32, chToPx(10),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 32, 33, chToPx(5),  barWidthB));
			bpLength  = bp.length;
			bpbLength = bpb.length;
			ceiling = chToPx(45);
			break;

		default:
			break;
	}

	if(visualiser.mode != mode) {
		mode = visualiser.mode;
		changeVisSize(canvas);
		canvas.style = "display: initial;";
		canvas.parentElement.style = "";
		canvas.parentElement.getElementsByClassName("wrapper")[0].style = "";
		background.parentElement.children['bg-matrix'].style = "";
		brightMax = .8;
		brightMin = .4;
		blurMax = 10;
		maxBounce = 30;

		if(mode == "freeView") {
			changeVisSize(canvas, 100, 100);
			//canvas.style = "filter: url(#barreldistortion)";
			canvas.parentElement.style = "filter:none;backdrop-filter:none;background: none;";
			canvas.parentElement.getElementsByClassName("wrapper")[0].style = "display: none;margin:0;padding:0;";
			background.parentElement.children['bg-matrix'].style = "display: none;"
			brightMax = 1.2;
			brightMin = 0.8;
			blurMax = 1;
			maxBounce = 15;
			//ctx.translate(.5, .5);
		}
	}

	switch(visualiser.mode) {
		case "bar":
			drawBar(bp, barWidth/2, 0, 0, 4);
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				drawWaveC(0, canvas.height - chToPx(35), canvas.width, wData, visualiser.analyser.fftSize/256, (-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))/1.5, 64, 2);
			}
			break;
		case "bBezier":
			drawBar(bp, barWidth/2, 0, -chToPx(10), 4);
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				//drawWaveC(0, canvas.height - chToPx(40), canvas.width, wData, visualiser.analyser.fftSize/256, (-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))/1.5, 64, 2);
				drawWave(0, canvas.height - chToPx(40), canvas.width, wData, visualiser.analyser.fftSize/256, (-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))/1.5);
			}
			drawBezier(bp, false, 0, barWidth/2, "white", 4, 4);
			break;
		case "bezier":
			drawBezier(bp, false, 0, -barWidth/4, "white");
			break;
		case "freeView":

			// ctx.fillStyle = "blue";
			// ctx.fillRect(0, 0, 8, canvas.height);
			// ctx.fillRect(0, 0, canvas.width, 8);
			// ctx.fillRect(canvas.width-8, 0, 8, canvas.height);
			// ctx.fillRect(0, canvas.height-8, canvas.width, 8);
			// ctx.fillStyle = "red";
			// for(let i = 1; i < 20; i++) {
			// 	ctx.fillRect(i*canvas.width/20, 0, 2, canvas.height);
			// 	ctx.fillRect(0, i*canvas.height/20, canvas.width, 2);
			// }

			drawBarVert(bp, 0, 0, 0, 4);
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				drawWaveBezierVert(-cwToPx(90), chToPx(90), chToPx(80), wData);
			}
			break;
		case "oFBezier":
			drawBezier(bp, true, 0, barWidth, /*"#365486"*/ "#4B6AC4", 4);
			
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				// drawWaveBezier(0, chToPx(22.5), canvas.width, wData);
				drawWave(0, canvas.height - chToPx(22.5), canvas.width, 0, wData, 12, (-Math.log2(player.volume) < .6 ? .6 : -Math.log2(player.volume)), 1.5);
				//drawWaveC(0, canvas.height - chToPx(25), canvas.width+6, wData, visualiser.analyser.fftSize/128, -Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume), 96, 2);
			}
		case "fBezier":
			drawBezier(bpb, true, 0, bpb[0].x+barWidth/2, /*"#7FC7D9"*/ "#ececec", 4, 2);
			// drawBezier(bpb, true, 0, barWidth, /*"#7FC7D9"*/ "#ececec", 4, 2);
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

	if(visualiser.debug) {
		drawDebug(ceiling, visualiser);
		drawText(0, chToPx(20), `letterSize: ${Math.round(letterSize)} px/l, titleSize: ${Math.round(titleSize)} px`, "fira code", cwToPx(1.5));
		//drawText(0, chToPx(50), `FPV: ${bp.length}  | PE: 0-> ${bp[0].x} 1-> ${bp[1].x} 2-> ${bp[2].x} ... e-> ${bp[bp.length-1].x}`, "fira code", cwToPx(1.5));
		//drawText(0, chToPx(53), `SPV: ${bpb.length} | PE: 0-> ${bpb[0].x} 1-> ${bpb[1].x} 2-> ${bpb[2].x} ... e-> ${bpb[bpb.length-1].x}`, "fira code", cwToPx(1.5));
	}

	

	writeFPS();
	visualiser.mouse.c = false;
	animVar.tGlow--;
	animVar.aGlow--;
	setTimeout(() => renderFrame(visualiser, canvas, ctx), visualiser.refreshTime);
	timerEnd = window.performance.now();
	pDataArray = dataArray;
}

module.exports = {
	setTitle,
	setAlbum,
	setArtist,
	setNextTitle,
	renderFrame,
	changeVisSize,
	setBackground,
	setPersona,
	moveArrayC,
	persona
}