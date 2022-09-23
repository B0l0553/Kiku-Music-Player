const re = RegExp(/\.(?:wav|mp3)$/i);
const NodeID3 = require("node-id3");
const path = require("path");

class AppSettings {
	default;
	cachePath;
	musicFolders;
	favorites;
	lastPage;
	controlsOpen;
	//musics;
	//currentTheme;
	//themeFolder;

	constructor() {
		this.default = true;
		this.cachePath = "Cache";
		this.musicFolders = [];
		this.favorites = [];
		this.controlsOpen = false;
		//this.musics = [];
		//this.theme = "default";
		//this.themeFolder = [];
	}
}

class Tags {
	title = "Untitled"; 	// Music Title
	artist = "Unknown"; 	// Artist
	album = "Unknown";		// In ablum {x}
	//disc = 0;				// Disc number
	track = 0;				// Track number
	image;					// Thumb cache path
	year;
	bpm;
	composer = "Unknown";
	genre = "Unknown";
	length;
	comment = "No Comment";

}

class MusicMeta {
	path;				// Music Path
	filename;			// Music Filename
	lastEdited;			// Last edited (For recent wrapper in home)
	tags = new Tags();	// Tags
}

class Album {
	musics = [];
	tracks;
	length;

}


function GetSettingsJson() {
	var fpath = path.join(__dirname, "settings.json");
	if(fs.existsSync(fpath)) {
		return JSON.parse(fs.readFileSync(fpath));
	}
	return null;
}

function GetSettings() {
	var fpath = path.join(__dirname, "settings.json");
	var json = GetSettingsJson();

	if(json) {
		var ap = new AppSettings();

		ap.default 		=	json.default;
		ap.cachePath 	=	json.cachePath;
		ap.musicFolders = 	json.musicFolders;
		ap.favorites 	=	json.favorites;
		ap.lastPage 	=	json.lastPage;
		ap.controlsOpen =	json.controlsOpen;
		//ap.musics		=	json.musics;
		return ap;
	}

    var as = new AppSettings()
    as.cachePath = path.join(__dirname, "Cache");
    as.default = false;
	as.lastPage = "home-page";
    
    fs.writeFileSync(fpath, JSON.stringify(as, null, 4));
    return as;
}

function WriteSettings(_settings) {
	var fpath = path.join(__dirname, "settings.json");
	fs.writeFileSync(fpath, JSON.stringify(settings, null, 4));
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

// I DID IT!!
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

function GetMusics(_pathArray) {
	if(_pathArray.length < 1) return;

	var musics = [];
	_pathArray.forEach(el => {
		var e = GetAudioFiles(el);
		musics.push(... e);
	})

	var formMusics = [];
	musics.forEach(el => {
		formMusics.push(GetMetadata(el));
	})

	return formMusics;
}

function GetAlbums(_musicArray) {
	if(_musicArray < 1) return;

	var albums = [];
	_musicArray.forEach(el => {
		
	})

	return albums;
}

module.exports = {
	GetAlbums,
	GetMusics,
	GetSettings,
	WriteSettings,
	MusicMeta,
	Album,
	AppSettings,
}