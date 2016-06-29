# leaflet-test
trying leaflet for avnav

Playground for trying leaflet.

1. map rotation - rotate the map div by css transform and consider this in mouse coordinates
The map rotation is currently accomplished by 2 additional frames and a rotation of the map frame. Additionally there is a new map Class L.RMap to handle this.
Currently all of the elements on the map are rotated together with the map. A very basic solution for "unrotating" pop ups is in test.js.
Try it out on http://wellenvogel.github.io/leaflet-test/index.html (0.7.7) or http://wellenvogel.github.io/leaflet-test/index.html?version=1.0.0-rc1 (1.0.0-rc1).

2. sparse layers - show lower zoom level tiles when no higher level tiles are there

