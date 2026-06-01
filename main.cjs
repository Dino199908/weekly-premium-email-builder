const { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs/promises");
const path = require("node:path");

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 920,
    minWidth: 980,
    minHeight: 720,
    title: "Weekly Premium Email Builder",
    backgroundColor: "#f6f7f9",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.webContents.on("before-input-event", (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        win.webContents.openDevTools();
      }
    });
  }

  mainWindow = win;
  return win;
}

function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = true;

  autoUpdater.on("update-available", () => {
    mainWindow?.webContents.send("update-status", "Update found. Downloading it now...");
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow?.webContents.send("update-status", "You are already on the latest version.");
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("update-status", `Downloading update... ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Restart and Update", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update Ready",
      message: "A new version is ready to install.",
      detail: "Restart the app now to finish the update."
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (error) => {
    mainWindow?.webContents.send("update-status", `Update check failed: ${error.message}`);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 4000);
}

function checkForUpdatesManually() {
  if (isDev) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      message: "Updates only work in the installed Windows app."
    });
    return;
  }

  mainWindow?.webContents.send("update-status", "Checking for updates...");
  autoUpdater.checkForUpdatesAndNotify();
}

function registerIpcHandlers() {
  ipcMain.handle("read-store-mappings", async () => {
    try {
      const text = await fs.readFile(storeMappingsPath(), "utf8");
      const mappings = JSON.parse(text);
      return { ok: true, mappings: Array.isArray(mappings) ? mappings : [] };
    } catch {
      return { ok: true, mappings: [] };
    }
  });

  ipcMain.handle("write-store-mappings", async (event, mappings = []) => {
    const safeMappings = Array.isArray(mappings) ? mappings : [];
    await fs.mkdir(path.dirname(storeMappingsPath()), { recursive: true });
    await fs.writeFile(storeMappingsPath(), JSON.stringify(safeMappings, null, 2), "utf8");
    return { ok: true };
  });

  ipcMain.handle("open-email-draft", async (event, options = {}) => {
    const to = String(options.to || "").trim();
    const cc = String(options.cc || "").trim();
    const subject = String(options.subject || "").trim();
    const body = String(options.body || "").trim();
    if (!to) return { ok: false, error: "No manager email address is saved for this store." };

    const query = [
      cc ? `cc=${encodeURIComponent(cc)}` : "",
      `subject=${encodeURIComponent(subject)}`,
      `body=${encodeURIComponent(body)}`
    ].filter(Boolean).join("&");
    const mailto = `mailto:${encodeURIComponent(to)}?${query}`;
    await shell.openExternal(mailto);
    return { ok: true };
  });

  ipcMain.handle("save-text-file", async (event, options = {}) => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    const defaultName = sanitizeFileName(options.defaultName || "weekly-email.txt");
    const result = await dialog.showSaveDialog(parent, {
      title: options.title || "Save Email",
      defaultPath: defaultName,
      filters: [
        { name: "Text Files", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    await fs.writeFile(result.filePath, options.text || "", "utf8");
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle("read-clipboard-image", async () => {
    const text = clipboard.readText();
    const html = clipboard.readHTML();
    const image = clipboard.readImage();
    if (image.isEmpty()) {
      if (text || html) {
        return { ok: true, text, html };
      }
      return { ok: false, error: "No screenshot or copied report rows were found on the clipboard. Copy the screenshot again, then click Paste Screenshot." };
    }

    return {
      ok: true,
      text,
      html,
      dataUrl: image.toDataURL()
    };
  });
}

function storeMappingsPath() {
  return path.join(app.getPath("userData"), "store-number-settings.json");
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Check for Updates",
          click: () => checkForUpdatesManually()
        },
        { type: "separator" },
        {
          label: "Reload",
          accelerator: "Ctrl+R",
          click: (_, focusedWindow) => focusedWindow?.reload()
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Alt+F4",
          click: () => app.quit()
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMenu();
  createWindow();
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
