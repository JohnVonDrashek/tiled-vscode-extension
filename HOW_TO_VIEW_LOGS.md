# How to View VSCode Extension Logs

To debug the extension and see error logs, follow these steps:

## Method 1: Developer Console (Easiest)

1. Open the Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **"Developer: Toggle Developer Tools"**
3. Click on the **"Console"** tab
4. Look for errors prefixed with your extension name or related to "tiledMapViewer"

## Method 2: Output Panel

1. Open the Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **"Output"** or **"View: Toggle Output"**
3. In the dropdown at the top right of the Output panel, select **"Log (Extension Host)"**
4. Look for errors from "tiled-map-viewer" extension

## Method 3: Extension Logs (Full Logs)

1. Open the Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **"Developer: Show Logs..."**
3. Navigate to the extension host logs folder
4. Open the most recent log file

## Method 4: From Terminal (macOS/Linux)

The logs are typically located at:
- **macOS**: `~/Library/Application Support/Code/logs/`
- **Windows**: `%APPDATA%\Code\logs\`
- **Linux**: `~/.config/Code/logs/`

Look for files like:
- `exthost*/exthost.log` (Extension Host log)
- `renderer*.log` (Renderer log)

## What to Look For

- Errors starting with "Error in resolveCustomTextEditor"
- Errors starting with "Parse error"
- Errors starting with "Error resolving image path"
- Any stack traces or exception messages






