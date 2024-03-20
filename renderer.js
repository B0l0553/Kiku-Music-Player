const VERSION = "0.4.72"

const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist=[],pPtr=toPlay=loop=optionOpn=tMinus=announce=0,contextData=null,vHandle,visCanvas,keys={};


const {
	GetUserData,
	WriteUserData,
	getFileB64,
	GetMetadata,
	GetCache,
	WriteCache,
	gHistory,
	wHistory,
	GetJSONFromFile,
	aCache
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
	cObject,
	desp,
	setSVGFilter,
	setBackground,
} = require("./graphics.js");

const {
	changeMS
} = require("./msHandler.js")

function openLink(link) {
	require("electron").shell.openExternal(link);
}

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
		redrawHistory();

		function $(value) {
			return document.getElementById(value);
		}

		function createMPWrapper(data) {

			var body = `
			<div class="playlist__music">
				<img draggable="false" src="${data.tags.image}" />
				<div class="playlist__music-info">
					<div>${data.tags.title}</div>
					<div>${data.tags.album}</div>
					<div>${data.tags.artist}</div>
				</div>
			</div>`;

			var bg = document.createElement("div");
			bg.style.background = `url("${encodeURI(data.tags.image.replaceAll("\\", "/"))}")`;
			bg.style.backgroundPosition = "center";
			bg.classList.add("playlist__music-wrapper");
			bg.innerHTML = body;
			bg.onclick = () => {
				setMusic(data.i);
			}
			return bg;
		}

		function createMHItem(data) {
			var body = `
			<div class="playlist__music">
				<img draggable="false" src="${data.image}" />
				<div class="playlist__music-info">
					<div>${data.title}</div>
					<div>${data.album}</div>
					<div>${data.artist}</div>
				</div>
			</div>`;

			var bg = document.createElement("div");
			bg.style.background = `url("${encodeURI(data.image.replaceAll("\\", "/"))}")`;
			bg.style.backgroundPosition = "center";
			bg.classList.add("playlist__music-wrapper");
			bg.innerHTML = body;
			bg.onclick = () => {
				(async () => { 
					if(`file:///${data.path.replaceAll("\\", "/")}` == decodeURI(player.src)) return;
					var w = GetMetadata(data.path);
					clearPlaylist();
					addMusic(w);
					toPlay=1;
					playCurrent();
				})();
			}
			bg.onauxclick = () => {
				(async () => { 
					var w = GetMetadata(data.path);
					addMusic(w);
				})();
			}
			return bg;
		}

		function createVOChoice(mode) {
			let bg = document.createElement("div");
			bg.style.backgroundImage = `url("${path.join(__dirname, "assets/images/" + mode + ".png").replaceAll("\\", "/")}")`;
			bg.classList.add("mode__option");
			bg.onclick = (e) => {
				e.stopPropagation();
				vHandle.setMode(mode);
				userdata.settings.vis_mode = mode;
			}
			return bg;
		}

		function updateHistory(data) {
			var mthn = `${data.tags.title.toLowerCase()}-${data.tags.artist.toLowerCase()}`; 
			if(history[mthn] == undefined) {
				history[mthn] = {};
				history[mthn]["timesPlayed"]=0;
				history[mthn]["path"]=data.path;
				history[mthn]["title"]=data.tags.title;
				history[mthn]["artist"]=data.tags.artist;
				history[mthn]["album"]=data.tags.album;
				history[mthn]["image"]=data.tags.image;
			}
			history[mthn]["timesPlayed"]++;
			history[mthn]["last_played"] = (new Date().getTime());
			wHistory(history);
			redrawHistory();
		}

		function redrawHistory() {
			$("history__wrapper").textContent = "";
			let d = [];
			for (const [key, value] of Object.entries(history)) {
				//$("history__wrapper").appendChild(createMHItem(history[key]))
				d.push(value);
			}
			let sorted = d.sort((a, b) => b.last_played - a.last_played);
			for(let i = 0; i < sorted.length; i++) {
				$("history__wrapper").appendChild(createMHItem(sorted[i]));
			}
		}

		function setThumb(value) {
			const iu = value.replaceAll("\\", "/");
			playbackImg.style.backgroundImage = `url("${iu}")`;
			// playbackBodyBg.src = playbackImg.src;
			playbackBodyBg.style.backgroundImage = `url("${iu}")`;
			playbackBodyBg.style.backgroundSize = "120vw";
			playbackBodyBg.style.backgroundRepeat = "no-repeat";
			playbackBodyBg.style.backgroundPosition = "center";
			playbackBodyBg.style.filter = "brightness(0.7) blur(16px)";
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
			cache.currentPlaylist = InternalPlaylist;
			cache.pLen = InternalPlaylist.length;
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
				player.currentTime = 1e-3;
				//playbackLength.textContent = getTime(data.length);
				setThumb(thumbSrc);
				setTitle(data.tags.title);
				setArtist(data.tags.artist);
				setAlbum(data.tags.album);
				cache.cPtr = pPtr;
				WriteCache(cache);
				if(userdata.playing || toPlay) {
					toPlay = 0;
					togglePause();
					updateHistory(data)
				}
			}
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
			if(pPtr < InternalPlaylist.length-1) {
				playMusic(InternalPlaylist[++pPtr]);
				return true;
			}
			return false;
		}
		
		function playCurrent() {
			if(pPtr < InternalPlaylist.length && pPtr >= 0) {
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
				vHandle.startRender();
				vHandle.setRefreshRate(userdata.settings.vis_refresh_rate);
				$("control__pause").src = path.join(__dirname, "assets/icons/audio-pause.svg")
				return;
			}
			userdata.playing = 0;
			player.pause();
			// vHandle.setRefreshRate(20);
			vHandle.breakRender = true;
			$("control__pause").src = path.join(__dirname, "assets/icons/audio-play.svg")
		}

		function moveMusicTimestampTo(_time) {	
			if(_time > player.duration) {
				_time = player.duration;
			} else if(_time < 0) {
				_time = 0;
			}
		
			player.currentTime = _time;
		}

		function setMusicVolume(_volume, _show = true) {
			if(_volume < 0) _volume = 0;
			if(_volume > 100) _volume = 100;
		
			_volume = Math.trunc(_volume);
			if(_show) showVToaster();
			volumeSlider.style.width = `${_volume}%`
			volumeText.textContent = `${_volume}%`
			player.volume = _volume/100;
			vHandle.setDecibels((player.volume) * (-35 + 66.3) - 66.3, (player.volume) * (-15 + 30) - 32);
		}

		function showVToaster() {
			volumeToaster.classList.remove("hideAnim");
			volumeToaster.classList.remove("hidden");
			volumeToaster.getAnimations().forEach(i => { i.cancel() });
			volumeToaster.classList.add("hideAnim");
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

		function setupSettings() {
			(async () => { 
				var dvcs = await navigator.mediaDevices.enumerateDevices();
				dvcs.forEach((device) => {
					if(device.kind === "audiooutput") {
						if(device.deviceId != "default" && device.deviceId != "communications") {
							$("audio-output__select").innerHTML += `<option value="${device.deviceId}" ${userdata.settings.outputId == device.deviceId ? "selected" : ""}>${device.label}</option>`;
						}
					}
				});
			})();
			$("audio-output__select").onchange = (e) => {
				vHandle.setAudioOutput(e.target.value);
				userdata.settings.outputId = e.target.value;
			}

			let vms = $("visualiser__modeSelector");
			vms.appendChild(createVOChoice("none"));
			vms.appendChild(createVOChoice("bezier"));
			vms.appendChild(createVOChoice("fBezier"));
			vms.appendChild(createVOChoice("bBezier"));
			vms.appendChild(createVOChoice("oFBezier"));
			
			$("bouncingBackground__input").checked = userdata.settings.bcng_bg;
			$("bouncingBackground__input").onchange = (e) => {
				userdata.settings.bcng_bg = e.target.checked;
				vHandle.bouncingBackground = e.target.checked;
			}

			$("shwWaveform__input").checked = userdata.settings.wave_show;
			$("shwWaveform__input").onchange = (e) => {
				userdata.settings.wave_show = e.target.checked;
				vHandle.showWaveform = e.target.checked;
			}

			let rrs = $("vis-refresh__select");
			rrs.childNodes.forEach((node) => {
				if(node.value == userdata.settings.vis_refresh_rate) {
					node.selected = true;
				}
			});

			rrs.onchange = (e) => {
				userdata.settings.vis_refresh_rate = Number.parseInt(e.target.value);
				vHandle.setRefreshRate(e.target.value);
			}

		}

		const playlistBody = $("playlist__body");
		const player = document.getElementById("player");
		const progressWrapper = document.getElementsByClassName("playback__progressWrapper")[0];
		const progressHandle = $("playbackHandle");
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

		progressWrapper.addEventListener("mousedown", (e) => {
			var r = progressWrapper.getBoundingClientRect();
			player.currentTime = player.duration*((e.clientX-r.x)/r.width);

			function mouseMove(_e) {
				var cx = _e.clientX
				if(cx < r.x) cx = r.x;
				else if(cx > r.x + r.width) cx = r.x+r.width;
				player.currentTime = player.duration*((cx-r.x)/r.width);
			}

			function handleMouseUp() {
				document.removeEventListener("mousemove", mouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			}

			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		});

		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			var r = progressWrapper.getBoundingClientRect();
			progressBody.style.width = `${percent}%`;
			progressHandle.style.left = `${r.width*(percent/100)-3}px`;
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = tMinus ? getTime(player.duration-player.currentTime) : getTime(player.duration);
			userdata.playtime = player.currentTime;
			userdata.volume = player.volume;
			if(percent > 80 && !announce && pPtr + 1 < InternalPlaylist.length) {
				$("next__title").textContent = `NEXT UP: ${InternalPlaylist[pPtr + 1].tags.title}`;
				$("announcement__test").style.backgroundImage = `url("${encodeURI(InternalPlaylist[pPtr + 1].tags.image.replaceAll("\\", "/"))}")`;
				$("announcement__test").style.backgroundSize = "100%";
				$("announcement__test").style.backgroundPosition = "center";
				$("announcement__test").classList.remove("hide");
				setTimeout(() => { $("announcement__test").classList.add("hide"); }, 4000);
				announce = 1;
			} else if(announce && percent < 80) {
				announce = 0;
			}
		});
	
		player.addEventListener("ended", () => {
			userdata.playing = 0;
			vHandle.setRefreshRate(20);
			toPlay = 1;
			if(!playNext()) {
				player.currentTime = 0;
				$("control__pause").src = path.join(__dirname, "assets/icons/audio-play.svg");
			}
		});
		
		vHandle = setupVisualizer(visCanvas, player);
		vHandle.setSmoothing(0.35);
		vHandle.setFftSize(4096);
		vHandle.setMode(userdata.settings.vis_mode, visCanvas);
		vHandle.setRefreshRate(20);
		setBackground(playbackBodyBg);
		vHandle.showChibi = userdata.settings.showchibi;
		vHandle.showWaveform = userdata.settings.wave_show;
		vHandle.bouncingBackground = userdata.settings.bcng_bg;
		vHandle.setAudioOutput(userdata.settings.outputId);
		vHandle.startRender();

		setupSettings();

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
				userdata.totalTime += 1
			}
			$("sampleRate").textContent = vHandle.audioCtx.sampleRate;
			$("fftSize").textContent = vHandle.analyser.fftSize;
		}, 1000);
		setMusicVolume(userdata.volume*100 || 50, false);
		clearPlaylist();
		
		if(cache.pLen != 0) {
			let tcache = new aCache(cache);
			for(let j = 0; j < tcache.pLen; j++) {
				addMusic(tcache.currentPlaylist[j]);
			}
			pPtr = tcache.cPtr;
			playCurrent();
		}
		
		player.currentTime = userdata.playtime+1e-3 || 0;

		pBodyLength.onclick = () => {
			tMinus = !tMinus;
		}

		volumeToaster.addEventListener("animationend", () => {
			volumeToaster.classList.add("hidden");
		});

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
			//playbackWin.classList.toggle("mPlace");
		});
		$("history__header").addEventListener("click", (e) => {
			e.stopPropagation();
			$("history__body").classList.toggle("hide");
			$("history__header").classList.toggle("hide");
			//playbackWin.classList.toggle("mPlace");
		});

		window.addEventListener("resize", () => {
			changeVisSize(visCanvas);
		});

		ipcRenderer.on("cpu", (e, data) => {
			$("cpu").textContent = `${Math.round(data)}%`
		})
		ipcRenderer.on("ram", (e, data) => {
			$("ram").textContent = `${Math.round(data/1000)}MB`
		})
		ipcRenderer.on("fullscreen", (e, data) => {
			if(data === true) {
				$("titlebar").classList.add("hidden");
				$("app").classList.add("notitle");
				$("playlist__body").classList.add("notitle");
				$("history__body").classList.add("notitle");
			} else {
				$("titlebar").classList.remove("hidden");
				$("app").classList.remove("notitle");
				$("playlist__body").classList.remove("notitle");
				$("history__body").classList.remove("notitle");
			}
		})

		$("playback__window").addEventListener("dragover", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});

		$("playback__window").addEventListener("drop", (e) => {
			e.preventDefault();
			e.stopPropagation();

			clearPlaylist();

			for(let i = 0; i < e.dataTransfer.files.length; i++) {
				var w = GetMetadata(e.dataTransfer.files[i].path);
				addMusic(w);
			}

			toPlay = 1
			
			playCurrent();
		});

		$("playlist__body").addEventListener("dragover", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});

		$("playlist__body").addEventListener("drop", (e) => {
			e.preventDefault();
			e.stopPropagation();

			for(let i = 0; i < e.dataTransfer.files.length; i++) {
				var w = GetMetadata(e.dataTransfer.files[i].path);
				console.log("added " + w);
				addMusic(w);
			}
		});

		$("github__red").onclick = () => {
			openLink('https://github.com/B0l0553/Kiku-Music-Player');
		}

		$("twitter__red").onclick = () => {
			openLink('https://twitter.com/b0l0553');
		}

		$("version").textContent = VERSION;

		document.onkeyup = (e) => {
			switch(e.key) {
				case " ":
					keys['space'] = false;
					break;
			}
		}

		document.addEventListener("keydown", (e) => {
			
			switch(e.key) {
				case " ":
					e.preventDefault();
					if(keys["space"]) return;
					togglePause();
					keys['space'] = true;
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
					ipcRenderer.send('refresh', [userdata, cache, history]);
				default:
					break;
			}
		});
		
		window.onbeforeunload = () => {
			ipcMain.removeAllListeners();
		}
	}
}