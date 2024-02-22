const re = RegExp(/\.(?:wav|mp3)$/i);
const NodeID3 = require("node-id3");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class AppSettings {
	cachePath = "Cache";
	musicFolders = [];
	currentTheme = "internal";
}

class Tags {
	title = "Untitled"; 	// Music Title
	artist = "Unknown"; 	// Artist
	album = "Unknown";		// In ablum {x}
	//disc = 0;				// Disc number <-- Didn't find it in tag api
	track = 0;				// Track number
	image;					// Thumb cache path
	year;					// Year the song appeared
	bpm;					// Beat Per Minutes
	composer = "Unknown";	// Composer
	genre = "Unknown";		// Music Genre (eq. Breakcore ; Dubstep ; Metal ; Rock ; Drum 'n Bass)
	length;					// Music Length ( eq. 360s ; 190s ; 90s)
	comment = "No Comment";	// Tags comment
}

class MusicMeta {
	uniqueId;			// UNIQUE ID
	path;				// Music Path
	filename;			// Music Filename
	lastEdited;			// Last edited (For recent wrapper in home)
	tags = new Tags();	// Tags
}

/**
 * Main Wrapper for musics
*/ 
class Album {
	name = "Untitled";
	author = "Unknown";
	musics = [];
	tracks;
	length;
}

class Cache {
	last_music_data;
	thumb;
}

class UsrData {
	volume;
	playtime;
	totalTime;
	vis_mode;
	wave_show;
}

function GetJSONFromFile(_path, callback) {
	if(fs.existsSync(_path) && fs.statSync(_path).isFile) {
		//console.log("is file!")
		return JSON.parse(fs.readFileSync(_path));
	} else {
		console.log("GetJSONFromFile > executing callback");
		return callback(_path);
	}
}

function GetSettings() {
	var json = GetJSONFromFile(path.join(__dirname, "settings.json"), (_path) => {

		var as = new AppSettings()
		as.cachePath = path.join(__dirname, "Cache");
		fs.writeFileSync(_path, JSON.stringify(as, null, 4));
		return as;
	});

	if(json) {
		var ap = new AppSettings();
		console.log("Settings JSON Valid");
		ap.cachePath 	=	json.cachePath;
		return ap;
	}

	return new AppSettings();
}

function GetCache() {
	var json = GetJSONFromFile(path.join(__dirname, "cache.json"), (_path) => {
		fs.writeFileSync(_path, JSON.stringify(new Cache(), null, 4));
		return null;
	});

	if(json) {
		var a = new Cache();
		console.log("Cache JSON Valid");
		a.last_music_data 	= json.last_music_data || [];
		a.thumb 			= json.thumb || "";
		return a;
	}

	console.log("Hi!");
	return new Cache();
}

function GetUserData() {
	var json = GetJSONFromFile(path.join(__dirname, "usrdata.json"), (_path) => {
		fs.writeFileSync(_path, JSON.stringify(new UsrData(), null, 4));
		return null;
	})
	
	var tu = new UsrData();
	tu.volume 			= json.volume || .5;
	tu.playtime 		= json.playtime || 0;
	tu.totalTime		= json.totalTime || 0;
	tu.playing			= json.playing || 0;
	tu.vis_mode			= json.vis_mode || "bBezier";
	tu.wave_show		= json.wave_show || true;
	tu.showchibi 		= json.showchibi || false;
	return tu;
}

function gHistory() {
	var json = GetJSONFromFile(path.join(__dirname, "history.json"), (_path) => {
		fs.writeFileSync(_path, JSON.stringify({}, null, 4));
		return {};
	})

	return json;
}

function wHistory(_history) {
	var fpath = path.join(__dirname, "history.json");
	fs.writeFile(fpath, JSON.stringify(_history, null, 4), () => {});
}

function WriteUserData(_usrdata) {
	//console.log("Writing to usrdata");
	var fpath = path.join(__dirname, "usrdata.json");
	fs.writeFileSync(fpath, JSON.stringify(_usrdata, null, 4));
}

function WriteCache(_albums) {
	var fpath = path.join(__dirname, "cache.json");
	fs.writeFileSync(fpath, JSON.stringify(_albums, null, 4));
}

function WriteSettings(_settings) {
	var fpath = path.join(__dirname, "settings.json");
	fs.writeFileSync(fpath, JSON.stringify(_settings, null, 4));
}

function IsDir(_path) {
	var sts = fs.lstatSync(_path);
	return sts.isDirectory();
}

function IsFile(_path) {
	var sts = fs.lstatSync(_path);
	return sts.isFile();
}

function IsAudioFile(_path) {
	var name = path.basename(_path);
	return re.test(name);
}

function GetDirs(_path) {
	var rawDirs = fs.readdirSync(_path);
	var dirs = [];

	rawDirs.forEach(el => {
		if(IsDir(path.join(_path, el))) {
			dirs.push(path.join(_path, el));
		}
	})

	return dirs;
}

function GetFiles(rawArray) {
	var files = [];

	rawArray.forEach(el => {
		if(IsFile(el)) {
			files.push(el);
		}
	})
}


function GetAudioFiles(_path) {
	var rawArray = fs.readdirSync(_path);
	var audioFiles = [];
	var dirs = GetDirs(_path);
	rawArray.forEach(el => {
		if(IsAudioFile(path.join(_path, el))) {
			audioFiles.push(path.join(_path, el));
		}
	})

	dirs.forEach(el => {
		audioFiles.push(... GetAudioFiles(el));
	})

	return audioFiles;
}

function GetMetadata(_path, _cachePath) {
	if(!IsFile(_path)) return null;
	//console.log("Getting metadata for " + _path)
	var fMusic = new MusicMeta();
	var file = fs.lstatSync(_path);
	fMusic.path = _path;
	fMusic.filename = path.basename(_path);
	fMusic.lastEdited = file.birthtime;
	fMusic.uniqueId = crypto.randomInt(0xffffff);

	const tags = NodeID3.read(_path);

	fMusic.tags.artist 		= tags.artist 		|| "unknown artist";
	fMusic.tags.bpm			= tags.bpm			|| 0;
	fMusic.tags.comment 	= tags.comment 		|| "";
	fMusic.tags.composer	= tags.composer		|| "unknown";
	fMusic.tags.genre		= tags.genre		|| "unknown";
	fMusic.tags.length		= tags.length		|| 0;
	fMusic.tags.title		= tags.title		|| fMusic.filename;
	fMusic.tags.album 		= tags.album 		|| fMusic.title + " - Single";
	fMusic.tags.track		= tags.trackNumber 	|| 0;
	fMusic.tags.year		= tags.year			|| 0;

	// Extracting image
	if(tags.image !== undefined) {
		const hashSum = crypto.createHash('sha256');
		hashSum.update(tags.image.imageBuffer);
		const hex = hashSum.digest('hex');
		var finalPath = path.join(_cachePath, hex + "." + tags.image.mime.split('/')[1]);

		if(!fs.existsSync(finalPath)) fs.writeFileSync(finalPath, tags.image.imageBuffer);

		fMusic.tags.image = finalPath;
	} else {
		fMusic.tags.image = path.join(__dirname, "assets/images/unknown.png");
	}
	console.log(fMusic);
	return fMusic;
}

function PeekAudioFiles(_path) {
	var rawArray = fs.readdirSync(_path);
	var audioFiles = 0;
	var dirs = GetDirs(_path);
	rawArray.forEach(el => {
		if(IsAudioFile(path.join(_path, el))) {
			audioFiles++;
		}
	})

	dirs.forEach(el => {
		audioFiles += PeekAudioFiles(el);
	})

	return audioFiles;
}

function PeekMusicFolders(_pathArray) {
	if(_pathArray.length < 1) return 0;
	var musics = 0;
	_pathArray.forEach(el => {
		console.log("Peeking " + el);
		musics += PeekAudioFiles(el);
	})

	return musics;
}

function GetUnscannedFiles(_pathArray, _musics) {
	if(_pathArray.length < 1) return [];
	//if(_musics.length < 1) return [];

	var nscnd = [];
	_pathArray.forEach(path => {
		GetAudioFiles(path).forEach(musicf => {
			if(!CheckIfInMusics(_musics, musicf)) {
				nscnd.push(musicf);
			}
			
			/*if(!_musics.includes(musicf)) {
				nscnd.push(musicf);
			}*/
		})
	})

	return nscnd;
}

function CheckIfInMusics(_musics, _value) {
	for(let i = 0; i < _musics; i++) {
		if(_value == _musics[i].path) return true;
	}

	return false;
}

function VerifyFiles(_pathArray, _musics) {
	if(_pathArray.length < 1) return [];

	var toremove = [];
	_musics.forEach(music => {
		if(!fs.existsSync(music)) {
			toremove.push(music);
		}
	});

	return toremove;
}

function GetMusics(_pathArray) {
	if(_pathArray.length < 1) return [];

	var musics = [];
	_pathArray.forEach(el => {
		musics.push(... GetAudioFiles(el));
	})

	var formMusics = [];
	musics.forEach(el => {
		formMusics.push(GetMetadata(el));
	})

	return formMusics;
}

function AlbumExists(albums, name) {
	return (albums[name] !== null || albums[name] !== undefined)
}

function GetAlbums(_toscan) {
	if(_toscan < 1) return [];
	
	var albums = [];
	
	for(let i = 0; i < _toscan.length; i++) {
		
		if(AlbumExists(albums, _toscan[i].tags.Album)) {
			albums[_toscan[i].tags.Album].musics.push(_toscan);
			tAlbum.tracks++;
		} else {
			var tAlbum = new Album();
			tAlbum.name = _toscan[i].tags.album;
			tAlbum.tracks = 1;
			tAlbum.musics = [_toscan];
			albums.push(tAlbum);
		}
	}

	return albums;
}

function getFileB64(_path) {
	return fs.readFileSync(_path).toString('base64');
}

module.exports = {
	GetJSONFromFile,
	GetAlbums,
	GetMusics,
	GetMetadata,
	GetSettings,
	gHistory,
	wHistory,
	WriteSettings,
	GetCache,
	WriteCache,
	GetUserData,
	WriteUserData,
	PeekMusicFolders,
	GetUnscannedFiles,
	VerifyFiles,
	getFileB64,
	MusicMeta,
	Cache,
	AppSettings,
}