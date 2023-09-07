const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist = [];
const {
	GetUserData,
	WriteUserData
} = require("./mapi.js");

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
		console.log(userdata);

		function ClearWrapper() {
			wrapper.textContent = "";
		}
		
		function ChangePageWithId(_id) {
			ClearWrapper();
			switch(_id) {
				case "home":
					pageTitle.textContent = "HOME"
					//FetchHome();
					break;
				case "music":
					pageTitle.textContent = "MUSICS"
					FetchMusic();
					break;
				case "album":
					pageTitle.textContent = "ALBUMS"
					//FetchAlbum();
					break;
				case "artist":
					pageTitle.textContent = "ARTISTS"
					break;
				case "option":
					break;
				default:
					pageTitle.textContent = "HOME"
					//FetchHome();
					break;
			}

			userdata.last_page = _id;
			WriteUserData(userdata);
		}
		
		function TogglePlayback() {
			controls.classList.toggle("hide");
			userdata.playback_open = !controls.classList.contains("hide");
		
			if(userdata.playback_open) {
				controlHide.setAttribute('title', "Close Playback");
				controlHide.innerHTML = '<i class="gg-arrow-down-r"></i>';
				progress.classList.toggle("hidden");
				progressWrapper.classList.toggle("hidden");
				playbackLength.classList.toggle("hidden");
				playbackTime.classList.toggle("hidden");
				playbackMImg.classList.toggle("hidden");
				playbackMTitle.classList.toggle("hidden");
			} else {
				controlHide.setAttribute('title', "Close Playback");
				controlHide.innerHTML = '<i class="gg-arrow-up-r"></i>';
				progress.classList.toggle("hidden");
				progressWrapper.classList.toggle("hidden");
				playbackLength.classList.toggle("hidden");
				playbackTime.classList.toggle("hidden");
				playbackMImg.classList.toggle("hidden");
				playbackMTitle.classList.toggle("hidden");
			}
		
			WriteUserData(userdata);
		}

		function HidePlayback() {
			if(userdata.playback_open === true) {
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

		function CreateMusicLine(data) {
			let line = document.createElement('div');
			let title = document.createElement('div');
			let artist = document.createElement('div');
			let length = document.createElement('div');

			line.classList.add("music__line");
			line.addEventListener('click', () => {
				player.pause();
				player.src = `http://localhost/musics/${data.hash}.${data.data.dataformat}`;
				playbackLength.textContent = getTime(data.length);
				playbackMImg.src = `http://localhost/covers/${data.cover_hash}`;
				playbackMTitle.textContent = data.tags.title;
				TogglePause();
				userdata.last_played = `http://localhost/musics/${data.hash}.${data.data.dataformat}`;
				userdata.duration = data.length;
				userdata.title = data.tags.title;
				userdata.thumb = playbackMImg.src;

			});
			title.textContent = data.tags.title;
			title.classList.add("item");
			artist.textContent = data.tags.artist;
			artist.classList.add("item");
			length.textContent = getTime(data.length);
			length.classList.add("item");

			line.appendChild(title);
			line.appendChild(artist);
			line.appendChild(length);
			return line;
		}

		function FetchMusic(search = "") {
			let xhr = new XMLHttpRequest();
			xhr.open("GET", `http://localhost/search.php?JSON_DATA={"title":"${search}"}`);
			xhr.setRequestHeader("Accept", "application/json");
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.onreadystatechange = function () {
				if(xhr.readyState === 4) {
					if(xhr.status === 200) {
						const res = JSON.parse(xhr.responseText);
						console.log(res);
						for(let i = 0; i < res.length; i++) {
							wrapper.appendChild(CreateMusicLine(res[i]));
						}
					} else {
					}
				}
			};
			xhr.send(null);
		}

		function getTime(s) {
			var m = Math.floor(s/60);
			var s = Math.floor(s%60);
			return `${m.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:${s.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
		}

		function TogglePause() {
			if(player.paused && player.currentSrc != null) {
				player.play();
				pause.setAttribute('title', "Pause");
				pause.innerHTML = '<i class="gg-play-pause-r"></i>';
				return;
			}
			player.pause();
			pause.setAttribute('title', "Play");
			pause.innerHTML = '<i class="gg-play-button-r"></i>';
		}

		const homeBtn = document.getElementById("home-btn");
		const musicBtn = document.getElementById("music-btn");
		const albumBtn = document.getElementById("album-btn");
		const artistBtn = document.getElementById("artist-btn");
		const optionsBtn = document.getElementById("option-btn");

		const controls = document.getElementById("playback__wrapper");
		//const controlh = document.getElementById("playback__header");
		const controlHide = document.getElementById("playback__showBtn");
		
		const pageTitle = document.getElementById("page__title")
		const pageWrapper = document.getElementById("page__wrapper");
		const wrapper = document.getElementById('inside__wrapper')


		const player = document.createElement("audio");
		const pause = document.getElementById("playback__pause");
		const progressWrapper = document.getElementsByClassName("playback__progressWrapper")[0];
		const progress = document.getElementById("playbackProgress");
		//const progressHandle = document.getElementById("playbackHandle");
		const playbackLength = document.getElementById("playback__length");
		const playbackTime = document.getElementById("playback__time");
		const playbackMImg = document.getElementById("playback__minithumb");
		const playbackMTitle = document.getElementById("playback__minititle");
		const playbackImg = document.getElementById("playback__thumb");
		const playbackTitle = document.getElementById("playback__title");
		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			progress.style.width = `${percent}%`;
			//progressHandle.style.left = `${percent}%`;
			playbackTime.textContent = getTime(player.currentTime);
			userdata.playtime = player.currentTime;
			WriteUserData(userdata);
		});
		player.volume = userdata.volume || 0.5;
		player.src = userdata.last_played;
		player.currentTime = userdata.playtime || 0;
		playbackLength.textContent = getTime(userdata.duration);
		playbackMImg.src = userdata.thumb || ""
		playbackImg.src = userdata.thumb || ""
		playbackMTitle.textContent = userdata.title || "NO SONG"
		playbackTitle.textContent = userdata.title || "NO SONG"
		
		if(userdata.last_page) {
			ChangePageWithId(userdata.last_page);
		} else {
			ChangePageWithId("home");
		}

		if(userdata.playback_open) {
			TogglePlayback();
		}
	
		homeBtn.addEventListener('click', () => {
			HidePlayback();
			
			if(userdata.last_page != "home") {
				ChangePageWithId("home");
			}
		});

		musicBtn.addEventListener('click', () => {
			HidePlayback();
			if(userdata.last_page != "music") {
				ChangePageWithId("music");
			}
		});

		albumBtn.addEventListener('click', () => {
			HidePlayback();
			if(userdata.last_page != "album") {
				ChangePageWithId("album");
			}
		});

		artistBtn.addEventListener('click', () => {
			HidePlayback();
			if(userdata.last_page != "artist") {
				ChangePageWithId("artist");
			}
		});

		optionsBtn.addEventListener('click', () => {
			HidePlayback();
			if(userdata.last_page != "option") {
				ChangePageWithId("option");
			}
		});

		pause.addEventListener("click", () => {
			TogglePause();
		});

		controlHide.addEventListener('click', () => TogglePlayback());
	}
}

		



