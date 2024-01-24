const {
	renderFrame
} = require("./graphics");

function setupVisualizer(canvas, audio) {
	var v = new Visualiser(audio);
	var ctx = canvas.getContext("2d")
	v.setMode("oFBezier")
	setTimeout(() => renderFrame(v, canvas, ctx), 0);
	return v;
}

class Visualiser {

	audioCtx;
	ctxSrc;
	analyser;
	buffer;
	mode;

	constructor(audio) {
		this.audioCtx = new AudioContext();
		this.ctxSrc = this.audioCtx.createMediaElementSource(audio);
		this.analyser = this.audioCtx.createAnalyser();
		this.ctxSrc.connect(this.analyser);
		this.analyser.connect(this.audioCtx.destination);
		this.setFftSize(4096);
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
	}

	setMode(value) {
		this.mode = value;
	}

	setFftSize(value) {
		this.analyser.fftSize = value;
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
	}

	getVisualiserData() {
		this.analyser.getFloatFrequencyData(this.buffer);
		return this.buffer;
	}

	getWaveformData() {
		this.analyser.getFloatTimeDomainData(this.buffer);
		return this.buffer;
	}
}

module.exports = {
	setupVisualizer
}