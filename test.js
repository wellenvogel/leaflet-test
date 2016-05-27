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

var valueDiv = document.getElementById('sliderRValue');
var mapdiv=document.getElementById('mapid');

function toRad(x){
    return x/180*Math.PI;
}

var matrix=[1,0,0,1,0,0];
var imatrix=[1,0,0,1,0,0];
// When the slider value changes, update the input and span
range.noUiSlider.on('update', function( values, handle ) {
    var v=values[handle];
    valueDiv.innerHTML = v;
    var sin=Math.sin(toRad(v));
    var cos=Math.cos(toRad(v));
    matrix=[cos,sin,-sin,cos,0,0];
    //inverse rotation (i.e. -v) - cos(-x)=cos(x), sin(-x)=-sin(x)
    imatrix=[cos,-sin,sin,cos,0,0];
    //mapdiv.style.transform='rotate('+v+'deg)';
    mapdiv.style.transform='matrix('+matrix[0]+","+matrix[1]+","+matrix[2]+","+matrix[3]+","+matrix[4]+","+matrix[5]+")";
});



var mymap = L.map('mapid',{
    dragging: false,
    rdrag: true
});
var mapContainer=document.getElementById('mapContainer');

function rotatePointInvers(point,center){
    var start=new L.Point(point.x,point.y);
    if (center){
        start=start.subtract(center);
    }
    var rt=new L.Point(
        start.x*imatrix[0]+start.y*imatrix[2]+0,
        start.x*imatrix[1]+start.y*imatrix[3]+0
    );
    if (center){
        rt=rt.add(center);
    }
    return rt;
}

//a bit dirty - we overwrite the translation between mouse event coordinates and the container
//considering our translation
mymap.mouseEventToContainerPoint=function (e) { // (MouseEvent)
    var container=this._container;
    if (!container) {
        return new L.Point(e.clientX, e.clientY);
    }

    var rect = mapContainer.getBoundingClientRect();
    var rt= new L.Point(
        e.clientX - rect.left - container.clientLeft,
        e.clientY - rect.top - container.clientTop);

    var center=new L.point(
        rect.width/2,
        rect.height/2
    );
    rt=rotatePointInvers(rt,center);
    return rt;
};

L.Map.RDrag= L.Map.Drag.extend({
    addHooks:function(){
        L.Map.Drag.prototype.addHooks.call(this);
        this._draggable._onMove=function (e) {
            // Ignore simulated events, since we handle both touch and
            // mouse explicitly; otherwise we risk getting duplicates of
            // touch events, see #4315.
            if (e._simulated) { return; }

            if (e.touches && e.touches.length > 1) {
                this._moved = true;
                return;
            }

            var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
                newPoint = new L.Point(first.clientX, first.clientY),
                offset = newPoint.subtract(this._startPoint);
            offset=rotatePointInvers(offset);

            if (!offset.x && !offset.y) { return; }
            if (Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }

            L.DomEvent.preventDefault(e);

            if (!this._moved) {
                // @event dragstart: Event
                // Fired when a drag starts
                this.fire('dragstart');

                this._moved = true;
                this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

                L.DomUtil.addClass(document.body, 'leaflet-dragging');

                this._lastTarget = e.target || e.srcElement;
                // IE and Edge do not give the <use> element, so fetch it
                // if necessary
                if ((window.SVGElementInstance) && (this._lastTarget instanceof SVGElementInstance)) {
                    this._lastTarget = this._lastTarget.correspondingUseElement;
                }
                L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
            }

            this._newPos = this._startPos.add(offset);
            this._moving = true;

            L.Util.cancelAnimFrame(this._animRequest);
            this._lastEvent = e;
            this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true);
        }.bind(this._draggable);

    }

});
mymap.addHandler("rdrag", L.Map.RDrag) ;

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);


L.marker([51.5, -0.09]).addTo(mymap)
    .bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();

L.circle([51.508, -0.11], 500, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5
}).addTo(mymap).bindPopup("I am a circle.");

L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(mymap).bindPopup("I am a polygon.");
mymap.setView([54.1, 13.45], 13);

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

mymap.on('click', onMapClick);
