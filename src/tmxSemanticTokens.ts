import * as vscode from 'vscode';

const tokenTypes = ['tile0', 'tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6', 'tile7', 'tile8', 'tile9', 'definedAttribute', 'customAttribute'];
const tokenModifiers: string[] = [];

// Official TMX attributes for each element
const officialAttributes: { [key: string]: Set<string> } = {
	'map': new Set([
		'version', 'tiledversion', 'orientation', 'renderorder', 'width', 'height',
		'tilewidth', 'tileheight', 'infinite', 'nextlayerid', 'nextobjectid',
		'backgroundcolor', 'hexsidelength'
	]),
	'tileset': new Set([
		'firstgid', 'source', 'name', 'tilewidth', 'tileheight', 'spacing',
		'margin', 'tilecount', 'columns'
	]),
	'layer': new Set([
		'id', 'name', 'x', 'y', 'width', 'height', 'opacity', 'visible',
		'tintcolor', 'offsetx', 'offsety'
	]),
	'objectgroup': new Set([
		'id', 'name', 'color', 'x', 'y', 'width', 'height', 'opacity',
		'visible', 'tintcolor', 'offsetx', 'offsety', 'draworder'
	]),
	'imagelayer': new Set([
		'id', 'name', 'offsetx', 'offsety', 'x', 'y', 'opacity', 'visible', 'tintcolor'
	]),
	'group': new Set([
		'id', 'name', 'offsetx', 'offsety', 'opacity', 'visible', 'tintcolor'
	]),
	'object': new Set([
		'id', 'name', 'type', 'x', 'y', 'width', 'height', 'rotation',
		'gid', 'visible', 'template'
	]),
	'property': new Set(['name', 'type', 'value']),
	'text': new Set([
		'fontfamily', 'pixelsize', 'wrap', 'color', 'bold', 'italic',
		'underline', 'strikeout', 'kerning', 'halign', 'valign'
	]),
	'frame': new Set(['tileid', 'duration']),
	'terrain': new Set(['name', 'tile']),
	'wangtile': new Set(['tileid', 'wangid']),
	'wangcorner': new Set(['name', 'color', 'tile', 'probability']),
	'wangedge': new Set(['name', 'color', 'tile', 'probability']),
	'image': new Set(['source', 'width', 'height', 'format']),
	'data': new Set(['encoding', 'compression'])
};

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

		// Parse XML attributes and classify them as defined or custom
		this.parseXmlAttributes(text, document, builder);

		return builder.build();
	}

	private parseXmlAttributes(text: string, document: vscode.TextDocument, builder: vscode.SemanticTokensBuilder) {
		// Find all XML tags with attributes
		const tagRegex = /<(\w+)([^>]*)>/g;
		let tagMatch;

		while ((tagMatch = tagRegex.exec(text)) !== null) {
			const elementName = tagMatch[1];
			const attributesString = tagMatch[2];
			const tagStartOffset = tagMatch.index;

			// Find all attributes in this tag
			const attrRegex = /(\w+)\s*=\s*["'][^"']*["']/g;
			let attrMatch;

			while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
				const attrName = attrMatch[1];
				const attrStartInTag = attrMatch.index;
				// Calculate absolute offset: tag start + '<' + elementName + space + attribute position in attributesString
				const absoluteOffset = tagStartOffset + 1 + elementName.length + attrStartInTag;

				// Check if this attribute is officially defined for this element
				const isDefined = this.isOfficialAttribute(elementName, attrName);
				const tokenType = isDefined ? 'definedAttribute' : 'customAttribute';

				const position = document.positionAt(absoluteOffset);
				const length = attrName.length;

				builder.push(
					position.line,
					position.character,
					length,
					tokenTypes.indexOf(tokenType),
					0
				);
			}
		}
	}

	private isOfficialAttribute(elementName: string, attributeName: string): boolean {
		const elementAttrs = officialAttributes[elementName];
		if (!elementAttrs) {
			// If we don't know about this element, consider all its attributes as custom
			return false;
		}
		return elementAttrs.has(attributeName);
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


