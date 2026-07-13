const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("weeklyEmailApp", {
  saveTextFile: (options) => ipcRenderer.invoke("save-text-file", options),
  readClipboardImage: () => ipcRenderer.invoke("read-clipboard-image"),
  readStoreMappings: () => ipcRenderer.invoke("read-store-mappings"),
  writeStoreMappings: (mappings) => ipcRenderer.invoke("write-store-mappings", mappings),
  openEmailDraft: (options) => ipcRenderer.invoke("open-email-draft", options),
  copyRichEmail: (options) => ipcRenderer.invoke("copy-rich-email", options),
  openOutlookCompose: (options) => ipcRenderer.invoke("open-outlook-compose", options),
  createOutlookDrafts: (options) => ipcRenderer.invoke("create-outlook-drafts", options),
  getAIStatus: () => ipcRenderer.invoke("get-ai-status"),
  saveAIKey: (key) => ipcRenderer.invoke("save-ai-key", key),
  polishEmailWithAI: (options) => ipcRenderer.invoke("polish-email-with-ai", options),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners("update-status");
    ipcRenderer.on("update-status", (_event, message) => callback(message));
  }
});
