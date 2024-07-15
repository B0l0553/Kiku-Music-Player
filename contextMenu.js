class FloatingMenu {

	assignedElement;
	title;
	subMenu;
	optSel;

	discovered = false;
	lifetime = 0;
	position = {x: 0, y: 0};
	hoveredPos = 0;
	optStack = 0;

	constructor(elem) {
		this.assignedElement = elem;
		this.title = this.createElem("div", "", "title ctx-protect");
		this.subMenu = this.createElem("div", "", "submenu ctx-protect");
		this.optSel = this.createElem("img", "", "optSel ctx-protect");
		this.optSel.src = "./assets/icons/menu-triangle-com.svg"

		this.assignedElement.appendChild(this.title);
		this.assignedElement.appendChild(this.optSel);
		this.assignedElement.appendChild(this.subMenu);

		this.hideMenu();
	}

	moveMenu(x, y) {
		this.position.x = x;
		this.position.y = y;
		this.assignedElement.style.left = `${x}px`;
		this.assignedElement.style.top = `${y}px`;
	}

	showMenu(_lifetime=999999999) {
		this.discovered = 1;
		this.assignedElement.style.opacity = "1";
		this.assignedElement.style.pointerEvents = "all";
		this.lifetime = _lifetime;
		if(this.position.x + this.assignedElement.offsetWidth > window.innerWidth) {
			this.position.x = window.innerWidth - this.assignedElement.offsetWidth - 8;
			this.assignedElement.style.left = `${this.position.x}px`;
		}
		
		if(this.position.y + this.assignedElement.offsetHeight > window.innerHeight) {
			this.position.y = window.innerHeight - this.assignedElement.offsetHeight - 8;
			this.assignedElement.style.top = `${this.position.y}px`;
		}
	}

	hideMenu() {
		this.discovered = 0;
		this.assignedElement.style.opacity = "0";
		this.assignedElement.style.pointerEvents = "none";
		setTimeout(() => this.clearOptions(), 100);
		this.changeHoverCoords(48)
	}

	changeTitle(value) {
		this.title.innerText = value;
	}

	addButtonOption(text, func) {
		var tOpt = document.createElement("div");
		tOpt.classList.value = `opt ctx-protect`;
		tOpt.innerText = text;
		tOpt.onclick = func;
		this.subMenu.appendChild(tOpt);
		var rect = tOpt.getBoundingClientRect();
		tOpt.onmouseenter = () => {
			this.changeHoverCoords(tOpt.offsetTop);
		}
		
	}

	addTickOption(text, value, func) {
		var tOpt = document.createElement("div");
		tOpt.classList.value = `opt tick ${value ? "on" : ""} ctx-protect`;
		tOpt.innerText = text;
		tOpt.onclick = () => {
			tOpt.classList.toggle("on");
			func();
		};
		this.subMenu.appendChild(tOpt);
		var rect = tOpt.getBoundingClientRect();
		tOpt.onmouseenter = () => {
			this.changeHoverCoords(tOpt.offsetTop);
		}
	}

	addInputOption(text, value, func) {
		var tOpt = document.createElement("div");
		tOpt.classList.value = `opt input ctx-protect`;
		tOpt.innerText = text;
		var ip = document.createElement('input');
		ip.classList.add("ctx-protect")
		ip.value = value;
		ip.setAttribute("autocomplete", "off");
		ip.setAttribute("autocorrect", "off");
		ip.setAttribute("autocapitalize", "off");
		ip.setAttribute("spellcheck", false);
		ip.onkeyup = (e) => {
			func(e);
		}
		tOpt.appendChild(ip);
		this.subMenu.appendChild(tOpt);
		tOpt.onmouseenter = () => {
			this.changeHoverCoords(tOpt.offsetTop);
		}
	}

	addSelectOption(text, values, def, func) {
		var tOpt = document.createElement("div");
		tOpt.classList.value = `opt select ctx-protect`;
		tOpt.innerText = text;
		var ip = document.createElement('select');
		for(let i = 0; i < values.length; i++) {
			var t = this.createElem("option", "", "ctx-protect");
			t.value = values[i];
			t.innerText = values[i];
			ip.appendChild(t);
			if(values[i] == def) {
				t.selected = true;
			} else {
				t.selected = false;
			}
		}
		ip.classList.add("ctx-protect")
		ip.onchange = (e) => {
			func(e);
		}
		tOpt.appendChild(ip);
		this.subMenu.appendChild(tOpt);
		tOpt.onmouseenter = () => {
			this.changeHoverCoords(tOpt.offsetTop);
		}
	}

	clearOptions() {
		this.subMenu.childNodes.forEach((el) => {
			el.onmouseenter = null;
			el.onclick = null;
			if(el.classList.contains("select")) {
				el.firstChild.onchange = null;
			} else if(el.classList.contains("input")) {
				el.firstChild.onkeyup = null;
			}
		})
		this.subMenu.innerText = "";
		this.optStack = 0;
	}

	changeHoverCoords(y) {
		this.optSel.style.top = `${y+6}px`;
		// this.optSel.style.transform = `translateY(${y}px) rotateZ(90deg)`;
	}

	createElem(tag, id, clss) {
		var tmp = document.createElement(tag);
		tmp.id = id;
		tmp.classList.value = clss;
		return tmp;
	}

}

module.exports = {
	FloatingMenu
}