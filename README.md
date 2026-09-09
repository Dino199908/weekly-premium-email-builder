# Weekly Premium Email Builder

Open `index.html` in a browser, or run it as a Windows desktop app. Current app build: `1.0.37`.

Use `dist/Weekly Premium Email Builder Latest.exe` as the stable app shortcut. Each new build replaces that file so you do not need to chase versioned filenames.

GitHub Releases auto-update setup is documented in `AUTO_UPDATE.md`.

## Codex Thread Reader

Use this local helper when another Codex thread has useful context:

```powershell
npm run read-thread -- --list "Portal"
npm run read-thread -- --thread "Portal Updates" --query "weekly email" --context 2
```

Add `--include-tools` when the answer is likely inside command output.

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

- Provides searchable store navigation and dedicated Overview, Reports, Email, History, and Settings views.
- Keeps all saved stores and contacts between updates.
- Separates rich email and plain-text previews, with Outlook and export actions alongside the draft.
- Imports current and previous month reports separately and includes monthly comparisons in emails.
- Lets you edit contact names, visits, important notes, News updates, MTD numbers, and monthly goals.
- Copies a formatted, Outlook-ready HTML email with inline goal progress bars.
- Saves weekly store snapshots, rolls them into monthly history, compares metric movement, and duplicates last week's setup into the current week.
- Shows Ready, Needs Review, Needs Data, and Sent status for every store.
- Creates automatic coaching insights from the strongest result, biggest gap, and needed daily pace.
- Saves reusable store profiles with contacts, representatives, preferred wording, and goals.
- Runs seven pre-send checks for email, dates, visits, metrics, goals, notes, and saved state.
- Opens formatted store emails in new Outlook without a Microsoft app registration, or creates drafts directly in Classic Outlook.
- Includes expanded default store-number mappings, with Walmart manager emails generated from the same store-number pattern used by Jason's store.
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
store,contact,weekStart,weekEnd,visitDate,representative,importantNotes,helpNotes,news,metric,mtd,goal,format
```

Valid metric formats are `number`, `percent`, and `currency`.

It also recognizes performance report exports with headers like:

```csv
StoreNumber,Territory - SM,Post PSPD,App PSPD,Pre ACTs PSPD,Pre Units PSPD,ACC$PSPD,Install Retail,Total Protect Rate,Post ACTs,Apps,BYOD ACTs,Pre ACT Rate,Store Count
```

You can paste rows copied from Excel into the Paste Store Report box and import them without saving a file first.

## Outlook drafts

Choose `New Outlook (No Sign-In)` and then `Open in New Outlook`. The app copies the fully formatted email and opens a new message with the recipient, CC, and subject filled in. Press `Ctrl+V` once in the message body. New Outlook automatically saves the unsent message in Drafts. No Microsoft Application ID or administrator approval is required.

For multiple stores, choose `Start All Drafts`. After pasting each email in Outlook, return to the builder and choose `Open Next Draft` until the queue is complete. This one-at-a-time flow keeps the correct formatted email on the clipboard for each store.

Choose `Classic Outlook` to create one or all drafts directly in the installed Windows desktop client without copying and pasting. The app never sends messages automatically.
