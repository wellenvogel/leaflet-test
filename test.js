/**
 * Created by andreas on 27.05.16.
 */

//the slider
var range = document.getElementById('sliderRotate');

noUiSlider.create(range, {
    start: [ 0 ], // Handle start position
    step: 5, // Slider moves in increments of '10'
    margin: 20, // Handles must be more than '20' apart
    direction: 'ltr', // Put '0' at the bottom of the slider
    orientation: 'horizontal',
    range: { // Slider can select '0' to '100'
        'min': -180,
        'max': 180
    },
    pips: { // Show a scale with the slider
        mode: 'steps',
        density: 2
    }
});


/**
 *
 * @param {number} coordinate
 * @param axis
 * @returns {string}
 */
function formatLonLatsDecimal(coordinate,axis){
    coordinate = (coordinate+540)%360 - 180; // normalize for sphere being round

    var abscoordinate = Math.abs(coordinate);
    var coordinatedegrees = Math.floor(abscoordinate);

    var coordinateminutes = (abscoordinate - coordinatedegrees)/(1/60);
    var numdecimal=2;
    //correctly handle the toFixed(x) - will do math rounding
    if (coordinateminutes.toFixed(numdecimal) == 60){
        coordinatedegrees+=1;
        coordinateminutes=0;
    }
    if( coordinatedegrees < 10 ) {
        coordinatedegrees = "0" + coordinatedegrees;
    }
    if (coordinatedegrees < 100 && axis == 'lon'){
        coordinatedegrees = "0" + coordinatedegrees;
    }
    var str = coordinatedegrees + "\u00B0";

    if( coordinateminutes < 10 ) {
        str +="0";
    }
    str += coordinateminutes.toFixed(numdecimal) + "'";
    if (axis == "lon") {
        str += coordinate < 0 ? "W" :"E";
    } else {
        str += coordinate < 0 ? "S" :"N";
    }
    return str;
};



var valueDiv = document.getElementById('sliderRValue');
var mapdiv=document.getElementById('mapid');

var mymap = new L.SMap('mapid',{scrollWheelZoom:'center'});
var currentRotation=0;

// When the slider value changes, update the input and span
range.noUiSlider.on('update', function( values, handle ) {
    var v=values[handle];
    valueDiv.innerHTML = v;
    currentRotation=v;
    mymap.setRotation(v);
    updatePopUps();
});

var check=document.getElementById('updateSvg');
check.addEventListener('change',function(){
   mymap.setSvg(check.checked);
});

var upZoom=document.getElementById('upZoom');
if (upZoom){
    upZoom.addEventListener('change', function(){
       mymap.eachLayer(function(layer){
           if (layer.setUpZoom) layer.setUpZoom(upZoom.checked);
       })
    });
}

var offsets={};
var clickPosition;
function setElementPosition(element,pos,offset){
    if (! pos) return;
    var el=document.getElementById(element);
    if (! el) return;
    var left=pos.x;
    var top=pos.y;
    if (! offset) offset=offsets[element];
    if (offset){
        left=left-offset.x;
        top=top-offset.y;
    }
    el.style.top=top+"px";
    el.style.left=left+"px";
};



offsets['centerMarker']=new L.Point(10,10);
offsets['clickMarker']=new L.Point(10,10);
setElementPosition('centerMarker',mymap.getFrameCenter());
setElementPosition('clickMarker',mymap.getFrameCenter());

/*
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets',
    zoomOffset: -3,
    tileSize: 2048
}).addTo(mymap);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets',
    zoomOffset: -2,
    tileSize: 1024
}).addTo(mymap);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets',
    zoomOffset: -1,
    tileSize: 512
}).addTo(mymap);


L.tileLayer.sparseTile('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);


L.tileLayer('http://t1.openseamap.org/seamark//{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openseamap.org">OpenSeamaptMap</a>'
}).addTo(mymap);
*/


mymap.setView([54.1, 13.45], 13);
/**
 * really experimental support for rotating popUps
 * must be called after a popup has been created and on each rotation
 */
function updatePopUps(){
    var popups=document.getElementsByClassName('leaflet-popup');
    var i=0;
    var rotation=0-parseInt(currentRotation);
    for (i=0;i<popups.length;i++){
        var popup=popups[i];
        var height=popup.clientHeight;
        var width=popup.clientWidth;
        //we need to handle styles- only very limited here...
        var bottom=popup.style.bottom;
        if (bottom){
            bottom=bottom.replace(/ *px/,"");
            bottom=parseInt(bottom);
            height+=bottom;
        }
        var ostr=width/2+"px "+height+"px 0";
        popup.style.transformOrigin=ostr;
        popup.style.webkitTransformOrigin=ostr;
        var oldTransform=popup.style[L.DomUtil.TRANSFORM];
        if (oldTransform){
            oldTransform=oldTransform.replace(/  *rotate[^ ]* */,'');
        }
        else{
            oldTransform="";
        }
        popup.style[L.DomUtil.TRANSFORM]=oldTransform+" rotate("+rotation+"deg)";
    };
};
var clickMarker=document.getElementById('clickMarker');

function onMapClick(e) {
    var lat=formatLonLatsDecimal(e.latlng.lat,"lat");
    var lon=formatLonLatsDecimal(e.latlng.lng,"lon");
    clickPosition= e.latlng;
    document.getElementById('mousePosLat').innerHTML=lat;
    document.getElementById('mousePosLon').innerHTML=lon;
    setElementPosition('clickMarker',mymap.containerPointToFramePoint(e.containerPoint));
    L.popup()
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
    updatePopUps();
}

mymap.on('click',onMapClick);


function updatePos(){
    var containerPos = mymap.getCenterWithAnim();
    var lat = formatLonLatsDecimal(containerPos.lat, "lat");
    var lon = formatLonLatsDecimal(containerPos.lng, "lon");
    document.getElementById('posLat').innerHTML = lat;
    document.getElementById('posLon').innerHTML = lon;
    if (clickPosition) {
        var containerPoint=mymap.layerPointToContainerPoint(mymap.latLngToLayerWithAnim(clickPosition));
        var framePoint=mymap.containerPointToFramePoint(containerPoint);
        setElementPosition('clickMarker',framePoint);
    }
}
function onMap(e){
    updatePos();
}
mymap.on('zoomanim',function(e){
    onMap(e);
    return;

    //test alternative
    var x=e;
    var frameCenter=mymap.containerPointToFramePoint(mymap.layerPointToContainerPoint(e.origin));
    var oldFramepoint=mymap.containerPointToFramePoint(mymap.latLngToContainerPoint(clickPosition));
    var diff=oldFramepoint.subtract(frameCenter);
    diff=diff.multiplyBy(e.scale);
    var newFramepoint=frameCenter.add(diff);
    setElementPosition('clickMarker',newFramepoint);
});
mymap.on('move',onMap);
mymap.on('moveend',onMap);
mymap.on('zoomend',function(){
    updatePopUps();
    updatePos();
});

/**
 * test the scroll behavior
 */
document.getElementById('testScroll').onclick=function(){
  mymap._frame.scrollTop=400;
};
document.getElementById('zoomIn').onclick=function(){
    mymap.zoomIn(1);
};
document.getElementById('zoomOut').onclick=function(){
    mymap.zoomOut(1);
};
updatePos();

function e2f(elem,attr){
    return parseFloat($(elem).attr(attr));
};


function parseLayerlist(layerdata, baseurl) {
    var ll = [];
    $(layerdata).find('TileMap').each(function (ln, tm) {
        var rt = {};
        //complete tile map entry here
        rt.inversy = false;
        var layer_profile = $(tm).attr('profile');
        if (layer_profile) {
            if (layer_profile != 'global-mercator' && layer_profile != 'zxy-mercator' && layer_profile != 'wms') {
                alert('unsupported profile in tilemap.xml ' + layer_profile);
                return null;
            }
            if (layer_profile == 'global-mercator') {
                //our very old style stuff where we had y=0 at lower left
                rt.inversy = true;
            }
        }
        rt.url = $(tm).attr('href');
        rt.title = $(tm).attr('title');
        rt.minZoom = parseInt($(tm).attr('minzoom'));
        rt.maxZoom = parseInt($(tm).attr('maxzoom'));
        rt.projection = $(tm).attr('projection'); //currently only for WMS
        //we store the layer region in EPSG:4326
        $(tm).find(">BoundingBox").each(function (nr, bb) {
            rt.layerExtent = [e2f(bb, 'minlon'), e2f(bb, 'maxlat'),
                e2f(bb, 'maxlon'), e2f(bb, 'minlat')];
        });

        //although we currently do not need the boundings
        //we just parse them...
        var boundings = [];
        $(tm).find(">LayerBoundings >BoundingBox").each(function (nr, bb) {
            var bounds = [e2f(bb, 'minlon'), e2f(bb, 'maxlat'),
                e2f(bb, 'maxlon'), e2f(bb, 'minlat')];
            boundings.push(bounds);
        });
        rt.boundings = boundings;

        var zoomLayerBoundings = [];
        $(tm).find(">LayerZoomBoundings >ZoomBoundings").each(function (nr, zb) {
            var zoom = parseInt($(zb).attr('zoom'));
            var zoomBoundings = [];
            $(zb).find(">BoundingBox").each(function (nr, bb) {
                var bounds = {
                    minx: parseInt($(bb).attr('minx')),
                    miny: parseInt($(bb).attr('miny')),
                    maxx: parseInt($(bb).attr('maxx')),
                    maxy: parseInt($(bb).attr('maxy'))
                };
                zoomBoundings.push(bounds);
            });
            if (zoomBoundings.length) {
                zoomLayerBoundings[zoom] = zoomBoundings;
            }
        });
        if (zoomLayerBoundings.length) {
            rt.zoomLayerBoundings = zoomLayerBoundings;
        }

        //now we have all our options - just create the layer from them
        var layerurl = "";
        if (rt.url === undefined) {
            alert("missing href in layer");
            return null;
        }
        if (!rt.url.match(/^https*:/)) {
            layerurl = baseurl + "/" + rt.url;
        }
        else layerurl = rt.url;
        //rt.extent = ol.extent.applyTransform(rt.layerExtent, self.transformToMap); TODO: transform to map
        if (rt.wms) {
            var param = {};
            $(tm).find(">WMSParameter").each(function (nr, wp) {
                var n = $(wp).attr('name');
                var v = $(wp).attr('value');
                if (n !== undefined && v !== undefined) {
                    param[n] = v;
                }
            });
            rt.wmsparam = param;
            var layermap = {};
            $(tm).find(">WMSLayerMapping").each(function (nr, mapping) {
                var zooms = $(mapping).attr('zooms');
                var layers = $(mapping).attr('layers');
                var zarr = zooms.split(/,/);
                var i;
                for (i in zarr) {
                    try {
                        var zlevel = parseInt(zarr[i]);
                        layermap[zlevel] = layers;
                    } catch (ex) {
                    }
                }
            });
            rt.wmslayermap = layermap;

        }
        ll.push(rt);
    });
    return ll;
}

function addMapLayers(xml,baseUrl){
    var ll=parseLayerlist(xml,baseUrl);
    ll.forEach(function(layer){
        var lLayer= L.tileLayer.sparseTile(layer.url+"/{z}/{x}/{y}.png",{
           zoomLayerBoundings:layer.zoomLayerBoundings,
           maxZoom:layer.maxzoom
        });
        lLayer.addTo(mymap);
    });
}

var chartlist=null;

function showChart(num){
    if (chartlist == null || chartlist[num] === undefined) {
        alert("unknown chart");
        return;
    }
    var url=("/"+chartlist[num].url+"/avnav.xml").replace(/^\/\/*/,"/");
    var baseUrl=chartlist[num].url;
    $.ajax({
        url:url,
        dataType: 'xml',
        cache: false,
        success: function(data){
            $('#selectPage').hide();
            $('#container').show();
            addMapLayers(data,baseUrl);
        },
        error: function(e){
            alert("unable to get chart details: "+ e.statusText);
        }
    });
    return false;
}
$(window).on('load',function(){
    $.ajax({
        url:"/viewer/avnav_navi.php?request=listCharts",
        success: function(data){
            var i;
            chartlist=data.data;
            var html="";
            for (i=0;i<data.data.length;i++){
                var entry=data.data[i];
                html+="<a  onclick=\"showChart("+i+")\">"+entry.name+"</a><br>"
            }
            $('#selectPage').html(html);
        },
        error: function(e){
            alert("cannot load charts: "+ e.statusText);
        }
    });
});
