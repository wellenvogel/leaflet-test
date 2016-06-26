/**
 * Created by andreas on 21.06.16.
 * inspired by https://github.com/ghybs/Leaflet.TileLayer.Fallback/blob/master/leaflet.tilelayer.fallback-src.js
 */

var TL = L.TileLayer,
    TLproto = TL.prototype;

//we must overwrite set position to keep our scaling being set
L.DomUtil.setPosition=function (el, point, disable3D) { // (HTMLElement, Point[, Boolean])
    // jshint camelcase: false
    el._leaflet_pos = point;

    if (!disable3D && L.Browser.any3d) {
        var oldTranslate=el.style[L.DomUtil.TRANSFORM];
        var newTranslate=L.DomUtil.getTranslateString(point);
        if (oldTranslate && oldTranslate.match(/scale/)){
            oldTranslate=oldTranslate.replace(/.*scale *\(/,"scale(").replace(/\).*/,'');
            newTranslate+=" "+oldTranslate;
        }
        el.style[L.DomUtil.TRANSFORM] =  newTranslate;
    } else {
        el.style.left = point.x + 'px';
        el.style.top = point.y + 'px';
    }
};

L.TileLayer.SparseTile = TL.extend({

    statics: {
        version: '0.1.0'
    },

    options: {
        zoomLayerBoundings: null,
        upZoom: false,
        transform: true,
        shiftZoom: 0
    },

    initialize: function (urlTemplate, options) {
        if (! options) options={};
        TLproto.initialize.call(this,urlTemplate,options);
    },

    /**
     * find a tile that is available considering zoomLayerBoundings
     * if it is not found - just try lower zoom level
     * TODO
     * @param tilePoint
     * @returns {*} the new tilePoint to be used
     */
    findTile: function(tilePoint){
        if (tilePoint.x%2 == 0) return undefined;
        if (this.options.shiftZoom){
            return {
                x: Math.floor(tilePoint.x/Math.pow(2,this.options.shiftZoom)),
                y: Math.floor(tilePoint.y/Math.pow(2,this.options.shiftZoom)),
                z: tilePoint.z-this.options.shiftZoom
            }
        }
        if (! this.options.upZoom ) return tilePoint;
        return {
            x: Math.floor(tilePoint.x/4),
            y: Math.floor(tilePoint.y/4),
            z: tilePoint.z-2
        };
    },

    _loadTile: function (tile, tilePoint) {
        tilePoint.z=this._map.getZoom()+this.options.zoomOffset;
        var tileSize=this._getTileSize();
        tile._layer  = this;
        var newTilePoint=this.findTile(tilePoint);
        if (newTilePoint === undefined){
            this._tileOnError.call(tile);
            return;
        }
        var offsetX= 0,offsetY= 0;
        if (newTilePoint.z < tilePoint.z){
            var factor=Math.pow(2,tilePoint.z-newTilePoint.z);
            var xdiff=tilePoint.x-newTilePoint.x*factor;
            var ydiff=tilePoint.y-newTilePoint.y*factor;
            if (this.options.transform) {
                //implementation using scale
                //seems to be much faster on old webkit
                if (xdiff >= 0 && ydiff >= 0) {
                    tile.style.width = tile.style.height=tileSize+"px";
                    offsetX = xdiff * tileSize / factor;
                    offsetY = ydiff * tileSize / factor;

                    // Compute margins to adjust position.
                    tile.style.marginTop = (-offsetY*factor) + 'px';
                    tile.style.marginLeft = (-offsetX*factor) + 'px';

                    // Crop (clip) image.
                    // `clip` is deprecated, but browsers support for `clip-path: inset()` is far behind.
                    // http://caniuse.com/#feat=css-clip-path
                    // add 1px to the clipping region to avoid some strange borders on old webkit
                    tile.style.clip = 'rect(' + offsetY + 'px ' + (offsetX + tileSize/factor+1) + 'px ' + (offsetY + tileSize/factor+1) + 'px ' + offsetX + 'px)';
                    tile.style.webkitTransformOrigin="left top";
                    tile.style.transformOrigin = "left top";
                    var oldTransform= tile.style[L.DomUtil.TRANSFORM];
                    var newTransform="scale(" + factor + ")";
                    if (oldTransform && oldTransform != ""){
                        newTransform=oldTransform.replace(/scale.*\)/,"")+" "+newTransform;
                    }
                    tile.style[L.DomUtil.TRANSFORM]=newTransform;
                }
            }
            else {
                if (xdiff >= 0 && ydiff >= 0) {
                    offsetX = xdiff * tileSize;
                    offsetY = ydiff * tileSize;
                    // Zoom replacement img.
                    tile.style.width = tile.style.height = (tileSize * factor) + 'px';

                    // Compute margins to adjust position.
                    tile.style.marginTop = (-offsetY) + 'px';
                    tile.style.marginLeft = (-offsetX) + 'px';

                    // Crop (clip) image.
                    // `clip` is deprecated, but browsers support for `clip-path: inset()` is far behind.
                    // http://caniuse.com/#feat=css-clip-path
                    tile.style.clip = 'rect(' + offsetY + 'px ' + (offsetX + tileSize) + 'px ' + (offsetY + tileSize) + 'px ' + offsetX + 'px)';

                }
            }
        }
        tile.onload  = this._tileOnLoad;
        tile.onerror = this._tileOnError;
        tile.src     = this.getTileUrl(newTilePoint);

        this.fire('tileloadstart', {
            tile: tile,
            url: tile.src
        });
    },
    setUpZoom: function(v){
        this.options.upZoom=v;
        this.redraw();
    }



});

L.tileLayer.sparseTile=function(url,options){
    return new L.TileLayer.SparseTile(url,options);
};
