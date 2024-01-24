let barWidth = barWidthB = diffVolume = 0;
let title = album = artist = next = "";

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

function changeDiff(v) {
	diffVolume = 16*(v/100)-4;
	//diffVolume = v;
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

function renderFrame(visualiser, canvas, ctx) {
	requestAnimationFrame(() => renderFrame(visualiser, canvas, ctx))
	
	let x = 0;
	let bp = [];
	let bpb = [];

	function drawText(x,y,value="Sample Text",font="consolas",size="12",color="white") {
		ctx.font = `${size}px ${font}`;
		ctx.fillStyle = color;
		ctx.fillText(value, x, y)
	}	
	
	function drawBezier(bp, filled, offsetBottom=0, offsetRight=0, colorBg="white", colorEnd="rgba(255, 255, 255, .75)") {
		ctx.beginPath();
		var gradient = ctx.createLinearGradient(0, canvas.height-140, 0, canvas.height);
		gradient.addColorStop(0, colorBg);
		gradient.addColorStop(1, colorEnd);
		ctx.setLineDash([]);
		ctx.strokeStyle = `white`;
		ctx.fillStyle = gradient;
		ctx.lineWidth = 3;
		// move to the first point
		ctx.moveTo(0-barWidth/2, canvas.height-ctx.lineWidth-offsetBottom);
		for (var i = 0; i < bp.length-1; i++)
		{
			var xc = (bp[i].x + bp[i + 1].x) / 2;
			var yc = (bp[i].y + bp[i + 1].y) / 2;
			ctx.quadraticCurveTo(bp[i].x+i+barWidth/2-offsetRight, bp[i].y-offsetBottom, xc+i+1+barWidth/2-offsetRight, yc-offsetBottom);
		}
		// curve through the last two bp
		ctx.quadraticCurveTo(bp[bp.length-1].x+bp.length+barWidth/2-offsetRight, bp[bp.length-1].y-offsetBottom, canvas.width+barWidth/2, canvas.height-ctx.lineWidth-offsetBottom);
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
			var dy = p[i].y - pointOffset - canvas.height;
			if(dy > 0) dy=-8;
			ctx.fillStyle = "#FFF";
			ctx.beginPath();
			ctx.roundRect(p[i].x + i - offsetRight, canvas.height - offsetBottom, barWidth / 2, dy, [40]);
			ctx.fill();
		}
	}
	
	function drawLine(bp) {
		ctx.beginPath();
		ctx.strokeStyle = "white";
		ctx.lineWidth = 4;
	
		ctx.moveTo(bp[0].x, bp[0].y);
		for (var i = 1; i < bp.length; i++)
		{
			ctx.lineTo(bp[i].x+i, bp[i].y);
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
			const v = data[i] * 50.0;
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
			var barHeight = data[i] + 140;
			if (barHeight < 0) barHeight = 0;
			else if(barHeight < threshold) barHeight = 0;
			else {
				barHeight -= threshold;
				barHeight *= amplification;
			}
	
			p.push({x: x, y: (canvas.height - barHeight)-4});
			x += spacing;
		}
	
		return p;
	}

	function getRangeNormalized(data, start, end, threshold, norme = -20, spacing = 1) {
		var p = [];
		//norme = -53; // in dBFS
		for (var i = start; i < end; i++) {
			var barHeight = canvas.height - ((2-((data[i]/norme)-2))*threshold-threshold+4) //(threshold*(data[i]/norme)) + threshold + 4;
			if(barHeight > canvas.height - 4) barHeight = canvas.height - 4;
			p.push({x: x, y: barHeight});
			x += spacing;
		}
	
		return p;
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawText(5, 24, artist, "MPLUS1Code", "24");
	drawText(10, 100, title, "MPLUS1Code", "48");

	if(visualiser.mode == "none") return;
	var dataArray = visualiser.getVisualiserData();
	ctx.setLineDash([]);

	switch(visualiser.mode) {
		case "bar":
		case "bezier":
		case "bBezier":
		case "fSBezier":
		case "line":
			bp.push(... getRange(dataArray, 0, 58, 90 + diffVolume, 12, barWidth));
			//bp.push(... getRangeNormalized(dataArray, 0, 58, 125, -30 /*-80+diffVolume*.60*/, barWidth));
			break;
		case "tOFBezier":
		case "oFBezier":
		case "fBezier":
			bp.push(... getRange(dataArray, 0,  14, 87 + diffVolume, 7, barWidth));
			bpb.push(... getRange(dataArray, 0, 32, 87 + diffVolume, 7, barWidthB));
			// bp.push(... getRangeNormalized(dataArray, 1,  16, 125, -17 /*-80+diffVolume*.60*/, barWidth));
			// bpb.push(... getRangeNormalized(dataArray, 0, 32, 100, -17 /*-80+diffVolume*.60*/, barWidthB));
			break;
	}

	switch(visualiser.mode) {
		case "bar":
			drawBar(bp);
			break;
		case "bBezier":
			drawBar(bp, -4-barWidth/2, 100, -30);
			drawBezier(bp, false, 100, -barWidth/2);
			break;
		case "bezier":
			drawBezier(bp, false, 196);
			break;
		case "tOFBezier":
			drawTangent(bp, bpb);
		case "oFBezier":
			drawBezier(bp, true, 100, barWidth, "#365486", "#365486");
		case "fBezier":
			drawBezier(bpb, true, 100, bpb[0].x+barWidth, "#7FC7D9", "#7FC7D9");
			break;
		case "fSBezier":
			drawBezier(bp, true);
			drawBezier(bp, false);
			break;
		case "line":
			drawLine(bp);
			break;
		default:
			break;
	}

	ctx.beginPath();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.moveTo(0, canvas.height - 90);
	ctx.lineTo(canvas.width, canvas.height - 90);
	ctx.stroke();

	var dataArray = visualiser.getWaveformData();
	drawWave(dataArray);
}

module.exports = {
	changeBarWidth,
	changeDiff,
	setTitle,
	setAlbum,
	setArtist,
	setNextTitle,
	renderFrame
}