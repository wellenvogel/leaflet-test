L.Map.RDrag= L.Map.Drag.extend({
    addHooks:function(){
        L.Map.Drag.prototype.addHooks.call(this);
        var self=this;
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
            offset=self._map.rotatePointInvers(offset);

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
