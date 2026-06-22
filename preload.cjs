const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("weeklyEmailApp", {
  saveTextFile: (options) => ipcRenderer.invoke("save-text-file", options),
  readClipboardImage: () => ipcRenderer.invoke("read-clipboard-image"),
  readStoreMappings: () => ipcRenderer.invoke("read-store-mappings"),
  writeStoreMappings: (mappings) => ipcRenderer.invoke("write-store-mappings", mappings),
  openEmailDraft: (options) => ipcRenderer.invoke("open-email-draft", options),
  copyRichEmail: (options) => ipcRenderer.invoke("copy-rich-email", options),
  createOutlookDrafts: (drafts) => ipcRenderer.invoke("create-outlook-drafts", drafts),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners("update-status");
    ipcRenderer.on("update-status", (_event, message) => callback(message));
  }
});
