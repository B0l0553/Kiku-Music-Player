const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false,
    resizable: true,
    minHeight: 512,
    minWidth: 512,
    backgroundColor: '#fff',
    icon: "icons/AkioCrossedArmsCloseUp.png",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.on("minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
  });

  ipcMain.on("refresh", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.reload();
  });

  ipcMain.on("close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})