/**
 * Created by andreas on 29.05.16.
 * a Map that makes the add/remove of the svg viewport configurable
 * the original behavior leads to flicker on the (old) mobile safari on BB playbook
 */

L.SMap=L.RMap.extend({
    initialize: function (div, options) {
        if (!options) options = {};
        this._normalSvg = true;
        if (options.normalSvg !== undefined) {
            this._normalSvg = options.normalSvg;
        }
        L.RMap.prototype.initialize.call(this,div,options);
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
    setSvg: function (b) {
        this._normalSvg = b;
    }
});
