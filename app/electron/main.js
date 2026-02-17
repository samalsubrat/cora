const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Auto-detect dev vs production
const isDev = !app.isPackaged;
let mainWindow;

// Keep track of child windows so they aren't garbage-collected
const childWindows = new Set();

function getBaseURL() {
  if (isDev) {
    return "http://localhost:3000";
  }
  // In production, load from the bundled build folder
  return `file://${path.join(__dirname, "../build/index.html")}`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    title: "Cora",
    icon: path.join(__dirname, "../build/favicon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load React App
  mainWindow.loadURL(getBaseURL());

  mainWindow.on("closed", () => {
    mainWindow = null;
    // Close all child windows when the main window is closed
    childWindows.forEach((w) => {
      if (!w.isDestroyed()) w.close();
    });
    childWindows.clear();
  });
}

// IPC handler: open a component in a new window
ipcMain.handle("open-window", (_event, { route, title, width, height }) => {
  console.log("[CORA] open-window IPC received:", { route, title });

  const child = new BrowserWindow({
    width: width || 1100,
    height: height || 750,
    title: title || "Cora",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Navigate to the standalone hash route (no sidebar)
  const url = `${getBaseURL()}#/standalone${route}`;
  child.loadURL(url);

  childWindows.add(child);
  child.on("closed", () => childWindows.delete(child));
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
