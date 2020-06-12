
import SceneView from "esri/views/SceneView";
import WebScene from "esri/WebScene";
import Graphic from "esri/Graphic";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import FeatureLayer from "esri/layers/FeatureLayer";
import Point from "esri/geometry/Point";
import geometryEngine from "esri/geometry/geometryEngine";
import PointSymbol3D from "esri/symbols/PointSymbol3D";
import Search from "esri/widgets/Search";
import Sketch from "esri/widgets/Sketch";
import Geometry from "esri/geometry/Geometry";

class DaffodilGen {

    private showWidgets = false;
    private showAreaLayer = false;
    private itemId = "6d83a0e1c12b43beba2a0eb745ec552a";
    private daffodilAreasUrl = "https://services.arcgis.com/OLiydejKCZTGhvWg/arcgis/rest/services/DaffodilAreas_Coast/FeatureServer/0";
    private daffodilUrl = "./Daffodil_426_te1.glb";
    private maxDist = 2;
    private maxHeight = 1;
    private startAt = 0;
    private modelLayerStartAt = -1;
    private modelLayerEndAt = -1;
    private speedFactor = 0.1;
    private offset = 0;
    private cameraListener = false;
    private zoomClose = false;
    private easing = "in-out-coast-quadratic";
    private view: SceneView;
    private modelLayer: GraphicsLayer;
    private aniSlideCounter: number;
    private webScene: WebScene;
    private usePresentation: boolean;
    searchWidget: Search;
    sketch: any;
    geocode: any;


    constructor() {
        this.getUrlParams();
        this.createSceneAndView();

        this.modelLayer = new GraphicsLayer({
            id: "modelLayer"
        });

        if ((this.modelLayerStartAt === -1 || this.modelLayerStartAt <= this.startAt) && !this.view.map.findLayerById(this.modelLayer.id)) {
            this.view.map.add(this.modelLayer);
        }

        if (this.usePresentation) {
            this.initPresentation();

            let daffodilAreas = new FeatureLayer({
                url: this.daffodilAreasUrl,
                id: "daffodilAreas"
            })
            if (this.showAreaLayer) this.view.map.add(daffodilAreas);

            // Queries for all the features in the service (not the graphics in the view)
            daffodilAreas.queryFeatures().then((results: any) => this.handleDaffodils(results));
        }
        else {
            this.searchWidget = new Search({
                view: this.view
            });
            if (this.geocode) {
                this.searchWidget.search(this.geocode);
                this.searchWidget.goToOverride = (view: SceneView, goToParams: any) => {
                    goToParams.options.animate = false;
                    return view.goTo(goToParams.target, goToParams.options);
                };
            }
            this.view.ui.add(this.searchWidget, {
                position: "top-left",
                index: 0
            });

            let sketchLayer = new GraphicsLayer();
            this.view.map.add(sketchLayer);

            this.sketch = new Sketch({
                layer: sketchLayer,
                view: this.view,
                availableCreateTools: ["polygon", "rectangle", "circle"]
            });
            this.view.ui.add(this.sketch, {
                position: "top-right",
                index: 0
            });

            this.sketch.on("create", (event: any) => {
                if (event.state === "complete") {
                    this.drawDaffodilsIntoArea(event.graphic.geometry);
                    this.view.goTo(event.graphic.geometry);
                    sketchLayer.remove(event.graphic);
                }
            });
        }
    }

    private handleDaffodils(results: any) {
        // prints an array of all the features in the service to the console
        console.log("daffodilAreas query", results.features);

        let allGeo = results.features.map((feature: Graphic) => feature.geometry);
        let unGeo = geometryEngine.union(allGeo);

        console.log("result geo", allGeo, unGeo);

        this.drawDaffodilsIntoArea(unGeo);
    }


    private drawDaffodilsIntoArea(unGeo: Geometry) {
        let ext = unGeo.extent;
        let xDist = this.maxDist * this.getRndPercent();
        let yDist = this.maxDist * this.getRndPercent();

        // assume numbers
        let assumePointCount = 0;
        for (let x = ext.xmin; x < ext.xmax; x += xDist) {
            for (let y = ext.ymin; y < ext.ymax; y += yDist) {
                assumePointCount++;
                yDist = this.maxDist * this.getRndPercent();
            }
            xDist = this.maxDist * this.getRndPercent();
        }

        let pointCounter = 0;
        let rowCounter = 0;
        for (let x = ext.xmin; x < ext.xmax; x += xDist) {
            for (let y = ext.ymin; y < ext.ymax; y += yDist) {
                let point = new Point({
                    y: y,
                    x: x,
                    spatialReference: unGeo.spatialReference
                });
                if (geometryEngine.contains(unGeo, point)) {
                    let heading = Math.random() * 360;
                    let height = this.maxHeight * this.getRndPercent(50, 100);
                    let graphic = new Graphic({
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
                        } as unknown as PointSymbol3D
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
        console.log("total pointCounter", pointCounter, "assumed: ", assumePointCount, "ratio assumed/real: ", assumePointCount / pointCounter);
    }

    private initPresentation() {
        this.view.when(() => {
            this.createPresentation(this.webScene.presentation.slides);
            if (this.zoomClose) {
                let c = this.view.camera;
                c.position.z = 0.1;
                this.view.goTo(c);
            }
            if (this.cameraListener) {
                this.view.watch("camera", (c) => {
                    console.log(JSON.stringify(c));
                });
            }
        });
    }

    private createSceneAndView() {
        this.webScene = new WebScene({
            portalItem: {
                id: this.itemId
            }
        });
        this.webScene.load().then((w: any) => {
            console.log("webScene loaded", w);
            this.webScene.basemap.loadAll()
                .catch((error) => {
                    console.error("Basemap resource load error", error);
                })
                .then((l) => {
                    console.log("All loaded", l);
                });
        });
        this.view = new SceneView({
            container: "viewDiv",
            map: this.webScene
        });
        if (!this.showWidgets && this.usePresentation) {
            this.view.ui.empty("top-left");
            this.view.ui.remove("attribution");
        }
        if (!this.usePresentation) {
            this.view.when().then((e: any) => {
                let cam = { "position": { "spatialReference": { "latestWkid": 3857, "wkid": 102100 }, "x": 775403.8146573873, "y": 6612168.1981127085, "z": 57.69778415095061 }, "heading": 207.9885080296481, "tilt": 82.21180084335448 };
                this.view.goTo(cam, {
                    animate: false
                });
            });
        }
    }

    private getUrlParams() {
        let queryParams = document.location.search;
        let result: any = {};

        queryParams.split("?").map((params) => {
            params.split("&").map((param) => {
                var item = param.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
            })
        });

        if (result.geocode) this.geocode = result.geocode;
        if (result.usePresentation) this.usePresentation = result.usePresentation === "true" || result.usePresentation === "y" || result.usePresentation === 1 ? true : false;
        if (result.showWidgets) this.showWidgets = result.showWidgets;
        if (result.showWidgets) this.showWidgets = result.showWidgets;
        if (result.showAreaLayer) this.showAreaLayer = result.showAreaLayer;
        if (result.itemId) this.itemId = result.itemId;
        if (result.daffodilAreasUrl) this.daffodilAreasUrl = result.daffodilAreasUrl;
        if (result.daffodilUrl) this.daffodilUrl = result.daffodilUrl;
        if (result.maxDist) this.maxDist = result.maxDist;
        if (result.maxHeight) this.maxHeight = result.maxHeight;
        if (result.cameraListener) this.cameraListener = result.cameraListener;
        if (result.zoomClose) this.zoomClose = result.zoomClose;
        if (result.startAt) this.startAt = result.startAt;
        if (result.modelLayerStartAt) this.modelLayerStartAt = parseInt(result.modelLayerStartAt);
        if (result.modelLayerEndAt) this.modelLayerEndAt = parseInt(result.modelLayerEndAt);
        if (result.speedFactor) this.speedFactor = result.speedFactor;
        if (result.offset) this.offset = result.offset;
        if (result.easing) this.easing = result.easing;
    }

    private getRndPercent(min = 0, max = 100) {
        let rnd = Math.random() * (max - min + 1) + min;
        let pc = rnd / 100.0;
        return pc;
    }

    // when the webscene has slides, they are added in a list at the bottom
    private createPresentation(slides: any) {
        // when the webscene has slides, they are added in a list at the bottom
        console.log("createPresentation", slides.items);
        this.playAnimation(slides.items);
    }

    private playAnimation(slides: any) {
        if (this.startAt > slides.length) this.startAt = 0;
        this.aniSlideCounter = this.startAt;

        console.log("Playing flight on click", slides, this.view, " | speedFactor:", this.speedFactor, " | offset (ms):", this.offset, " | starting at slide ", this.startAt);

        this.view.on("click", () => {
            console.log("click starts animation");
            this.aniNextLocation(slides);
        });
    }

    private aniNextLocation(slides: any) {
        console.log("Approaching location #" + this.aniSlideCounter, slides[this.aniSlideCounter], slides[this.aniSlideCounter].viewpoint);
        if (!(this.modelLayerStartAt === -1) && this.modelLayerStartAt === this.aniSlideCounter && !this.view.map.findLayerById(this.modelLayer.id)) {
            this.view.map.add(this.modelLayer);
        }
        new Promise((resolve: any) => {
            setTimeout(resolve, this.offset);
        }).then(() => {
            console.log("Offset over", this.offset);
            if (this.aniSlideCounter <= slides.length) {

                if ((this.modelLayerEndAt === this.aniSlideCounter) && this.view.map.findLayerById(this.modelLayer.id)) {
                    this.view.map.remove(this.modelLayer);
                }

                this.view.goTo(slides[this.aniSlideCounter].viewpoint, {
                    animate: true,
                    speedFactor: this.speedFactor,
                    maxDuration: 1000000,
                    easing: this.easing
                }).then(() => {
                    this.aniNextLocation(slides)
                });
                this.aniSlideCounter++;
            }
        });
    }
}

let daffodilGen = new DaffodilGen();