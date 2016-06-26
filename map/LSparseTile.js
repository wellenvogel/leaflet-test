/**
 * Created by andreas on 21.06.16.
 * inspired by https://github.com/ghybs/Leaflet.TileLayer.Fallback/blob/master/leaflet.tilelayer.fallback-src.js
 */

var TL = L.TileLayer.Canvas,
    TLproto = TL.prototype;


L.TileLayer.SparseTile = TL.extend({

    statics: {
        version: '0.1.0'
    },

    options: {
        zoomLayerBoundings: null
    },

    initialize: function (urlTemplate, options) {
        if (! options) options={};
        options.async=true;
        //we need to call the TileLayer proto here directly as Canvas does not forward...
        L.TileLayer.prototype.initialize.call(this,urlTemplate,options);
    },

    /**
     * find a tile that is available considering zoomLayerBoundings
     * if it is not found - just try lower zoom level
     * @param tilePoint
     * @returns {*} the new tilePoint to be used
     */
    findTile: function(tilePoint){
        return tilePoint;
    },

    drawTile: function(tile,tilePoint,zoom){
        tilePoint.z=zoom;
        var tileSize=this._getTileSize();
        var newTilePoint=this.findTile(tilePoint);
        var offsetX= 0,offsetY= 0,sWidth=tileSize,sHeight=tileSize;
        var url=this.getTileUrl(tilePoint);
        if (newTilePoint.z < tilePoint.z){
            var factor=Math.pow(2,oldZoom-newTilePoint.z);
            var fract=this.tileSize/factor;
            var xdiff=tilePoint.x-newTilePoint.x*factor;
            var ydiff=tilePoint.y-newTilePoint.y*factor;
            if (xdiff >= 0 && ydiff >= 0){
                sWidth=tileSize/factor;
                sHeight=tileSize/factor;
                offsetX=xdiff*fract;
                offsetY=ydiff*fract;
                url=this.getTileUrl(newTilePoint);
            }
        }
        var i=new Image();
        var self=this;
        var currentTile=tile;
        i.onload=function(){
            var ctx=tile.getContext("2d");
            ctx.drawImage(i,0,0,tileSize,tileSize,offsetX,offsetY,sWidth,sHeight);
            self.tileDrawn(currentTile);
        };
        i.onerror=function(e){
          self.tileError(currentTile,e)
        };
        i.src=url;
    },

    tileError: function(tile){
        this._tileOnError.call(tile);
    }
});

L.tileLayer.sparseTile=function(url,options){
    return new L.TileLayer.SparseTile(url,options);
};
