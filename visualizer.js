var context,src,analyser,ctx,barWidth = 2,HEIGHT,WIDTH,dataArray,canvas,x = 0,sampled=false,mode="bezier";

function ChangeBarWidth(_nWidth) {
	barWidth = _nWidth;
}

function drawBezier(bp) {
	ctx.beginPath();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 4;
	// move to the first point
	ctx.moveTo(bp[0].x, bp[0].y);
	for (var i = 1; i < bp.length - 2; i++)
	{
		var xc = (bp[i].x + bp[i + 1].x) / 2;
		var yc = (bp[i].y + bp[i + 1].y) / 2;
		ctx.quadraticCurveTo(bp[i].x, bp[i].y, xc, yc);
	}
	// curve through the last two bp
	ctx.quadraticCurveTo(bp[i].x, bp[i].y, bp[i+1].x,bp[i+1].y);
	ctx.stroke();
	ctx.closePath();
}

function drawBar(p) {
	for(var i = 0; i < p.length; i++) {
		ctx.fillStyle = "#FFF";
		ctx.fillRect(p[i].x+i, canvas.height, barWidth, p[i].y- canvas.height);
	}
}

function renderFrame() {
	requestAnimationFrame(renderFrame);
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

	if(mode == "none") return;
	let bp = [];
	analyser.getFloatFrequencyData(dataArray);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var gradient = ctx.createLinearGradient(canvas.width/2, canvas.height, canvas.width/2, canvas.height-128)
	gradient.addColorStop(0, "rgba(0,0,0,0.75)");
	gradient.addColorStop(1, "rgba(0,0,0,0.75)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, canvas.height, canvas.width, -140)
	bp.push(... getRange(dataArray, 0,      64,    80,   4));
	bp.push(... getRange(dataArray, 64,     129,   75,   2));
	//bp.push(... getRange(dataArray, 0,     16,   85,   6));
	//bp.push(... getRange(dataArray, 16,    24,   85,   4)); // 500 Hz range
	//bp.push(... getRange(dataArray, 32,    64,   85,   2));
	//bp.push(... getRange(dataArray, 336,   352,  85,   1)); // 4kHz range
	//bp.push(... getRange(dataArray, 678,   686,  70)); // 8kHz range
	//bp.push(... getRange(dataArray, 1022, 1026,  70)); // 12kHz range

	if(!sampled) {
		console.log("New sample size: ", bp.length);
		sampled = 1;
	}

	switch(mode) {
		case "bar":
			drawBar(bp);
			break;
		case "bezier":
			drawBezier(bp);
			break;
		default:
			break;
	}
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
	analyser.fftSize = 2048;
	var bufferLength = analyser.frequencyBinCount;
	console.log(bufferLength);
	dataArray = new Float32Array(bufferLength);
	renderFrame();
}

module.exports = {
	CreateVisualizer,
	RefreshVisualizer,
	ChangeBarWidth,
	mode
}