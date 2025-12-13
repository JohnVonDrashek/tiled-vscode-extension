import * as vscode from 'vscode';

const tokenTypes = ['tile0', 'tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6', 'tile7', 'tile8', 'tile9'];
const tokenModifiers: string[] = [];

export class TmxSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken
	): Promise<vscode.SemanticTokens> {
		const builder = new vscode.SemanticTokensBuilder();
		const text = document.getText();

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
				const tokenType = tokenTypes[tileIndex];

				// Calculate line and character position
				const absoluteOffset = dataStartOffset + numberMatch.index;
				const position = document.positionAt(absoluteOffset);
				const length = numberMatch[0].length;

				// Add semantic token with the appropriate type
				builder.push(
					position.line,
					position.character,
					length,
					tokenTypes.indexOf(tokenType),
					0
				);
			}
		}

		return builder.build();
	}
}

export function registerSemanticTokensProvider(context: vscode.ExtensionContext): vscode.Disposable {
	const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
	const provider = new TmxSemanticTokensProvider();

	return vscode.languages.registerDocumentSemanticTokensProvider(
		{ language: 'tmx' },
		provider,
		legend
	);
}


