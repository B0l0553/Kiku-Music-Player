const {
	renderFrame,
	changeVisSize
} = require("./graphics");

function setupVisualizer(canvas, audio) {
	var v = new Visualiser(audio);
	var ctx = canvas.getContext("2d")
	v.setRefreshRate(20);
	v.startRender = () => { 
		if(v.breakRender){
			v.breakRender = false;
			renderFrame(v, canvas, ctx); 
		}
	};
	return v;
}

class Visualiser {

	audioCtx;
	ctxSrc;
	analyser;
	buffer;
	UIntBuffer;
	mode;
	bouncingBackground;
	showWaveform;
	showChibi;
	refreshTime;
	refreshRate;
	breakRender = true;
	startRender;

	constructor(audio) {
		this.audioCtx = new AudioContext();
		this.ctxSrc = this.audioCtx.createMediaElementSource(audio);
		this.analyser = this.audioCtx.createAnalyser();
		this.ctxSrc.connect(this.analyser);
		this.analyser.connect(this.audioCtx.destination);
		this.setFftSize(128);
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
		this.UIntBuffer = new Uint8Array(this.analyser.frequencyBinCount);
		this.showChibi = false;
		this.showWaveform = false;
		
	}

	getAudioOutput() {
		return this.audioCtx.sinkId;
	}

	setAudioOutput(token) {
		this.audioCtx.setSinkId(token);
	}

	setRefreshRate(value) {
		this.refreshRate = value;
		this.refreshTime = 1/value*1000
	}

	setMode(value) {
		this.mode = value;
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
		this.analyser.getByteTimeDomainData(this.UIntBuffer);
		return this.UIntBuffer;
	}
}

module.exports = {
	setupVisualizer
}