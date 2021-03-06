# mapbox-gl-custom-protocol
Supports custom protocols when using [Mapbox GLJS](https://www.mapbox.com/mapbox-gljs) version v1.9.1.
It _may_ work with future versions, but it hasn't been tested.

## Objective ✨
[Maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js), a fork of Mapbox GLJS, has implemented a feature called [`addProtocol`](https://github.com/maplibre/maplibre-gl-js/blob/492bec58c5684609af8fba81ef01e5f5a3ef0711/src/index.js#L177) that was not supported in Mapbox GLJS. This approximates that functionality in Mapbox GLJS. 

## Inspiration 💡
For users of tools like [Mapbox Atlas](https://www.mapbox.com/atlas/), where Mapbox GLJS support is useful to maintain compatibility. This makes it easier to abstract out links to other services that support the [Mapbox Vector Tiles Standard](https://github.com/mapbox/vector-tile-spec), but may not support the same Tile Mapping Scheme (such as [ESRI VTPK](https://www.arcgis.com/apps/mapviewer/index.html?webmap=353f1a96be854f77bf063ff97abc69b8)).

## Usage 🛠️
This code is not needed with Maplibre-gl-js. If it detects that `addProtocol` is already defined, it will use the existing function.

See information on how to define the `protocolLoadFn` here: https://github.com/maplibre/maplibre-gl-js/blob/492bec58c5684609af8fba81ef01e5f5a3ef0711/src/index.js#L185
```javascript
<script src="https://loc8.us/mapbox-gl-custom-protocol/dist/mapbox-gl-custom-protocol.min.js"></script>

map.addSourceType('vector-custom', CustomProtocol(mapboxgl).vector, (e) => {
    if (e) {
      console.error('There was an error', e);
    }
});
// addProtocol is not available before the sourceType is added
mapboxgl.addProtocol('protocol-name', protocolLoadFn);
```

## Examples ⚙️
* [ESRI Tiles](https://jimmyrocks.github.io/mapbox-gl-custom-protocol/examples/vector.html)
* [ESRI Tiles using Maplibre-gl-js](https://jimmyrocks.github.io/mapbox-gl-custom-protocol/examples/vector-maplibre.html) (Tests the ability to still work with maplibregljs)
* [Raster OSM Tiles](https://jimmyrocks.github.io/mapbox-gl-custom-protocol/examples/raster.html)
* [Raster OSM Tiles using Maplibre-gl-js](https://jimmyrocks.github.io/mapbox-gl-custom-protocol/examples/raster-maplibre.html) (Tests the ability to still work with maplibregljs)
* [GeoJSON Layer](https://jimmyrocks.github.io/mapbox-gl-custom-protocol/examples/geojson.html)
* [GeoJSON Layer using Maplibre-gl-js](https://jimmyrocks.github.io/mapbox-gl-custom-protocol/examples/geojson-maplibre.html) (Tests the ability to still work with maplibregljs)
