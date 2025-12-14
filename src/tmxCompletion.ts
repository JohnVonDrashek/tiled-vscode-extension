import * as vscode from 'vscode';

export class TmxCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): vscode.CompletionItem[] | vscode.CompletionList {
		const line = document.lineAt(position.line).text;
		const linePrefix = line.substring(0, position.character);

		// Determine context based on the current line
		if (this.isInsideTag(linePrefix)) {
			return this.getAttributeCompletions(linePrefix);
		} else if (this.isOpeningTag(linePrefix)) {
			return this.getElementCompletions();
		} else if (this.isAttributeValue(linePrefix)) {
			return this.getAttributeValueCompletions(linePrefix);
		}

		// Default: show all elements and common attributes
		return this.getDefaultCompletions();
	}

	isInsideTag(linePrefix: string): boolean {
		const tagMatch = linePrefix.match(/<[^>]*$/);
		return tagMatch !== null && !linePrefix.includes('>') && !this.isOpeningTag(linePrefix);
	}

	isOpeningTag(linePrefix: string): boolean {
		return /<\w*$/.test(linePrefix);
	}

	isAttributeValue(linePrefix: string): boolean {
		return /=\s*["'][^"']*$/.test(linePrefix);
	}

	getElementCompletions(): vscode.CompletionItem[] {
		// All TMX elements from official documentation
		const elements = [
			'map', 'editorsettings', 'tileset', 'layer', 'objectgroup',
			'imagelayer', 'group', 'properties', 'property', 'object',
			'ellipse', 'polygon', 'polyline', 'text', 'image', 'terrain',
			'tile', 'animation', 'frame', 'wangset', 'wangtile', 'wangcorner', 'wangedge'
		];

		return elements.map(element => {
			const item = new vscode.CompletionItem(element, vscode.CompletionItemKind.Class);
			item.insertText = new vscode.SnippetString(`${element}$1>$2</${element}>`);
			item.documentation = `Tiled ${element} element`;
			return item;
		});
	}

	getAttributeCompletions(linePrefix: string): vscode.CompletionItem[] {
		// Extract the element name from the line
		const elementMatch = linePrefix.match(/<(\w+)/);
		if (!elementMatch) return this.getDefaultAttributes();

		const element = elementMatch[1];
		let attributes: string[] = [];

		switch (element) {
			case 'map':
				attributes = [
					'version', 'tiledversion', 'orientation', 'renderorder',
					'width', 'height', 'tilewidth', 'tileheight', 'infinite',
					'nextlayerid', 'nextobjectid', 'backgroundcolor', 'hexsidelength'
				];
				break;
			case 'tileset':
				attributes = [
					'firstgid', 'source', 'name', 'tilewidth', 'tileheight',
					'spacing', 'margin', 'tilecount', 'columns'
				];
				break;
			case 'layer':
				attributes = [
					'id', 'name', 'x', 'y', 'width', 'height', 'opacity',
					'visible', 'tintcolor', 'offsetx', 'offsety'
				];
				break;
			case 'objectgroup':
				attributes = [
					'id', 'name', 'color', 'x', 'y', 'width', 'height', 'opacity',
					'visible', 'tintcolor', 'offsetx', 'offsety', 'draworder'
				];
				break;
			case 'imagelayer':
				attributes = [
					'id', 'name', 'offsetx', 'offsety', 'x', 'y', 'opacity',
					'visible', 'tintcolor'
				];
				break;
			case 'group':
				attributes = [
					'id', 'name', 'offsetx', 'offsety', 'opacity', 'visible', 'tintcolor'
				];
				break;
			case 'object':
				attributes = [
					'id', 'name', 'type', 'x', 'y', 'width', 'height',
					'rotation', 'gid', 'visible', 'template'
				];
				break;
			case 'property':
				attributes = ['name', 'type', 'value'];
				break;
			case 'text':
				attributes = ['fontfamily', 'pixelsize', 'wrap', 'color', 'bold', 'italic', 'underline', 'strikeout', 'kerning', 'halign', 'valign'];
				break;
			case 'frame':
				attributes = ['tileid', 'duration'];
				break;
			case 'terrain':
				attributes = ['name', 'tile'];
				break;
			case 'wangtile':
				attributes = ['tileid', 'wangid'];
				break;
			case 'wangcorner':
			case 'wangedge':
				attributes = ['name', 'color', 'tile', 'probability'];
				break;
			default:
				attributes = ['id', 'name', 'x', 'y', 'width', 'height', 'visible'];
		}

		return attributes.map(attr => {
			const item = new vscode.CompletionItem(attr, vscode.CompletionItemKind.Property);
			item.insertText = new vscode.SnippetString(`${attr}="$1"`);
			item.documentation = `Tiled ${attr} attribute for ${element}`;
			return item;
		});
	}

	getAttributeValueCompletions(linePrefix: string): vscode.CompletionItem[] {
		// Extract the attribute name from the line
		const attrMatch = linePrefix.match(/(\w+)\s*=\s*["'][^"']*$/);
		if (!attrMatch) return [];

		const attribute = attrMatch[1];
		let values: string[] = [];

		switch (attribute) {
			case 'orientation':
				values = ['orthogonal', 'isometric', 'staggered', 'hexagonal'];
				break;
			case 'renderorder':
				values = ['right-down', 'right-up', 'left-down', 'left-up'];
				break;
			case 'draworder':
				values = ['topdown', 'index'];
				break;
			case 'encoding':
				values = ['csv', 'base64'];
				break;
			case 'compression':
				values = ['gzip', 'zlib', 'zstd'];
				break;
			case 'type':
				values = ['string', 'int', 'float', 'bool', 'color', 'file', 'object'];
				break;
			case 'halign':
				values = ['left', 'center', 'right', 'justify'];
				break;
			case 'valign':
				values = ['top', 'center', 'bottom'];
				break;
			case 'visible':
			case 'infinite':
			case 'bold':
			case 'italic':
			case 'underline':
			case 'strikeout':
			case 'kerning':
			case 'wrap':
				values = ['0', '1'];
				break;
			default:
				return []; // No predefined values for this attribute
		}

		return values.map(value => {
			const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
			item.insertText = value;
			item.documentation = `${attribute} value: ${value}`;
			return item;
		});
	}

	getDefaultCompletions(): vscode.CompletionItem[] {
		const items: vscode.CompletionItem[] = [];

		// Add common elements
		const elements = ['map', 'tileset', 'layer', 'objectgroup', 'object', 'properties'];
		elements.forEach(element => {
			const item = new vscode.CompletionItem(element, vscode.CompletionItemKind.Class);
			item.insertText = `${element}>`;
			item.documentation = `Tiled ${element} element`;
			items.push(item);
		});

		// Add common attributes
		const attributes = ['id', 'name', 'width', 'height', 'x', 'y', 'visible', 'opacity'];
		attributes.forEach(attr => {
			const item = new vscode.CompletionItem(attr, vscode.CompletionItemKind.Property);
			item.insertText = `${attr}="`;
			item.documentation = `Tiled ${attr} attribute`;
			items.push(item);
		});

		return items;
	}

	getDefaultAttributes(): vscode.CompletionItem[] {
		const attributes = ['id', 'name', 'x', 'y', 'width', 'height', 'visible', 'opacity'];
		return attributes.map(attr => {
			const item = new vscode.CompletionItem(attr, vscode.CompletionItemKind.Property);
			item.insertText = new vscode.SnippetString(`${attr}="$1"`);
			item.documentation = `Tiled ${attr} attribute`;
			return item;
		});
	}
}

export function registerCompletionProvider(context: vscode.ExtensionContext): vscode.Disposable {
	const provider = new TmxCompletionProvider();
	return vscode.languages.registerCompletionItemProvider(
		{ language: 'tmx' },
		provider,
		'<', ' '
	);
}
