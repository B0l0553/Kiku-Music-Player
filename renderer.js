const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
const {
	SetRPC,
	StartRPC,
	PauseRPC
} = require("./rpcApi.js")
let InternalPlaylist=[],pPtr=0,loop=0,contextData=null;
const {
	GetUserData,
	WriteUserData,
	getFileB64
} = require("./mapi.js");

const { 
	CreateVisualizer, 
	RefreshVisualizer,
	ChangeBarWidth,
	ChangeMode,
	ChangeDiff,
	changeCursorCoords,
} = require("./visualizer.js");

const {
	changeMS
} = require("./msHandler.js")

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

		function clearWrapper() {
			wrapper.textContent = "";
		}
		
		function changePageWithId(_id) {
			clearWrapper();
			switch(_id) {
				case "home":
					pageTitle.textContent = "HOME"
					//FetchHome();
					break;
				case "music":
					pageTitle.textContent = "MUSICS"
					fetchMusic();
					break;
				case "album":
					pageTitle.textContent = "ALBUMS"
					fetchAlbum();
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
		
		function togglePlayback() {
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

		function hidePlayback() {
			if(userdata.playback_open === true) {
				togglePlayback();
			}
		}

		function insertList(_element, _list, _basename = false) {
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

		function deleteFromListWithValue(_list, _value) {
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

		function clearPlaylist() {
			InternalPlaylist = [];
			pPtr = -1;
			updatePlaylistDisplay();
		}

		function addMusic(data) {
			data.i = InternalPlaylist.length;
			InternalPlaylist.push(data);
			updatePlaylistDisplay();
		}

		function setMusic(i) {
			pPtr = i;
			playMusic(InternalPlaylist[i]);
		}

		//! Why did I do this, this is fundamentaly flawed wtf ???
		//FML mannn
		function playMusic(data) {
			if(data == null) {
				console.error("Tried to play, but data was null");
				return;
			}
			changeMS(player, togglePause, data);
			var src = `http://localhost/serveMusic.php?hash=${data.hash}.${data.data.dataformat}`;
			var thumbSrc = `http://localhost/covers/${data.cover_hash}`;
			if(player.currentSrc != src) {
				player.pause();
				player.src = src;
				player.load();
				player.currentTime = 0;
				playbackLength.textContent = getTime(data.length);
				setThumb(thumbSrc);
				setTitle(data.tags.title);
				RefreshVisualizer(player);
				togglePause();
				userdata.last_music_data = data;
				WriteUserData(userdata);
			}
			pBodyAlbum.textContent = data.tags.album;
			pBodyArtist.textContent = data.tags.artist;
			PauseRPC();
			SetRPC(data.tags.title, data.tags.artist, thumbSrc, data.tags.album);
			StartRPC(0.001, data.length);
		}

		function playPrevious() {
			if(pPtr == 0) {
				console.log("ptr at zero")
				moveMusicTimestampTo(0);
			} else {
				playMusic(InternalPlaylist[--pPtr])
			}
		}

		function playNext() {
			console.log("Playing Next Music... preincremented ptr=", pPtr);
			if(pPtr < InternalPlaylist.length-1) {
				playMusic(InternalPlaylist[++pPtr]);
			}
		}

		function updatePlaylistDisplay() {
			console.log("Updating Playlist display with new playlist: ", InternalPlaylist);
			playbackPlaylistDisplay.textContent = "";
			InternalPlaylist.forEach(music => {
				playbackPlaylistDisplay.appendChild(createPlaylistLine(music));
			})
		}

		function createPlaylistLine(data) {
			let line = document.createElement('div');
			let title = document.createElement('div');
			let length = document.createElement('div');
			line.classList.add("playlist__line");
			line.addEventListener('click', () => setMusic(data.i));
			title.textContent = data.tags.title;
			title.classList.add("item");
			length.textContent = getTime(data.length);
			length.classList.add("item");
			line.appendChild(title);
			line.appendChild(length);
			return line;
		}

		function createMusicLine(data) {
			let line = document.createElement('div');
			let title = document.createElement('div');
			let album = document.createElement('div');
			let artist = document.createElement('div');
			let length = document.createElement('div');

			line.classList.add("music__line");
			line.addEventListener('click', () => {
				clearPlaylist();
				addMusic(data);
				playNext();

			} );
			line.addEventListener('contextmenu', (e) => rightClick(e, data));

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
			let title = document.createElement("span");
			let artist = document.createElement("span");

			title.textContent = data.title;
			artist.textContent = data.artist;
			thumb.src = "http://localhost/covers/" + data.cover;
			title.classList.add("album__text");
			artist.classList.add("album__text");
			thumb.classList.add("album__thumb");
			box.classList.add("album__box");
			box.appendChild(thumb);
			box.appendChild(title);
			box.appendChild(artist);
			return box;
		}

		// je veux mourir
		function fetchMusic(search = "") {
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
							wrapper.appendChild(createMusicLine(res[i]));
						}
					}
				}
			};
			xhr.send(null);
		}

		function fetchAlbum(search = "") {
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

		function togglePause() {
			if(player.paused) {
				if(player.currentSrc == null) {
					playNext();
					return;
				}
				player.play();
				pause.setAttribute('title', "Pause");
				pause.innerHTML = '<i class="gg-play-pause-r"></i>';
				StartRPC(player.currentTime, InternalPlaylist[pPtr].length);
				return;
			}
			player.pause();
			pause.setAttribute('title', "Play");
			pause.innerHTML = '<i class="gg-play-button-r"></i>';
			PauseRPC();
		}

		function moveMusicTimestampTo(_time) {	
			if(_time > player.duration) {
				_time = player.duration;
			} else if(_time < 0) {
				_time = 0;
			}
		
			player.currentTime = _time;
		}

		function setMusicVolume(_volume) {
			if(_volume < 0) _volume = 0;
			if(_volume > 100) _volume = 100;
		
			_volume = Math.floor(_volume);
			ChangeDiff(_volume);
			showVToaster();
			volumeSlider.style.width = `${_volume}%`
			volumeText.textContent = `${_volume}%`
			player.volume = _volume/100;
		}

		function showVToaster() {
			volumeToaster.classList.remove("hideAnim");
			volumeToaster.classList.remove("hidden");
			volumeToaster.getAnimations().forEach(i => { i.cancel() });
			//volumeToaster.classList.toggle("show");
			volumeToaster.classList.add("hideAnim");
		}

		function hideMenu() {
			document.getElementById("contextMenu")
					.style.display = "none"
		}
	  
		function rightClick(e, data) {
			e.preventDefault();
			contextData = data;
			console.log("Recorded context data");
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

		function refreshVisSize() {
			var w = vwTOpx(40);
			var h = vwTOpx(40);

			if(w > 600) w = 600;
			if(h > 600) h = 600;

			visCanvas.width = w;
			visCanvas.height = h;

			ChangeBarWidth(Math.floor(w/86));
		}

		const homeBtn = document.getElementById("home-btn");
		const musicBtn = document.getElementById("music-btn");
		const albumBtn = document.getElementById("album-btn");
		const artistBtn = document.getElementById("artist-btn");
		const optionsBtn = document.getElementById("option-btn");

		const controls = document.getElementById("playback__wrapper");
		//const controlh = document.getElementById("playback__header");
		const controlHide = document.getElementById("playback__showBtn");
		
		const pageTitle = document.getElementById("page__title");
		const pageWrapper = document.getElementById("page__wrapper");
		const wrapper = document.getElementById('inside__wrapper');

		const pause = document.getElementById("playback__pause");
		const playbackPrev = document.getElementById("playback__before");
		const playbackNext = document.getElementById("playback__next");

		const cPlayNext = document.getElementById("context__playNext");

		const player = document.getElementById("player");
		const progressWrapper = document.getElementsByClassName("playback__progressWrapper")[0];
		const progressBodyWrapper = document.getElementsByClassName("playback__progressWrapper")[1];
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
		const playbackPlaylistDisplay = document.getElementById("playback__playlist");
		const pBodyAlbum = document.getElementById("pBody__album");
		const pBodyArtist = document.getElementById("pBody__artist");
		const visCanvas = document.getElementById("visualiz");
		const cRect = visCanvas.getBoundingClientRect();
		const volumeSlider = document.getElementById("volumeSlider");
		const volumeText = document.getElementById("volume__text");
		const volumeToaster = document.getElementById("volume-toast");

		progressWrapper.addEventListener("click", (e) => {
			player.currentTime = player.duration*((e.clientX-progressWrapper.offsetLeft)/vwTOpx(40));
		});

		progressBodyWrapper.addEventListener("click", (e) => {
			player.currentTime = player.duration*((e.clientX-progressBodyWrapper.offsetLeft)/progressBodyWrapper.offsetWidth);
		});
		
		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			progress.style.width = `${percent}%`;
			progressBody.style.width = `${percent}%`;
			//progressHandle.style.left = `${percent}%`;
			playbackTime.textContent = getTime(player.currentTime);
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = getTime(player.duration);
			userdata.playtime = player.currentTime;
			userdata.volume = player.volume;
			WriteUserData(userdata);
		});

		player.addEventListener("ended", () => {
			//togglePause();
			playNext();
		});
		
		CreateVisualizer(player, visCanvas);
		/*if(userdata.last_music_data != null)
			addMusic(userdata.last_music_data);*/
		
		clearPlaylist();
		if(userdata.last_music_data != null) {
			addMusic(userdata.last_music_data);
			playNext();
		}
		
		setMusicVolume(userdata.volume*100 || 50);
		refreshVisSize();
		player.currentTime = userdata.playtime || 0;
		
		if(userdata.last_page) {
			changePageWithId(userdata.last_page);
		} else {
			changePageWithId("home");
		}

		if(userdata.playback_open) {
			togglePlayback();
		}

		homeBtn.addEventListener('click', () => {
			hidePlayback();
			
			if(userdata.last_page != "home") {
				changePageWithId("home");
			}
		});

		playbackPrev.addEventListener('click', () => {
			playPrevious();
		});

		playbackNext.addEventListener('click', () => {
			playNext();
		});

		musicBtn.addEventListener('click', () => {
			hidePlayback();
			if(userdata.last_page != "music") {
				changePageWithId("music");
			}
		});

		albumBtn.addEventListener('click', () => {
			hidePlayback();
			if(userdata.last_page != "album") {
				changePageWithId("album");
			}
		});

		artistBtn.addEventListener('click', () => {
			hidePlayback();
			if(userdata.last_page != "artist") {
				changePageWithId("artist");
			}
		});

		optionsBtn.addEventListener('click', () => {
			hidePlayback();
			if(userdata.last_page != "option") {
				changePageWithId("option");
			}
		});

		pause.addEventListener("click", () => {
			togglePause();
		});

		controlHide.addEventListener('click', () => togglePlayback());

		volumeToaster.addEventListener("animationend", () => {
			volumeToaster.classList.add("hidden");
		});

		//visCanvas.addEventListener('mousemove', (e) => changeCursorCoords(e.clientX-358, e.y));
		//visCanvas.addEventListener('mouseout', (e) => changeCursorCoords(-1, -1));

		document.onclick = hideMenu;
		cPlayNext.addEventListener("click", () => {

			addMusic(contextData);
		})

		window.addEventListener("resize", () => {
			refreshVisSize();
		});

		document.addEventListener("keydown", (e) => {
			
			switch(e.key) {
				case " ":
					e.preventDefault();
					togglePause();
					break;
				case "ArrowUp":
					e.preventDefault();
					setMusicVolume(player.volume*100 + 2);
					break;
				case "ArrowDown":
					e.preventDefault();
					setMusicVolume(player.volume*100 - 2);
					break;
				case "ArrowLeft":
					e.preventDefault();
					moveMusicTimestampTo(player.currentTime - 10);
					break;
				case "ArrowRight":
					e.preventDefault();
					moveMusicTimestampTo(player.currentTime + 10);
					break;
				default:
					console.log(e.key);
					break;
			}
		});
	}
}