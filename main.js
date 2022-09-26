const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");

function createWindow () {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    frame: false,
    resizable: false,
    backgroundColor: '#fff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.on("minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
  })

  ipcMain.on("refresh", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.reload();
  })

  ipcMain.on("close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
  })

  ipcMain.on("setSettings", (event, appSettings) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    
  })
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})