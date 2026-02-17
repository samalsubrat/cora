const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Open a dashboard component in a new Electron window.
   * @param {{ route: string, title?: string, width?: number, height?: number }} opts
   */
  openWindow: (opts) => ipcRenderer.invoke("open-window", opts),
});
