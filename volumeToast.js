
class VolumeToast {

	Focus = [false, false, false];
	externalFocus = false;

	hidden = false;

	autoHide = false;
	autoHideTarget = 0;

	value = 0;

	constructor(_elem) {
		this.rootElem = _elem || document.createElement("div");

		let wrapper = document.createElement("div");
		wrapper.style.display = "flex";
		wrapper.style.justifyContent = "center";
		wrapper.style.alignItems = "end";
		wrapper.style.height = "100%";
		wrapper.style.width = ".4rem";
		wrapper.style.background = "#3f3f3f";
		wrapper.style.borderRadius = ".25rem";
		wrapper.style.overflow = "hidden";
		this.wrapper = wrapper;

		let progressBar = document.createElement("div");
		progressBar.style.height = "0";
		progressBar.style.width = "100%";
		progressBar.style.background = "blueviolet";
		this.sliderBar = progressBar;

		let volumeHandle = document.createElement("div");
		volumeHandle.style.position = "absolute";
		volumeHandle.style.borderRadius = "100%";
		volumeHandle.style.width = volumeHandle.style.height = ".6rem";
		volumeHandle.style.bottom = ".25rem";
		volumeHandle.style.background = "#acacac";
		// volumeHandle.style.pointerEvents = "none";
		this.handle = volumeHandle;

		this.wrapper.appendChild(this.sliderBar);
		this.wrapper.appendChild(this.handle);
		this.rootElem.appendChild(this.wrapper);
	}

	registerEvents() {
		this.rootElem.onmouseenter = () => 	{ this.setFocus(0, true); 	this.handleEntry();	}
		this.wrapper.onmouseenter = () => 	{ this.setFocus(1, true); 	this.handleEntry();	}
		this.rootElem.onmouseleave = () => 	{ this.setFocus(0, false); 	this.handleEntry();	}
		this.wrapper.onmouseleave = () => 	{ this.setFocus(1, false); 	this.handleEntry();	}
	}

	handleEntry() {
		console.log(this.Focus);
		if(this.isFocused()) this.showVolumeToast();
		else {
			this.hideVolumeToast(500);
		}
	}

	hideVolumeToast(_value = -1) {
		if(_value >= 0) {
			this.autoHide = true;
			this.autoHideTarget = Date.now() + _value;
		} else {
			this.rootElem.style.height = '0';
			this.rootElem.style.padding = '0 .5rem 0 .5rem';
			this.handle.style.height = "0";
			this.autoHide = false;
			this.hidden = true;
		}
	}

	showVolumeToast() {
		if(!this.autoHide && !this.hidden) return;
		this.rootElem.style = '';
		this.handle.style.height = ".6rem";
		this.autoHide = false;
		this.hidden = false;
	}

	showToastFor(_value) {
		this.showVolumeToast();
		this.hideVolumeToast(_value);
	}

	getValue() {
		return this.volume;
	}

	setValue(_value) {
		if(_value > 100) _value = 100;
		if(_value < 0) _value = 0;
		this.sliderBar.style.height = `${_value}%`;
		this.handle.style.translate = `0px -${(_value/100) * 144}px`
		this.volume = _value/100;
	}

	autoHideUpdate() {
		if(this.autoHideTarget <= Date.now() && this.autoHide) {
			this.hideVolumeToast();
		}
	}

	setExternalFocus(_value) {
		this.externalFocus = _value;
		this.handleEntry();
	}

	setFocus(_key, _value) {
		this.Focus[_key] = _value;
	}

	isFocused() {
		return this.Focus[0] || this.Focus[1] || this.Focus[2] || this.externalFocus;
	}
}

module.exports = {
	VolumeToast
}