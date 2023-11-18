
var context,src,analyser,ctx,barWidth = 2,HEIGHT,WIDTH,dataArray,canvas,x=0,sampled=false,mode="fsBezier",diffVolume=0,dC=[0,0];

function ChangeDiff(v) {
	diffVolume = v/6;
}

function ChangeMode(m) {
	mode = m;
}

function ChangeBarWidth(_nWidth) {
	barWidth = _nWidth;
}

function changeCursorCoords(x,y) {
	dC[0] = x;
	dC[1] = y;
}

function drawBezier(bp, filled) {
	ctx.beginPath();
	var gradient = ctx.createLinearGradient(0, canvas.height-150, 0, canvas.height);
	gradient.addColorStop(0, "white");
	gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
	ctx.strokeStyle = `white`;
	ctx.fillStyle = gradient;
	ctx.lineWidth = 4;
	// move to the first point
	ctx.moveTo(bp[0].x, bp[0].y);
	for (var i = 1; i < bp.length - 2; i++)
	{
		
		var xc = (bp[i].x + bp[i + 1].x) / 2;
		var yc = (bp[i].y + bp[i + 1].y) / 2;
		ctx.quadraticCurveTo(bp[i].x+i, bp[i].y, xc+i, yc);
	}
	// curve through the last two bp
	ctx.quadraticCurveTo(bp[i].x+bp.length, bp[i].y, bp[i+1].x+bp.length+1, bp[i+1].y);
	if(filled) {
		ctx.lineTo(canvas.width, canvas.height);
		ctx.lineTo(0, canvas.height);
		
  		ctx.fill();
	} else {
		ctx.stroke();
	}
	ctx.closePath();
}

function drawBar(p) {
	for(var i = 0; i < p.length; i++) {
		ctx.fillStyle = "#FFF";
		ctx.fillRect(p[i].x+i, canvas.height, barWidth, p[i].y- canvas.height);
	}
}

function drawLine(bp) {
	ctx.beginPath();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 4;

	ctx.moveTo(bp[0].x, bp[0].y);
	//ctx.lineTo(bp[1].x, bp[1].y);
	for (var i = 1; i < bp.length; i++)
	{
		//var xc = (bp[i].x + bp[i + 1].x) / 2;
		//var yc = (bp[i].y + bp[i + 1].y) / 2;
		ctx.lineTo(bp[i].x+i, bp[i].y);
	}
	ctx.stroke();
	ctx.closePath();
}

function getAverage(array, start, end) {
	var S=0;
	for(let i = 0; i < end; i++) {
		S+=canvas.height-array[i].y-4;
	}

	return S/(end - start);
}

function renderFrame() {
	if(mode == "none") return;
	requestAnimationFrame(renderFrame)
	x = 0;

	function getRange(data, start, end, threshold, amplification = 1) {
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
			x += barWidth;
		}
	
		return p;
	}
	let c = ["white", "red", "blue", "green"]
	let bp = [];
	analyser.getFloatFrequencyData(dataArray);
	ctx.clearRect(0, 0, canvas.width, canvas.height);	
	var gradient = ctx.createLinearGradient(canvas.width/2, canvas.height, canvas.width/2, canvas.height-140)
	gradient.addColorStop(0, "rgba(0,0,0,1)");
	gradient.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = gradient;
	ctx.setLineDash([]);
	ctx.fillRect(0, canvas.height, canvas.width, -140)
	ctx.font = "12px Fira Code"
	ctx.fillStyle = "white";

	bp.push(... getRange(dataArray, 0,  35, 74 + diffVolume, 4));
	bp.push(... getRange(dataArray, 35, 86, 71 + diffVolume, 4));
	
	ctx.fillText(`VISUALIZER_${canvas.width}x${canvas.height}_${barWidth}_${mode}_${Math.round(diffVolume*100)/100}_${analyser.fftSize}_${bp.length}:0-${24000/analyser.frequencyBinCount*bp.length-1}`, 0, canvas.height-9);
	if(!sampled) {
		console.log("New sample size: ", bp.length);
		sampled = 1;
	}

	switch(mode) {
		case "bar":
			drawBar(bp);
			break;
		case "bezier":
			drawBezier(bp, false);
			break;
		case "fBezier":
			drawBezier(bp, true);
			break;
		case "fsBezier":
			drawBezier(bp, true);
			drawBezier(bp, false);
			break;
		case "line":
			drawLine(bp);
			break;
		default:
			break;
	}

	/*bp.forEach((p, i) => {
		if(dC[0] >= p.x+i-3 && dC[0] <= p.x+i+3) {
			ctx.beginPath();
			ctx.strokeStyle = "rgb(255, 100, 255)";
			ctx.fillStyle = "rgb(200, 150, 170)";
			ctx.lineWidth = 1;
			ctx.moveTo(p.x+i, 0);
			ctx.setLineDash([15, 5]);
			ctx.lineTo(p.x+i, canvas.height);
			ctx.stroke();
			ctx.closePath();
			ctx.fillText(`p=${Math.floor(p.x)}`, dC[0]+8, dC[1]-275)
			ctx.fillText(`Value: ${-Math.floor(p.y-canvas.height+4)}`, dC[0]+8, dC[1]-260)
		}
	});*/
}

function CreateVisualizer(audio, _canvas) {
	context = new AudioContext();
	src = context.createMediaElementSource(audio);
	analyser = context.createAnalyser();
	canvas = _canvas;
	ctx = _canvas.getContext("2d");
	RefreshVisualizer(audio);
}

function RefreshVisualizer(audio) {
	//src = context.createMediaElementSource(audio);
	src.connect(analyser);
	analyser.connect(context.destination);
	analyser.fftSize = 8192;
	var bufferLength = analyser.frequencyBinCount;
	console.log(bufferLength);
	dataArray = new Float32Array(bufferLength);
	renderFrame();
}

module.exports = {
	CreateVisualizer,
	RefreshVisualizer,
	ChangeBarWidth,
	ChangeMode,
	ChangeDiff,
	changeCursorCoords
}