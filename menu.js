class Menu {
	active;
	menuElem;
	scrollPos = 0;

	constructor(_elem) {
		this.menuElem = _elem;
	}

	toggleMenu() {
		if(this.active) {
			this.hideMenu();
		} else {
			this.showMenu();
		}
	}

	showMenu() {
		this.active = true;
		this.menuElem.classList.remove("hide");
	}

	hideMenu() {
		this.active = false;
		this.menuElem.classList.add("hide");
	}

	startCustomScroll() {

		this.menuElem.addEventListener("mousewheel", (e) => {
			if(e.deltaY < 0) {
				if(this.scrollPos == 0 || this.scrollPos + 50 > 0) {
					this.scrollPos = 0;
				} else {
					this.scrollPos += 100;
				}
				this.menuElem.style.top = `${this.scrollPos}px`;
			} else {
				this.scrollPos -= 100;
				this.menuElem.style.top = `${this.scrollPos}px`;
			}
			console.log("scroll");
		});

		this.menuElem.style = `
		overflow: visible;
		position: absolute;
		top: ${this.scrollPos}px;
		transition: top .2s ease;
		`;
	}
}

class MenuPointer {
	pointElem;
	x;
	dx;

	constructor(_elem) {
		this.pointElem = _elem;
		this.setPos(0);
		this.setWidth(0);
	}

	setPos(_x) {
		this.x = _x;
		_elem.style.left = _x;
	}
	
	setWidth(_w) {
		this.dx = _w;
		this.pointElem.style.width = _w;
	}

	pointTo(_elem) {
		let elemRect = _elem.getBoundingClientRect();
		this.setPos(elemRect.x);
		this.setWidth(elemRect.width);
	}

}

module.exports = {
	Menu,
	MenuPointer
}