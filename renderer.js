const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist=[],pPtr=toPlay=loop=optionOpn=0,contextData=null,vHandle,visCanvas,chiCanvas;
const {
	GetUserData,
	WriteUserData,
	getFileB64,
	GetMetadata,
	GetCache,
	WriteCache,
	gHistory,
	wHistory,
	GetJSONFromFile
} = require("./mapi.js");

const { 
	setupVisualizer
} = require("./visualizer.js");

const { 
	changeBarWidth,
	changeDiff,
	setArtist,
	setTitle,
	changeVisSize,
	setAlbum,
	Chibi,
	appendChibi,
	setNextTitle,
	chibis,
	cObject
} = require("./graphics.js");

const {
	changeMS
} = require("./msHandler.js")

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
		const cache = GetCache();
		const history = gHistory();

		function $(value) {
			return document.getElementById(value);
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
			playbackBodyBg.style.backgroundImage = `url("${playbackImg.src}")`;
			playbackBodyBg.style.backgroundSize = "120vw";
			playbackBodyBg.style.backgroundPosition = "center";
			playbackBodyBg.style.filter = "blur(32px) brightness(0.6)";

			//visCanvas.style.backgroundImage = `url("${value}")`;
			//changeBackground(playbackImg);
			cache.thumb = value;
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
				setAlbum(data.tags.album);
				cache.last_music_data = data;
				WriteCache(cache);
				if(userdata.playing || toPlay) {
					toPlay = 0;
					togglePause();
					if(history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`] == undefined) {
						history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`] = {};
						history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`]["timesPlayed"]=0;
						history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`]["path"]=data.path;
					}
					history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`]["path"]=data.path;
					history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`]["timesPlayed"]++;
					history[`${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`]["last_played"] = (new Date().getTime());
					history.totalPlay++;
				}
			}
			wHistory(history);
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
				userdata.playing = 1;
				//pause.setAttribute('title', "Pause");
				//pause.innerHTML = '<i class="gg-play-pause-r"></i>';
				//StartRPC(player.currentTime, InternalPlaylist[pPtr].length);
				return;
			}
			userdata.playing = 0;
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

		function sec2time(timeInSeconds) {
			var pad = function(num, size) { return ('000' + num).slice(size * -1); },
			time = parseFloat(timeInSeconds).toFixed(3),
			hours = Math.floor(time / 60 / 60),
			minutes = Math.floor(time / 60) % 60,
			seconds = Math.floor(time - minutes * 60),
			milliseconds = time.slice(-3);
		
			return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
		}

		function addChibi(folder) {
			var sprite = path.join(__dirname, `assets/sprites/${folder}/sprite.png`);
			var json = path.join(__dirname, `assets/sprites/${folder}/spriteInfo.json`);
			var chb = new Chibi(folder, sprite, GetJSONFromFile(json));
			chb.x = Math.round(Math.random() * (visCanvas.width - 1) + 1);
			
			var spriteB = path.join(__dirname, `assets/sprites/misc/speechBubble.png`);
			var jsonB = path.join(__dirname, `assets/sprites/misc/speechBubble.json`);

			var sbb = new cObject("speechBubble", spriteB, GetJSONFromFile(jsonB));
			chb.attachObject(sbb);
			appendChibi(chb);
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
		const playbackWin = document.getElementById("playback__window");
		visCanvas = document.getElementById("visualiz");
		const volumeSlider = document.getElementById("volumeSlider");
		const volumeText = document.getElementById("volume__text");
		const volumeToaster = document.getElementById("volume-toast");
		const test = document.getElementById("time");
		const formatSeconds = s => (new Date(s * 100)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];

		progressWrapper.addEventListener("click", (e) => {
			var r = progressWrapper.getBoundingClientRect();
			player.currentTime = player.duration*((e.clientX-r.x)/r.width);
		});

		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			progressBody.style.width = `${percent}%`;
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = getTime(player.duration);
			userdata.playtime = player.currentTime;
			userdata.volume = player.volume;
		});
		

		player.addEventListener("ended", () => {
			userdata.playing = 0;
			playNext();
		});

		
		
		vHandle = setupVisualizer(visCanvas, player);
		vHandle.setDecibels(-63, -27);
		vHandle.setSmoothing(0.2);
		vHandle.setFftSize(4096);
		vHandle.setMode(userdata.vis_mode, visCanvas);
		vHandle.setRefreshRate(60);
		vHandle.showWaveform = false;
		//vHandle.showChibis();

		addChibi("jolteon");
		addChibi("eevee");
		addChibi("vaporeon");
		addChibi("meowth");

		setTimeout(() => changeVisSize(visCanvas), 250);
		setInterval(() => {
			WriteUserData(userdata);
		}, 1000);
		
		setInterval(() => {
			if(userdata.playing) {
				userdata.totalTime += .1
				//(userdata.totalTime/10).toLocaleString('en-US', { minimumFractionDigits: 1 });
				$("settings__time").textContent = (Math.trunc(userdata.totalTime*10)/100).toLocaleString("en-US", {minimumFractionDigits: 2});
				$("settings__time").textContent = $("settings__time").textContent.replace(/,\s?/g, "");
			}
		}, 10);
		$("settings__time").textContent = "You've listened to music for " + userdata.totalTime + " while using this app";
		setMusicVolume(userdata.volume*100 || 50);
		clearPlaylist();
		if(cache.last_music_data != null) {
			addMusic(cache.last_music_data);
			playNext();
		}
		player.currentTime = userdata.playtime || 0;

		volumeToaster.addEventListener("animationend", () => {
			volumeToaster.classList.add("hidden");
		});

		document.onclick = hideMenu;
		$("option-btn").addEventListener("click", () => {
			$("settings__body").classList.toggle("hidden");
		});

		$("settings__body").addEventListener("click", (e) => {
			e.target.classList.toggle("hidden");
		});

		$("settings__wrapper").addEventListener("click", (e) => {
			//e.preventDefault();
			e.stopPropagation();
		});
		cPlayNext.addEventListener("click", () => {
			addMusic(contextData);
		});

		window.addEventListener("resize", () => {
			changeVisSize(visCanvas);
		});

		document.addEventListener("dragover", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});

		document.addEventListener("drop", (e) => {
			e.preventDefault();
			e.stopPropagation();
			var w = GetMetadata(e.dataTransfer.files[0].path, __dirname + "/cache/");
			console.log(w);
			toPlay = 1
			playMusic(w);
		});

		document.addEventListener("keydown", (e) => {
			
			switch(e.key) {
				case " ":
					e.preventDefault();
					togglePause();
					chibis.forEach((c) => {
						if(c.y + c.height + c.dy >= visCanvas.height) c.dy = -(Math.random() * (2.5 - 1) + 1 );
					});
					break;
				case "ArrowUp":
					e.preventDefault();
					setMusicVolume(player.volume*100 + 2);
					//vHandle.setDecibels(-55+(30*(player.volume-0.5)), -20+(30*(player.volume-0.5)));
					break;
				case "ArrowDown":
					e.preventDefault();
					setMusicVolume(player.volume*100 - 2);
					//vHandle.setDecibels(-55+(30*(player.volume-0.5)), -20+(30*(player.volume-0.5)));
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
		
		window.onbeforeunload = () => {
			ipcMain.removeAllListeners();
			WriteCache(cache);
			WriteUserData(userdata);
			wHistory(history);
		}
	}
}