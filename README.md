# Weekly Premium Email Builder

Open `index.html` in a browser, or run it as a Windows desktop app. Current app build: `1.0.20`.

Use `dist/Weekly Premium Email Builder Latest.exe` as the stable app shortcut. Each new build replaces that file so you do not need to chase versioned filenames.

GitHub Releases auto-update setup is documented in `AUTO_UPDATE.md`.

## Windows app

Install dependencies once:

```powershell
npm install
```

Run the desktop app:

```powershell
npm start
```

Or double-click `Start Weekly Email Builder.bat`.

Build a Windows installer and portable app:

```powershell
npm run build
```

The finished files will be created in `dist`.

## What it does

- Stores four starter locations in your browser.
- Lets you edit contact names, visits, important notes, MTD numbers, and monthly goals.
- Automatically writes progress lines like `73% to goal ($2,000 remaining)`.
- Copies one store email or all store emails.
- Saves the current email or all store emails to `.txt` files.
- Free Smart Writer polishes one email or all store emails without an API key.
- Imports and exports data as JSON.
- Imports screenshots, CSV/TSV files, or pasted rows.
- Screenshot import uses in-browser OCR, so a clear full-width PNG/JPG/WEBP works best.
- Screenshot imports create store-specific notes for every store row found in the report.
- Copy a report screenshot and press `Ctrl+V` in the app to import, polish, and draft all store emails in one step.
- Store Number Settings let you map report store numbers to real store names and contact names.
- CSV/TSV files can use these simple weekly-email headers:

```csv
store,contact,weekStart,weekEnd,visitDate,representative,importantNotes,helpNotes,metric,mtd,goal,format
```

Valid metric formats are `number`, `percent`, and `currency`.

It also recognizes performance report exports with headers like:

```csv
StoreNumber,Territory - SM,Post PSPD,App PSPD,Pre ACTs PSPD,Pre Units PSPD,ACC$PSPD,Install Retail,Total Protect Rate,Post ACTs,Apps,BYOD ACTs,Pre ACT Rate,Store Count
```

You can paste rows copied from Excel into the Paste Store Report box and import them without saving a file first.
