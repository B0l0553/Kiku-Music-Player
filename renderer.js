const { ipcRenderer } = require("electron");
const fs = require("fs");
const { 
	GetSettings, 
	GetMusics, 
	GetAlbums, 
	WriteSettings,
	GetCache,
	PeekMusicFolders,
	GetUnscannedFiles,
	VerifyFiles,
	WriteCache,  
} = require("./mapi.js")

let CurrentPage;
let InternalPlaylist = [];

//Musics = GetMusics(settings.musicFolders);
/*
Musics.push(GetMetadata("F:\\Windows\\Music\\Camellia\\Blackmagik Blazing\\[BLEED BLOOD].mp3"));
Musics.push(GetMetadata("F:\\Windows\\Music\\Camellia\\PLANET√√SHAPER\\BLACK JACK.mp3"));
Musics.push(GetMetadata("F:\\Windows\\Music\\kyarustep.mp3"));
*/

window.onbeforeunload = () => {
	ipcMain.removeAllListeners();
}

document.onreadystatechange = () => {
	if(document.readyState === 'complete') {
		document.getElementById('min-button').addEventListener("click", () => {
			ipcRenderer.send("minimize");
		})
		
		document.getElementById('close-button').addEventListener("click", () => {
			ipcRenderer.send("close");
		})
		
		document.getElementById('refresh-button').addEventListener("click", () => {
			ipcRenderer.send('refresh');
		})
		
		const settings = GetSettings();
		fs.mkdirSync(settings.cachePath, { recursive: true });

		const cache = GetCache();
		if(cache.fcount !== PeekMusicFolders(settings.musicFolders)) {
			cache.remove = VerifyFiles(settings.musicFolders, [].concat(cache.albums, cache.banned, cache.toscan));
			cache.toscan = GetUnscannedFiles(settings.musicFolders, cache.albums);
			cache.fcount = PeekMusicFolders(settings.musicFolders);
		}

		cache.remove.forEach(trm => {
			if(cache.albums.includes(trm)) {
				cache.albums = cache.albums.filter(e => e !== trm);
			}

			if(cache.toscan.includes(trm)) {
				cache.toscan = cache.toscan.filter(e => e !== trm);
			}
		})

		cache.remove = [];
		WriteCache(cache);

		function ChangePage(newP) {
			if(CurrentPage) {
				CurrentPage.classList.toggle("hidden");
			}
			
			newP.classList.toggle("hidden");
			CurrentPage = newP;
			cache.lstpag = CurrentPage.id;
			WriteCache(cache);
		}
		
		function ChangePageWithId(_id) {
			ChangePage(document.getElementById(_id));
		}
		
		function TogglePlayback() {
			controls.classList.toggle("hide");
			cache.ctrlop = !controls.classList.contains("hide");
		
			if(cache.ctrlop) {
				controlHide.innerHTML = '<i class="gg-arrow-down-r"></i>'
			} else {
				controlHide.innerHTML = '<i class="gg-arrow-up-r"></i>'
			}
		
			WriteCache(cache);
		}

		function HidePlayback() {
			if(cache.ctrlop === true) {
				TogglePlayback();
			}
		}

		function FetchRecent() {}

		
		//? TODO *not obligatory* Make 'NEW' Bagdes on fresh imported musics
		//* TODO Add notifications icons
		//  TODO Make a warning in options, and make it so only the user can decide if he want to sync the unscanned musics
		//? TODO Make it so the user can eventually ban some audio files he doesn't want in his library
		//! TODO DO SETTINGS PANEL !!!!

		const homeBtn = document.getElementById("home-btn");
		const albumBtn = document.getElementById("album-btn");
		const artistBtn = document.getElementById("artist-btn");
		const optionsBtn = document.getElementById("option-btn");

		const home = document.getElementById("home-page");
		const album = document.getElementById("albums-page");
		const artist = document.getElementById("artist-page");
		const options = document.getElementById("options-page");

		const controls = document.getElementById("playback__wrapper");
		//const controlh = document.getElementById("playback__header");
		const controlHide = document.getElementById("playback__showBtn");

		if(cache.lstpag) {
			ChangePageWithId(cache.lstpag);
		} else {
			ChangePage(home)
		}


		if(cache.ctrlop) {
			TogglePlayback();
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
	}
}

		



