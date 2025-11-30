// Make sure browser has Media Session API available
function changeMS(musicPlayer, tP, data) {
	if (!('mediaSession' in navigator)) return;
	// Access to Media Session API
	

	var x = new XMLHttpRequest();
	x.open('GET', data.tags.image);
	x.responseType = 'blob';
	x.onload = function() {
		var blob = x.response;
		var fr = new FileReader();
		fr.onloadend = function() {
			var dataUrl = fr.result;
			var ms = navigator.mediaSession;
			var trackInfo = {};
			trackInfo.title = data.tags.title;
			trackInfo.artist = data.tags.artist;
			trackInfo.album = data.tags.album;
			trackInfo.artwork = [
				{ src: dataUrl, sizes: '512x512', type: 'image/jpeg' }
			];
	
			var mediaMD = new MediaMetadata(trackInfo);
			ms.metadata = mediaMD
	
			ms.setActionHandler('play', tP.tp());
			ms.setActionHandler('pause', tP.tp());
			ms.setActionHandler('stop', function() { /* Code excerpted. */ });
			ms.setActionHandler('seekbackward', function() { /* Code excerpted. */ });
			ms.setActionHandler('seekforward', function() { /* Code excerpted. */ });
			ms.setActionHandler('seekto', function() { /* Code excerpted. */ });
			ms.setActionHandler('previoustrack', function() {});
			ms.setActionHandler('nexttrack', function() {});
		};
    	fr.readAsDataURL(blob);
	};
	x.send();
}

module.exports = {
	changeMS
}