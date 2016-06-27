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
        L.Map.prototype.initialize.call(this,this._rmapdiv,options);
        this._matrix=[1,0,0,1,0,0];
        this._imatrix=[1,0,0,1,0,0];
        this._currentRotation=0; //rotation in deg
        var dragging=options.dragging === undefined || options.dragging;
        var self=this;
        //we should have a more "open" API to to that instead of deeply looking into L.Map.DragHandler
        if (dragging && this.dragging){
            this.dragging._draggable.on('predrag', function(){
                self.dragging._draggable._newPos=self.rotatePointInvers(self.dragging._draggable._newPos,self.dragging._draggable._startPos);
            });
        }
        if (options.animate || options.animate === undefined) {
            this.on('zoomanim', this._rzoomAnim);
            this.on('zoomend', this._rzoomEnd);
        }
        this._zoomParameter=undefined;
    },
    _rzoomAnim:function(e){
      this._zoomParameter={
          scale: e.scale,
          delta: e.delta? e.delta.clone():new L.Point(0,0),
          origin: e.origin?e.origin.clone():undefined,
          zoom: e.zoom,
          center: e.center
      };

    },
    _rzoomEnd: function(e){
      this._zoomParameter=undefined;
    },
    remove: function(){
        this.__super__.remove()
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
    /**
     *
     * @param {number} rot rotation in degrees
     */
    setRotation:function(rot){
        if (! this._rmapdiv) return;
        this._currentRotation=parseInt(rot);
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
    /**
     * return the current rotation in degrees
     * @returns {number|Number|*}
     */
    getRotation:function(){
        return this._currentRotation;
    },
    /**
     * overloaded function from the map, consider rotation
     * @param e
     * @returns {*}
     */
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
    containerPointToFramePoint: function (point){
        var opoint=new L.Point(point.x,point.y);
        if (this._container) {
            opoint=opoint.add(new L.Point(this._container.clientLeft, this._container.clientTop))
        }
        var center = new L.point(
            this._rsize / 2,
            this._rsize / 2
        );
        var unrotated=this.rotatePoint(opoint,center);
        var rt=this._rmapToFrame(unrotated);
        return rt;
    },
    /**
     * convert a point on the frame to a point on the map container
     * @param point
     * @returns {point}
     */
    framePointToContainerPoint: function (point){
        var ipoint=point;
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
    },

    latLngToLayerWithAnim:function(ll){
        if (! this._zoomParameter) return this.latLngToLayerPoint(ll);
        else return this._latLngToNewLayerPoint(ll,this._zoomParameter.zoom,this._zoomParameter.center);
    },

    getCenterWithAnim: function(){
        if (this._zoomParameter) return this._zoomParameter.center;
        return this.getCenter();
    }
});