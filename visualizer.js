const {
	renderFrame,
	changeVisSize,
	setPersona
} = require("./graphics");

function setupVisualizer(canvas, audio) {
	var v = new Visualiser(audio);
	var ctx = canvas.getContext("2d")
	var img = new Image();
	img.src = "./assets/images/Untitledx2.png";
	setPersona(img, 32*2, 66*2)
	v.setRefreshRate(20);
	v.startRender = () => { 
		if(v.breakRender){
			v.breakRender = false;
			renderFrame(v, canvas, ctx);
		} else {
			console.warn("Refused to launch new render thread because one is already running!")
		}
	};
	return v;
}

class Visualiser {

	audioElem;
	audioCtx;
	ctxSrc;
	analyser;
	buffer;
	UIntBuffer;
	mode;
	bouncingBackground;
	windowTilt = true;
	showWaveform;
	// showChibi;
	refreshTime;
	refreshRate;
	breakRender = true;
	startRender;
	debug = false;
	mouse = {x:-1, y:-1, c:0, h:0, hx:0, hy:0, gx: -1, gy: -1}
	imports = {}
	height;
	width;

	constructor(audio) {
		this.audioElem = audio;
		this.audioCtx = new AudioContext();
		this.ctxSrc = this.audioCtx.createMediaElementSource(audio);
		this.analyser = this.audioCtx.createAnalyser();
		this.ctxSrc.connect(this.analyser);
		this.analyser.connect(this.audioCtx.destination);
		this.setFftSize(128);
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
		this.UIntBuffer = new Uint8Array(this.analyser.frequencyBinCount);
		this.UIntBufferWave = new Uint8Array(this.analyser.frequencyBinCount);
		this.showWaveform = false;
	}

	/**
		DEPRECATED
	*/
	showDebug() {
		this.debug = !this.debug;
	}

	sillyness() {
		this.silly = true;
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
		var lValue = Math.round(Math.log2(value));
		this.analyser.fftSize = Math.pow(2, lValue);
		this.buffer = new Float32Array(this.analyser.frequencyBinCount);
		this.UIntBuffer = new Uint8Array(this.analyser.frequencyBinCount);
		this.UIntBufferWave = new Uint8Array(this.analyser.frequencyBinCount);
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
		this.analyser.getByteTimeDomainData(this.UIntBufferWave);
		return this.UIntBufferWave;
	}
}

module.exports = {
	setupVisualizer
}