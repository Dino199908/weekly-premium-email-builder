const { contextBridge, ipcRenderer } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function assetUrl(relativePath) {
  return pathToFileURL(path.join(__dirname, relativePath)).href;
}

contextBridge.exposeInMainWorld("weeklyEmailApp", {
  saveTextFile: (options) => ipcRenderer.invoke("save-text-file", options),
  readClipboardImage: () => ipcRenderer.invoke("read-clipboard-image"),
  readStoreMappings: () => ipcRenderer.invoke("read-store-mappings"),
  writeStoreMappings: (mappings) => ipcRenderer.invoke("write-store-mappings", mappings),
  openEmailDraft: (options) => ipcRenderer.invoke("open-email-draft", options),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners("update-status");
    ipcRenderer.on("update-status", (_event, message) => callback(message));
  },
  ocrAssets: {
    workerPath: assetUrl("vendor/tesseract/worker.min.js"),
    corePath: assetUrl("vendor/tesseract/tesseract-core-simd-lstm.wasm.js"),
    langPath: assetUrl("vendor/tesseract/lang")
  }
});
