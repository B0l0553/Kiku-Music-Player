const VERSION = "0.8.0"

const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist=[],stickers=[],pPtr=realVolume=toPlay=loop=shuffle=optionOpn=scrollcap=menuHeaderTime=tMinus=0,contextData=null,vHandle,visCanvas,keys={},search="",menu="";
let inactivity = 0;
let soundIcons = {};
soundIcons.volumeHigh = "assets/icons/audio-volumehigh.svg"
soundIcons.volumeLow = "assets/icons/audio-volumelow.svg"
soundIcons.volumeNone = "assets/icons/audio-volumenone.svg"
soundIcons.volumeMute = "assets/icons/audio-volumemute.svg"

const { 
	createNewSticker,
	getSticker,
	importStickerJSON,
	exportStickersToJSON,
	deleteSticker
} = require("./sticker.js")

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
	setArtist,
	setTitle,
	changeVisSize,
	setAlbum,
	setNextTitle,
	setBackground,
	moveArrayC,
	persona
} = require("./graphics.js");

const {
	changeMS
} = require("./msHandler.js")

const {
	FloatingMenu
} = require("./contextMenu.js");

const {
	Menu,
	MenuPointer
} = require("./menu.js");
const { VolumeToast } = require("./volumeToast.js");

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

		function $(value) {
			return document.getElementById(value);
		}

		function vwTOpx(value) {
			return (window.innerWidth*value)/100;
		}

		function createMPWrapper(data) {

			var body = `
			<div class="playlist__music scroll-protected">
				<img draggable="false" src="${data.tags.image}" loading="lazy" />
				<div class="playlist__music-info scroll-protected">
					<p>${data.tags.title}</p>
					<!--<p>${data.tags.album}</p>-->
					<p>${data.tags.artist}</p>
				</div>
			</div>`;


			var bg = document.createElement("div");
			bg.setAttribute("li-data", data.i)
			bg.classList.add("playlist__music-wrapper", "scroll-protected");
			bg.innerHTML = body;
			bg.onclick = (e) => {
				e.stopPropagation();
				setMusic(parseInt(bg.getAttribute("li-data")));
			}
			bg.onauxclick = (e) => {
				e.stopPropagation();
				removeMusic(data.i);
			}
			return bg;
		}

		function createMHItem(data) {
			var body = `
			<div class="playblock__music">
				<img draggable="false" class="scroll-unprotected" src="${data.image}" />
				<div class="playblock__music-info">
					<p>${data.title}</p>
					<!--<p>${data.album}</p>-->
					<p>${data.artist}</p>
				</div>
			</div>`;

			if(data.image == undefined) {
				console.log(data);
			}

			var bg = document.createElement("div");
			//bg.style.background = `url("${encodeURI(data.image.replaceAll("\\", "/"))}")`;
			//bg.style.backgroundPosition = "center";
			bg.classList.add("playblock__music-wrapper");
			bg.innerHTML = body;
			bg.onclick = () => {
				(async () => { 
					if(`file:///${data.path.replaceAll("\\", "/")}` == decodeURI(player.src)) return;
					var w = GetMetadata(data.path);
					clearPlaylist();
					addMusic(w);
					toPlay=1;
					playCurrent();
					redrawHistory();
				})();
			}
			bg.onauxclick = () => {
				(async () => { 
					var w = GetMetadata(data.path);
					
					for(let i = 0; i < InternalPlaylist.length; i++) {
						if(data.path == InternalPlaylist[i].path) return;
					}

					addMusic(w);
				})();
			}
			return bg;
		}

		function createVOChoice(mode, _func = null) {
			let bg = document.createElement("div");
			bg.style.backgroundImage = `url("${path.join(__dirname, "assets/images/" + mode + ".png").replaceAll("\\", "/")}")`;
			bg.classList.add("mode__option");
			bg.onclick = (e) => {
				e.stopPropagation();
				vHandle.setMode(mode);
				userdata.settings.vis_mode = mode;
				vHandle.startRender();
				_func();
			}
			return bg;
		}

		function searchHistory(value) {
			const childs = document.getElementById("history__wrapper").childNodes;
			childs.forEach((el) => {
				if(!el.textContent.toLowerCase().includes(value.toLowerCase())) {
					el.style.display = "none";
				} else {
					el.style.display = "flex";
				}
			});
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
				if(sorted[i].title == undefined) continue;
				$("history__wrapper").appendChild(createMHItem(sorted[i]));
			}
			searchHistory(search);
		}

		function redrawLocalPlaylist() {
			$("playlist__wrapper").textContent = "";
			for(let i = 0; i < InternalPlaylist.length; i++) {
				InternalPlaylist[i].i = i;
				$("playlist__wrapper").appendChild(createMPWrapper(InternalPlaylist[i]));
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
			playbackBodyBg.style.filter = "url(#rgb-split) brightness(0.7) blur(16px)";
		}

		function clearPlaylist() {
			InternalPlaylist = [];
			resetPointer();
			$("playlist__wrapper").textContent = "";
		}

		function removeMusic(index) {
			if(index < 0 || index > InternalPlaylist.length || InternalPlaylist.length <= 1) return;
			
			InternalPlaylist.splice(index, 1);

			redrawLocalPlaylist();
			cache.currentPlaylist = InternalPlaylist;
			cache.pLen = InternalPlaylist.length;
			WriteCache(cache);
			if(pPtr == index) {
				if(!playNext()) {
					playPrevious();
				}
			}
		}

		function addMusic(data) {
			data.i = InternalPlaylist.length;
			InternalPlaylist.push(data);
			$("playlist__wrapper").appendChild(createMPWrapper(data));
			cache.currentPlaylist = InternalPlaylist;
			cache.pLen = InternalPlaylist.length;
		}

		function moveMusic(index, nIndex) {
			if(index == nIndex || index > InternalPlaylist.length-1 || index < 0 || nIndex < 0) return;
		
			let indexValue = InternalPlaylist[index];
			if(nIndex > InternalPlaylist.length-1) {
				InternalPlaylist.splice(index, 1);
				InternalPlaylist.push(indexValue);
		
			} else {
				
				InternalPlaylist[index] = InternalPlaylist[nIndex];
				InternalPlaylist[nIndex] = indexValue;
			}
		
			redrawLocalPlaylist();
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
			changeMS(player, {tp: () => togglePause(), pt: () => playPrevious(), nt: () => playNext()}, data);
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
			if(shuffle) {
				pPtr = Math.trunc(Math.random() * (InternalPlaylist.length-1));
				playCurrent();
				return true;
			}
			if(loop == 2) {
				playCurrent();
				return true;
			}
			if(pPtr < InternalPlaylist.length-1) {
				pPtr++;
				playCurrent();
				return true;
			}
			if(loop == 1) {
				resetPointer();
				playCurrent();
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

		function toggleLoop() {
			if(!loop) {
				loop=1;
				$("control__loop").classList.add("on");
				if(shuffle) {
					toggleShuffle();
				}
			} else if(loop==1) {
				loop=2;
				$("control__loop").src = path.join(__dirname, "assets/icons/audio-loop-s.svg");
				if(shuffle) {
					toggleShuffle();
				}
			} else {
				noLoop();
			}
		}

		function noLoop() {
			loop=0;
			$("control__loop").src = path.join(__dirname, "assets/icons/audio-loop.svg");
			$("control__loop").classList.remove("on");
		}

		function toggleShuffle() {
			if(!shuffle) {
				shuffle=1;
				$("control__shuffle").classList.add("on");
				if(loop) {
					noLoop();
				}
			} else {
				shuffle=0;
				$("control__shuffle").classList.remove("on");
			}
		}

		function togglePause() {
			if(player.paused) {
				if(player.currentSrc == null) {
					playNext();
					return;
				}
				player.play();
				userdata.playing = 1;
				if(menu == "") vHandle.setRefreshRate(userdata.settings.vis_refresh_rate);
				$("control__pause").src = path.join(__dirname, "assets/icons/audio-pause.svg")
				return;
			}
			userdata.playing = 0;
			player.pause();
			vHandle.setRefreshRate(15);
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

		function setMusicVolume(_volume, _volumeIcon = null, _show = true) {
			if(_volume < 0) _volume = 0;
			if(_volume > 1) _volume = 1;
			volumeToast.showVolumeToast()
			volumeToast.hideVolumeToast(500);
			volumeToast.setValue(_volume*100);
			realVolume = Math.round(_volume*100)/100;
			player.volume = Math.round(Math.log2(_volume + 1)*1000)/1000;
			if(_volumeIcon) {
				if(_volume >= .5) _volumeIcon.src = soundIcons.volumeHigh;
				else if(_volume < .5 && _volume >= .2) _volumeIcon.src = soundIcons.volumeLow;
				else _volumeIcon.src = soundIcons.volumeNone;

				if(_volume == 0 || player.muted) _volumeIcon.src = soundIcons.volumeMute;
			}

			vHandle.setDecibels(-48+6*Math.log2(player.volume), -12+6*Math.log2(player.volume));
		}

		function setMusicPlayrate(_rate, _show = true) {
			if(_rate < 0.1) _rate = 0.1;
			if(_show) showVToaster();
			volumeSlider.parentElement.style.display = "none";
			volumeText.textContent = `Playrate: ${Math.round(_rate*1e3)/1e3}`
			player.playbackRate = _rate;
		}

		function showVToaster() {
			volumeToaster.classList.remove("hideAnim");
			volumeToaster.classList.remove("hidden");
			volumeToaster.getAnimations().forEach(i => { i.cancel() });
			volumeToaster.classList.add("hideAnim");
		}

		function sec2time(timeInSeconds) {
			var pad = function(num, size) { return ('000' + num).slice(-size); },
			time = parseFloat(timeInSeconds).toFixed(3),
			hours = Math.floor(time / 60 / 60),
			minutes = Math.floor(time / 60) % 60,
			seconds = Math.floor(time - minutes * 60),
			milliseconds = time.slice(-3);
		
			return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
		}

		function setupStickers() {
			if(userdata.stickers.length < 1) return;

			for(let i = 0; i < userdata.stickers.length; i++) {
				var t = importStickerJSON(userdata.stickers[i]);
				$("stickers__wrapper").appendChild(t.imgElem);
			}
		}

		function setupSettings(vms) {
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
			vms.appendChild(createVOChoice("none"));
			vms.appendChild(createVOChoice("bezier"));
			vms.appendChild(createVOChoice("fBezier"));
			vms.appendChild(createVOChoice("bBezier"));
			vms.appendChild(createVOChoice("bar"));
			vms.appendChild(createVOChoice("oFBezier"));
			vms.appendChild(createVOChoice("freeView"));
			
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

			$("shwDebug__input").checked = userdata.settings.debug;
			$("shwDebug__input").onchange = (e) => {
				userdata.settings.debug = e.target.checked;
				vHandle.debug = e.target.checked;
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

		function toggleMenu(value) {
			$(`${value}__body`).classList.toggle("hide");
			$(`${value}__header`).classList.toggle("hide");
		}

		function edgeMenu() {
			$("history__body").classList.add("edge");
			$("history__body").classList.add("hide");
		}

		function openMenu(value) {
			$(`${value}__body`).classList.remove("hide");
			$(`${value}__body`).classList.remove("edge");
			$(`${value}__header`).classList.add("hide");
			menu = value;
			vHandle.setRefreshRate(20);
		}

		function closeMenu(value) {
			$(`${value}__body`).classList.add("hide");
			$(`${value}__body`).scrollTop = 0;
			$(`${value}__header`).classList.remove("hide");
			menu = "";
			if(userdata.playing) vHandle.setRefreshRate(userdata.settings.vis_refresh_rate);
		}

		

		const visModeSelect = $("visualiser__modeSelector");
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
		const volumeIcon = document.getElementById("control__volume-icon");
		const test = document.getElementById("time");
		const formatSeconds = s => (new Date(s * 100)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];

		progressWrapper.addEventListener("mousedown", (e) => {
			if(e.buttons != 1) return;
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
	
		player.addEventListener("ended", () => {
			userdata.playing = 0;
			vHandle.setRefreshRate(20);
			toPlay = 1;
			if(!playNext()) {
				player.currentTime = 0;
				$("control__pause").src = path.join(__dirname, "assets/icons/audio-play.svg");
			}
		});
		
		let contextMenu = new FloatingMenu($("contextMenu"));
		let historyMenu = new Menu($("history__wrapper"));
		let volumeToast = new VolumeToast($("volume-toast"));
		volumeToast.registerEvents();
		volumeToast.showVolumeToast();
		volumeToast.hideVolumeToast();
		//historyMenu.startCustomScroll();

		vHandle = setupVisualizer(visCanvas, player);
		vHandle.setSmoothing(0.45);
		vHandle.setMode(userdata.settings.vis_mode, visCanvas);
		vHandle.setRefreshRate(20);
		setBackground(playbackBodyBg);
		vHandle.showWaveform = userdata.settings.wave_show;
		vHandle.bouncingBackground = userdata.settings.bcng_bg;
		vHandle.beatWindow = userdata.settings.beatWindow;
		vHandle.parallaxBackground = userdata.settings.parallaxBackground;
		vHandle.windowTilt = userdata.settings.windowTilt;
		vHandle.setAudioOutput(userdata.settings.outputId);
		vHandle.setFftSize(vHandle.audioCtx.sampleRate/11.71875); // 11.71875 -> Idk honestly ; magic number to find correct power of 2 :P
		vHandle.startRender();
		vHandle.setMode(userdata.settings.vis_mode, visCanvas);
		vHandle.debug = userdata.settings.debug;
		vHandle.imports = {"searchExt": (k) => { $("history__header").click(); $("menu-search__input").value = k; searchHistory($("menu-search__input").value); } };

		setupStickers();
		setupSettings(visModeSelect);
		//visModeSelect.appendChild(createVOChoice("freeView", () => {}));
		setTimeout(() => {
			var event = new Event("resize");
			window.dispatchEvent(event);
		}, 100);
		setInterval(() => {
			WriteUserData(userdata);
		}, 10000);

		setMusicVolume(userdata.volume || .5, volumeIcon, false);
		clearPlaylist();

		volumeToast.wrapper.addEventListener("mousedown", (e) => {

			if(e.buttons != 1) return;
			var r = volumeToast.wrapper.getBoundingClientRect();
			var val = 1- ((e.clientY - r.y) / r.height)
			setMusicVolume(val, volumeIcon);
			volumeToast.setFocus(2, true);

			function mouseMove(_e) {
				var cy = _e.clientY;
				if(cy < r.y) cy = r.y;
				else if(cy > r.y + r.height) cy = r.y+r.height;
				setMusicVolume(1 - (_e.clientY-r.y)/r.height, volumeIcon);
			}

			function handleMouseUp() {
				document.removeEventListener("mousemove", mouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				volumeToast.setFocus(2, false); 
				volumeToast.handleEntry();
			}

			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("mouseup", handleMouseUp);

		})
		
		setInterval(() => {
			
			if(userdata.playing) {
				userdata.totalTime += .25
			}
			var td = new Date();
			var percent = (player.currentTime / player.duration) * 100;
			var r = progressWrapper.getBoundingClientRect();
			$("sampleRate").textContent = vHandle.audioCtx.sampleRate + " Hz";
			$("fftSize").textContent = vHandle.analyser.fftSize/2 + " Bytes";
			$("time").textContent = `${td.getHours().toLocaleString("en-US", { minimumIntegerDigits: 2 })}:${td.getMinutes().toLocaleString("en-US", { minimumIntegerDigits: 2 })}:${td.getSeconds().toLocaleString("en-US", { minimumIntegerDigits: 2 })}`;
			if(contextMenu.discovered && contextMenu.lifetime >= 1) contextMenu.lifetime-= 1;
			else if(contextMenu.discovered && contextMenu.lifetime < 1) contextMenu.hideMenu();
			progressBody.style.width = `${percent}%`;
			progressHandle.style.transform = `translateX(${r.width*percent/100}px)`;
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = userdata.settings.tMinus ? getTime(player.duration-player.currentTime) : getTime(player.duration);
			userdata.playtime = player.currentTime;
			menuHeaderTime++;
			inactivity += 250;

			if(inactivity > 10000)

			if(menuHeaderTime > 5) {
				$("history__header").classList.add("hide");
			}
			userdata.volume = realVolume;
			volumeToast.autoHideUpdate();
		}, 250);
		
		
		if(cache.pLen != 0) {
			let tcache = new aCache(cache);
			for(let j = 0; j < tcache.pLen; j++) {
				addMusic(tcache.currentPlaylist[j]);
			}
			pPtr = tcache.cPtr;
			playCurrent();
		}
		
		player.currentTime = userdata.playtime+1e-3 || 0;

		if(userdata.fullscreen) {
			$("titlebar").classList.add("hidden");
			$("app").classList.add("notitle");
			$("playlist__body").classList.add("notitle");
			$("history__body").classList.add("notitle");
			$("bg-matrix").classList.add("notitle");
			$("bg-img").classList.add("notitle");
		}

		pBodyLength.onclick = () => {
			userdata.settings.tMinus = !userdata.settings.tMinus;
		}

		document.onmousemove = (e) => {
			vHandle.mouse.seenObject = e.target;
			vHandle.mouse.gx = e.clientX;
			vHandle.mouse.gy = e.clientY;
			inactivity = 0;
		}

		document.onmouseleave = (e) => {
			vHandle.mouse.gx = window.innerWidth/2;
			vHandle.mouse.gy = window.innerHeight/2;
		}

		visCanvas.onmousemove = (e) => {
			let d = e.target.getBoundingClientRect()
			vHandle.mouse.x = Math.round(e.clientX - d.x);
			vHandle.mouse.y = Math.round(e.clientY - d.y);
		}

		visCanvas.onmouseleave = () => {
			vHandle.mouse.x = -2;
			vHandle.mouse.y = -2;
			vHandle.mouse.h = false;
		}

		visCanvas.onclick = (e) => {
			vHandle.mouse.c = true;
		}

		visCanvas.onmousedown = (e) => {
			let d = e.target.getBoundingClientRect()
			vHandle.mouse.h = true;
			vHandle.mouse.hx = Math.round(e.clientX - d.x);
			vHandle.mouse.hy = Math.round(e.clientY - d.y);

			visCanvas.onmouseup = () => {
				vHandle.mouse.h = false;
			}
		}

		$("option-btn").onclick = 			() => { $("settings__body").classList.toggle("hidden"); }
		$("settings__body").onclick = 		(e) => { e.target.classList.toggle("hidden"); }
		$("settings__wrapper").onclick = 	(e) => { e.stopPropagation(); }

		$("control__pause").onclick = 	 () => { togglePause(); }
		$("control__prev").onclick = 	 () => { playPrevious();	}
		$("control__next").onclick = 	 () => { playNext(); }
		$("control__loop").onclick = 	 () => { toggleLoop(); }
		$("control__shuffle").onclick =  () => { toggleShuffle(); }
		$("control__showplay").onclick = () => { toggleMenu("playlist"); }
		// $("control__volume").onmouseenter = () => { volumeToast.showVolumeToast(); }
		// $("control__volume").onmouseleave = () => { if(!volumeToast.stillFocused) volumeToast.hideVolumeToast(); }
		volumeIcon.onmouseenter = () => { volumeToast.setExternalFocus(true); }
		volumeIcon.onmouseleave = () => { volumeToast.setExternalFocus(false); }
		volumeIcon.onclick = () => { player.muted = !player.muted; setMusicVolume(realVolume, volumeIcon, false); }

		$("history__header").onmouseenter = () => { menuHeaderTime=0; $("history__header").classList.remove("hide"); }
		$("history__exit").onclick = 		() => { closeMenu("history"); }
		$("history__header").onclick = 		() => { openMenu("history"); redrawHistory(); }

		$("menu-search__input").onkeydown = (e) => {
		}

		$("menu-search__input").onkeyup = (e) => {
			search = e.target.value;
			searchHistory(search);
		}

		window.addEventListener("resize", () => {
			changeVisSize(visCanvas);
			if(vHandle.mode == "freeView") {
				changeVisSize(visCanvas, 100, 94.25);
			}
		});

		ipcRenderer.on("minimized", (e, isMinimized) => {
			console.log("minized: ", isMinimized);
			if(isMinimized) {
				vHandle.breakRender = true;
			} else {
				vHandle.startRender();
			}
		})
		
		ipcRenderer.on("fullscreen", (e, data) => {
			if(data === true) {
				$("titlebar").classList.add("hidden");
				$("app").classList.add("notitle");
				$("playlist__body").classList.add("notitle");
				$("history__body").classList.add("notitle");
				$("bg-matrix").classList.add("notitle");
				$("bg-img").classList.add("notitle");
				userdata.fullscreen = true;
			} else {
				$("titlebar").classList.remove("hidden");
				$("app").classList.remove("notitle");
				$("playlist__body").classList.remove("notitle");
				$("history__body").classList.remove("notitle");
				$("bg-matrix").classList.remove("notitle");
				$("bg-img").classList.remove("notitle");
				userdata.fullscreen = false;
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
				addMusic(w);
			}
		});

		document.onwheel = (e) => {

			if(e.altKey) {
				if(e.shiftKey)  {
					setMusicPlayrate(player.playbackRate - Math.sign(e.deltaY)*.1);
					return;
				}

				if(e.ctrlKey) {
					setMusicPlayrate(player.playbackRate - Math.sign(e.deltaY)*.001);
					return;
				}

				setMusicPlayrate(player.playbackRate - Math.sign(e.deltaY)*.01);
				return;
			}

			if(e.ctrlKey) {
				if(e.shiftKey)  {
					setMusicVolume(realVolume - Math.sign(e.deltaY)*.1, volumeIcon);
					return;
				}
				setMusicVolume(realVolume - Math.sign(e.deltaY)*.01, volumeIcon);
				return;
			}

			/*if((e.target.classList.contains("scroll-protected") || e.target.nodeName == "IMG" || e.target.nodeName == "P") 
				&& !e.target.classList.contains("scroll-unprotected") ) return;

			scrollcap += e.deltaY;
			
			if(menu == "") {
				$("lprog__bar").style.width = `${scrollcap/300*100}vw`;
				if(scrollcap >= 300 && Math.sign(e.deltaY) > 0) {
					openMenu("history");
					redrawHistory();
					scrollcap = 0;
				} else if(scrollcap >= 200 && Math.sign(e.deltaY) > 0) {
					edgeMenu();
				}
			}*/
		}

		$("github__red").onclick = () => {
			openLink('https://github.com/B0l0553/Kiku-Music-Player');
		}

		$("version").textContent = VERSION;

		function setupContext() {
			
			// album cover
			contextMenu.addButtonOption("Extract Cover", () => {
				const link = document.createElement("a");
				link.href = InternalPlaylist[pPtr].tags.image;
				link.download = `${InternalPlaylist[pPtr].tags.album}_cover.${InternalPlaylist[pPtr].tags.image.split(".")[1]}`;
				link.click();

				contextMenu.hideMenu();
			});

			// visualizer
			contextMenu.addTickOption("Wave", vHandle.showWaveform, () => {
				vHandle.showWaveform = !vHandle.showWaveform;
				$("shwWaveform__input").checked = vHandle.showWaveform;
				userdata.settings.wave_show = vHandle.showWaveform;
			});
			contextMenu.addTickOption("Background", vHandle.bouncingBackground, () => {
				vHandle.bouncingBackground = !vHandle.bouncingBackground;
				$("bouncingBackground__input").checked = vHandle.bouncingBackground;
				userdata.settings.bcng_bg = vHandle.bouncingBackground;
			});
			contextMenu.addTickOption("Window Shadow", vHandle.beatWindow, () => {
				vHandle.beatWindow = !vHandle.beatWindow;
				userdata.settings.beatWindow = vHandle.beatWindow;
			});
			contextMenu.addTickOption("Tilting Window", vHandle.windowTilt, () => {
				vHandle.windowTilt = !vHandle.windowTilt;
				userdata.settings.windowTilt = vHandle.windowTilt;
			});
			contextMenu.addTickOption("Parallax Background", vHandle.parallaxBackground, () => {
				vHandle.parallaxBackground = !vHandle.parallaxBackground;
				userdata.settings.parallaxBackground = vHandle.parallaxBackground;
			});
			contextMenu.addInputOption("Smoothing", vHandle.analyser.smoothingTimeConstant, (e) => {
				var f = parseFloat(e.target.value);
				if(f >= 0 && f < 1) {
					vHandle.setSmoothing(f);
				}
			});

			contextMenu.addButtonOption("Move", (e) => {
				var ts = getSticker(contextMenu.currentFocus.id);
				
				function m(e) {
					ts.moveTo(e.clientX, e.clientY);
				}

				function x(e) {
					document.removeEventListener("mousemove", m);
					document.removeEventListener("mousedown", x);
					userdata.stickers = exportStickersToJSON();
				}
				document.addEventListener("mousemove", m);
				document.addEventListener("mousedown", x);

				contextMenu.hideMenu();
			});

			contextMenu.addButtonOption("Resize", (e) => {
				var ts = getSticker(contextMenu.currentFocus.id);
				
				function m(e) {
					ts.resizeTo(e.clientX - ts.x, e.clientY - ts.x);
				}

				function x(e) {
					document.removeEventListener("mousemove", m);
					document.removeEventListener("mousedown", x);
					userdata.stickers = exportStickersToJSON();
				}
				document.addEventListener("mousemove", m);
				document.addEventListener("mousedown", x);

				contextMenu.hideMenu();
			});

			contextMenu.addTickOption("Lock Proportions", false, (e) => { 
				let ts = getSticker(contextMenu.currentFocus.id);
				ts.lockedProportions = !ts.lockedProportions;
			})
			contextMenu.addButtonOption("Invert", () => {
				getSticker(contextMenu.currentFocus.id).invert();
				userdata.stickers = exportStickersToJSON();
				contextMenu.hideMenu();
			})

			contextMenu.addButtonOption("Add Sticker", () => {
				let input = document.createElement("input");
				input.type = "file";
				
				input.onchange = e => {
					var file = e.target.files[0];

					// console.log(file);
					let ts = createNewSticker(file.path);
					$("stickers__wrapper").appendChild(ts.imgElem);
					userdata.stickers = exportStickersToJSON();
				}

				input.click();
			})

			contextMenu.addButtonOption("Remove Sticker", () => {
				deleteSticker(contextMenu.currentFocus.id);
				userdata.stickers = exportStickersToJSON();
				contextMenu.hideMenu();
			})

			var fps = [ "240", "165", "144", "75", "60", "30", "20" ];

			contextMenu.addSelectOption("FPS", fps, `${userdata.settings.vis_refresh_rate}`, (e) => {
				userdata.settings.vis_refresh_rate = Number.parseInt(e.target.value);
				vHandle.setRefreshRate(e.target.value);
			});

			contextMenu.addTickOption("Debug", vHandle.debug, () => {
				vHandle.debug = !vHandle.debug;
				$("shwDebug__input").checked = vHandle.debug;
				userdata.settings.debug = vHandle.debug;
			});
			
			contextMenu.addTickOption("Show FFT Size", userdata.settings.showFFTSize, () => {
				userdata.settings.showFFTSize = !userdata.settings.showFFTSize;
				if(userdata.settings.showFFTSize) $("fftSize").classList.remove("hidden");
				else $("fftSize").classList.add("hidden");
			});
			contextMenu.addTickOption("Show Sample Rate", userdata.settings.sampleRate, () => {
				userdata.settings.sampleRate = !userdata.settings.sampleRate;
				if(userdata.settings.sampleRate) $("sampleRate").classList.remove("hidden");
				else $("sampleRate").classList.add("hidden");
			});
			contextMenu.addTickOption("Show FPS", userdata.settings.showFPS, () => {
				userdata.settings.showFPS = !userdata.settings.showFPS;
				if(userdata.settings.showFPS) $("fps").classList.remove("hidden");
				else $("fps").classList.add("hidden");
			});
			contextMenu.addTickOption("Show Time", userdata.settings.showTime, () => {
				userdata.settings.showTime = !userdata.settings.showTime;
				if(userdata.settings.showTime) $("time").classList.remove("hidden");
				else $("time").classList.add("hidden");
			});

			if(userdata.settings.showFFTSize) $("fftSize").classList.remove("hidden");
			else $("fftSize").classList.add("hidden");

			if(userdata.settings.sampleRate) $("sampleRate").classList.remove("hidden");
			else $("sampleRate").classList.add("hidden");

			if(userdata.settings.showFPS) $("fps").classList.remove("hidden");
			else $("fps").classList.add("hidden");

			if(userdata.settings.showTime) $("time").classList.remove("hidden");
			else $("time").classList.add("hidden");
		}

		function contextSearchParent(_elem) {
			var pElem = _elem.parentElement;
			var res = pElem.getAttribute("data-ctx");
			// console.log(`cycling... ${_elem.id}: ${_elem.getAttribute("data-ctx")} -> ${pElem.id}: ${pElem.getAttribute("data-ctx")}`);
			if(pElem.id != "app" && res == null) {
				res = contextSearchParent(pElem);
			}
			
			return res
		}

		setupContext();
		contextMenu.hideMenu();
		document.oncontextmenu = (e) => {
			if(contextMenu.discovered) {
				contextMenu.hideMenu();
			} else {
				var ctxname = e.target.getAttribute("data-ctx");
				
				if(ctxname == null) {
					ctxname = contextSearchParent(e.target);
				}
				contextMenu.currentFocus = e.target;
				contextMenu.moveMenu(e.clientX, e.clientY);
				contextMenu.changeTitle(ctxname);

				switch(ctxname) {
					case "music-thumbnail":
						contextMenu.showOption("Extract Cover")
						break;
					
					case "visualiser":
						contextMenu.showOption("Wave");
						contextMenu.showOption("Background");
						contextMenu.showOption("Tilting Window");
						contextMenu.showOption("Parallax Background");
						contextMenu.showOption("Smoothing");
						contextMenu.showOption("FPS");
						contextMenu.showOption("Debug");
					case "window":
						contextMenu.showOption("Window Shadow");
						break;

					case "sticker":
						contextMenu.showOption("Move");
						contextMenu.showOption("Resize");
						contextMenu.showOption("Lock Proportions");
						contextMenu.showOption("Invert");
						contextMenu.showOption("Add Sticker");
						contextMenu.showOption("Remove Sticker");
						break;
					case "body":
						contextMenu.showOption("Add Sticker");
						contextMenu.showOption("Background");
						contextMenu.showOption("Parallax Background");
						break;
					case "footer":
						contextMenu.showOption("Show FPS");
						contextMenu.showOption("Show FFT Size");
						contextMenu.showOption("Show Sample Rate");
						contextMenu.showOption("Show Time");
						break
					default:
						break
				}

				if(ctxname != null) contextMenu.showMenu();
			}
		}

		document.onclick = (e) => {
			if(contextMenu.discovered && e.target.id != contextMenu.assignedElement.id && !e.target.classList.contains("ctx-protect")
			) {
				e.preventDefault();
				e.stopPropagation();
				contextMenu.hideMenu();
			}
		}

		document.onkeyup = (e) => {
			switch(e.key) {
				case " ":
					keys['space'] = false;
					break;
			}
		}

		document.addEventListener("keydown", (e) => {
			if(menu != "" && e.key == "Escape") {
				closeMenu(menu);
				return;
			} else if(menu == "history") {
				$("history__input").focus();
				return;
			}

			switch(e.key) {
				case " ":
					e.preventDefault();
					if(keys["space"]) return;
					togglePause();
					keys['space'] = true;
					break;
				case "ArrowUp":
					e.preventDefault();
					setMusicVolume(realVolume + .01);
					break;
				case "ArrowDown":
					e.preventDefault();
					setMusicVolume(realVolume - .01);
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
					break;
				case "p":
					e.preventDefault();
					if(e.altKey) player.preservesPitch = !player.preservesPitch;
					break;
				default:
					break;
			}
		});
		
		window.onbeforeunload = () => {
			ipcMain.removeAllListeners();
		}
	}
}