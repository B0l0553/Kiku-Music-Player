const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist = [];
const {
	GetUserData,
	WriteUserData
} = require("./mapi.js");

const { 
	CreateVisualizer, 
	RefreshVisualizer,
	ChangeBarWidth
} = require("./visualizer.js");

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

		function $(value) {
			return document.getElementById(value);
		}

		function vwTOpx(value) {
			var w = window,
			  d = document,
			  e = d.documentElement,
			  g = d.getElementsByTagName('body')[0],
			  x = w.innerWidth || e.clientWidth || g.clientWidth;
		   
			var result = (x*value)/100;
			return(result);
		}

		function vhTOpx(value) {
			var w = window,
			  d = document,
			  e = d.documentElement,
			  g = d.getElementsByTagName('body')[0],
			  y = w.innerHeight|| e.clientHeight|| g.clientHeight;
		   
			var result = (y*value)/100;
			return(result);
		}

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
					FetchAlbum();
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

		function setTitle(value) {
			playbackMTitle.textContent = value;
			playbackTitle.textContent = value;

			if(playbackTitle.clientWidth > playbackTitle.parentElement.clientWidth) {
				var td = (playbackTitle.parentElement.clientWidth - playbackTitle.clientWidth)/window.innerWidth*100;
				var animation = `
				@keyframes animleftright {
					0%,
					20% {
						transform: translateX(0%);
					}
					80%,
					100% {
						transform: translateX(${td-4}vw);
					}
				}
				.prout {
					animation: animleftright 5s infinite alternate ease-in-out;
				}
				`
				$("styleMain").textContent = animation;
				playbackTitle.classList.value = "prout";
			} else {
				playbackTitle.classList.value = "";
			}
			if($("playback__mtC").clientWidth < playbackMTitle.clientWidth) {
				playbackMTitle.classList.add("animate");
			}
		}

		function setThumb(value) {
			playbackMImg.src = value;
			//playbackImg.src = value;
			visCanvas.style.backgroundImage = `url("${value}")`;
			userdata.thumb = value;
		}

		function PlayMusic(data) {
			
			var src = `http://localhost/musics/${data.hash}.${data.data.dataformat}`;
			if(player.currentSrc != src) {
				player.pause();
				player.src = src;
				player.load();
				playbackLength.textContent = getTime(data.length);
				setThumb(`http://localhost/covers/${data.cover_hash}`);
				setTitle(data.tags.title);
				userdata.last_played = src;
				userdata.duration = data.length;
				userdata.title = data.tags.title;
				userdata.thumb = playbackMImg.src;
				RefreshVisualizer(player);
			}
			pBodyAlbum.textContent = data.tags.album;
			pBodyArtist.textContent = data.tags.artist;
			TogglePause();
			
		}

		function CreateMusicLine(data) {
			let line = document.createElement('div');
			let title = document.createElement('div');
			let album = document.createElement('div');
			let artist = document.createElement('div');
			let length = document.createElement('div');

			line.classList.add("music__line");
			line.addEventListener('click', () => PlayMusic(data));
			title.textContent = data.tags.title;
			title.classList.add("item");
			album.textContent = data.tags.album;
			album.classList.add("item");
			artist.textContent = data.tags.artist;
			artist.classList.add("item");
			length.textContent = getTime(data.length);
			length.classList.add("item");

			line.appendChild(title);
			line.appendChild(album);
			line.appendChild(artist);
			line.appendChild(length);
			return line;
		}

		function createAlbumBox(data) {
			let box = document.createElement("div");
			let thumb = document.createElement("img");
			let info = document.createElement("div");
			let title = document.createElement("span");
			let artist = document.createElement("span");

			title.textContent = data.title;
			artist.textContent = data.artist;
			info.appendChild(title);
			info.appendChild(artist);
			box.appendChild(thumb);
			box.appendChild(info);
			return box;
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
						//console.log(res);
						for(let i = 0; i < res.length; i++) {
							wrapper.appendChild(CreateMusicLine(res[i]));
						}
					} else {
					}
				}
			};
			xhr.send(null);
		}

		function FetchAlbum(search = "") {
			let xhr = new XMLHttpRequest();
			xhr.open("GET", `http://localhost/search.php?JSON_DATA={"title":"${search}","type":"album"}`);
			xhr.setRequestHeader("Accept", "application/json");
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.onreadystatechange = function () {
				if(xhr.readyState === 4) {
					if(xhr.status === 200) {
						const res = JSON.parse(xhr.responseText);
						//console.log(res);
						for(let i = 0; i < res.length; i++) {
							wrapper.appendChild(createAlbumBox(res[i]));
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

		function MoveMusicTimestampTo(_time) {	
			if(_time > player.duration) {
				_time = player.duration;
			} else if(_time < 0) {
				_time = 0;
			}
		
			player.currentTime = _time;
		}

		function SetMusicVolume(_volume) {
			if(_volume < 0) _volume = 0;
			if(_volume > 100) _volume = 100;
		
			_volume = Math.floor(_volume);
		
			//vti.textContent = `${_volume}%`
			//vpi.style.width = `${_volume}%`
		
			player.volume = _volume/100;
		}

		function hideMenu() {
			document.getElementById("contextMenu")
					.style.display = "none"
		}
	  
		function rightClick(e) {
			e.preventDefault();
			var menu = document.getElementById("contextMenu")
			if (menu.style.display == "block") {
				menu.style.left = e.pageX + "px";
				menu.style.top = e.pageY + "px";
			} else {	  
				menu.style.display = 'block';
				menu.style.left = e.pageX + "px";
				menu.style.top = e.pageY + "px";
			}
		}

		function RefreshVisSize() {
			var w = vwTOpx(40);
			var h = vwTOpx(40);

			visCanvas.width = w;
			visCanvas.height = h;

			ChangeBarWidth(Math.floor(w/128))
			console.log("new size!")
			console.log("barWidth: ", Math.floor(w/96-.35));
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

		const player = document.getElementById("player");
		const pause = document.getElementById("playback__pause");
		const progressWrapper = document.getElementsByClassName("playback__progressWrapper")[0];
		const progress = document.getElementById("playbackProgress");
		const progressBody = document.getElementById("pBody__progress");
		//const progressHandle = document.getElementById("playbackHandle");
		const playbackLength = document.getElementById("playback__length");
		const playbackTime = document.getElementById("playback__time");
		const pBodyLength = document.getElementById("pBody__length");
		const pBodyTime = document.getElementById("pBody__time");
		const playbackMImg = document.getElementById("playback__minithumb");
		const playbackMTitle = document.getElementById("playback__minititle");
		const playbackImg = document.getElementById("playback__thumb");
		const playbackTitle = document.getElementById("playback__title");
		const pBodyAlbum = document.getElementById("pBody__album");
		const pBodyArtist = document.getElementById("pBody__artist");
		const visCanvas = document.getElementById("visualiz");
		
		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			progress.style.width = `${percent}%`;
			progressBody.style.width = `${percent}%`;
			//progressHandle.style.left = `${percent}%`;
			playbackTime.textContent = getTime(player.currentTime);
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = getTime(player.duration);
			userdata.playtime = player.currentTime;
			WriteUserData(userdata);
		});
		player.src = userdata.last_played;
		player.volume = userdata.volume || 0.5;
		player.load();
		CreateVisualizer(player, visCanvas);
		RefreshVisSize();
		player.currentTime = userdata.playtime;
		playbackLength.textContent = getTime(userdata.duration);
		pBodyLength.textContent = getTime(userdata.duration);
		setThumb(userdata.thumb);
		setTitle(userdata.title)
		
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

		document.oncontextmenu = rightClick;
		document.onclick = hideMenu;

		window.addEventListener("resize", () => {
			RefreshVisSize();
		});

		document.addEventListener("keydown", (e) => {
			
			switch(e.key) {
				case " ":
					e.preventDefault();
					TogglePause();
					break;
				case "ArrowUp":
					e.preventDefault();
					SetMusicVolume(player.volume*100 + 10);
					break;
				case "ArrowDown":
					e.preventDefault();
					SetMusicVolume(player.volume*100 - 10);
					break;
				case "ArrowLeft":
					e.preventDefault();
					MoveMusicTimestampTo(player.currentTime - 10);
					break;
				case "ArrowRight":
					e.preventDefault();
					MoveMusicTimestampTo(player.currentTime + 10);
					break;
				default:
					console.log(e.key);
					break;
			}
		})
	}
}