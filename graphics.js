const path = require("path");
const { GetJSONFromFile } = require("./mapi");
let barWidth = barWidthB = bpLength = bpbLength = backa = timerStart = timerEnd = 0;
let title = album = artist = mode = "";
let desp = background = undefined;
let wData = [];
let dataArray = [];
let wfTest = [];

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

function changeVisSize(canvas, vw = 55, vh = 65) {
	var w = window.innerWidth*vw/100;
	var h = window.innerHeight*vh/100;

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
			if(dy > -barWidth/4) dy=-barWidth/4;
			ctx.beginPath();
			ctx.roundRect(p[i].x - offsetRight, canvas.height - offsetBottom, barWidth/4, dy, [40]);
			// var h = 300 + p[i].y;
			// var s = 100 + "%";
			// var l = -p[i].y < 64 ? -p[i].y * 50 / 64 + "%" : "50%";
			// ctx.fillStyle = "hsl(" + h + "," + s + "," + l + ")";
			ctx.fill();
		}
		ctx.shadowBlur=0;
	}

	function drawDebug(p, offsetRight, offsetBottom, skip, vis) {
		// ctx.fillStyle = "red"
		// for(var i = 0; i < p.length; i++) {
		// 	var dy = p[i].y;
		// 	if(dy > 0) dy=0;
		// 	ctx.beginPath();
		// 	ctx.roundRect(p[i].x+barWidth/2 - offsetRight, canvas.height - offsetBottom, 2, dy, [40]);
		// 	ctx.fill();
		// }
		
		var fData = vis.getVisualiserData();
		var data = vis.getVisualiserUIntData();
		var mx = maxIndex(data);
		var mfx = maxIndex(fData);
		//var dbfs = Math.round(((data[mx]/255)*(vis.analyser.maxDecibels - vis.analyser.minDecibels) + vis.analyser.minDecibels+13.89)*100)/100;
		var dbfs = Math.round((fData[mfx]+13.9)*100)/100;
		if(dbfs < -96) dbfs = -96;
		var hz = Math.round(mx*vHandle.audioCtx.sampleRate/vis.analyser.fftSize*100)/100;
		var intensity = -(dbfs * 8);
		var color = `hsl(${0-10*(dbfs/3) + 5} 100% 50%)`;
		drawText(canvas.width-cwToPx(38.5), chToPx(5), `${hz}Hz`, "MPLUS1Code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(40), chToPx(10), `${dbfs.toLocaleString('en-US', { minimumFractionDigits: 2 } )}dBFS`, "MPLUS1Code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(40), chToPx(15), `${-Math.log2(player.volume)+0.5}`, "MPLUS1Code", chToPx(5), color, 2);
		// drawText(canvas.width-cwToPx(40), chToPx(15), `minDb: ${vis.analyser.minDecibels}`, "MPLUS1Code", chToPx(5), "white", 2);
		// drawText(canvas.width-cwToPx(40), chToPx(20), `maxDb: ${vis.analyser.maxDecibels}`, "MPLUS1Code", chToPx(5), "white", 2);
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
			let mx = (Math.max(... e[i]) - 128)/128 * ceiling * amp;
			let mn = (Math.min(... e[i]) - 128)/128 * ceiling * amp;
			
			if(Math.abs(mn - mx) < chToPx(2)) {
				mx = mx+chToPx(1);
				mn = mn-chToPx(1);
			}

			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .8)";
			ctx.roundRect(dx + ox, y-mn, sliceWidth, mn-mx, [40]);
			ctx.fill();
			dx += sliceWidth + 2;
		}
		ctx.fillStyle = "#FFF";
	}

	function drawWaveC(x, y, sx, ox, data, dataGroups = 8, amp = 1) {
		let dx = x;
		var e = groupPerN(data, dataGroups);
		const sliceWidth = Math.round(sx / wfTest.length);
		const ceiling = chToPx(25)
		
		for (let i = 0; i < e.length; i++) {
			let mx = (Math.max(... e[i]) - 128)/128 * ceiling * amp;
			let mn = (Math.min(... e[i]) - 128)/128 * ceiling * amp;
			
			if(Math.abs(mn - mx) < chToPx(2)) {
				mx = mx+chToPx(1);
				mn = mn-chToPx(1);
			}

			wfTest.push({x: dx, y: y-mn, h: mn-mx});
			if(wfTest.length > 96) {
				wfTest = wfTest.slice(1);
			}

			dx += sliceWidth + 2;
		}

		for(let i = 0; i < wfTest.length; i++) {
			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .8)";
			ctx.roundRect(i*canvas.width/wfTest.length, wfTest[i].y, sliceWidth, wfTest[i].h, [40]);
			ctx.fill();
		}
		ctx.fillStyle = "#FFF";
		drawText(0, 255, `wf buffer ln: ${wfTest.length} values`);
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
	// for(let j = 1; j <= 4; j++) {
	// 	ctx.fillStyle = `rgb(${128 + 126*j/4} ${255*j/4} 255)`
	// 	for(let i = 1; i <= 10; i++) {
	// 		ctx.fillRect(i*Math.log10(i)*-(canvas.width/40)+(canvas.width/40)*10*j, 0, 2, canvas.height);
	// 	}
	// }

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
			bp.push(... getPointsUInt8(halveData(dataArray, 2), 0, 32, chToPx(100), barWidth));
			bp.push(... getPointsUInt8(halveData(dataArray, 3), 32, 64, chToPx(100), barWidth));
			bpLength = bp.length;
			//bp.push(... getRange(dataArray, 0, 58, 1100 + diffVolume, 11.5, barWidth));
			//bp.push(... getRangeNormalized(dataArray, 0, 58, 125, -30, barWidth));
			break;
		case "tOFBezier":
		case "oFBezier":
		case "fBezier":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(...  getPointsUInt8(dataArray, 1, 12, chToPx(40),  barWidth));
			bpb.push(... getPointsUInt8(dataArray, 0, 1,  0,  		   barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0, 32,  chToPx(50),  barWidthB));
			bpLength  = bp.length;
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
			drawBar(bp, -barWidth, waveOffset, 0);
			break;
		case "bBezier":
			drawBar(bp, -barWidth/2, waveOffset, -75, 4);
			drawBezier(bp, false, waveOffset, -barWidth/4, "white", 4);
			// drawDebug(bp, bp[0].x+barWidth/2, waveOffset, 1, visualiser);
			break;
		case "bezier":
			drawBezier(bp, false, waveOffset, -barWidth/4, "white");
			break;
		case "tOFBezier":
			drawTangent(bp, bpb);
		case "oFBezier":
			drawBezier(bp, true, waveOffset, barWidth, /*"#365486"*/ "#4B6AC4", 4);
			
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				// drawWave(0, canvas.height - chToPx(21.5), canvas.width+50, 0, wData, visualiser.analyser.fftSize/256, 1);
				drawWaveC(0, canvas.height - chToPx(21.5), canvas.width-50, 0, wData, visualiser.analyser.fftSize/256, 1);
				// drawWaveBezier(0, chToPx(21.5), canvas.width+50, wData)
			}
		case "fBezier":
			drawBezier(bpb, true, waveOffset, bpb[0].x+barWidth/2, /*"#7FC7D9"*/ "#FFF", 4);
			// drawDebug(bpb, bpb[0].x+barWidth/2, waveOffset, 1, visualiser);
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
		var value = getAverage(dataArray, 0, Math.round(visualiser.analyser.fftSize/170.7))/255;
		backa += (60/visualiser.refreshRate) / 1000;
		if(backa >= Math.PI*2) backa = 0;
		background.style.backgroundSize = `${150 + 50*value}vw`
		background.style.filter = `url(#rgb-split) brightness(${.5 + .8*value})  blur(4px)`;
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