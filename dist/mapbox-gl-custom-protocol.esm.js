const getReqObjectUrl = (loadFn, rawUrl, type, collectResourceTiming) => new Promise((res, rej) => {
    let requestParameters = {
        url: rawUrl,
        type: type === ('vector' ) ? 'arrayBuffer' : 'string',
        collectResourceTiming: collectResourceTiming
    };
    if (type === 'raster') {
        requestParameters.headers = {
            accept: "image/webp,*/*"
        };
    }
    const urlCallback = (error, data, cacheControl, expires) => {
        if (error) {
            rej(error);
        }
        else {
            let preparedData;
            if (data instanceof ArrayBuffer) {
                preparedData = new Uint8Array(data);
            }
            else {
                preparedData = JSON.stringify(data);
            }
            const blob = new Blob([preparedData]);
            const url = URL.createObjectURL(blob);
            res(url);
        }
    };
    loadFn(requestParameters, urlCallback);
});
const CustomProtocol = (mapLibrary) => {
    // Adds the protocol tools to the mapLibrary, doesn't overwrite them if they already exist
    const alreadySupported = mapLibrary.addProtocol !== undefined && mapLibrary._protocols === undefined;
    if (!alreadySupported) {
        mapLibrary._protocols = mapLibrary._protocols || new Map();
        mapLibrary.addProtocol = mapLibrary.addProtocol || ((customProtocol, loadFn) => {
            var _a;
            (_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.set(customProtocol, loadFn);
        });
        mapLibrary.removeProtocol = mapLibrary.removeProtocol || ((customProtocol) => {
            var _a;
            (_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.delete(customProtocol);
        });
    }
    return {
        'vector': class VectorCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('vector') {
            constructor() {
                super(...arguments);
            }
            loadTile(tile, callback) {
                var _a, _b;
                const rawUrl = tile.tileID.canonical.url(this.tiles, this.scheme);
                const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
                if (!alreadySupported && ((_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.has(protocol))) {
                    const loadFn = (_b = mapLibrary._protocols) === null || _b === void 0 ? void 0 : _b.get(protocol);
                    getReqObjectUrl(loadFn, rawUrl, this.type, this._collectResourceTiming).then((url) => {
                        tile.tileID.canonical.url = function () {
                            delete tile.tileID.canonical.url;
                            return url;
                        };
                        super.loadTile(tile, function () {
                            URL.revokeObjectURL(url);
                            callback(...arguments);
                        });
                    }).catch((e) => {
                        console.error('Error loading tile', e.message);
                        throw e;
                    });
                }
                else {
                    super.loadTile(tile, callback);
                }
            }
        },
        'raster': class RasterCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('raster') {
            constructor() {
                super(...arguments);
            }
            loadTile(tile, callback) {
                var _a, _b;
                const rawUrl = tile.tileID.canonical.url(this.tiles, this.scheme);
                const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
                if (!alreadySupported && ((_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.has(protocol))) {
                    const loadFn = (_b = mapLibrary._protocols) === null || _b === void 0 ? void 0 : _b.get(protocol);
                    getReqObjectUrl(loadFn, rawUrl, this.type, this._collectResourceTiming).then((url) => {
                        tile.tileID.canonical.url = function () {
                            delete tile.tileID.canonical.url;
                            return url;
                        };
                        super.loadTile(tile, function () {
                            URL.revokeObjectURL(url);
                            callback(...arguments);
                        });
                    }).catch((e) => {
                        console.error('Error loading tile', e.message);
                        throw e;
                    });
                }
                else {
                    super.loadTile(tile, callback);
                }
            }
        },
        'geojson': class GeoJSONCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('geojson') {
            constructor() {
                super(...arguments);
                this.type = 'geojson';
            }
            _updateWorkerData(callback) {
                var _a, _b;
                const that = this;
                const data = that._data;
                const done = (url) => {
                    super._updateWorkerData(function () {
                        if (url !== undefined) {
                            URL.revokeObjectURL(url);
                        }
                        callback(...arguments);
                    });
                };
                if (typeof data === 'string') {
                    const protocol = data.substring(0, data.indexOf('://'));
                    if (!alreadySupported && ((_a = mapLibrary._protocols) === null || _a === void 0 ? void 0 : _a.has(protocol))) {
                        const loadFn = (_b = mapLibrary._protocols) === null || _b === void 0 ? void 0 : _b.get(protocol);
                        getReqObjectUrl(loadFn, data, this.type, this._collectResourceTiming).then((url) => {
                            that._data = url;
                            done(url);
                        });
                    }
                    else {
                        // Use the build in code
                        done();
                    }
                }
                else {
                    // If data is already GeoJSON, then pass it through
                    done();
                }
            }
        }
    };
};

export { CustomProtocol as default };
