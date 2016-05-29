/**
 * Created by andreas on 28.05.16.
 * an extended leaflet map that allows to rotate it
 * the provided div needs at least position relative to be set
 * it will create 2 additional containers. At the end we have:
 * _frame: the visible part (as defined by the user)
 * _rcontainer: a div with a square size that will ensure that with every rotation angle the map fills the outer div
 *              this one will not be rotated and will be used for all translations of pointer positions
 *              it will be positioned at _top,_left related to the _frame
 * _rmapdiv: the leaflet map - this will be rotated an will have the same sizes like _rcontainer
 * it will additionally install a a modified Drag handler as mouse positions/direction need to be converted
 * currently all pop up and text is rotated together with the map...
 */

L.RMap=L.Map.extend({
    initialize: function(div,options){
        this._frame=document.getElementById(div);
        if (! this._frame) throw new Error("Map div "+div+" not found");
        if (! options) options={};
        this._rcontainer= L.DomUtil.create("div","leaflet-rmap-container",this._frame);
        this._rmapdiv=L.DomUtil.create("div","leaflet-rmap-div",this._rcontainer);
        if (options.preventScroll ===undefined || options.preventScroll) {
            //there seem to be situations where the frame gets scrolled - so we revert this here...
            this._frame.onscroll = function () {
                this.scrollTop = 0;
                this.scrollLeft = 0;
            };
            this._rcontainer.onscroll=function(){
                this.scrollTop = 0;
                this.scrollLeft = 0;
            };
            this._rmapdiv.onscroll=function(){
                this.scrollTop = 0;
                this.scrollLeft = 0;
            };
        }
        this.setSizes();
        var dragging=options.dragging === undefined || options.dragging;
        options.dragging=false; //we have to be a bit tricky: first disable loading of the original drag handler
        L.Map.prototype.initialize.call(this,this._rmapdiv,options);
        this._matrix=[1,0,0,1,0,0];
        this._imatrix=[1,0,0,1,0,0];
        if (dragging){
            this.options.dragging=true; //now enable loading of OUR draghandler
            this.addHandler('dragging', L.Map.RDrag); //overwrite the original drag handler
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
    rotatePoint: function(point,center){
        var start=new L.Point(point.x,point.y);
        if (center){
            start=start.subtract(center);
        }
        var rt=new L.Point(
            start.x*this._matrix[0]+start.y*this._matrix[2]+0,
            start.x*this._matrix[1]+start.y*this._matrix[3]+0
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
        this.fire('moveend');
    },
    mouseEventToContainerPoint: function (e) { // (MouseEvent)
        var rect = this._frame.getBoundingClientRect();
        var fpoint = new L.Point(
            e.clientX - rect.left ,
            e.clientY - rect.top );

        var rt=this.framePointToContainerPoint(fpoint);
        return rt;
    },
    getFrameCenter: function(){
        return this._rmapToFrame(new L.Point(this._rsize/2,this._rsize/2));
    },
    /**
     * convert a point to the unrotated _rmapdiv
     * @param point
     * @private
     */
    _frameToRmap:function(point){
        return new L.Point(point.x,point.y).subtract(new L.Point(this._left,this._top));
    },
    _rmapToFrame: function(point){
        return new L.Point(point.x,point.y).add(new L.Point(this._left,this._top));
    },
    /**
     * convert a point from the map container to a point on the surrounding frame
     * this considers the rotation
     * @param point
     * @returns {*}
     */
    containerPointToFramePoint:function(point){
        var opoint=new L.Point(point.x,point.y);
        if (this._container) {
            opoint=opoint.add(new L.Point(this._container.clientLeft, this._container.clientTop))
        }
        var center = new L.point(
            this._rsize / 2,
            this._rsize / 2
        );
        var unrotated=this.rotatePoint(opoint,center);
        return this._rmapToFrame(unrotated);
    },
    /**
     * convert a point on the frame to a point on the container
     * @param point
     * @returns {*}
     */
    framePointToContainerPoint:function(point){
        var rpoint=this._frameToRmap(point);
        var center = new L.point(
            this._rsize / 2,
            this._rsize / 2
        );
        var rotated=this.rotatePointInvers(rpoint,center);
        if (this._container){
            return rotated.subtract(new L.Point(this._container.clientLeft,this._container.clientTop));
        }
        return rotated;
    }
});