// Make sure browser has Media Session API available
function changeMS(musicPlayer, tP, data) {
	if (!('mediaSession' in navigator)) return;
	// Access to Media Session API
	var ms = navigator.mediaSession;

	// Create track info JSON variable
	var trackInfo = {};

	// Set track title
	trackInfo.title = data.tags.title;

	// Set artist name
	trackInfo.artist = data.tags.artist;

	// Set album name
	trackInfo.album = data.tags.album;

	// Set album art (NOTE: image files must be hosted in "http" or "https" protocol to be shown)
	trackInfo.artwork = [
		{ src: data.tags.image, sizes: '512x512', type: 'image/jpg' }
	];

	// Then, we create a new MediaMetadata and pass our trackInfo JSON variable
	var mediaMD = new MediaMetadata(trackInfo);

	// We assign our mediaMD to MediaSession.metadata property
	ms.metadata = mediaMD

	// And that will be all for show our custom track info in Windows (or any supported) Media Player Pop-Up
	
	// If we need to customize Media controls, we must set action handlers (NOTE: It's not necessary to add all action handlers).
	ms.setActionHandler('play', tP);
	ms.setActionHandler('pause', tP);
	ms.setActionHandler('stop', function() { /* Code excerpted. */ });
	ms.setActionHandler('seekbackward', function() { /* Code excerpted. */ });
	ms.setActionHandler('seekforward', function() { /* Code excerpted. */ });
	ms.setActionHandler('seekto', function() { /* Code excerpted. */ });
	ms.setActionHandler('previoustrack', function() { /* Code excerpted. */ });
	ms.setActionHandler('nexttrack', function() { /* Code excerpted. */ });
}

module.exports = {
	changeMS
}