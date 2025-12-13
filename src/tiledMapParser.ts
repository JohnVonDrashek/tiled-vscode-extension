import * as xml2js from 'xml2js';

export interface TileData {
	gid: number;
}

export interface Layer {
	name: string;
	width: number;
	height: number;
	data: TileData[];
	visible?: boolean;
	opacity?: number;
}

export interface Tileset {
	firstgid: number;
	source?: string;
	name?: string;
	tilewidth?: number;
	tileheight?: number;
	image?: {
		source: string;
		width: number;
		height: number;
	};
}

export interface TiledMap {
	width: number;
	height: number;
	tilewidth: number;
	tileheight: number;
	orientation: string;
	layers: Layer[];
	tilesets: Tileset[];
	properties?: Record<string, string>;
}

/**
 * Parse a TMX (XML) file into a TiledMap object
 */
export async function parseTMX(content: string): Promise<TiledMap> {
	const parser = new xml2js.Parser({
		explicitArray: false,
		mergeAttrs: true,
		explicitRoot: false
	});

	const result = await parser.parseStringPromise(content);
	const map = result.map || result;

	// Parse layers
	const layers: Layer[] = [];
	if (map.layer) {
		const layerArray = Array.isArray(map.layer) ? map.layer : [map.layer];
		for (const layer of layerArray) {
			const layerData: Layer = {
				name: layer.name || 'Layer',
				width: parseInt(layer.width || '0'),
				height: parseInt(layer.height || '0'),
				data: [],
				visible: layer.visible !== '0' && layer.visible !== false,
				opacity: parseFloat(layer.opacity || '1.0')
			};

			// Parse tile data
			if (layer.data) {
				const dataContent = layer.data._ || layer.data || '';
				const dataText = typeof dataContent === 'string' ? dataContent : '';
				// Remove newlines and whitespace, then split by comma
				const cleanData = dataText.replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
				const tileGids = cleanData.split(',')
					.map((gid: string) => gid.trim())
					.filter((gid: string) => gid.length > 0)
					.map((gid: string) => parseInt(gid))
					.filter((gid: number) => !isNaN(gid));
				
				layerData.data = tileGids.map((gid: number) => ({ gid }));
			}

			layers.push(layerData);
		}
	}

	// Parse tilesets
	const tilesets: Tileset[] = [];
	if (map.tileset) {
		const tilesetArray = Array.isArray(map.tileset) ? map.tileset : [map.tileset];
		for (const ts of tilesetArray) {
			const tileset: Tileset = {
				firstgid: parseInt(ts.firstgid || '1'),
				source: ts.source,
				name: ts.name
			};

			// Embedded tileset data
			if (ts.tilewidth) {
				tileset.tilewidth = parseInt(ts.tilewidth);
				tileset.tileheight = parseInt(ts.tileheight || ts.tilewidth);
			}

			if (ts.image) {
				// Handle both object and string formats from xml2js
				let imageSource: string;
				let imageWidth: string | number;
				let imageHeight: string | number;
				
				if (typeof ts.image === 'string') {
					imageSource = ts.image;
					imageWidth = '0';
					imageHeight = '0';
				} else {
					imageSource = ts.image.source || (typeof ts.image === 'string' ? ts.image : '');
					imageWidth = ts.image.width || '0';
					imageHeight = ts.image.height || '0';
				}
				
				if (imageSource) {
					tileset.image = {
						source: imageSource,
						width: parseInt(String(imageWidth)),
						height: parseInt(String(imageHeight))
					};
				}
			}

			tilesets.push(tileset);
		}
	}

	return {
		width: parseInt(map.width || '0'),
		height: parseInt(map.height || '0'),
		tilewidth: parseInt(map.tilewidth || '32'),
		tileheight: parseInt(map.tileheight || '32'),
		orientation: map.orientation || 'orthogonal',
		layers,
		tilesets
	};
}

/**
 * Parse a JSON map file into a TiledMap object
 */
export function parseJSON(content: string): TiledMap {
	const map = JSON.parse(content);

	const layers: Layer[] = (map.layers || []).map((layer: any) => ({
		name: layer.name || 'Layer',
		width: layer.width || 0,
		height: layer.height || 0,
		data: layer.data ? layer.data.map((gid: number) => ({ gid })) : [],
		visible: layer.visible !== false,
		opacity: layer.opacity !== undefined ? layer.opacity : 1.0
	}));

	const tilesets: Tileset[] = (map.tilesets || []).map((ts: any) => ({
		firstgid: ts.firstgid || 1,
		source: ts.source,
		name: ts.name,
		tilewidth: ts.tilewidth,
		tileheight: ts.tileheight,
		image: ts.image ? {
			source: ts.image.source || ts.image,
			width: ts.image.width || 0,
			height: ts.image.height || 0
		} : undefined
	}));

	return {
		width: map.width || 0,
		height: map.height || 0,
		tilewidth: map.tilewidth || 32,
		tileheight: map.tileheight || 32,
		orientation: map.orientation || 'orthogonal',
		layers,
		tilesets,
		properties: map.properties
	};
}

