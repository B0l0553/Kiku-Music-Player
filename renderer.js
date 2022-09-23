const { ipcRenderer } = require("electron");
const fs = require("fs");
const { GetSettings, GetMusics, GetAlbums, WriteSettings } = require("./mapi.js")

let CurrentPage;
let Musics 	= [];
let Albums 	= [];
let Playing = [];

const settings = GetSettings();

fs.mkdirSync(settings.cachePath, { recursive: true });

//Musics = GetMusics(settings.musicFolders);
/*Musics.push(GetMetadata("F:\\Windows\\Music\\Camellia\\Blackmagik Blazing\\[BLEED BLOOD].mp3"))
Musics.push(GetMetadata("F:\\Windows\\Music\\Camellia\\PLANET√√SHAPER\\BLACK JACK.mp3"))
Musics.push(GetMetadata("F:\\Windows\\Music\\kyarustep.mp3"))*/

document.onreadystatechange = () => {
	if(document.readyState == "complete") {
		document.getElementById('min-button').addEventListener("click", () => {
			ipcRenderer.send("minimize");
		})
		
		document.getElementById('close-button').addEventListener("click", () => {
			ipcRenderer.send("close");
		})
		
		document.getElementById('refresh-button').addEventListener("click", () => {
			ipcRenderer.send('refresh');
		})		
	}
};

window.onbeforeunload = () => {
	ipcMain.removeAllListeners();
}

const homeBtn = document.getElementById("home-btn");
const albumBtn = document.getElementById("album-btn");
const artistBtn = document.getElementById("artist-btn");
const optionsBtn = document.getElementById("option-btn");

const home = document.getElementById("home-page");
const album = document.getElementById("albums-page");
const artist = document.getElementById("artist-page");
const options = document.getElementById("options-page");

const controls = document.getElementById("playback__wrapper");
const controlh = document.getElementById("playback__header");
const controlHide = document.getElementById("playback__showBtn");

function ChangePage(newP) {
	if(CurrentPage) {
		CurrentPage.classList.toggle("hidden");
	}
	
	newP.classList.toggle("hidden");
	CurrentPage = newP;
	settings.lastPage = CurrentPage.id;
	WriteSettings(settings);
}

function ChangePageWithId(_id) {
	ChangePage(document.getElementById(_id));
}

function TogglePlayback() {
	controls.classList.toggle("hide");
	settings.controlsOpen = !controls.classList.contains("hide");

	if(settings.controlsOpen) {
		controlHide.innerHTML = '<i class="gg-arrow-down-r"></i>'
	} else {
		controlHide.innerHTML = '<i class="gg-arrow-up-r"></i>'
	}

	WriteSettings(settings);
}

function HidePlayback() {
	if(settings.controlsOpen) {
		TogglePlayback();
	}
}

function FetchRecent() {}

ChangePageWithId(settings.lastPage);

if(settings.controlsOpen) {
	controls.classList.toggle("hide");
}

homeBtn.addEventListener('click', () => {
	//FetchRecent();
	//FetchAlbums();
	//FetchFavorites();
	HidePlayback();
	ChangePage(home);
});

albumBtn.addEventListener('click', () => {
	HidePlayback();
	ChangePage(album);
});

artistBtn.addEventListener('click', () => {
	HidePlayback();
	ChangePage(artist)
});

optionsBtn.addEventListener('click', () => {
	HidePlayback();
	ChangePage(options)
});

controlHide.addEventListener('click', () => TogglePlayback())