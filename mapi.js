const re = RegExp(/\.(?:wav|mp3)$/i);
const NodeID3 = require("node-id3");
const path = require("path");
const fs = require("fs")

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
	musics = [];
	tracks;
	length;
}

class Cache {
	albums 	= [];	//* Already Scanned albums
	toscan 	= [];	//? Musics files pending scan
	banned 	= [];	//! Banned files
	remove 	= [];
	fcount 	= [];	// Total Musics files in cache
	u_favs 	= [];	// User favorites
	lstpag;
	ctrlop = false;
}

function GetSettingsJSON() {
	var fpath = path.join(__dirname, "settings.json");
	if(fs.existsSync(fpath) && fs.statSync(fpath).isFile) {
		return JSON.parse(fs.readFileSync(fpath));
	} else {
		var as = new AppSettings()
		as.cachePath = path.join(__dirname, "Cache");
		
		fs.writeFileSync(fpath, JSON.stringify(as, null, 4));
		return as;
	}
}

function GetSettings() {
	var json = GetSettingsJSON();

	if(json) {
		var ap = new AppSettings();

		ap.cachePath 	=	json.cachePath;
		ap.musicFolders = 	json.musicFolders;
		ap.currentTheme =	json.currentTheme;
		return ap;
	}

	return new AppSettings();
}

function GetCacheJSON() {
	var fpath = path.join(__dirname, "cache.json");
	if(fs.existsSync(fpath) && fs.statSync(fpath).isFile) {
		console.log("Cache is file!")
		return JSON.parse(fs.readFileSync(fpath));
	} else {
		fs.writeFileSync(fpath, JSON.stringify(new Cache(), null, 4));
		return null;
	}
}


function GetCache() {
	var json = GetCacheJSON();

	if(json) {
		var a = new Cache();
		a.albums = json.albums;
		a.toscan = json.toscan;
		a.banned = json.banned;
		a.ctrlop = json.ctrlop;
		a.fcount = json.fcount;
		a.lstpag = json.lstpag;
		a.remove = json.remove;
		a.u_favs = json.u_favs;
		return a;
	}

	return new Cache();
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
	var name = _path.split("\\")[_path.split("\\").length - 1];
	return re.test(name);
}

function GetDirs(_path) {
	var rawDirs = fs.readdirSync(_path);
	var dirs = [];

	rawDirs.forEach(el => {
		if(IsDir(_path + "\\" + el)) {
			dirs.push(_path + "\\" + el);
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
		if(IsAudioFile(_path + "\\" + el)) {
			audioFiles.push(_path + "\\" + el);
		}
	})

	dirs.forEach(el => {
		audioFiles.push(... GetAudioFiles(el));
	})

	return audioFiles;
}

function GetMetadata(_path) {
	if(!IsFile(_path)) return null;
	var fMusic = new MusicMeta();
	var file = fs.lstatSync(_path);
	fMusic.path = _path;
	fMusic.filename = _path.split('\\')[_path.split('\\').length - 1];
	fMusic.lastEdited = file.birthtime;

	const tags = NodeID3.read(_path);

	fMusic.tags.album 		= tags.album;
	fMusic.tags.artist 		= tags.artist;
	fMusic.tags.bpm			= tags.bpm;
	fMusic.tags.comment 	= tags.comment;
	fMusic.tags.composer	= tags.composer;
	fMusic.tags.genre		= tags.genre;
	fMusic.tags.length		= tags.length;
	fMusic.tags.title		= tags.title;
	fMusic.tags.track		= tags.trackNumber;
	fMusic.tags.year		= tags.year;

	// Extracting image
	if(tags.image !== undefined) {
		if(tags.album !== undefined) {
			var albumForm = btoa(encodeURIComponent(tags.album))
			if(fs.existsSync(settings.cachePath + "\\" + albumForm + "." + tags.image.mime.split('/')[1])) return fMusic;
			fs.writeFileSync(settings.cachePath + "\\" + albumForm + "." + tags.image.mime.split('/')[1], tags.image.imageBuffer);
			fMusic.tags.image = settings.cachePath + "\\" + albumForm + "." + tags.image.mime.split('/')[1];
		} else {
			var filename = btoa(encodeURIComponent(fMusic.filename));
			if(fs.existsSync(settings.cachePath + "\\" + filename + "." + tags.image.mime.split('/')[1])) return fMusic;
			fs.writeFileSync(settings.cachePath + "\\" + filename + "." + tags.image.mime.split('/')[1], tags.image.imageBuffer);
			fMusic.tags.image = settings.cachePath + "\\" + filename + "." + tags.image.mime.split('/')[1];
		}
	}

	return fMusic;
}

function PeekAudioFiles(_path) {
	var rawArray = fs.readdirSync(_path);
	var audioFiles = 0;
	var dirs = GetDirs(_path);
	rawArray.forEach(el => {
		if(IsAudioFile(_path + "\\" + el)) {
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

function GetUnscannedFiles(_pathArray, _albums) {
	if(_pathArray.length < 1) return [];

	var nscnd = [];
	_pathArray.forEach(path => {
		GetAudioFiles(path).forEach(musicf => {
			if(!_albums.includes(musicf)) {
				nscnd.push(musicf);
			}
		})
	})

	return nscnd;
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

function GetAlbums(_toscan) {
	if(_toscan < 1) return [];

	var albums = [];
	
	for(let i = 0; i < _toscan.length; i++) {
		albums.forEach(album => {
			if(_toscan[i].tags.Album === album.name) album.push(_toscan);
		})

		var tAlbum = new Album();
		tAlbum.name = _toscan[i].tags.album;
		tAlbum.tracks = 1;
		tAlbum.musics = [_toscan];
		albums.push(tAlbum);
	}

	return albums;
}

module.exports = {
	GetAlbums,
	GetMusics,
	GetSettings,
	WriteSettings,
	GetCache,
	WriteCache,
	PeekMusicFolders,
	GetUnscannedFiles,
	VerifyFiles,
	MusicMeta,
	Cache,
	AppSettings,
}