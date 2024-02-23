const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist=[],pPtr=toPlay=loop=optionOpn=0,contextData=null,vHandle,visCanvas;
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
			ipcRenderer.send("close", [userdata, cache, history]);
		});
		
		document.getElementById('refresh-button').addEventListener("click", () => {
			ipcRenderer.send('refresh', [userdata, cache, history]);
		});

		const userdata = GetUserData();
		const cache = GetCache();
		const history = gHistory();

		function $(value) {
			return document.getElementById(value);
		}

		function createMPWrapper(data) {
			var wtt = document.createElement("div");
			wtt.textContent = data.tags.title;
			var wal = document.createElement("div");
			wal.textContent = data.tags.album;
			var wat = document.createElement("div");
			wat.textContent = data.tags.artist;
			var wtm = document.createElement("div");
			wtm.textContent = data.tags.length;
			var inf = document.createElement("div");

			inf.appendChild(wtt);
			inf.appendChild(wal);
			inf.appendChild(wat);
			inf.appendChild(wtm);
			inf.classList.add("playlist__music-info")

			var ico = document.createElement("img");
			ico.src = data.tags.image;

			var twr = document.createElement("div");
			twr.classList.add("playlist__music");
			twr.appendChild(ico);
			twr.appendChild(inf);

			var bg = document.createElement("div");
			bg.style.background = `url("${ico.src}")`;
			bg.classList.add("playlist__music-wrapper");
			bg.appendChild(twr);
			bg.onclick = () => {
				setMusic(data.i);
			}
			return bg;
		}

		function setThumb(value) {
			playbackImg.src = value;
			playbackBodyBg.style.backgroundImage = `url("${playbackImg.src}")`;
			playbackBodyBg.style.backgroundSize = "120vw";
			playbackBodyBg.style.backgroundPosition = "center";
			playbackBodyBg.style.filter = "blur(32px) brightness(0.6)";
			cache.thumb = value;
		}

		function clearPlaylist() {
			InternalPlaylist = [];
			resetPointer();
			$("playlist__wrapper").textContent = "";
		}

		function addMusic(data) {
			data.i = InternalPlaylist.length;
			InternalPlaylist.push(data);
			$("playlist__wrapper").appendChild(createMPWrapper(data));
		}

		function setMusic(i) {
			if(i == pPtr || i > InternalPlaylist.length-1 || i < 0) return;
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
		
		function playCurrent() {
			if(pPtr < InternalPlaylist.length-1 && pPtr >= 0) {
				playMusic(InternalPlaylist[pPtr]);
			} else {
				resetPointer();
				playMusic(InternalPlaylist[pPtr]);
			}
		}

		function resetPointer() {
			pPtr = 0;
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
				$("control__pause").classList.value = "gg-play-pause";
				//StartRPC(player.currentTime, InternalPlaylist[pPtr].length);
				return;
			}
			userdata.playing = 0;
			player.pause();
			$("control__pause").classList.value = "gg-play-button";
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
			showVToaster();
			volumeSlider.style.width = `${_volume}%`
			volumeText.textContent = `${_volume}%`
			player.volume = _volume/100;
			vHandle.setDecibels((player.volume) * (-50 + 66.3) - 66.3, (player.volume) * (-20 + 30) - 32);
		}

		function showVToaster() {
			volumeToaster.classList.remove("hideAnim");
			volumeToaster.classList.remove("hidden");
			volumeToaster.getAnimations().forEach(i => { i.cancel() });
			volumeToaster.classList.add("hideAnim");
		}

		function hideMenu() {
			document.getElementById("contextMenu").style.display = "none"
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

		const playlistBody = $("playlist__body");
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
			toPlay = 1;
			playNext();
		});
		
		vHandle = setupVisualizer(visCanvas, player);
		vHandle.setDecibels(-63, -27);
		vHandle.setSmoothing(0.2);
		vHandle.setFftSize(4096);
		vHandle.setMode(userdata.vis_mode, visCanvas);
		vHandle.setRefreshRate(60);
		vHandle.showWaveform = userdata.wave_show;
		if(userdata.showchibi) {
			vHandle.showChibis();
		}

		addChibi("jolteon");
		addChibi("eevee");
		addChibi("vaporeon");
		addChibi("meowth");

		setTimeout(() => changeVisSize(visCanvas), 250);
		setInterval(() => {
			WriteUserData(userdata);
		}, 10000);
		
		setInterval(() => {
			if(userdata.playing) {
				userdata.totalTime += .1
				//(userdata.totalTime/10).toLocaleString('en-US', { minimumFractionDigits: 1 });
				// $("settings__time").textContent = (Math.trunc(userdata.totalTime*10)/100).toLocaleString("en-US", {minimumFractionDigits: 2});
				// $("settings__time").textContent = $("settings__time").textContent.replace(/,\s?/g, "");
			}
		}, 10);
		// $("settings__time").textContent = "You've listened to music for " + userdata.totalTime + " while using this app";
		setMusicVolume(userdata.volume*100 || 50);
		clearPlaylist();
		console.log(cache.last_music_data.length)
		if(cache.last_music_data != 0) {
			addMusic(cache.last_music_data);
			playCurrent();
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

		$("control__pause").addEventListener("click", (e) => {
			e.stopPropagation();
			togglePause();
		});

		$("control__prev").addEventListener("click", (e) => {
			e.stopPropagation();
			playPrevious();
		});

		$("control__next").addEventListener("click", (e) => {
			e.stopPropagation();
			playNext();
		});

		$("playlist__header").addEventListener("click", (e) => {
			e.stopPropagation();
			playlistBody.classList.toggle("hide");
			$("playlist__header").classList.toggle("hide");
		})

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

			clearPlaylist();

			for(let i = 0; i < e.dataTransfer.files.length; i++) {
				var w = GetMetadata(e.dataTransfer.files[i].path);
				console.log("added " + w);
				addMusic(w);
			}

			toPlay = 1
			
			playCurrent();
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
					break;
				case "ArrowDown":
					e.preventDefault();
					setMusicVolume(player.volume*100 - 2);
					break;
				case "ArrowLeft":
					e.preventDefault();
					moveMusicTimestampTo(player.currentTime - 10);
					if(e.shiftKey) {
						playPrevious();
					}
					break;
				case "ArrowRight":
					e.preventDefault();
					if(e.shiftKey) {
						playNext();
					} else {
						moveMusicTimestampTo(player.currentTime + 10);
					}
					break;
				case "F5":
					e.preventDefault();
					ipcRenderer.send('refresh');
				default:
					break;
			}
		});
		
		window.onbeforeunload = () => {
			ipcMain.removeAllListeners();
		}
	}
}