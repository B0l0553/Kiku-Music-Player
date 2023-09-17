var context,src,analyser,ctx,barWidth = 2,HEIGHT,WIDTH,dataArray,canvas,x = 0;

function ChangeBarWidth(_nWidth) {
	barWidth = _nWidth;
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

	let bp = [];
	analyser.getFloatFrequencyData(dataArray);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var gradient = ctx.createLinearGradient(canvas.width/2, canvas.height, canvas.width/2, canvas.height-160)
	gradient.addColorStop(0, "rgba(0,0,0,0.75)");
	gradient.addColorStop(1, "rgba(0,0,0,0.75)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, canvas.height, canvas.width, -140)
	bp.push(... getRange(dataArray, 0,    16,   90,   6)); // 200 Hz range
	bp.push(... getRange(dataArray, 16,   32,   80,   4)); // 500 Hz range
	bp.push(... getRange(dataArray, 32,   64,   80,   4)); // 1kHz range
	bp.push(... getRange(dataArray, 64,  128,   70,   2)); // 2kHz range
	//bp.push(... getRange(dataArray, 168,  176,  70)); // 4kHz range
	//bp.push(... getRange(dataArray, 339,  343,  50)); // 8kHz range
	//bp.push(... getRange(dataArray, 511,  513,  40)); // 12kHz range
	ctx.beginPath();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 6;
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
	ChangeBarWidth
}