let StickersBank = [];

class Sticker {
	id;
	imgElem;
	lockedProportions = true;
	rotation = 0;
	inverted = 0;
	glued = false;
	x = 0;
	y = 0;
	width = 0;
	height = 0;

	constructor(imgRef, x, y) {
		this.imgElem = document.createElement("img");
		this.imgElem.src = imgRef;
		this.imgElem.id = "sticker" + Math.round(Math.random() * (9999 - 1000) + 1000);
		this.imgElem.classList.value = "sticker";
		this.imgElem.setAttribute("data-ctx", "sticker");
		this.imgElem.draggable = false;
		this.lockedProportions = (this.imgElem.naturalHeight == this.imgElem.naturalWidth);
		this.moveTo(x, y)
		this.resizeTo(10, 10);
		this.id = this.imgElem.id;
	}

	resizeTo(w, h) {
		if(this.lockedProportions) {
			this.imgElem.style.width = `${w}px`;
			this.imgElem.style.height = `${w}px`;
			this.width = this.height = w;
		} else {
			this.imgElem.style.width = `${w}px`;
			this.imgElem.style.height = `${h}px`;
			this.width = w;
			this.height = h;
		}
	}

	moveTo(x, y) {
		this.imgElem.style.top = `${y}px`;
		this.imgElem.style.left = `${x}px`;
		this.x = x;
		this.y = y;
	}

	invert() {
		this.inverted = !this.inverted;
		this.rotate(this.rotation);
	}

	rotate(deg) {
		this.imgElem.style.transform = `rotateY(${this.inverted*180}deg) rotateZ(${deg}deg)`;
		this.rotation = deg;
	}

	getSticker() {
		return this.imgElem;
	}
}

function createNewSticker(_src) {
	let ts = new Sticker(_src, 0, 0);
	StickersBank.push(ts);
	return ts;
}

function getAllStickers() {
	return StickersBank;
}

function getSticker(_id) {
	for(let i = 0; i < StickersBank.length; i++) {
		if(StickersBank[i].id == _id) return StickersBank[i];
	}
}

function deleteSticker(_id) {
	let id = null;
	for(let i = 0; i < StickersBank.length; i++) {
		if(StickersBank[i].id == _id) id = i; 
	}
	if( id != null ) {
		document.getElementById("stickers__wrapper").removeChild(StickersBank[id].imgElem);
		StickersBank.splice(id, 1);
	}
}

function importStickerJSON(_val) {
	let ts = createNewSticker(_val.src);
	ts.moveTo(_val.x, _val.y);
	if(_val.inverted) ts.invert();
	ts.rotate(_val.theta);
	ts.lockedProportions = _val.lockedProportions;
	ts.resizeTo(_val.w, _val.h);
	
	return ts;
}

function exportStickersToJSON() {
	let infos = [];

	for(let i = 0; i < StickersBank.length; i++) {
		infos.push({
			src: StickersBank[i].imgElem.src,
			x: StickersBank[i].x,
			y: StickersBank[i].y,
			w: StickersBank[i].width,
			h: StickersBank[i].height,
			theta: StickersBank[i].rotation,
			inverted: StickersBank[i].inverted,
			lockedProportions: StickersBank[i].lockedProportions
		});
	}

	return infos;
}

module.exports = {
	createNewSticker,
	getSticker,
	deleteSticker,
	importStickerJSON,
	exportStickersToJSON
}