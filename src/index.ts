import {
    default as maplibregl,
    Tile,
    Callback,
    RequestParameters,
    ResponseCallback,
    Cancelable,
    VectorSourceSpecification,
    Dispatcher,
    Evented
} from 'maplibre-gl';

type LoadFnType = (requestParameters: RequestParameters, callback: ResponseCallback<any>) => Cancelable;

const vectorCustomProtocol = (mapLibrary: typeof maplibregl) => {

    // Adds the protocol tools to the mapLibrary, doesn't overwrite them if they already exist
    let protocols = new Map<string, ((requestParameters: RequestParameters, callback: ResponseCallback<any>) => Cancelable)>();
    const alreadySupported = mapLibrary.addProtocol !== undefined;
    if (!alreadySupported) {
        mapLibrary.addProtocol = mapLibrary.addProtocol || ((customProtocol: string, loadFn: LoadFnType) => {
            protocols.set(customProtocol, loadFn);
        });
        mapLibrary.removeProtocol = mapLibrary.removeProtocol || ((customProtocol: string) => {
            protocols.delete(customProtocol);
        });
    }
    return class VectorCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('vector') {

        constructor(id: string, options: VectorSourceSpecification & {collectResourceTiming: boolean}, dispatcher: Dispatcher, eventedParent: Evented) {
            super(id, options, dispatcher, eventedParent);
        }

        loadTile(tile: Tile, callback: Callback<void>) {
            const rawUrl = tile.tileID.canonical.url((this as any).tiles, (this as any).scheme);
            const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
            if (!alreadySupported && protocols.has(protocol)) {
                // Probably using Mapboxgljs
                // There's a matching URL
                const loadFn = protocols.get(protocol) as LoadFnType;
                const requestParameters:RequestParameters = {
                    url: rawUrl,
                    type: 'arrayBuffer',

                };
                const urlCallback = (error?: Error | null, data?: ArrayBuffer, cacheControl?: string | null, expires?: string | null) => {
                    if (error) {
                        throw error;
                    } else {
                        const byteArray = new Uint8Array(data as ArrayBuffer);
                        const url = URL.createObjectURL(new Blob([byteArray]));
                        tile.tileID.canonical.url = function () {
                            delete (tile.tileID.canonical as any).url;
                            return url;
                        };

                        super.loadTile(tile, function() {
                            URL.revokeObjectURL(url);
                            callback(...arguments);
                        });
                    }
                };
                loadFn(requestParameters, urlCallback);
            } else {
                super.loadTile(tile, callback);
            }
        }
    };
};

export default vectorCustomProtocol;