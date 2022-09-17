const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");
let CurrentPage;

class AppSettings {
	default;
	cachePath;
	musicFolders;
	favorites;
	lastPage;
	//currentTheme;
	//themeFolder;

	constructor() {
		this.default = true;
		this.cachePath = "Cache";
		this.musicFolders = [];
		this.favorites = [];
	}
}

const settings = GetSettings();

document.onreadystatechange = () => {
	if(document.readyState == "complete") {
		document.getElementById('min-button').addEventListener("click", () => {
			ipcRenderer.send("minimize");
			//window.electronAPI.minimize();
		})
		
		document.getElementById('close-button').addEventListener("click", () => {
			ipcRenderer.send("close");
			//window.electronAPI.close();
		})
		
		document.getElementById('refresh-button').addEventListener("click", () => {
			ipcRenderer.send('refresh');
			//window.electronAPI.refresh();
		})		
	}
};

window.onbeforeunload = () => {
	ipcMain.removeAllListeners();
}

function GetSettingsJson() {
	var fpath = path.join(__dirname, "settings.json");
	if(fs.existsSync(fpath)) {
		return JSON.parse(fs.readFileSync(fpath));
	}
	return null;
}

function GetSettings() {
	var fpath = path.join(__dirname, "settings.json");
	var json = GetSettingsJson();

	if(json) {
		var ap = new AppSettings();

		ap.default 		=	json.default;
		ap.cachePath 	=	json.cachePath;
		ap.musicFolders = 	json.musicFolders;
		ap.favorites 	=	json.favorites;
		ap.lastPage 	=	json.lastPage;
		return ap;
	}

    var as = new AppSettings()
    as.cachePath = path.join(__dirname, "Cache");
    as.default = false;
	as.lastPage = "HOME";
    
    fs.writeFileSync(fpath, JSON.stringify(as, null, 4));
    return as;
}

function WriteSettings(_settings) {
	var fpath = path.join(__dirname, "settings.json");
	fs.writeFileSync(fpath, JSON.stringify(settings, null, 4));
}

//const contextmenu = document.getElementById('contextmenu');

const homeBtn = document.getElementById("home-btn");
const albumBtn = document.getElementById("album-btn");
const artistBtn = document.getElementById("artist-btn");
const optionsBtn = document.getElementById("option-btn");

const home = document.getElementById("home-page");
const album = document.getElementById("albums-page");
const options = document.getElementById("options-page");

function ChangePage(newP) {
	if(CurrentPage) {
		CurrentPage.classList.toggle("hidden");
	}
	
	newP.classList.toggle("hidden");
	CurrentPage = newP;
	settings.lastPage = CurrentPage.id;
	WriteSettings(settings);
	//console.log(`Changed to ${CurrentPage.id}`);
}

function ChangePageWithId(_id) {
	ChangePage(document.getElementById(_id));
}

ChangePageWithId(settings.lastPage);
/*document.addEventListener('contextmenu', (event) => {
	contextmenu.textContent = "";
	if(contextmenu.classList.contains("hide-context")) {
		contextmenu.classList.toggle("hide-context");
	}
	contextmenu.style.transform = `translate(${event.clientX-8}px, ${event.clientY-20}px)`;
	
	const p = document.createElement("p");
	p.classList.add("smoll-text");
	p.id = "context-identifier";
	
	if(event.target.getAttribute("name")) {
		p.textContent = event.target.getAttribute("name");
		contextmenu.appendChild(p);
		
	} else {
		p.textContent = "Unknown";
		contextmenu.appendChild(p);
	}

	//LastContext.x = event.clientX;
	//LastContext.y = event.clientY;
});*/

/*document.addEventListener('click', (event) => {
	
	console.log([event.target.id, event.target.getAttribute("name")]);
	if(event.target.id != "contextmenu" || event.target.id != "context-identifier") {
		if(!contextmenu.classList.contains("hide-context")) {
			contextmenu.classList.toggle("hide-context");
		}
	}
});*/

homeBtn.addEventListener('click', () => ChangePage(home));
albumBtn.addEventListener('click', () => ChangePage(album));
optionsBtn.addEventListener('click', () => ChangePage(options))
