// https://github.com/maplibre/maplibre-gl-js/blob/ddf69421c6ae34c808afefec309a5beecdb7500e/src/index.ts#L151

window.arcgisTiles = (params, callback) => {
    const prefix = 'https://tiles.arcgis.com/tiles';
    const [key, service, z, y, x] = params.url.split('://')[1].split('/');
    const newUrl = `${prefix}/${key}/arcgis/rest/services/${service}/VectorTileServer/tile/${z}/${y}/${x}.pbf`;

    console.log(params, callback, z,x,y,service, prefix);

    fetch(newUrl)
        .then(response => {
            if (response.status == 200) {
                response.arrayBuffer().then(data => {
                    callback(null, data, null, null);
                });
            } else {
                callback(new Error(`Tile fetch error: ${response.statusText}`));
            }
        })
        .catch(e => {
            callback(new Error(e));
        });
    return { cancel: () => { } };
};