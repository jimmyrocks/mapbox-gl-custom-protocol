import {
    default as maplibregl,
    Tile,
    Callback,
    RequestParameters,
    ResponseCallback,
    Cancelable
} from 'maplibre-gl';

type MapLibrary = typeof maplibregl & { '_protocols'?: Map<string, LoadFnType> };
type LoadFnType = (requestParameters: RequestParameters, callback: ResponseCallback<any>) => Cancelable;

const getReqObjectUrl = (loadFn: LoadFnType, rawUrl: string, type: 'vector' | 'raster' | 'geojson', collectResourceTiming?: boolean): Promise<string> => new Promise((res, rej) => {
    let requestParameters: RequestParameters = {
        url: rawUrl,
        type: type === ('vector' || 'raster') ? 'arrayBuffer' : 'string',
        collectResourceTiming: collectResourceTiming
    };
    if (type === 'raster') {
        requestParameters.headers = {
            accept: "image/webp,*/*"
        };
    }


    const urlCallback = (error?: Error | null, data?: ArrayBuffer | Object, cacheControl?: string | null, expires?: string | null) => {
        if (error) {
            rej(error);
        } else {
            let preparedData: Uint8Array | string;
            if (data instanceof ArrayBuffer) {
                preparedData = new Uint8Array(data as ArrayBuffer);
            } else {
                preparedData = JSON.stringify(data);
            }
            const blob = new Blob([preparedData]);
            const url = URL.createObjectURL(blob);
            res(url);
        }
    };
    loadFn(requestParameters, urlCallback);
});

const CustomProtocol = (mapLibrary: MapLibrary) => {

    // Adds the protocol tools to the mapLibrary, doesn't overwrite them if they already exist
    const alreadySupported = mapLibrary.addProtocol !== undefined && mapLibrary._protocols === undefined;
    if (!alreadySupported) {
        mapLibrary._protocols = mapLibrary._protocols || new Map<string, LoadFnType>();
        mapLibrary.addProtocol = mapLibrary.addProtocol || ((customProtocol: string, loadFn: LoadFnType) => {
            mapLibrary._protocols?.set(customProtocol, loadFn);
        });
        mapLibrary.removeProtocol = mapLibrary.removeProtocol || ((customProtocol: string) => {
            mapLibrary._protocols?.delete(customProtocol);
        });
    }

    return {
        'vector': class VectorCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('vector') {

            constructor() {
                super(...arguments);
            }

            loadTile(tile: Tile, callback: Callback<void>) {
                const rawUrl = tile.tileID.canonical.url((this as any).tiles, (this as any).scheme);
                const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
                if (!alreadySupported && mapLibrary._protocols?.has(protocol)) {
                    const loadFn = mapLibrary._protocols?.get(protocol) as LoadFnType;
                    getReqObjectUrl(loadFn, rawUrl, (this as any).type, (this as any)._collectResourceTiming).then((url: string) => {
                        tile.tileID.canonical.url = function () {
                            delete (tile.tileID.canonical as any).url;
                            return url;
                        };
                        super.loadTile(tile, function () {
                            URL.revokeObjectURL(url);
                            callback(...arguments);
                        });
                    }).catch((e: Error) => {
                        console.error('Error loading tile', e.message);
                        throw e;
                    });
                } else {
                    super.loadTile(tile, callback);
                }
            }
        },
        'raster': class RasterCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('raster') {

            constructor() {
                super(...arguments);
            }

            loadTile(tile: Tile, callback: Callback<void>) {
                const rawUrl = tile.tileID.canonical.url((this as any).tiles, (this as any).scheme);
                const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
                if (!alreadySupported && mapLibrary._protocols?.has(protocol)) {
                    const loadFn = mapLibrary._protocols?.get(protocol) as LoadFnType;
                    getReqObjectUrl(loadFn, rawUrl, (this as any).type, (this as any)._collectResourceTiming).then((url: string) => {
                        tile.tileID.canonical.url = function () {
                            delete (tile.tileID.canonical as any).url;
                            return url;
                        };
                        super.loadTile(tile, function () {
                            URL.revokeObjectURL(url);
                            callback(...arguments);
                        });
                    }).catch((e: Error) => {
                        console.error('Error loading tile', e.message);
                        throw e;
                    });


                } else {
                    super.loadTile(tile, callback);
                }
            }
        },
        'geojson': class GeoJSONCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('geojson') {

            type: 'geojson';

            constructor() {
                super(...arguments);
                this.type = 'geojson';
            }

            _updateWorkerData(callback: Callback<void>) {

                const that = (this as any);
                const data = that._data;
                const done = (url?: string) => {
                    super._updateWorkerData(function () {
                        if (url !== undefined) {
                            URL.revokeObjectURL(url);
                        }
                        callback(...arguments);
                    });
                };

                if (typeof data === 'string') {
                    const protocol = data.substring(0, data.indexOf('://'));
                    if (!alreadySupported && mapLibrary._protocols?.has(protocol)) {
                        const loadFn = mapLibrary._protocols?.get(protocol) as LoadFnType;

                        getReqObjectUrl(loadFn, data, (this as any).type, (this as any)._collectResourceTiming).then((url: string) => {
                            that._data = url;
                            done(url);
                        });
                    } else {
                        // Use the build in code
                        done();
                    }
                } else {
                    // If data is already GeoJSON, then pass it through
                    done();
                }

            }
        }
    }
};

export default CustomProtocol;