define(["require", "exports", "esri/views/SceneView", "esri/WebScene", "esri/Graphic", "esri/layers/GraphicsLayer", "esri/layers/FeatureLayer", "esri/geometry/Point", "esri/geometry/geometryEngine"], function (require, exports, SceneView, WebScene, Graphic, GraphicsLayer, FeatureLayer, Point, geometryEngine) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DaffodilGen = /** @class */ (function () {
        function DaffodilGen() {
            var _this = this;
            this.showWidgets = false;
            this.showAreaLayer = false;
            this.itemId = "6d83a0e1c12b43beba2a0eb745ec552a";
            this.daffodilAreasUrl = "https://services.arcgis.com/OLiydejKCZTGhvWg/arcgis/rest/services/DaffodilAreas_Coast/FeatureServer/0";
            this.daffodilUrl = "./Daffodil_426_te1.glb";
            this.maxDist = 2;
            this.maxHeight = 1;
            this.startAt = 0;
            this.modelLayerStartAt = -1;
            this.modelLayerEndAt = -1;
            this.speedFactor = 0.1;
            this.offset = 0;
            this.cameraListener = false;
            this.zoomClose = false;
            this.easing = "in-out-coast-quadratic";
            this.getUrlParams();
            this.webScene = new WebScene({
                portalItem: {
                    id: this.itemId
                }
            });
            this.webScene.load().then(function (w) {
                console.log("webScene loaded", w);
                _this.webScene.basemap.loadAll()
                    .catch(function (error) {
                    console.error("Basemap resource load error", error);
                })
                    .then(function (l) {
                    console.log("All loaded", l);
                });
            });
            this.view = new SceneView({
                container: "viewDiv",
                map: this.webScene
            });
            if (!this.showWidgets) {
                this.view.ui.empty("top-left");
                this.view.ui.remove("attribution");
            }
            this.view.when(function () {
                _this.createPresentation(_this.webScene.presentation.slides);
                if (_this.zoomClose) {
                    var c = _this.view.camera;
                    c.position.z = 0.1;
                    _this.view.goTo(c);
                }
                if (_this.cameraListener) {
                    _this.view.watch("camera", function (c) {
                        console.log(JSON.stringify(c));
                    });
                }
            });
            this.modelLayer = new GraphicsLayer({
                id: "modelLayer"
            });
            if ((this.modelLayerStartAt === -1 || this.modelLayerStartAt <= this.startAt) && !this.view.map.findLayerById(this.modelLayer.id)) {
                this.view.map.add(this.modelLayer);
            }
            var daffodilAreas = new FeatureLayer({
                url: this.daffodilAreasUrl,
                id: "daffodilAreas"
            });
            if (this.showAreaLayer)
                this.view.map.add(daffodilAreas);
            // Queries for all the features in the service (not the graphics in the view)
            daffodilAreas.queryFeatures().then(function (results) { return _this.handleDaffodils(results); });
        }
        DaffodilGen.prototype.handleDaffodils = function (results) {
            // prints an array of all the features in the service to the console
            console.log("daffodilAreas query", results.features);
            var allGeo = results.features.map(function (feature) { return feature.geometry; });
            var unGeo = geometryEngine.union(allGeo);
            console.log("result geo", allGeo, unGeo);
            var ext = unGeo.extent;
            var xDist = this.maxDist * this.getRndPercent();
            var yDist = this.maxDist * this.getRndPercent();
            var pointCounter = 0;
            var rowCounter = 0;
            for (var x = ext.xmin; x < ext.xmax; x += xDist) {
                for (var y = ext.ymin; y < ext.ymax; y += yDist) {
                    var point = new Point({
                        y: y,
                        x: x,
                        spatialReference: unGeo.spatialReference
                    });
                    if (geometryEngine.contains(unGeo, point)) {
                        var heading = Math.random() * 360;
                        var height = this.maxHeight * this.getRndPercent(50, 100);
                        var graphic = new Graphic({
                            geometry: point,
                            symbol: {
                                type: "point-3d",
                                symbolLayers: [
                                    {
                                        type: "object",
                                        resource: {
                                            href: this.daffodilUrl
                                        },
                                        height: height,
                                        heading: heading,
                                    }
                                ]
                            }
                        });
                        this.modelLayer.add(graphic);
                        console.log("graphic ", graphic, height, heading);
                        pointCounter++;
                    }
                    yDist = this.maxDist * this.getRndPercent();
                }
                xDist = this.maxDist * this.getRndPercent();
                rowCounter++;
                console.log("row ", rowCounter, " pointCounter", pointCounter);
            }
            console.log("total pointCounter", pointCounter);
        };
        DaffodilGen.prototype.getUrlParams = function () {
            var queryParams = document.location.search.substr(1);
            var result = {};
            queryParams.split("?").map(function (params) {
                params.split("&").map(function (param) {
                    var item = param.split("=");
                    result[item[0]] = decodeURIComponent(item[1]);
                });
            });
            if (result.showWidgets)
                this.showWidgets = result.showWidgets;
            if (result.showAreaLayer)
                this.showAreaLayer = result.showAreaLayer;
            if (result.itemId)
                this.itemId = result.itemId;
            if (result.daffodilAreasUrl)
                this.daffodilAreasUrl = result.daffodilAreasUrl;
            if (result.daffodilUrl)
                this.daffodilUrl = result.daffodilUrl;
            if (result.maxDist)
                this.maxDist = result.maxDist;
            if (result.maxHeight)
                this.maxHeight = result.maxHeight;
            if (result.cameraListener)
                this.cameraListener = result.cameraListener;
            if (result.zoomClose)
                this.zoomClose = result.zoomClose;
            if (result.startAt)
                this.startAt = result.startAt;
            if (result.modelLayerStartAt)
                this.modelLayerStartAt = result.modelLayerStartAt;
            if (result.modelLayerEndAt)
                this.modelLayerEndAt = result.modelLayerEndAt;
            if (result.speedFactor)
                this.speedFactor = result.speedFactor;
            if (result.offset)
                this.offset = result.offset;
            if (result.easing)
                this.easing = result.easing;
        };
        DaffodilGen.prototype.getRndPercent = function (min, max) {
            if (min === void 0) { min = 0; }
            if (max === void 0) { max = 100; }
            var rnd = Math.random() * (max - min + 1) + min;
            var pc = rnd / 100.0;
            return pc;
        };
        // when the webscene has slides, they are added in a list at the bottom
        DaffodilGen.prototype.createPresentation = function (slides) {
            // when the webscene has slides, they are added in a list at the bottom
            console.log("createPresentation", slides.items);
            this.playAnimation(slides.items);
        };
        DaffodilGen.prototype.playAnimation = function (slides) {
            var _this = this;
            if (this.startAt > slides.length)
                this.startAt = 0;
            this.aniSlideCounter = this.startAt;
            console.log("Playing flight on click", slides, this.view, " | speedFactor:", this.speedFactor, " | offset (ms):", this.offset, " | starting at slide ", this.startAt);
            this.view.on("click", function () {
                console.log("click starts animation");
                _this.aniNextLocation(slides);
            });
        };
        DaffodilGen.prototype.aniNextLocation = function (slides) {
            var _this = this;
            console.log("Approaching location #" + this.aniSlideCounter, slides[this.aniSlideCounter], slides[this.aniSlideCounter].viewpoint);
            new Promise(function (resolve) {
                setTimeout(resolve, _this.offset);
            }).then(function () {
                console.log("Offset over", _this.offset);
                if (_this.aniSlideCounter <= slides.length) {
                    if ((_this.modelLayerEndAt === _this.aniSlideCounter) && _this.view.map.findLayerById(_this.modelLayer.id)) {
                        _this.view.map.remove(_this.modelLayer);
                    }
                    _this.view.goTo(slides[_this.aniSlideCounter].viewpoint, {
                        animate: true,
                        speedFactor: _this.speedFactor,
                        maxDuration: 1000000,
                        easing: _this.easing
                    }).then(function () {
                        _this.aniNextLocation(slides);
                    });
                    _this.aniSlideCounter++;
                }
            });
        };
        return DaffodilGen;
    }());
});
//# sourceMappingURL=main.js.map