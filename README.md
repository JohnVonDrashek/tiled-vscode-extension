# TILED Map Viewer

A VSCode extension that provides a visual preview of TILED map editor files (.tmx and .json) directly within VSCode.

## Screenshots

![TILED Map Viewer](screenshots/Screenshot%202025-12-13%20at%208.45.27%20PM.png)

![TILED Map Viewer](screenshots/Screenshot%202025-12-13%20at%208.45.39%20PM.png)

## Features

- 🗺️ **Visual Map Preview** - View your TILED maps directly in VSCode
- 📊 **Layer Management** - Show/hide individual layers
- 🔍 **Zoom Controls** - Zoom in/out and reset zoom level
- 🎨 **Multiple Layer Support** - Render all layers with proper opacity
- 📁 **File Format Support** - Supports both TMX (XML) and JSON map formats

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press `F5` in VSCode to open a new Extension Development Host window
4. In the Extension Development Host, open a `.tmx` or `.json` TILED map file
5. The map should automatically open in the TILED Map Viewer

### Building for Distribution

1. Run `npm install`
2. Run `npm run compile` to build the extension
3. Package with `vsce package` (requires [vsce](https://github.com/microsoft/vscode-vsce))

## Usage

1. Open a `.tmx` or `.json` file created by TILED in VSCode
2. The file will automatically open in the TILED Map Viewer custom editor
3. Use the controls to:
   - **Zoom**: Use the zoom slider or buttons to adjust zoom level
   - **Layers**: Toggle visibility of individual layers using checkboxes
   - **Reset**: Click "Reset Zoom" to return to 100% zoom

## Requirements

- VSCode 1.74.0 or higher
- TILED map files (.tmx or .json format)

## Known Limitations

- Tileset images are loaded via VSCode's file system API, so relative paths should work correctly
- Embedded tilesets (tilesets defined inline in TMX) are supported
- External tileset references (`.tsx` files) are not yet automatically resolved
- Only orthogonal map orientation is fully tested (isometric and hexagonal may work but are not optimized)

## Extension Settings

This extension contributes no settings currently.

## Release Notes

### 0.0.1

Initial release:
- Basic map visualization
- TMX and JSON format support
- Layer visibility toggles
- Zoom controls

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is provided as-is. TILED is a trademark of Thorbjørn Lindeijer.


















