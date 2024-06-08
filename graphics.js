const path = require("path");
const { GetJSONFromFile } = require("./mapi");
let barWidth = barWidthB = bpLength = bpbLength = backa = timerStart = timerEnd = debugT = 0;
let title = album = artist = mode = "";
let desp = background = undefined;
let wData = [];
let dataArray = [];
let wfTest = [];
let pTme = [];
let animVar = {tGlow: 0, aGlow: 0};

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

function changeVisSize(canvas, vw = 60, vh = 70) {
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

	function drawText(x,y,value="Sample Text",font="consolas",size=12,color="white",shadow=0,shadowColor="#000") {
		ctx.shadowColor=shadowColor;
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
	
	function drawBezier(bp, filled, offsetBottom=0, offsetRight=0, color="white", shadow=0, lWidth=2) {
		ctx.beginPath();
		ctx.setLineDash([]);
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = lWidth;
		ctx.shadowBlur=shadow;
		ctx.moveTo(0-barWidth/2, canvas.height-offsetBottom);
		for (var i = 0; i < bp.length-1; i++)
		{
			var xc = (bp[i].x + bp[i + 1].x) / 2;
			var yc = (bp[i].y + bp[i + 1].y) / 2;
			ctx.quadraticCurveTo(bp[i].x+barWidth/2-offsetRight, bp[i].y+canvas.height-offsetBottom, xc+1+barWidth/2-offsetRight, yc + canvas.height-offsetBottom);
			
		}
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
			ctx.roundRect(p[i].x - offsetRight + barWidth/32*i, canvas.height - offsetBottom, barWidth/4, dy, [40]);
			ctx.fill();
		}
		ctx.shadowBlur=0;
	}

	function drawDebug(ceiling, vis) {
		
		var fData = vis.getVisualiserData();
		var data = vis.getVisualiserUIntData();
		var mx = maxIndex(data);
		var mfx = maxIndex(fData);
		var dbfs = fData[mfx];
		if(dbfs < -96) dbfs = -96;
		var hz = Math.round(mx*vHandle.audioCtx.sampleRate/vis.analyser.fftSize*100)/100;
		var intensity = -(dbfs * 8);
		var color = `hsl(${0-6*(dbfs/3) + 5} 100% 50%)`;

		drawText(canvas.width-cwToPx(24), chToPx(5), `${hz}Hz`, "fira code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(24), chToPx(10), `${(Math.round((dbfs+13.9)*100)/100).toLocaleString('en-US', { minimumFractionDigits: 2 } )}dBFS`, "fira code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(24), chToPx(15), `${Math.round((-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))*100)/100}`, "fira code", chToPx(5), color, 2);

		var coefx = Math.trunc(256/pTme.length);
		drawText(cwToPx(50), chToPx(5)+80, "FPS CHART", "fira code", 16, "white");
		ctx.fillRect(cwToPx(50), chToPx(5), 1, 64);
		ctx.fillRect(cwToPx(50), chToPx(5)+64, coefx*pTme.length+1, 1);

		ctx.fillStyle = "grey";
		for(let i = 0; i < pTme.length; i++) {
			var h = pTme[i]/30*32;
			ctx.fillRect(cwToPx(50)+1+coefx*i, chToPx(5)+64, coefx, -h);
		}

		drawText(cwToPx(50)-20, chToPx(5)+37, "30", "fira code", 16, "yellow");
		ctx.fillRect(cwToPx(50), chToPx(5)+32, coefx*pTme.length+1, 1);
		drawText(cwToPx(50)-20, chToPx(5)+53, "60", "fira code", 16, "lightgreen");
		ctx.fillRect(cwToPx(50), chToPx(5)+48, coefx*pTme.length+1, 1);

		drawText(16, canvas.height - data[mx]/255*ceiling - 4, `HEIGHT - ${Math.trunc(data[mx]/255*ceiling)}px (${Math.round(Math.trunc(data[mx]/255*ceiling)/canvas.height*1000)/10} ch)`, "fira code", 12, `rgba(255, 128, 0, ${data[mx]/64})`, 0);
		ctx.fillRect(16, canvas.height - data[mx]/255*ceiling - 1, canvas.width - 32, 2);
		drawText(16, canvas.height-ceiling-4, `CEILING`, "fira code", 12, `rgba(255, 64, 128, ${(data[mx]-175)/50})`, 0);
		ctx.fillRect(16, canvas.height-ceiling-1, canvas.width-32, 2);
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

	function drawWaveC(x, y, sx, data, dataGroups = 8, amp = 1, bufferSize=128, swm=1) {
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
		ctx.shadowBlur = 1;
		ctx.shadowColor = "#000";
		for(let i = 0; i < wfTest.length; i++) {
			
			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .85)";
			ctx.roundRect(x + sliceWidth * i + i*2, wfTest[i].y, sliceWidth/swm, wfTest[i].h, [40]);
			ctx.fill();
		}
		ctx.fillStyle = "#FFF";
		// drawText(0, 255, `wf buffer ln: ${wfTest.length} values`);
		// drawText(0, 267, `${e.length}`);
	}

	function drawWaveBezier(x, y, sx, data) {
		const ceiling = chToPx(25);
		var e = groupPerN(data, 8);
		const sliceWidth = Math.round(sx / e.length);
		let g = [];
		for (let i = 0; i < e.length; i++) {
			let pHeight = (getAverage(e[i])-128)/128 * ceiling;
			g.push({x: sliceWidth*i+2, y: pHeight})
		}
		
		drawBezier(g, false, y, x+barWidth/2, "rgb(126, 249, 255)", 2, 4);
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
		document.getElementById("fps").textContent = `${Math.round((timerStart - timerEnd))}ms > ${Math.round(1/(getAverage(pTme)/1000))}fps (${pTme.length})`;
		if(pTme.length > 127) pTme = pTme.slice(1);
		pTme.push(timerStart - timerEnd);
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

	drawText(0, chToPx(5), "Artist", "MIGUM1R", cwToPx(3), "white", 4);
	drawTrapeze(cwToPx(12), chToPx(3.2), cwToPx(22), chToPx(.6), 5, "white");
	drawText(0, chToPx(16), artist, "MIGUM1R", cwToPx(8), "#A0E9FF", 4, `hsl(165, 100%, ${63*animVar.aGlow/(visualiser.refreshRate/3)}%)`);
	var artistSize = getTextWidth(artist, "MIGUM1R", cwToPx(8));

	drawText(0, chToPx(25), "Title", "MIGUM1R", cwToPx(3), "white", 6);
	drawTrapeze(cwToPx(10.5), chToPx(23.3), cwToPx(23.5), chToPx(.6), 5, "white");
	var letterSize = canvas.width/title.length*2;
	var titleSize = getTextWidth(title, "MIGUM1R", letterSize) ;

	if(letterSize > chToPx(40)) {
		letterSize = chToPx(40);
	}

	if(titleSize > canvas.width) {
		titleSize = canvas.width;
		letterSize = titleSize/title.length;
	}
	
	drawText(0, chToPx(26) + letterSize*0.8, title, "MIGUM1R", Math.round(letterSize-1), /*"#4361EE"*/ "#06dba0", 4, `hsl(165, 100%, ${63*animVar.tGlow/(visualiser.refreshRate/3)}%)`);
	var ceiling = 0;
	if(visualiser.breakRender) return;
	switch(visualiser.mode) {
		case "bar":
		case "bezier":
		case "bBezier":
		case "fSBezier":
		case "line":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(... getPointsUInt8(dataArray, 0, 40, chToPx(30), barWidth));
			bpLength = bp.length;
			//bp.push(... getRange(dataArray, 0, 58, 1100 + diffVolume, 11.5, barWidth));
			//bp.push(... getRangeNormalized(dataArray, 0, 58, 125, -30, barWidth));
			ceiling = chToPx(35);
			break;
		
		case "tOFBezier":
		case "oFBezier":
		case "fBezier":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(...  getPointsUInt8(dataArray, 1, 10,  chToPx(40),  barWidth));
			bpb.push(... getPointsUInt8(dataArray, 0,  1,  0,  	    	barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0,  30, chToPx(50),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 30, 31, chToPx(25),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 31, 32, chToPx(10),  barWidthB));
			bpLength  = bp.length;
			bpbLength = bpb.length;
			ceiling = chToPx(50);
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
				drawWaveC(0, canvas.height - chToPx(40), canvas.width, wData, visualiser.analyser.fftSize/256, (-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))/1.5, 64, 2);
			}
			drawBezier(bp, false, 0, barWidth/2, "white", 4, 4);
			break;
		case "bezier":
			drawBezier(bp, false, 0, -barWidth/4, "white");
			break;
		case "tOFBezier":
			drawTangent(bp, bpb);
		case "oFBezier":
			drawBezier(bp, true, 0, barWidth, /*"#365486"*/ "#4B6AC4", 4);
			
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				// drawWave(0, canvas.height - chToPx(21.5), canvas.width+50, 0, wData, visualiser.analyser.fftSize/256, 1);
				// drawWaveBezier(0, chToPx(21.5), canvas.width+50, wData)
				drawWaveC(0, canvas.height - chToPx(25), canvas.width+6, wData, visualiser.analyser.fftSize/256, -Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume), 96, 1.5);
			}
		case "fBezier":
			drawBezier(bpb, true, waveOffset, bpb[0].x+barWidth/2, /*"#7FC7D9"*/ "#FFF", 4);
			
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
	}

	if(visualiser.bouncingBackground) {
		dataArray = visualiser.getVisualiserUIntData()
		var value = getAverage(dataArray, 0, Math.round(visualiser.analyser.fftSize/170.7))/255;
		backa += (60/visualiser.refreshRate) / 750;
		if(backa >= Math.PI*2) backa = 0;
		background.style.backgroundSize = `${150 + 60*value}vw`
		background.style.filter = `url(#rgb-split) brightness(${.4 + .8*value})  blur(${16 - 32*value}px)`;
		background.style.backgroundPosition = `-${(25 + 30*value) - (Math.cos(backa) * 24)/2}vw -${(50 + 30*value) - (Math.sin(backa) * 24)/2}vw`
	}

	if(visualiser.mouse.x > 0 && visualiser.mouse.x < titleSize && visualiser.mouse.y > chToPx(26) && visualiser.mouse.y < chToPx(26) + letterSize*0.8) {
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(visualiser.mouse.x, visualiser.mouse.y, 14, 0, 2 * Math.PI);
		ctx.stroke();
		if(visualiser.mouse.c) animVar.tGlow = visualiser.refreshRate/3;
	}

	if(visualiser.mouse.x > 0 && visualiser.mouse.x < artistSize && visualiser.mouse.y > chToPx(16) - cwToPx(6) && visualiser.mouse.y < chToPx(16)) {
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(visualiser.mouse.x, visualiser.mouse.y, 14, 0, 2 * Math.PI);
		ctx.stroke();
		if(visualiser.mouse.c) {
			visualiser.imports["searchExt"](artist);
			animVar.aGlow = visualiser.refreshRate/3;
		} 
	}

	if(visualiser.mouse.h && visualiser.mouse.hx > 0 && visualiser.mouse.hy > 0) {
		ctx.strokeStyle = "#2e5bbbff";
		ctx.lineWidth = 2;
		//ctx.fillRect(visualiser.mouse.hx, visualiser.mouse.hy, visualiser.mouse.x-visualiser.mouse.hx, visualiser.mouse.y-visualiser.mouse.hy);
		ctx.beginPath();
		ctx.moveTo(visualiser.mouse.hx, visualiser.mouse.hy);
		ctx.lineTo(visualiser.mouse.hx+(visualiser.mouse.x-visualiser.mouse.hx), visualiser.mouse.hy);
		ctx.lineTo(visualiser.mouse.hx+(visualiser.mouse.x-visualiser.mouse.hx), visualiser.mouse.hy+(visualiser.mouse.y-visualiser.mouse.hy));
		ctx.lineTo(visualiser.mouse.hx, visualiser.mouse.hy+(visualiser.mouse.y-visualiser.mouse.hy));
		ctx.lineTo(visualiser.mouse.hx, visualiser.mouse.hy);
		ctx.stroke();

		ctx.fillStyle = "#255cd142";
		ctx.fillRect(visualiser.mouse.hx+1, visualiser.mouse.hy+1, visualiser.mouse.x-visualiser.mouse.hx-2, visualiser.mouse.y-visualiser.mouse.hy-2);
	}

	if(visualiser.mouse.x >= 0 && visualiser.mouse.y >= 0) {
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 2;
		var crossLength = 5;
		ctx.beginPath();
		ctx.moveTo(visualiser.mouse.x-crossLength, visualiser.mouse.y-crossLength);
		ctx.lineTo(visualiser.mouse.x+crossLength, visualiser.mouse.y+crossLength)
		ctx.lineTo(visualiser.mouse.x, visualiser.mouse.y)
		ctx.lineTo(visualiser.mouse.x-crossLength, visualiser.mouse.y+crossLength)
		ctx.lineTo(visualiser.mouse.x+crossLength, visualiser.mouse.y-crossLength)
		ctx.stroke();
	}

	writeFPS();
	visualiser.mouse.c = false;
	animVar.tGlow--;
	animVar.aGlow--;
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