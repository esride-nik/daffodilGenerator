var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "esri/views/SceneView", "esri/WebScene", "esri/Graphic", "esri/layers/GraphicsLayer", "esri/layers/FeatureLayer", "esri/geometry/Point", "esri/geometry/geometryEngine", "esri/widgets/Search", "esri/widgets/Sketch"], function (require, exports, SceneView_1, WebScene_1, Graphic_1, GraphicsLayer_1, FeatureLayer_1, Point_1, geometryEngine_1, Search_1, Sketch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    SceneView_1 = __importDefault(SceneView_1);
    WebScene_1 = __importDefault(WebScene_1);
    Graphic_1 = __importDefault(Graphic_1);
    GraphicsLayer_1 = __importDefault(GraphicsLayer_1);
    FeatureLayer_1 = __importDefault(FeatureLayer_1);
    Point_1 = __importDefault(Point_1);
    geometryEngine_1 = __importDefault(geometryEngine_1);
    Search_1 = __importDefault(Search_1);
    Sketch_1 = __importDefault(Sketch_1);
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
            this.createSceneAndView();
            this.modelLayer = new GraphicsLayer_1.default({
                id: "modelLayer"
            });
            if ((this.modelLayerStartAt === -1 || this.modelLayerStartAt <= this.startAt) && !this.view.map.findLayerById(this.modelLayer.id)) {
                this.view.map.add(this.modelLayer);
            }
            if (this.usePresentation) {
                this.initPresentation();
                var daffodilAreas = new FeatureLayer_1.default({
                    url: this.daffodilAreasUrl,
                    id: "daffodilAreas"
                });
                if (this.showAreaLayer)
                    this.view.map.add(daffodilAreas);
                // Queries for all the features in the service (not the graphics in the view)
                daffodilAreas.queryFeatures().then(function (results) { return _this.handleDaffodils(results); });
            }
            else {
                this.searchWidget = new Search_1.default({
                    view: this.view
                });
                this.view.ui.add(this.searchWidget, {
                    position: "top-left",
                    index: 0
                });
                var sketchLayer_1 = new GraphicsLayer_1.default();
                this.view.map.add(sketchLayer_1);
                this.sketch = new Sketch_1.default({
                    layer: sketchLayer_1,
                    view: this.view
                });
                this.view.ui.add(this.sketch, {
                    position: "top-right",
                    index: 0
                });
                this.sketch.on("create", function (event) {
                    if (event.state === "complete") {
                        _this.drawDaffodilsIntoArea(event.graphic.geometry);
                        sketchLayer_1.remove(event.graphic);
                    }
                });
            }
        }
        DaffodilGen.prototype.handleDaffodils = function (results) {
            // prints an array of all the features in the service to the console
            console.log("daffodilAreas query", results.features);
            var allGeo = results.features.map(function (feature) { return feature.geometry; });
            var unGeo = geometryEngine_1.default.union(allGeo);
            console.log("result geo", allGeo, unGeo);
            this.drawDaffodilsIntoArea(unGeo);
        };
        DaffodilGen.prototype.drawDaffodilsIntoArea = function (unGeo) {
            var ext = unGeo.extent;
            var xDist = this.maxDist * this.getRndPercent();
            var yDist = this.maxDist * this.getRndPercent();
            var pointCounter = 0;
            var rowCounter = 0;
            for (var x = ext.xmin; x < ext.xmax; x += xDist) {
                for (var y = ext.ymin; y < ext.ymax; y += yDist) {
                    var point = new Point_1.default({
                        y: y,
                        x: x,
                        spatialReference: unGeo.spatialReference
                    });
                    if (geometryEngine_1.default.contains(unGeo, point)) {
                        var heading = Math.random() * 360;
                        var height = this.maxHeight * this.getRndPercent(50, 100);
                        var graphic = new Graphic_1.default({
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
        DaffodilGen.prototype.initPresentation = function () {
            var _this = this;
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
        };
        DaffodilGen.prototype.createSceneAndView = function () {
            var _this = this;
            this.webScene = new WebScene_1.default({
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
            this.view = new SceneView_1.default({
                container: "viewDiv",
                map: this.webScene
            });
            if (!this.showWidgets && this.usePresentation) {
                this.view.ui.empty("top-left");
                this.view.ui.remove("attribution");
            }
            if (!this.usePresentation) {
                this.view.when().then(function (e) {
                    var cam = _this.view.camera;
                    cam.position.x = 775332.0137992485;
                    cam.position.y = 6612214.632348182;
                    cam.position.z = 57.69778415095061;
                    cam.heading = 207.988007136939;
                    cam.tilt = 82.21180084335059;
                    _this.view.goTo(cam, {
                        animate: false
                    });
                });
            }
        };
        DaffodilGen.prototype.getUrlParams = function () {
            var queryParams = document.location.search;
            var result = {};
            queryParams.split("?").map(function (params) {
                params.split("&").map(function (param) {
                    var item = param.split("=");
                    result[item[0]] = decodeURIComponent(item[1]);
                });
            });
            if (result.usePresentation)
                this.usePresentation = result.usePresentation === "true" || result.usePresentation === "y" || result.usePresentation === 1 ? true : false;
            if (result.showWidgets)
                this.showWidgets = result.showWidgets;
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
                this.modelLayerStartAt = parseInt(result.modelLayerStartAt);
            if (result.modelLayerEndAt)
                this.modelLayerEndAt = parseInt(result.modelLayerEndAt);
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
            if (!(this.modelLayerStartAt === -1) && this.modelLayerStartAt === this.aniSlideCounter && !this.view.map.findLayerById(this.modelLayer.id)) {
                this.view.map.add(this.modelLayer);
            }
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
    var daffodilGen = new DaffodilGen();
});
//# sourceMappingURL=main.js.map