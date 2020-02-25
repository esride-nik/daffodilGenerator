# Daffodil Generator
#### Niklas Köhn, Esri Deutschland GmbH, 2020

Generated random daffodil patterns within areas defined on an ArcGIS FeatureLayer. Plays a flight from slides defined in an ArcGIS WebScene.

Supports the following URL parameters:
* showWidgets: boolean. default: false
* showAreaLayer: boolean. default: false
* itemId: string. Points to the [ArcGIS](http://www.arcgis.com) ItemID of a WebScene.
* daffodilAreasUrl: string. Points to the URL of an ArcGIS FeatureLayer that contains the daffodil areas.
* daffodilUrl: string. default: using the slightly altered ["Daffodil" model from "Poly by Google](https://poly.google.com/view/2Gw0Pca1YRS). Points to the URL of the 3d model (can be anything that is supported by the ArcGIS API for JavaScript.. try ``daffodilUrl=tent.glb`` if you dare).
* maxDist: number. default: 2. The bigger the area, the lower this number should be. My browser went down at around 1000 planted flowers.
* maxHeight: number. default max flower height: 1
* cameraListener: boolean. default: false. shows camera positions in dev console.
* zoomClose: boolean. default: false. sets camera z value to 0.5 on init.
* startAt: number. default: 0. animation starts at this slide no.
* modelLayerStartAt: number. default: -1. add 3d model layer when animation reaches this slide no.
* modelLayerEndAt: number. default: -1. remove 3d model layer when animation reaches this slide no.
* speedFactor: number. default: 0.1. lower is slower.
* offset: number. default: 0. halt when slide is reached.
* easing: string. default: "in-out-coast-quadratic". [possible values see "easing" doc](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-SceneView.html#GoToOptions3D)

Based the ArcGIS API for JavaScript Sample [Import glTF 3D Models - 4.14](https://developers.arcgis.com/javascript/latest/sample-code/import-gltf/index.html).