// preload.js
//const {contextBridge, ipcRenderer} = require("electron");
/*contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('minimize'),
	close: () => ipcRenderer.send('close'),
	refresh: () => ipcRenderer.send('refresh'),
	GetSettings: () => ipcRenderer.send('getSettings'),
	SetSettings: (appSettings) => ipcRenderer.send('setSettings', appSettings)
})*/

window.addEventListener('DOMContentLoaded', () => {
	//new Titlebar();
	const replaceText = (selector, text) => {
	  const element = document.getElementById(selector)
	  if (element) element.innerText = text
	}
  
	for (const dependency of ['chrome', 'node', 'electron']) {
	  replaceText(`${dependency}-version`, process.versions[dependency])
	}
})