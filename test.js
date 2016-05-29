/**
 * Created by andreas on 27.05.16.
 */

//the slider
var range = document.getElementById('sliderRotate');

noUiSlider.create(range, {
    start: [ 0 ], // Handle start position
    step: 5, // Slider moves in increments of '10'
    margin: 20, // Handles must be more than '20' apart
    direction: 'rtl', // Put '0' at the bottom of the slider
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

var mymap = new L.SMap('mapid');

var mapRect=mapdiv.getBoundingClientRect();
var center=document.getElementById("centerMarker");
var left=mapRect.left+mapRect.width/2-10;
var ctop=mapRect.top+mapRect.height/2-10;
center.style.left=left+"px";
center.style.top=ctop+"px";

// When the slider value changes, update the input and span
range.noUiSlider.on('update', function( values, handle ) {
    var v=values[handle];
    valueDiv.innerHTML = v;
    mymap.setRotation(v);
});

var check=document.getElementById('updateSvg');
check.addEventListener('change',function(){
   mymap.setSvg(check.checked);
});

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);



mymap.setView([54.1, 13.45], 13);


function onMapClick(e) {
    var lat=formatLonLatsDecimal(e.latlng.lat,"lat");
    var lon=formatLonLatsDecimal(e.latlng.lng,"lon");
    document.getElementById('mousePosLat').innerHTML=lat;
    document.getElementById('mousePosLon').innerHTML=lon;
}

mymap.on('click',onMapClick);


function updatePos(){
    var centerPoint=mymap.getContainerCenter();
    var centerPos=mymap.containerPointToLatLng(centerPoint);
    var lat=formatLonLatsDecimal(centerPos.lat,"lat");
    var lon=formatLonLatsDecimal(centerPos.lng,"lon");
    document.getElementById('posLat').innerHTML=lat;
    document.getElementById('posLon').innerHTML=lon;
}
function onMap(e){
    updatePos();
}
mymap.on('move',onMap);
mymap.on('moveend',onMap);

document.getElementById('testScroll').onclick=function(){
  mymap._frame.scrollTop=400;
};
updatePos();
