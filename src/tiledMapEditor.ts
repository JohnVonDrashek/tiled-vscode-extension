import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseTMX, parseJSON, TiledMap } from './tiledMapParser';

export class TiledMapEditorProvider implements vscode.CustomEditorProvider<vscode.CustomDocument> {
	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentContentChangeEvent<vscode.CustomDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new TiledMapEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(
			'tiledMapViewer.mapViewer',
			provider,
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		);
		return providerRegistration;
	}

	constructor(private readonly context: vscode.ExtensionContext) {}

	public async openCustomDocument(
		uri: vscode.Uri,
		openContext: vscode.CustomDocumentOpenContext,
		_token: vscode.CancellationToken
	): Promise<vscode.CustomDocument> {
		// For readonly editors, we return a minimal document object
		const document: vscode.CustomDocument = {
			uri: uri,
			dispose: () => {}
		};
		return document;
	}

	public async saveCustomDocument(
		document: vscode.CustomDocument,
		cancellation: vscode.CancellationToken
	): Promise<void> {
		// Read-only viewer, no saving needed
	}

	public async saveCustomDocumentAs(
		document: vscode.CustomDocument,
		destination: vscode.Uri,
		cancellation: vscode.CancellationToken
	): Promise<void> {
		// Read-only viewer, no saving needed
	}

	public async revertCustomDocument(
		document: vscode.CustomDocument,
		cancellation: vscode.CancellationToken
	): Promise<void> {
		// Read-only viewer, no reverting needed
	}

	public async backupCustomDocument(
		document: vscode.CustomDocument,
		context: vscode.CustomDocumentBackupContext,
		cancellation: vscode.CancellationToken
	): Promise<vscode.CustomDocumentBackup> {
		// Return a minimal backup
		return {
			id: document.uri.toString(),
			delete: async () => {}
		};
	}

	public async resolveCustomEditor(
		document: vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		try {
			if (!this.context.extensionUri) {
				throw new Error('Extension URI is not available');
			}

			const filePath = document.uri.fsPath;
			if (!filePath) {
				webviewPanel.webview.html = this.getErrorWebviewContent(
					'Cannot open map file: File path is not available. Please save the file first.'
				);
				return;
			}
			const mapDir = path.dirname(filePath);

			// Set webview options FIRST before any URI conversions
			webviewPanel.webview.options = {
				enableScripts: true,
			};

			// Set initial loading HTML immediately
			webviewPanel.webview.html = '<!DOCTYPE html><html><body><p>Loading map...</p></body></html>';

			const updateWebview = async () => {
				// Read the file content directly from the URI
				const fileData = await vscode.workspace.fs.readFile(document.uri);
				const content = Buffer.from(fileData).toString('utf8');
				const fileExt = path.extname(filePath).toLowerCase();
				
				let mapData: TiledMap;
				try {
					if (fileExt === '.tmx') {
						mapData = await parseTMX(content);
					} else if (fileExt === '.json') {
						mapData = parseJSON(content);
					} else {
						throw new Error(`Unsupported file format: ${fileExt}`);
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					const errorStack = error instanceof Error ? error.stack : '';
					console.error('Parse error:', errorMessage, errorStack);
					webviewPanel.webview.html = this.getErrorWebviewContent(
						`Failed to parse map file: ${errorMessage}`
					);
					return;
				}

				// No image handling - just display text data

				webviewPanel.webview.html = this.getWebviewContent(
					webviewPanel.webview,
					document.uri,
					mapData
				);
			};

			// Initial update
			await updateWebview().catch(error => {
				console.error('Error in initial updateWebview:', error);
				webviewPanel.webview.html = this.getErrorWebviewContent(
					`Error loading map: ${error instanceof Error ? error.message : String(error)}`
				);
			});

			// Watch for file changes
			const fileWatcher = vscode.workspace.createFileSystemWatcher(document.uri.fsPath);
			fileWatcher.onDidChange(() => {
				updateWebview().catch(error => {
					console.error('Error updating webview:', error);
				});
			});

			webviewPanel.onDidDispose(() => {
				fileWatcher.dispose();
			});

			// Handle messages from webview
			webviewPanel.webview.onDidReceiveMessage(async message => {
				switch (message.command) {
					case 'reopenAsText':
						// Reopen the file with the default text editor
						await vscode.commands.executeCommand('workbench.action.reopenTextEditor');
						break;
				}
			});
		} catch (error) {
			console.error('Error in resolveCustomTextEditor:', error);
			webviewPanel.webview.html = this.getErrorWebviewContent(
				`Failed to initialize editor: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}


	private getWebviewContent(
		webview: vscode.Webview,
		documentUri: vscode.Uri,
		mapData: TiledMap
	): string {
		// Format layer data as text grid with colors
		const formatLayerData = (layer: any) => {
			const rows: string[] = [];
			for (let y = 0; y < layer.height; y++) {
				const row: string[] = [];
				for (let x = 0; x < layer.width; x++) {
					const index = y * layer.width + x;
					const gid = layer.data[index]?.gid || 0;
					const gidStr = gid.toString().padStart(4);
					if (gid === 0) {
						row.push(`<span class="tile-0">${gidStr}</span>`);
					} else {
						row.push(`<span class="tile-${gid % 10}">${gidStr}</span>`);
					}
				}
				rows.push(row.join(' '));
			}
			return rows.join('\n');
		};

		const layersHtml = mapData.layers.map((layer, index) => {
			const layerData = formatLayerData(layer);
			return `
				<div class="layer-content" id="layer-${index}" ${index === 0 ? '' : 'style="display: none;"'}>
					<h3>${layer.name}</h3>
					<pre>${layerData}</pre>
				</div>
			`;
		}).join('');

		const layerButtons = mapData.layers.map((layer, index) => {
			return `<button class="layer-btn" onclick="showLayer(${index})">${layer.name}</button>`;
		}).join('');

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>TILED Map Viewer</title>
	<style>
		body {
			margin: 0;
			padding: 20px;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			font-family: var(--vscode-font-family);
		}

		.info {
			margin-bottom: 15px;
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}

		.layer-selector {
			margin-bottom: 20px;
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
		}

		.layer-btn {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: none;
			padding: 8px 16px;
			cursor: pointer;
			border-radius: 2px;
			font-size: 13px;
		}

		.layer-btn:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}

		.layer-btn.active {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}

		.layer-content {
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			padding: 15px;
			background: var(--vscode-editor-background);
		}

		.layer-content h3 {
			margin-top: 0;
			margin-bottom: 15px;
			font-size: 16px;
		}

		.layer-content pre {
			margin: 0;
			font-family: 'Courier New', monospace;
			font-size: 12px;
			line-height: 1.4;
			overflow-x: auto;
			white-space: pre;
		}

		.layer-content pre span {
			display: inline-block;
			padding: 2px 4px;
			border-radius: 2px;
			margin: 0 1px;
		}

		.tile-0 {
			color: var(--vscode-descriptionForeground);
			background: transparent;
			opacity: 0.3;
		}
		.tile-1 {
			color: #ffffff;
			background: #569cd6;
		}
		.tile-2 {
			color: #ffffff;
			background: #4ec9b0;
		}
		.tile-3 {
			color: #000000;
			background: #dcdcaa;
		}
		.tile-4 {
			color: #ffffff;
			background: #ce9178;
		}
		.tile-5 {
			color: #000000;
			background: #d7ba7d;
		}
		.tile-6 {
			color: #ffffff;
			background: #c586c0;
		}
		.tile-7 {
			color: #000000;
			background: #9cdcfe;
		}
		.tile-8 {
			color: #ffffff;
			background: #4fc1ff;
		}
		.tile-9 {
			color: #ffffff;
			background: #f48771;
		}

		.switch-view-btn {
			margin-left: 15px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 4px 12px;
			cursor: pointer;
			border-radius: 2px;
			font-size: 11px;
		}

		.switch-view-btn:hover {
			background: var(--vscode-button-hoverBackground);
		}
	</style>
</head>
<body>
	<div class="info">
		<strong>Map:</strong> ${mapData.width} × ${mapData.height} tiles | 
		<strong>Tile Size:</strong> ${mapData.tilewidth} × ${mapData.tileheight}px | 
		<strong>Orientation:</strong> ${mapData.orientation} | 
		<strong>Layers:</strong> ${mapData.layers.length}
		<button class="switch-view-btn" onclick="switchToTextView()">📝 View as Text</button>
	</div>

	<div class="layer-selector">
		${layerButtons}
	</div>

	${layersHtml}

	<script>
		const vscode = acquireVsCodeApi();
		const mapData = ${JSON.stringify(mapData)};
		
		function showLayer(index) {
			// Hide all layers
			for (let i = 0; i < mapData.layers.length; i++) {
				const layerEl = document.getElementById('layer-' + i);
				const btn = document.querySelectorAll('.layer-btn')[i];
				if (layerEl) layerEl.style.display = 'none';
				if (btn) btn.classList.remove('active');
			}
			
			// Show selected layer
			const layerEl = document.getElementById('layer-' + index);
			const btn = document.querySelectorAll('.layer-btn')[index];
			if (layerEl) layerEl.style.display = 'block';
			if (btn) btn.classList.add('active');
		}

		function switchToTextView() {
			vscode.postMessage({
				command: 'reopenAsText'
			});
		}

		// Show first layer by default
		if (mapData.layers.length > 0) {
			showLayer(0);
		}
	</script>
</body>
</html>`;
	}

	private getErrorWebviewContent(error: string): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>TILED Map Viewer - Error</title>
	<style>
		body {
			margin: 20px;
			padding: 20px;
			background: var(--vscode-editor-background);
			color: var(--vscode-errorForeground);
			font-family: var(--vscode-font-family);
		}
		.error {
			padding: 10px;
			background: var(--vscode-inputValidation-errorBackground);
			border: 1px solid var(--vscode-inputValidation-errorBorder);
			border-radius: 4px;
		}
	</style>
</head>
<body>
	<div class="error">
		<h2>Error Loading Map</h2>
		<p>${error}</p>
	</div>
</body>
</html>`;
	}
}

