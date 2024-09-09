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
		var mfx = maxIndex(fData);
		var dbfs = fData[mfx] + 11.89;
		var data = vis.getVisualiserUIntData();
		var mx = maxIndex(data);
		
		if(dbfs < -96) dbfs = -96;
		var hz = Math.round(mx*vHandle.audioCtx.sampleRate/vis.analyser.fftSize*100)/100;
		var amp = data[mx]/255;
		var color = `hsl(${0-6*(dbfs/3) + 5} 100% 50%)`;
		var value = getAverage(data, 0, Math.round(visualiser.analyser.fftSize/170.7))/255;

		ctx.fillStyle = "#000000c7";
		ctx.fillRect(canvas.width-cwToPx(55), chToPx(0), cwToPx(55), chToPx(42));
		drawText(canvas.width-cwToPx(54), chToPx(27.5), `${Math.round((vis.audioElem.duration - vis.audioElem.currentTime)*10)/10}`, "fira code", chToPx(25), "#ffffff10", 0, "#000", "italic");
		
		drawText(canvas.width-cwToPx(24), chToPx(5), `${hz}Hz`, "fira code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(24), chToPx(10), `${(Math.round((dbfs)*100)/100).toLocaleString('en-US', { minimumFractionDigits: 2 } )}dB`, "fira code", chToPx(5), color, 2);
		drawText(canvas.width-cwToPx(24), chToPx(15), `${Math.round((-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))*100)/100}`, "fira code", chToPx(5), color, 2);
		
		let auBarX = canvas.width-cwToPx(30);
		let auBarY = chToPx(40);
		ctx.fillStyle = "#005000ff"
		ctx.fillRect(auBarX, auBarY, 8, -160)
		ctx.fillRect(auBarX+10, auBarY, 8, -160)
		ctx.fillStyle = "#503d00ff"
		ctx.fillRect(auBarX, auBarY-100, 8, -60)
		ctx.fillRect(auBarX+10, auBarY-100, 8, -60)
		ctx.fillStyle = "#500000ff"
		ctx.fillRect(auBarX, auBarY-135, 8, -25)
		ctx.fillRect(auBarX+10, auBarY-135, 8, -25)

		let auHeightBar = 160*((fData[mfx]+21)/-96);
		if(auHeightBar > 160 ) auHeightBar = 160;
		if(auHeightBar < 0 ) auHeightBar = 0;
		if(auHeightBar > 60) ctx.fillStyle = "#00c500"
		else if(auHeightBar <= 60 && auHeightBar > 25) ctx.fillStyle = "#c5c500";
		else ctx.fillStyle = "#c50000";
		ctx.fillRect(auBarX, auBarY, 8, -160+auHeightBar);
		ctx.fillRect(auBarX+10, auBarY, 8, -160+auHeightBar);
		
		var sineX = canvas.width-cwToPx(47.5);
		var sineY = chToPx(38.5);
		var phi = (hz/visualiser.refreshRate) * Math.PI;
		var size = cwToPx(0.75);

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(sineX + 20*size, sineY - 10, 2, 20)
		ctx.fillRect(sineX-2, sineY - 10, 2, 20)
		ctx.fillStyle = "#808080";
		ctx.fillRect(sineX, sineY-1, 20*size, 2);

		
		ctx.beginPath();
		for(let i = 0; i < 200; i++) {
			ctx.quadraticCurveTo(sineX + i/10*size, sineY + (amp * Math.sin((hz*2*Math.PI*i/1e4+phi)))*size, 
			sineX + (i+1)/10*size, sineY + (amp * Math.sin((hz*2*Math.PI*(i+1)/1e4+phi)))*size);
			if(i%100 == 0 && i > 0) {
				ctx.fillStyle = "#808080";
				ctx.fillRect(sineX + i/10 * size - 2, sineY - 10, 2, 20);
			}
		}
		ctx.strokeStyle = "#dca0ff";
		ctx.stroke();

		drawText(canvas.width-cwToPx(54), chToPx(25), `A: ${Math.round(amp*100)/100}`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(54), chToPx(30), `ω: ${Math.round(hz*2*Math.PI)}rad`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(54), chToPx(35), `φ: ${Math.round(phi*10)/10}rad`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(54), chToPx(40), `t:`, "fira code", chToPx(5), "white", 2);
		
		drawText(canvas.width-cwToPx(24), chToPx(25), `B:  ${Math.round((10-20*value)*100)/100}px`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(24), chToPx(30), `L:  ${Math.round((.4 + .8*value)*100)/100}`, "fira code", chToPx(5), "white", 2);
		drawText(canvas.width-cwToPx(24), chToPx(35), `BK: ${Math.round(backa*100)/100}`, "fira code", chToPx(5), "white", 2);
		// drawText(canvas.width-cwToPx(54), chToPx(45), `BP: ${background.style.backgroundPosition}`, "fira code", chToPx(5), "white", 2);
		
		
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
		var e = groupPerN(data, dataGroups);
		const sliceWidth = Math.round(sx / e.length);
		const ceiling = chToPx(25)
		
		for (let i = 0; i < e.length; i++) {
			let mx = (Math.max(... e[i]) - 128)/128 * ceiling * amp;
			let mn = (Math.min(... e[i]) - 128)/128 * ceiling * amp;
			
			if(Math.abs(mn - mx) < chToPx(1)) {
				mx = mx+chToPx(.75);
				mn = mn-chToPx(.75);
			}

			ctx.beginPath();
			ctx.fillStyle = "rgba(126, 249, 255, .8)";
			// ctx.shadowBlur = 6;
			// ctx.shadowColor = "#000"
			ctx.roundRect(dx + ox, y-mn, sliceWidth/swm, mn-mx, [40]);
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
		ctx.shadowBlur = 3;
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
		const ceiling = chToPx(40);
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
		document.getElementById("fps").textContent = `${Math.round((timerStart - timerEnd))}ms > ${Math.round(1/(getAverage(pTme)/1000))}fps (${pTme.length})`;
		pTme.push(timerStart - timerEnd);
		if(pTme.length > 63) pTme = pTme.slice(1);
	}

	timerStart = window.performance.now();

	if(visualiser.bouncingBackground) {
		dataArray = visualiser.getVisualiserUIntData()
		var value = getAverage(dataArray, 0, Math.round(visualiser.analyser.fftSize/170.7))/255;
		backa += (60/visualiser.refreshRate) / 750;
		if(backa >= Math.PI*2) backa = 0;
		background.style.backgroundSize = `${130 + 30*value}vw`
		background.style.filter = `url(#rgb-split) brightness(${.4 + .8*value})  blur(${10 - 20*value}px)`;
		background.style.backgroundPosition = `${-((15 + 15*value) - (Math.cos(backa) * 14))}vw ${-((60 + 30*value) - (Math.sin(backa) * 28))}vh`;
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
	
	drawText(0, chToPx(26) + letterSize*0.8, title, fontg, Math.round(letterSize-1), /*"#4361EE"*/ "#06dba0", 4, `hsl(165, 100%, ${63*animVar.tGlow/(visualiser.refreshRate/3)}%)`, "bold");
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
		
		case "tOFBezier":
		case "oFBezier":
		case "fBezier":
			dataArray = visualiser.getVisualiserUIntData()
			bp.push(...  getPointsUInt8(dataArray, 1, 10,  chToPx(35),  barWidth ));
			bpb.push(... getPointsUInt8(dataArray, 0,  0,  0,  			barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0,  1,  chToPx(25),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 0,  30, chToPx(45),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 30, 31, chToPx(25),  barWidthB));
			bpb.push(... getPointsUInt8(dataArray, 31, 32, chToPx(10),  barWidthB));
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
				// drawWave(0, canvas.height - chToPx(40), canvas.width, wData, visualiser.analyser.fftSize/256, (-Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume))/1.5);
			}
			drawBezier(bp, false, 0, barWidth/2, "white", 4, 4);
			break;
		case "bezier":
			drawBezier(bp, false, 0, -barWidth/4, "white");
			break;
		case "oFBezier":
			drawBezier(bp, true, 0, barWidth, /*"#365486"*/ "#4B6AC4", 4);
			
			if(visualiser.showWaveform) {
				wData = visualiser.getWaveformData();
				// drawWaveBezier(0, chToPx(22.5), canvas.width, wData);
				drawWave(0, canvas.height - chToPx(22.5), canvas.width, 0, wData, visualiser.analyser.fftSize/256, (-Math.log2(player.volume) < .6 ? .6 : -Math.log2(player.volume)), 1.5);
				// drawWaveC(0, canvas.height - chToPx(25), canvas.width+6, wData, visualiser.analyser.fftSize/128, -Math.log2(player.volume) < 0.5 ? 0.5 : -Math.log2(player.volume), 96, 2);
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
		drawText(0, chToPx(50), `FPV: ${bp.length}  | PE: 0-> ${bp[0].x} 1-> ${bp[1].x} 2-> ${bp[2].x} ... e-> ${bp[bp.length-1].x}`, "fira code", cwToPx(1.5));
		drawText(0, chToPx(53), `SPV: ${bpb.length} | PE: 0-> ${bpb[0].x} 1-> ${bpb[1].x} 2-> ${bpb[2].x} ... e-> ${bpb[bpb.length-1].x}`, "fira code", cwToPx(1.5));
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
		ctx.strokeStyle = `hsl(${180-360*value} 100% 50%)`;
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