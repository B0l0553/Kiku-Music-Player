const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");
const mapi = require("./mapi");

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    resizable: true,
    minHeight: 500,
    minWidth: 900,
    backgroundColor: '#fff',
    icon: "./assets/icons/yu_music.ico",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  win.on("minimize", () => {
    win.webContents.send("minimized", win.isMinimized());
  })

  win.on("restore", () => {
    win.webContents.send("minimized", win.isMinimized());
  })

  win.on("enter-full-screen", () => {
    win.webContents.send("fullscreen", true);
  })
  win.on("leave-full-screen", () => {
    win.webContents.send("fullscreen", false);
  })

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.on("minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
  });

  ipcMain.on("refresh", (event, arg) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    mapi.WriteUserData(arg[0]);
    mapi.WriteCache(arg[1]);
    mapi.wHistory(arg[2]);
    win.reload();
  });

  ipcMain.on("close", (event, arg) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    mapi.WriteUserData(arg[0]);
    mapi.WriteCache(arg[1]);
    mapi.wHistory(arg[2]);
    win.close();
  });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})