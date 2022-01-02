(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.VectorCustomProtocol = factory());
})(this, (function () { 'use strict';

    const vectorCustomProtocol = (mapLibrary) => {
        // Adds the protocol tools to the mapLibrary, doesn't overwrite them if they already exist
        let protocols = new Map();
        const alreadySupported = mapLibrary.addProtocol !== undefined;
        if (!alreadySupported) {
            mapLibrary.addProtocol = mapLibrary.addProtocol || ((customProtocol, loadFn) => {
                protocols.set(customProtocol, loadFn);
            });
            mapLibrary.removeProtocol = mapLibrary.removeProtocol || ((customProtocol) => {
                protocols.delete(customProtocol);
            });
        }
        return class VectorCustomProtocolSourceSpecification extends mapLibrary.Style.getSourceType('vector') {
            constructor(id, options, dispatcher, eventedParent) {
                super(id, options, dispatcher, eventedParent);
            }
            loadTile(tile, callback) {
                const rawUrl = tile.tileID.canonical.url(this.tiles, this.scheme);
                const protocol = rawUrl.substring(0, rawUrl.indexOf('://'));
                if (!alreadySupported && protocols.has(protocol)) {
                    // Probably using Mapboxgljs
                    // There's a matching URL
                    const loadFn = protocols.get(protocol);
                    const requestParameters = {
                        url: rawUrl,
                        type: 'arrayBuffer',
                    };
                    const urlCallback = (error, data, cacheControl, expires) => {
                        if (error) {
                            throw error;
                        }
                        else {
                            const byteArray = new Uint8Array(data);
                            const url = URL.createObjectURL(new Blob([byteArray]));
                            tile.tileID.canonical.url = function () {
                                delete tile.tileID.canonical.url;
                                return url;
                            };
                            super.loadTile(tile, function () {
                                URL.revokeObjectURL(url);
                                callback(...arguments);
                            });
                        }
                    };
                    loadFn(requestParameters, urlCallback);
                }
                else {
                    super.loadTile(tile, callback);
                }
            }
        };
    };

    return vectorCustomProtocol;

}));
