const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const { 
	GetSettings, 
	GetMusics, 
	GetMetadata,
	GetAlbums, 
	WriteSettings,
	GetUserData,
	WriteUserData,
	GetCache,
	PeekMusicFolders,
	GetUnscannedFiles,
	VerifyFiles,
	WriteCache,  
} = require("./mapi.js")
const path = require("path")
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
		});
		
		document.getElementById('close-button').addEventListener("click", () => {
			ipcRenderer.send("close");
		});
		
		document.getElementById('refresh-button').addEventListener("click", () => {
			ipcRenderer.send('refresh');
		});

		const userdata = GetUserData();
		const settings = GetSettings();
		console.log(userdata);
		fs.mkdirSync(settings.cachePath, { recursive: true });

		const cache = GetCache();
		var f = PeekMusicFolders(settings.musicFolders)
		if(cache.musics.length !== f) {
			console.log(`Length Invalid: ${cache.musics.length} != ${f}`)
			cache.remove = VerifyFiles(settings.musicFolders, cache.musics);
			cache.toscan = GetUnscannedFiles(settings.musicFolders, cache.musics);
			//cache.fcount = PeekMusicFolders(settings.musicFolders);
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

		function GetAlbumBox(_album) {
			const box 			= document.createElement('div');
			const thumb 		= document.createElement('img');
			const infoWrap 		= document.createElement('div');
			const subInfoL 		= document.createElement('div');
			const subInfoR 		= document.createElement('div');
			const title 		= document.createElement('span');
			const author 		= document.createElement('span');
			const musicNumber 	= document.createElement('span');

			thumb.src = _album.musics[0].tags.image;
			musicNumber.innerText = _album.musics.length;
			title.innerText = _album.name;
			author.innerText = _album.author;

			subInfoR.classList.add("box__subInfoWrapper");
			subInfoR.appendChild(musicNumber);

			subInfoL.classList.add("box__subInfoWrapper");
			subInfoL.appendChild(title);
			subInfoL.appendChild(author);

			infoWrap.classList.add("box__infoWrapper");
			infoWrap.appendChild(subInfoL);

			box.classList.add("box__albumDisplay")
			box.appendChild(thumb);
			box.appendChild(infoWrap);

			return box;
		}

		function ChangePage(newP) {
			if(CurrentPage) {
				CurrentPage.classList.toggle("hidden");
			}
			
			newP.classList.toggle("hidden");
			CurrentPage = newP;
			userdata.lstpag = CurrentPage.id;
			WriteUserData(userdata);
		}
		
		function ChangePageWithId(_id) {
			ChangePage(document.getElementById(_id));
		}
		
		function TogglePlayback() {
			controls.classList.toggle("hide");
			userdata.ctrlop = !controls.classList.contains("hide");
		
			if(userdata.ctrlop) {
				controlHide.setAttribute('title', "Close Playback");
				controlHide.innerHTML = '<i class="gg-arrow-down-r"></i>';
			} else {
				controlHide.setAttribute('title', "Close Playback");
				controlHide.innerHTML = '<i class="gg-arrow-up-r"></i>';
			}
		
			WriteUserData(userdata);
		}

		function HidePlayback() {
			if(userdata.ctrlop === true) {
				TogglePlayback();
			}
		}

		function InsertList(_element, _list, _basename = false) {
			if(!_list) return;
			if(_list.length === 0) {
				const fel = document.getElementById(_element);
				fel.classList.add("list__nothing");
				fel.innerText = "Nothing :(";
				return;
			}

			const fel = document.getElementById(_element);
			_list.forEach(el => {
				const nsp = document.createElement("span");
				if(_basename) nsp.textContent = path.basename(el);
				else nsp.textContent = el;
				nsp.classList.add("list__element");
				fel.appendChild(nsp);
			})

			const title = document.getElementById(_element + "Title");
			if(title !== undefined && title) {
				title.innerText = `Waiting to be scanned ( ${_list.length} )`;
			}
		}

		function DeleteFromListWithValue(_list, _value) {
			if(!_value || !_list) return;
			
			const fel = document.getElementById(_list);
			fel.childNodes.forEach((value, key) => {
				if(value.textContent == _value) {
					fel.removeChild(value);
					//return;
				}
			});

			//console.log(`No childs with content: ${_value} to remove!`);
		}

		function ScanAllMusics() {
			const p = document.getElementById('playbackProgress');
			for(let i = 0; i < cache.toscan.length; i++) {
				var MMeta = GetMetadata(cache.toscan[i], settings.cachePath);
				cache.musics.push(MMeta);
				//DeleteFromListWithValue("settings__cacheTSList", MMeta.filename)
				//p.style.width = `${(Math.round(((i / cache.toscan.length) * 100))).toString()}%`;
				console.log((Math.round(((i / cache.toscan.length) * 100))).toString());
			}
			cache.toscan = [];
			WriteCache(cache);
			//ipcRenderer.send("refresh")
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
		//const controlh = document.getElementById("playback__header");
		const controlHide = document.getElementById("playback__showBtn");
		const scanBtn = document.getElementById('settings__scanButton')

		if(userdata.lstpag) {
			ChangePageWithId(userdata.lstpag);
		} else {
			ChangePage(home);
		}

		if(userdata.ctrlop) {
			TogglePlayback();
		}

		var alb = [];
		var msc = [];

		cache.albums.forEach(album => {
			alb.push(album.name);
		})

		cache.musics.forEach(music => {
			msc.push(music.filename);
		})

		InsertList("settings__cacheSOList", settings.musicFolders);
		InsertList("settings__cacheTSList", cache.toscan, true);
		InsertList("settings__cacheMSList", msc, true);
		InsertList("settings__cacheABList", alb, true);
		InsertList("settings__cacheUFList", cache.u_favs, true);
		
		scanBtn.addEventListener('click', () => ScanAllMusics());
		homeBtn.addEventListener('click', () => {
			HidePlayback();
			ChangePage(home);
		});

		albumBtn.addEventListener('click', () => {
			HidePlayback();
			ChangePage(album);
		});

		artistBtn.addEventListener('click', () => {
			HidePlayback();
			ChangePage(artist);
		});

		optionsBtn.addEventListener('click', () => {
			HidePlayback();
			ChangePage(options);
			
		});

		controlHide.addEventListener('click', () => TogglePlayback());
	}
}

		



