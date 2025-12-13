import * as vscode from 'vscode';
import { TiledMapEditorProvider } from './tiledMapEditor';

const decorationTypes = [
	vscode.window.createTextEditorDecorationType({ color: '#808080', fontStyle: 'italic' }), // tile0
	vscode.window.createTextEditorDecorationType({ color: '#569cd6' }), // tile1
	vscode.window.createTextEditorDecorationType({ color: '#4ec9b0' }), // tile2
	vscode.window.createTextEditorDecorationType({ color: '#dcdcaa' }), // tile3
	vscode.window.createTextEditorDecorationType({ color: '#ce9178' }), // tile4
	vscode.window.createTextEditorDecorationType({ color: '#d7ba7d' }), // tile5
	vscode.window.createTextEditorDecorationType({ color: '#c586c0' }), // tile6
	vscode.window.createTextEditorDecorationType({ color: '#9cdcfe' }), // tile7
	vscode.window.createTextEditorDecorationType({ color: '#4fc1ff' }), // tile8
	vscode.window.createTextEditorDecorationType({ color: '#f48771' }), // tile9
];

export function activate(context: vscode.ExtensionContext) {
	// Register custom editor provider for TILED map files
	context.subscriptions.push(
		TiledMapEditorProvider.register(context)
	);

	// Apply number decorations when TMX files are opened
	vscode.workspace.onDidOpenTextDocument((document) => {
		if (document.languageId === 'tmx') {
			updateDecorations(document);
		}
	});

	vscode.workspace.onDidChangeTextDocument((event) => {
		if (event.document.languageId === 'tmx') {
			updateDecorations(event.document);
		}
	});

	// Apply decorations when text editors become visible (important for switching back from custom editor)
	vscode.window.onDidChangeVisibleTextEditors((editors) => {
		editors.forEach((editor) => {
			if (editor.document.languageId === 'tmx') {
				updateDecorations(editor.document);
			}
		});
	});

	// Decorate any open TMX files
	vscode.window.visibleTextEditors.forEach((editor) => {
		if (editor.document.languageId === 'tmx') {
			updateDecorations(editor.document);
		}
	});

	// Register reset zoom command
	context.subscriptions.push(
		vscode.commands.registerCommand('tiledMapViewer.resetZoom', () => {
			vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction');
		})
	);

	// Register command to open file in custom viewer
	context.subscriptions.push(
		vscode.commands.registerCommand('tiledMapViewer.openInViewer', async (uri?: vscode.Uri) => {
			const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
			if (fileUri) {
				await vscode.commands.executeCommand('vscode.openWith', fileUri, 'tiledMapViewer.mapViewer');
			}
		})
	);
}

function updateDecorations(document: vscode.TextDocument) {
	const text = document.getText();
	const decorations: vscode.DecorationOptions[][] = Array.from({ length: 10 }, () => []);

	// Find all <data encoding="csv"> sections
	const csvDataRegex = /<data[^>]*encoding\s*=\s*["']csv["'][^>]*>([\s\S]*?)<\/data>/gi;
	let match;

	while ((match = csvDataRegex.exec(text)) !== null) {
		const csvContent = match[1];
		const dataStartOffset = match.index + match[0].indexOf(csvContent);

		// Find all numbers in the CSV content
		const numberRegex = /\d+/g;
		let numberMatch;

		while ((numberMatch = numberRegex.exec(csvContent)) !== null) {
			const numberValue = parseInt(numberMatch[0]);
			const tileIndex = numberValue % 10;

			// Calculate line and character position
			const absoluteOffset = dataStartOffset + numberMatch.index;
			const position = document.positionAt(absoluteOffset);
			const endPosition = document.positionAt(absoluteOffset + numberMatch[0].length);

			decorations[tileIndex].push({
				range: new vscode.Range(position, endPosition)
			});
		}
	}

	// Apply decorations to all visible TMX editors
	vscode.window.visibleTextEditors.forEach((editor) => {
		if (editor.document === document) {
			decorationTypes.forEach((type, index) => {
				editor.setDecorations(type, decorations[index]);
			});
		}
	});
}

export function deactivate() {}



