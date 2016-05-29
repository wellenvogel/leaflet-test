/**
 * Created by andreas on 28.05.16.
 */

L.RMap=L.Map.extend({
    initialize: function(div,options){
        if (! options) options={};
        options.rdrag=true;
        if (options.dragging !== undefined){
            options.rdrag=options.dragging;
        }
        this._normalSvg=true;
        if (options.normalSvg !== undefined){
            this._normalSvg=options.normalSvg;
        }
        options.dragging=false;
        this._frame=document.getElementById(div);
        if (! this._frame) throw new Error("Map div "+div+" not found");
        this._rcontainer= L.DomUtil.create("div","leaflet-rmap-container",this._frame);
        this._rmapdiv=L.DomUtil.create("div","leaflet-rmap-div",this._rcontainer);
        this.setSizes();
        L.Map.prototype.initialize.call(this,this._rmapdiv,options);
        this._matrix=[1,0,0,1,0,0];
        this._imatrix=[1,0,0,1,0,0];
        if (options.rdrag){
            this.addHandler("rdrag", L.Map.RDrag);
        }
    },
    setSizes: function(){
        var rect=this._frame.getBoundingClientRect();
        this._rsize=Math.max(rect.width,rect.height)*Math.sqrt(2);
        this._top=(rect.height-this._rsize)/2;
        this._left=(rect.width-this._rsize)/2;
        this._rcontainer.style.left=this._left+"px";
        this._rcontainer.style.top=this._top+"px";
        this._rcontainer.style.width=this._rsize+"px";
        this._rcontainer.style.height=this._rsize+"px";
    },
    rotatePointInvers: function(point,center){
        var start=new L.Point(point.x,point.y);
        if (center){
            start=start.subtract(center);
        }
        var rt=new L.Point(
            start.x*this._imatrix[0]+start.y*this._imatrix[2]+0,
            start.x*this._imatrix[1]+start.y*this._imatrix[3]+0
        );
        if (center){
            rt=rt.add(center);
        }
        return rt;
    },
    toRad: function(x){
    return x/180*Math.PI;
    },
    setRotation:function(rot){
        if (! this._rmapdiv) return;
        var sin=Math.sin(this.toRad(rot));
        var cos=Math.cos(this.toRad(rot));
        this._matrix=[cos,sin,-sin,cos,0,0];
        //inverse rotation (i.e. -v) - cos(-x)=cos(x), sin(-x)=-sin(x)
        this._imatrix=[cos,-sin,sin,cos,0,0];
        var str='matrix('+this._matrix[0]+","+this._matrix[1]+","+this._matrix[2]+","+this._matrix[3]+","+this._matrix[4]+","+this._matrix[5]+")";
        var center = new L.Point(this._rsize/2,this._rsize/2);
        var cstr=center.x+"px "+center.y+"px  0";
        this._rmapdiv.style.webkitTransformOrigin=cstr;
        this._rmapdiv.style.transformOrigin=cstr;
        this._rmapdiv.style.webkitTransform=str;
        this._rmapdiv.style.transform=str;
    },
    mouseEventToContainerPoint: function (e) { // (MouseEvent)
        var container = this._container;
        if (!container) {
            return new L.Point(e.clientX, e.clientY);
        }

        var oldRect = container.getBoundingClientRect();
        var rect = this._rcontainer.getBoundingClientRect();
        var rt = new L.Point(
            e.clientX - rect.left - container.clientLeft,
            e.clientY - rect.top - container.clientTop);

        var center = new L.point(
            rect.width / 2,
            rect.height / 2
        );
        rt = this.rotatePointInvers(rt, center);
        return rt;
    },
    getContainerCenter: function(){
        var rect = this._rcontainer.getBoundingClientRect();
        var center = new L.point(
            rect.width / 2,
            rect.height / 2
        );
        return center;
    },
    _updateSvgViewport: function () {

        if (this._pathZooming) {
            // Do not update SVGs while a zoom animation is going on otherwise the animation will break.
            // When the zoom animation ends we will be updated again anyway
            // This fixes the case where you do a momentum move and zoom while the move is still ongoing.
            return;
        }

        this._updatePathViewport();

        var vp = this._pathViewport,
            min = vp.min,
            max = vp.max,
            width = max.x - min.x,
            height = max.y - min.y,
            root = this._pathRoot,
            pane = this._panes.overlayPane;

        // Hack to make flicker on drag end on mobile webkit less irritating
        if (L.Browser.mobileWebkit && this._normalSvg) {
            pane.removeChild(root);
        }

        L.DomUtil.setPosition(root, min);
        root.setAttribute('width', width);
        root.setAttribute('height', height);
        root.setAttribute('viewBox', [min.x, min.y, width, height].join(' '));

        if (L.Browser.mobileWebkit && this._normalSvg) {
            pane.appendChild(root);
        }
    },
    setSvg: function(b){
        this._normalSvg=b;
    }

});