const VERSION = "0.6.95"

const { ipcRenderer, dialog, app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path")
let InternalPlaylist=[],stickers=[],pPtr=toPlay=loop=shuffle=optionOpn=tMinus=0,contextData=null,vHandle,visCanvas,keys={},search="",menu="";

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
	setBackground
} = require("./graphics.js");

const {
	changeMS
} = require("./msHandler.js")

const {
	FloatingMenu
} = require("./contextMenu.js");

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
			<div class="playlist__music">
				<img draggable="false" src="${data.tags.image}" loading="lazy" />
				<div class="playlist__music-info">
					<div>${data.tags.title}</div>
					<!--<div>${data.tags.album}</div>-->
					<div>${data.tags.artist}</div>
				</div>
			</div>`;

			var bg = document.createElement("div");
			bg.classList.add("playlist__music-wrapper");
			bg.innerHTML = body;
			bg.onclick = (e) => {
				e.stopPropagation();
				setMusic(data.i);
			}
			return bg;
		}

		function createMHItem(data) {
			var body = `
			<div class="playlist__music">
				<img draggable="false" src="${data.image}" />
				<div class="playlist__music-info">
					<p>${data.title}</p>
					<!--<div>${data.album}</div>-->
					<p>${data.artist}</p>
				</div>
			</div>`;

			var bg = document.createElement("div");
			//bg.style.background = `url("${encodeURI(data.image.replaceAll("\\", "/"))}")`;
			//bg.style.backgroundPosition = "center";
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
					redrawHistory();
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
				vHandle.startRender();
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
				$("history__wrapper").appendChild(createMHItem(sorted[i]));
			}
			searchHistory(search);
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

		function setMusicVolume(_volume, _show = true) {
			if(_volume < 0) _volume = 0;
			if(_volume > 1) _volume = 1;
			if(_show) showVToaster();
			volumeSlider.parentElement.style.display = "";
			volumeSlider.style.width = `${_volume*100}%`
			volumeText.textContent = `${Math.round(_volume*100)}%`
			player.volume = Math.round(_volume*100)/100;
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
			vms.appendChild(createVOChoice("bar"));
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

		function openMenu(value) {
			$(`${value}__body`).classList.remove("hide");
			menu = value;
			vHandle.setRefreshRate(20);
		}

		function closeMenu(value) {
			$(`${value}__body`).classList.add("hide");
			menu = "";
			if(userdata.playing) vHandle.setRefreshRate(userdata.settings.vis_refresh_rate);
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

		player.addEventListener('timeupdate', () => {
			var percent = (player.currentTime / player.duration) * 100;
			var r = progressWrapper.getBoundingClientRect();
			progressBody.style.width = `${percent}%`;
			progressHandle.style.left = `${(r.width*(percent/100)-3)/window.innerWidth*100}vw`;
			pBodyTime.textContent = getTime(player.currentTime);
			pBodyLength.textContent = userdata.settings.tMinus ? getTime(player.duration-player.currentTime) : getTime(player.duration);
			userdata.playtime = player.currentTime;
			userdata.volume = player.volume;
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
		
		var contextMenu = new FloatingMenu($("contextMenu"));

		vHandle = setupVisualizer(visCanvas, player);
		vHandle.setSmoothing(0.3);
		vHandle.setMode(userdata.settings.vis_mode, visCanvas);
		vHandle.setRefreshRate(20);
		setBackground(playbackBodyBg);
		vHandle.showWaveform = userdata.settings.wave_show;
		vHandle.bouncingBackground = userdata.settings.bcng_bg;
		vHandle.setAudioOutput(userdata.settings.outputId);
		vHandle.setFftSize(vHandle.audioCtx.sampleRate/11.71875); // 11.71875 -> Idk honestly ; magic number to find correct power of 2 :P
		vHandle.startRender();
		vHandle.setMode(userdata.settings.vis_mode, visCanvas);
		vHandle.debug = userdata.settings.debug;
		vHandle.imports = {"searchExt": (k) => { $("history__header").click(); $("history__input").value = k; searchHistory($("history__input").value); } };

		// var stickerTest = new Sticker("E:\\pokemon\\eevees\\endwl\\279476.png", 600, 200);
		// stickerTest.resizeTo(188, 188);
		// $("playback__body").appendChild(stickerTest.getSticker())
		// stickers.push(stickerTest);
		
		setupSettings();
		setTimeout(() => changeVisSize(visCanvas), 250);
		setInterval(() => {
			WriteUserData(userdata);
		}, 10000);
		
		setInterval(() => {
			if(userdata.playing) {
				userdata.totalTime += 1
			}
			var td = new Date();
			$("sampleRate").textContent = vHandle.audioCtx.sampleRate + " Hz";
			$("fftSize").textContent = vHandle.analyser.fftSize/2 + " Bytes";
			$("time").textContent = `${td.getHours().toLocaleString("en-US", { minimumIntegerDigits: 2 })}:${td.getMinutes().toLocaleString("en-US", { minimumIntegerDigits: 2 })}:${td.getSeconds().toLocaleString("en-US", { minimumIntegerDigits: 2 })}`;
			if(contextMenu.discovered && contextMenu.lifetime >= 1000) contextMenu.lifetime-= 1000;
			else if(contextMenu.discovered && contextMenu.lifetime < 1000) contextMenu.hideMenu();
		}, 1000);
		setMusicVolume(userdata.volume || .5, false);
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

		volumeToaster.addEventListener("animationend", () => {
			volumeToaster.classList.add("hidden");
		});

		visCanvas.onmousemove = (e) => {
			var d = e.target.getBoundingClientRect()
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
			var d = e.target.getBoundingClientRect()
			vHandle.mouse.h = true;
			vHandle.mouse.hx = Math.round(e.clientX - d.x);
			vHandle.mouse.hy = Math.round(e.clientY - d.y);

			visCanvas.onmouseup = () => {
				vHandle.mouse.h = false;
			}
		}

		$("option-btn").onclick = () => { $("settings__body").classList.toggle("hidden"); }
		$("settings__body").onclick = (e) => { e.target.classList.toggle("hidden"); }
		$("settings__wrapper").onclick = (e) => { e.stopPropagation(); }

		$("control__pause").onclick = 	() => { togglePause(); }
		$("control__prev").onclick = 	() => { playPrevious();	}
		$("control__next").onclick = 	() => { playNext(); }
		$("control__loop").onclick = 	() => { toggleLoop(); }
		$("control__shuffle").onclick = () => { toggleShuffle();}

		// $("playlist__exit").onclick = 	() => { closeMenu("playlist"); }
		$("playlist__body").onclick = 	() => { closeMenu("playlist"); }
		$("playlist__header").onclick = () => { openMenu("playlist"); }
		$("history__exit").onclick = 	() => { closeMenu("history"); }
		$("history__top").onclick = 	() => { $("history__wrapper").scrollTo(0, 0); }
		$("history__header").onclick = 	() => { openMenu("history"); redrawHistory(); }
		$("history__wrapper").onscroll = (e) => { 
			if($("history__wrapper").scrollTop > 100) {
				$("history__top").classList.remove("hide")
			} else {
				$("history__top").classList.add("hide")
			}
		}

		$("history__input").onkeyup = (e) => {
			search = e.target.value;
			searchHistory(search);
		}

		window.addEventListener("resize", () => {
			changeVisSize(visCanvas);
		});
		
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
				console.log("added " + w);
				addMusic(w);
			}
		});

		$("playback__window").onwheel = (e) => {

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
			}

			if(e.ctrlKey) {
				if(e.shiftKey)  {
					setMusicVolume(player.volume - Math.sign(e.deltaY)*.1);
					return;
				}
				setMusicVolume(player.volume - Math.sign(e.deltaY)*.01);
			}
		}

		$("github__red").onclick = () => {
			openLink('https://github.com/B0l0553/Kiku-Music-Player');
		}

		$("twitter__red").onclick = () => {
			openLink('https://twitter.com/b0l0553');
		}

		$("version").textContent = VERSION;

		function contextSearchParent(_elem) {
			var pElem = _elem.parentElement;
			var res = pElem.getAttribute("data-ctx");
			// console.log(`cycling... ${_elem.id}: ${_elem.getAttribute("data-ctx")} -> ${pElem.id}: ${pElem.getAttribute("data-ctx")}`);
			if(pElem.id != "app" && res == null) {
				res = contextSearchParent(pElem);
			}
			
			return res
		}

		document.oncontextmenu = (e) => {
			if(contextMenu.discovered) {
				contextMenu.hideMenu();
			} else {
				var ctxname = e.target.getAttribute("data-ctx");
				
				if(ctxname == null) {
					ctxname = contextSearchParent(e.target);
				}

				contextMenu.moveMenu(e.clientX, e.clientY);
				contextMenu.changeTitle(ctxname);

				switch(ctxname) {
					case "music-thumbnail":
						contextMenu.addButtonOption("抽出して保存", () => {
							const link = document.createElement("a");
							link.href = InternalPlaylist[pPtr].tags.image;
							link.download = `${InternalPlaylist[pPtr].tags.album}_cover.${InternalPlaylist[pPtr].tags.image.split(".")[1]}`;
							link.click();

							contextMenu.hideMenu();
						})
						break;
					case "visualiser":
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
						contextMenu.addInputOption("Smoothing", vHandle.analyser.smoothingTimeConstant, (e) => {
							var f = parseFloat(e.target.value);
							if(f >= 0 && f < 1) {
								vHandle.setSmoothing(f);
							}
						});

						var fps = [ "240", "170", "144", "75", "32", "10" ];

						contextMenu.addSelectOption("FPS", fps, `${userdata.settings.vis_refresh_rate}`, (e) => {
							userdata.settings.vis_refresh_rate = Number.parseInt(e.target.value);
							vHandle.setRefreshRate(e.target.value);
						});

						contextMenu.addTickOption("Debug", vHandle.debug, () => {
							vHandle.debug = !vHandle.debug;
							$("shwDebug__input").checked = vHandle.debug;
							userdata.settings.debug = vHandle.debug;
						});
						break;
					case "sticker":
						contextMenu.addButtonOption("Move", () => {
							for(let i = 0; i < stickers.length; i++) {
								if(stickers[i].imgElem.id == e.target.id) {
									break;
								}
							}
							contextMenu.hideMenu();
						})
						break
					case "body":
					case "":
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
					setMusicVolume(player.volume + .01);
					break;
				case "ArrowDown":
					e.preventDefault();
					setMusicVolume(player.volume - .01);
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
					if(e.altKey) player.preservesPitch = !player.preservesPitch
				default:
					break;
			}
		});
		
		window.onbeforeunload = () => {
			ipcMain.removeAllListeners();
		}
	}
}