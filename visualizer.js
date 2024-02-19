const {
	renderFrame,
	changeVisSize
} = require("./graphics");

function setupVisualizer(canvas, audio) {
	var v = new Visualiser(audio);
	var ctx = canvas.getContext("2d")
	v.setMode("oFBezier", canvas)
	v.showWaveform = true;
	v.setRefreshRate(20);
	renderFrame(v, canvas, ctx)
	return v;
}

class Visualiser {

	audioCtx;
	ctxSrc;
	analyser;
	buffer;
	UIntBuffer;
	mode;
	showWaveform;
	showChibi;
	refreshTime;
	refreshRate;

	constructor(audio) {
		this.audioCtx = new AudioContext();
		this.ctxSrc = this.audioCtx.createMediaElementSource(audio);
		this.analyser = this.audioCtx.createAnalyser();
		this.ctxSrc.connect(this.analyser);
		this.analyser.connect(this.audioCtx.destination);
		this.setFftSize(4096);
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
		this.UIntBuffer = new Uint8Array(this.analyser.frequencyBinCount);
	}

	showChibis() {
		this.showChibi = true;
		this.showWaveform = false;
	}

	setRefreshRate(value) {
		this.refreshRate = value;
		this.refreshTime = 1/value*1000
	}

	setMode(value, canvas) {
		this.mode = value;
		setTimeout(() => changeVisSize(canvas), this.refreshTime+1);
	}

	setFftSize(value) {
		this.analyser.fftSize = value;
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
		this.UIntBuffer = new Uint8Array(this.analyser.frequencyBinCount);
	}

	setDecibels(min, max) {
		this.analyser.minDecibels = min;
		this.analyser.maxDecibels = max;
	}

	setSmoothing(value) {
		this.analyser.smoothingTimeConstant = value;
	}

	getVisualiserUIntData() {
		this.analyser.getByteFrequencyData(this.UIntBuffer);
		return this.UIntBuffer;
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