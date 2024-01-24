const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist=[],pPtr=0,loop=0,contextData=null,vHandle;
const {
	GetUserData,
	WriteUserData,
	getFileB64,
	GetMetadata
} = require("./mapi.js");

const { 
	setupVisualizer
} = require("./visualizer.js");

const { 
	changeBarWidth,
	changeDiff,
	setArtist,
	setTitle
} = require("./graphics.js");

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

		function setThumb(value) {
			//playbackMImg.src = value;
			playbackImg.src = value;
			playbackBodyBg.style.backgroundImage = `url("${value.replace("\\", "/")}")`;
			playbackBodyBg.style.backgroundSize = "120vw";
			playbackBodyBg.style.backgroundPosition = "center";
			playbackBodyBg.style.filter = "blur(32px) brightness(0.6)";

			//visCanvas.style.backgroundImage = `url("${value}")`;
			//changeBackground(playbackImg);
			userdata.thumb = value;
		}

		function clearPlaylist() {
			InternalPlaylist = [];
			pPtr = -1;
			//updatePlaylistDisplay();
		}

		function addMusic(data) {
			data.i = InternalPlaylist.length;
			InternalPlaylist.push(data);
			//updatePlaylistDisplay();
		}

		function setMusic(i) {
			pPtr = i;
			playMusic(InternalPlaylist[i]);
		}

		function playMusic(data) {
			if(data == null) {
				console.error("Tried to play, but data was null: ", data);
				return;
			}
			changeMS(player, togglePause, data);
			var src = data.path;
			var thumbSrc = data.tags.image;
			if(player.currentSrc != src) {
				player.pause();
				player.src = src;
				player.load();
				player.currentTime = 0;
				//playbackLength.textContent = getTime(data.length);
				setThumb(thumbSrc);
				setTitle(data.tags.title);
				setArtist(data.tags.artist);
				togglePause();
				userdata.last_music_data = data;
				WriteUserData(userdata);
			}
			// pBodyAlbum.textContent = data.tags.album;
			// pBodyArtist.textContent = data.tags.artist;
			//PauseRPC();
			//SetRPC(data.tags.title, data.tags.artist, thumbSrc, data.tags.album);
			//StartRPC(0.001, data.length);
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
			console.log("Playing Next Music... ptr=", pPtr);
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
				//pause.setAttribute('title', "Pause");
				//pause.innerHTML = '<i class="gg-play-pause-r"></i>';
				//StartRPC(player.currentTime, InternalPlaylist[pPtr].length);
				return;
			}
			player.pause();
			//pause.setAttribute('title', "Play");
			//pause.innerHTML = '<i class="gg-play-button-r"></i>';
			//PauseRPC();
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
		
			_volume = Math.trunc(_volume);
			changeDiff(_volume);
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
			var w = vwTOpx(50);
			var h = vhTOpx(70);

			if(w > 1024) w = 1024;
			//if(h > 512) h = 512;
			visCanvas.width = w;
			visCanvas.height = h;

			changeBarWidth(Math.trunc(w/12), Math.trunc(w/28));
		}

		const pause = document.getElementById("playback__pause");
		const playbackPrev = document.getElementById("playback__before");
		const playbackNext = document.getElementById("playback__next");

		const cPlayNext = document.getElementById("context__playNext");

		const player = document.getElementById("player");
		const progressWrapper = document.getElementsByClassName("playback__progressWrapper")[0];
		const progressBody = document.getElementById("pBody__progress");
		const playbackBodyBg = document.getElementById("bg-img");
		const pBodyLength = document.getElementById("pBody__length");
		const pBodyTime = document.getElementById("pBody__time");
		const playbackImg = document.getElementById("playback__thumb");
		const playbackTitle = document.getElementById("playback__title");
		const visCanvas = document.getElementById("visualiz");
		const volumeSlider = document.getElementById("volumeSlider");
		const volumeText = document.getElementById("volume__text");
		const volumeToaster = document.getElementById("volume-toast");

		progressWrapper.addEventListener("click", (e) => {
			player.currentTime = player.duration*((e.clientX-progressWrapper.offsetLeft)/progressWrapper.offsetWidth);
		});
		
		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			//progress.style.width = `${percent}%`;
			progressBody.style.width = `${percent}%`;
			//progressHandle.style.left = `${percent}%`;
			//playbackTime.textContent = getTime(player.currentTime);
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = getTime(player.duration);
			userdata.playtime = player.currentTime;
			userdata.volume = player.volume;
			WriteUserData(userdata);
		});

		player.addEventListener("ended", () => {
			playNext();
		});
		
		vHandle = setupVisualizer(visCanvas, player);
		
		clearPlaylist();
		if(userdata.last_music_data != null) {
			addMusic(userdata.last_music_data);
			playNext();
		}
		
		setMusicVolume(userdata.volume*100 || 50);
		refreshVisSize();
		player.currentTime = userdata.playtime || 0;

		volumeToaster.addEventListener("animationend", () => {
			volumeToaster.classList.add("hidden");
		});

		document.onclick = hideMenu;
		cPlayNext.addEventListener("click", () => {

			addMusic(contextData);
		})

		window.addEventListener("resize", () => {
			refreshVisSize();
		});

		document.addEventListener("dragover", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});

		document.addEventListener("drop", (e) => {
			e.preventDefault();
			e.stopPropagation();
		    console.log(e.dataTransfer.files[0].path);
			var w = GetMetadata(e.dataTransfer.files[0].path, __dirname + "/cache/");
			playMusic(w);
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
				case "F5":
					e.preventDefault();
					ipcRenderer.send('refresh');
				default:
					console.log(e.key);
					break;
			}
		});
		
	}
	
}