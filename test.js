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
           layer.setUpZoom(upZoom.checked);
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


L.tileLayer.sparseTile('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);


L.tileLayer.sparseTile('http://t1.openseamap.org/seamark//{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openseamap.org">OpenSeamaptMap</a>'
}).addTo(mymap);



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
