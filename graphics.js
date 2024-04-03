const path = require("path");
const { GetJSONFromFile } = require("./mapi");
let barWidth = barWidthB = bpLength = bpbLength = dWaveform = dVisualizer = backa = timerStart = timerEnd = 0;
let title = album = artist = mode = "";
let desp = background = undefined;

function setBackground(value) {
	background = value;
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

function vwTOpx(value) {
	return window.innerWidth*value/100;
}

function vhTOpx(value) {
	return window.innerHeight*value/100;
}

function changeVisSize(canvas, vw = 55, vh = 65) {
	var w = vwTOpx(vw);
	var h = vhTOpx(vh);

	//if(w > 1024) w = 1024;
	//if(h > 450) h = 450;
	canvas.width = w;
	canvas.height = h;
	canvas.style.width = `${w}px`;
	canvas.style.height = `${h}px`;
	
	barWidth = Math.trunc(w/(bpLength-2));
	barWidthB= Math.trunc(w/(bpbLength-2));
	// changeBarWidth(Math.trunc(w/(bpLength-2)), Math.trunc(w/(bpbLength-2)));
}

function renderFrame(visualiser, canvas, ctx) {
	//requestAnimationFrame(() => renderFrame(visualiser, canvas, ctx))
	
	let x = 0;
	let bp = [];
	let bpb = [];

	function drawText(x,y,value="Sample Text",font="consolas",size=12,color="white",shadow=0) {
		ctx.shadowColor="#000";
		ctx.shadowBlur=shadow;
		ctx.fillStyle = color;
		ctx.font = `${size*1}px ${font}`;
		ctx.fillText(value, x, y)
		ctx.shadowBlur=0;
	}

	function getTextWidth(value, font="consolas", size=12) {
		ctx.font = `${size}px ${font}`;
		return ctx.measureText(value).width;
	}
	
	function drawBezier(bp, filled, offsetBottom=0, offsetRight=0, color="white", shadow=0) {
		ctx.beginPath();
		ctx.setLineDash([]);
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 4;
		ctx.shadowBlur=shadow;
		// move to the first point
		ctx.moveTo(0-barWidth/2, canvas.height-offsetBottom);
		for (var i = 0; i < bp.length-1; i++)
		{
			var xc = (bp[i].x + bp[i + 1].x) / 2;
			var yc = (bp[i].y + bp[i + 1].y) / 2;
			//ctx.quadraticCurveTo(bp[i].x+i*spacing+barWidth/2-offsetRight, bp[i].y-offsetBottom, xc+i*spacing+1+barWidth/2-offsetRight, yc-offsetBottom);
			ctx.quadraticCurveTo(bp[i].x+barWidth/2-offsetRight, bp[i].y+canvas.height-offsetBottom, xc+1+barWidth/2-offsetRight, yc + canvas.height-offsetBottom);
			
		}
		// curve through the last two bp
		ctx.quadraticCurveTo(bp[bp.length-1].x+barWidth/2-offsetRight, bp[bp.length-1].y+canvas.height-offsetBottom, canvas.width+barWidth/2, canvas.height-offsetBottom);
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
	
	function drawBar(p, offsetRight, offsetBottom, pointOffset, shadow = 0) {
		ctx.shadowBlur=shadow;
		ctx.fillStyle = "white"
		for(var i = 0; i < p.length; i++) {
			var dy = p[i].y-pointOffset;
			if(dy > -barWidth/1.5) dy=-barWidth/1.5;
			ctx.beginPath();
			ctx.roundRect(p[i].x + i - offsetRight, canvas.height - offsetBottom, barWidth / 2, dy, [40]);
			// var h = 300 + p[i].y;
			// var s = 100 + "%";
			// var l = -p[i].y < 64 ? -p[i].y * 50 / 64 + "%" : "50%";
			// ctx.fillStyle = "hsl(" + h + "," + s + "," + l + ")";
			ctx.fill();
		}
		ctx.shadowBlur=0;
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
	
	function drawWave(x, y, sx, ox, data, dataGroups = 8, amp = 1) {
		let dx = x;
		var e = groupPerN(data, dataGroups);
		const sliceWidth = Math.round(sx / e.length);
		const ceiling = chToPx(25)
		
		for (let i = 0; i < e.length; i++) {
			let mx = ((max(e[i]) - 128) + chToPx(.75))/128 * ceiling * amp;
			let mn = ((min(e[i]) - 128) - chToPx(.75))/128 * ceiling * amp;
			
			if(mx - mn < 4) mn -= mn - mx;

			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .8)";
			ctx.roundRect(dx + ox, y-mn, sliceWidth, mn-mx, [40]);
			ctx.fill();
			dx += sliceWidth + 2;
		}
		ctx.fillStyle = "#FFF";
	}

	function drawWaveBezier(x, y, sx, data) {
		const ceiling = chToPx(25);
		var e = groupPerN(data, 16);
		const sliceWidth = Math.round(sx / e.length);
		let g = [];
		for (let i = 0; i < e.length; i++) {
			let pHeight = (getAverage(e[i])-128)/128 * ceiling;
			g.push({x: sliceWidth*i+2, y: pHeight})
		}

		drawBezier(g, false, y, x+barWidth/2, "rgb(126, 249, 255)", 2);
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

	function getPointsUInt8P(data, start, end, ceiling = 100, spacing = 1) {
		var p = [];
		for(let i = start; i < end-1; i++) {
			var barHeight = (data[i]/255)*ceiling;
			var barHeightN = (data[i+1]/255)*ceiling;
			var barHeightM = 0;
			p.push({x: x, y: -barHeight});
			x += spacing;
			barHeightM = ( barHeight + barHeightN ) / 2 + (barHeight - barHeightN) * .05;
			p.push({x: x, y: -barHeightM, m: true});
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

	function chToPx(value) {
		return Math.round((canvas.height*value)/100);
	}
	function cwToPx(value) {
		return Math.round((canvas.width*value)/100);
	}

	function writeFPS() {
		document.getElementById("fps").textContent = `${Math.round((timerStart - timerEnd))}ms > ${Math.round(1/((timerStart - timerEnd)/1000))}fps `;
	}

	timerStart = window.performance.now();
	if(visualiser.mode == "none") {
		canvas.style.display = "none";
		background.style.backgroundSize = `150vw`;
		background.style.filter = `brightness(.7) blur(16px)`;
		background.style.backgroundPosition = `center`;
		visualiser.breakRender = true;
		return;
	}
	canvas.style.display = "block";
	var waveOffset = 0;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if(visualiser.showChibi) {
		waveOffset = 90;
	}
	ctx.setLineDash([]);

	drawText(cwToPx(2), chToPx(5), "ARTIST", "MPLUS1Code", cwToPx(2.6), "white", 4);
	drawTrapeze(cwToPx(12), chToPx(3.4), cwToPx(22), chToPx(.6), 5, "white");
	drawText(cwToPx(2), chToPx(14), artist, "MPLUS1Code", cwToPx(6), "#A0E9FF", 4);

	drawText(cwToPx(2), chToPx(25), "TITLE", "MPLUS1Code", cwToPx(2.6), "white", 4);
	drawTrapeze(cwToPx(10.5), chToPx(23.5), cwToPx(23.5), chToPx(.6), 5, "white");
	var ttlen = canvas.width/title.length*1.8;
	var tw = getTextWidth(title, "MPLUS1Code", ttlen) 
	if(tw > canvas.width) {
		ttlen*=(canvas.width/tw)*0.95;
		tw = getTextWidth(title, "MPLUS1Code", ttlen)
	}
	drawText(cwToPx(2), chToPx(25) + ttlen*0.85, title, "MPLUS1Code", ttlen, /*"#4361EE"*/ "#06dba0", 4);
	if(visualiser.breakRender) return;
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
			dataArray = visualiser.getVisualiserUIntData()
			// bp.push(... getAllPointNormalized(dataArray, 225));
			// bpb.push(... getAllPointNormalized(dataArray, 225));
			bp.push(... getPointsUInt8(dataArray, 1, 12, chToPx(30), barWidth));
			bpb.push(... getPointsUInt8(dataArray, 0, 1, 0, barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0, 32, chToPx(43), barWidthB));
			bpLength = bp.length;
			bpbLength = bpb.length;
			break;

		default:
			break;
	}

	if(visualiser.mode != mode) {
		mode = visualiser.mode;
		changeVisSize(canvas);
		canvas.style.display = "initial";
	}

	switch(visualiser.mode) {
		case "bar":
			drawBar(bp, -barWidth/2, waveOffset, 0);
			break;
		case "bBezier":
			drawBar(bp, -barWidth/2, waveOffset, -75, 4);
			drawBezier(bp, false, waveOffset, -barWidth/4, "white", 4);
			break;
		case "bezier":
			drawBezier(bp, false, waveOffset, -barWidth/4, "white");
			break;
		case "tOFBezier":
			drawTangent(bp, bpb);
		case "oFBezier":
			drawBezier(bp, true, waveOffset, barWidth, /*"#365486"*/ "#4B6AC4", 4);
			
			if(visualiser.showWaveform) {
				var wData = visualiser.getWaveformData();
				drawWave(0, canvas.height - chToPx(21.5), canvas.width+50, -canvas.width*0.2-51, wData, visualiser.analyser.fftSize/256);
				// drawWaveBezier(0, chToPx(21.5), canvas.width+barWidth/2, wData)
			}
		case "fBezier":
			drawBezier(bpb, true, waveOffset, bpb[0].x+barWidth, /*"#7FC7D9"*/ "#FFF", 4);
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

	if(visualiser.bouncingBackground) {
		dataArray = visualiser.getVisualiserUIntData()
		var value = getAverage(dataArray, 0, 24)/255;
		backa += (60/visualiser.refreshRate) / 1000;
		if(backa >= Math.PI*2) backa = 0;
		background.style.backgroundSize = `${150 + 50*value}vw`
		background.style.filter = `brightness(${.7 + .3*value}) blur(16px)`;
		background.style.backgroundPosition = `-${(25 + 25*value) - (Math.cos(backa) * 16)/2}vw -${(50 + 25*value) - (Math.sin(backa) * 24)/2}vw`
	}

	writeFPS();
	setTimeout(() => renderFrame(visualiser, canvas, ctx), visualiser.refreshTime);
	timerEnd = window.performance.now();
}

module.exports = {
	setTitle,
	setAlbum,
	setArtist,
	setNextTitle,
	renderFrame,
	changeVisSize,
	setBackground
}