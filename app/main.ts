
import SceneView = require("esri/views/SceneView");
import WebScene = require("esri/WebScene");
import Graphic = require("esri/Graphic");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Point = require("esri/geometry/Point");
import geometryEngine = require("esri/geometry/geometryEngine");
import PointSymbol3D = require("esri/symbols/PointSymbol3D");

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


    constructor() {
        this.getUrlParams();

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

        if (!this.showWidgets) {
            this.view.ui.empty("top-left");
            this.view.ui.remove("attribution");
        }

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
                })
            }
        });

        this.modelLayer = new GraphicsLayer({
            id: "modelLayer"
        });

        if ((this.modelLayerStartAt === -1 || this.modelLayerStartAt <= this.startAt) && !this.view.map.findLayerById(this.modelLayer.id)) {
            this.view.map.add(this.modelLayer);
        }

        let daffodilAreas = new FeatureLayer({
            url: this.daffodilAreasUrl,
            id: "daffodilAreas"
        })
        if (this.showAreaLayer) this.view.map.add(daffodilAreas);



        // Queries for all the features in the service (not the graphics in the view)
        daffodilAreas.queryFeatures().then((results: any) => this.handleDaffodils(results));
    }

    private handleDaffodils(results: any) {
        // prints an array of all the features in the service to the console
        console.log("daffodilAreas query", results.features);

        let allGeo = results.features.map((feature: Graphic) => feature.geometry);
        let unGeo = geometryEngine.union(allGeo);

        console.log("result geo", allGeo, unGeo);

        let ext = unGeo.extent;
        let xDist = this.maxDist * this.getRndPercent();
        let yDist = this.maxDist * this.getRndPercent();
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
        console.log("total pointCounter", pointCounter);
    }

    private getUrlParams() {
        const queryParams = document.location.search.substr(1);
        let result: any = {};

        queryParams.split("?").map((params) => {
            params.split("&").map((param) => {
                var item = param.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
            })
        });

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
        if (result.modelLayerStartAt) this.modelLayerStartAt = result.modelLayerStartAt;
        if (result.modelLayerEndAt) this.modelLayerEndAt = result.modelLayerEndAt;
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

    private playAnimation(slides) {
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
        new Promise((resolve) => {
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



