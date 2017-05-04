import {Component, ViewChild, ElementRef} from "@angular/core";
import { Router, ActivatedRoute, Params } from '@angular/router';
import 'rxjs/add/operator/switchMap';
import { MapService } from '../map/map.service';
import { GeoService } from '../core/geo.service';
import { VoiceService } from '../core/voice.service';
import { StateService } from "../core/state.service";
import { OptionMap } from '../map/map';
import { MapComponent } from '../map/map.component'

import WebMercatorUtils = require('esri/geometry/webMercatorUtils');
import Geometry = require('esri/geometry/Geometry');
import Point = require('esri/geometry/Point')
import Graphic = require("esri/graphic");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import {Vector2d, Plane2d, transform} from '../core/vector2d';
import LatLng = google.maps.LatLng;

import {TranslateService} from "ng2-translate";
import {ScalarObservable} from 'rxjs/observable/ScalarObservable';

interface translations  {value : string};

@Component({
  selector: 'aba-touchpad',
  templateUrl: 'touchpad.component.html',
  styleUrls: ['touchpad.component.css'],
  providers : []
})
export class TouchpadComponent {
  @ViewChild(MapComponent)
  private mapComponent: MapComponent;
  private nbClick: number = 0;
  private readonly defaultVector: Vector2d = {x: 0, y: 0};
  private devicePlane: Plane2d = <Plane2d> { A: this.defaultVector, B: this.defaultVector, C: this.defaultVector, D: this.defaultVector};
  private divPlane: Plane2d = <Plane2d> { A: this.defaultVector, B: this.defaultVector, C: this.defaultVector, D: this.defaultVector};

  private searchingPoint: Point | undefined = undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mapService: MapService,
    private voiceService : VoiceService,
    private stateService : StateService,
    private geoService : GeoService,
    private translateService: TranslateService,
    private _elementRef: ElementRef
  ){

    /**Init the voice commands and start calibration */
    document.onreadystatechange= () => {
      this.prepareVoiceCommand();
      this.voiceService.say(this.getStringTranslation("touchpadCenter"));
    }

    document.onclick = (ev: MouseEvent) => {
      if (!this.isCalibrated()) {
        /*
         * Calibration mode.
         * At the beginning, we detect the 4th corner of the device to map with de real div esri map
         */
        switch (this.nbClick) {
          case 0:
            this.voiceService.say(this.getStringTranslation("touchpadTopLeft"));

            break;
          case 1:
            /* Note: clientX and clientY for firefox compatibility */
            this.devicePlane.A = <Vector2d> {x: ev.x || ev.clientX, y: ev.y || ev.clientY};

            const geo = this.mapComponent.map.extent;

            this.divPlane.C = <Vector2d> {x: geo.xmin, y: geo.ymin };
            this.divPlane.D = <Vector2d> {x: geo.xmax, y: geo.ymin };
            this.divPlane.A = <Vector2d> {x: geo.xmin, y: geo.ymax };
            this.divPlane.B = <Vector2d> {x: geo.xmax, y: geo.ymax };

            this.voiceService.say(this.getStringTranslation("touchpadTopRight"));
            break;

          case 2:
            this.devicePlane.B = <Vector2d> {x: ev.x || ev.clientX, y: ev.y || ev.clientY};

            this.voiceService.say(this.getStringTranslation("touchpadBottomLeft"));
            break;
          case 3:
            this.devicePlane.C = <Vector2d> {x: ev.x || ev.clientX, y: ev.y || ev.clientY};

            this.voiceService.say(this.getStringTranslation("touchpadBottomRight"));
            break;
          case 4:
            this.devicePlane.D = <Vector2d> {x: ev.x || ev.clientX, y: ev.y || ev.clientY};

            this.voiceService.say(this.getStringTranslation("touchpadOk"));
            break;
        }
        this.nbClick += 1;

      } else if (this.isCalibrated()) {

        // Transformation from device coordinates to esri map coordinates

        // Detect current `P` point
        const OP = { x: ev.x || ev.clientX, y: ev.y || ev.clientY };

        // `P'` is the transformed final point on the esri map
        const OP_ = transform(OP, this.devicePlane, this.divPlane);

        // Transform to EsriPoint
        const mappedPoint = new Point(OP_.x, OP_.y);
        const touchPoint : Point = <Point> WebMercatorUtils.webMercatorToGeographic(mappedPoint);

        switch (this.stateService.activeMode().mode){
          case "reading":
            this.locateClick(touchPoint);
            break;
          case "searching":
            if (this.searchingPoint !== undefined){
              this.searchLocationClick(this.searchingPoint, touchPoint);
            } else {
              console.warn("Impossible state, searchingPoint must be defined");
            }
            break;
        }

        const symbol = new SimpleMarkerSymbol({
          color: [226, 119, 40],
          outline: { color: [255, 255, 255], width: 2 },
        });
        const graphic = new Graphic(touchPoint, symbol);
        this.mapComponent.map.graphics.add(graphic);

      }
    };

  }

  private isCalibrated(): boolean {
    return this.nbClick > 4;
  }

  onClick() {
    // Enable full screen
    this.mapComponent.map.setLayerVisible({kind: "osm"});
    const elem = <any> document.getElementsByTagName('body')[0];
    const f = elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen;
    f.call(elem);
  }

  ngOnInit() {

      // (+) converts string 'id' to a number
      let id = +this.route.snapshot.params['id'];

    this.mapService.map(id)
      .subscribe((optionMap: OptionMap) => {

        this.mapComponent.initMap(optionMap);

        /* jca: hack for the issue #76 and #77
         * To load an OSM map on a map saved with a different layer, we must load osm right
         * after the beginning of the original layer.
         */
        this.mapComponent.map.on("layer-reorder", () => {
          //this.mapComponent.map.setLayerVisible({kind: "osm"});
        });
        this.mapComponent.map.on("extent-change", () => {
          this.mapComponent.map.setLayerVisible({kind: "osm"});

          const map = document.getElementById("esri-map");
          if (map !== null){
            const style = map.style;
            style.height = optionMap.height + "px";
            style.width = optionMap.width + "px";
          }

        });

        this.mapComponent.map.disableMapNavigation();

        this.mapComponent.map.width = optionMap.width;
        this.mapComponent.map.height = optionMap.height;

      });
  }

  /** Switch to reading mode and notify the user */
  private readCommand():void{
    this.stateService.changeMode( {mode: "reading"} );
    this.voiceService.say(this.getStringTranslation("readActive"));
  }

  /** Switch to search mode and notify the user */
  private searchCommand(i: number, wildcard: string):void{
    this.searchingPoint = undefined;
    this.stateService.changeMode( {mode: "searching"} );
    this.voiceService.say(this.getStringTranslation("searchOk") + wildcard);

    this.geoService.point(wildcard).subscribe(
      (searchPoint: Point) => {
        this.searchingPoint = searchPoint;
        if (searchPoint === undefined){
          this.voiceService.say(this.getStringTranslation("searchKo"));
          this.stateService.changeMode( {mode: "reading"} );
        }
      }
    );
  }

  /** Notity the user in terms of input number  */
  private offendCommand(i:number):void{
    if (i%3===0) {
      this.voiceService.say(this.getStringTranslation("offendTextOne"));
    } else if (i%3 === 1){
      this.voiceService.say(this.getStringTranslation("offendTextTwo"));
    }else{
      this.voiceService.say(this.getStringTranslation("offendTextTree"));
    }
  }

  /** Change language of application */
  private changeLang(langTranslate : string,langVoice : string):void{
        this.translateService.use(langTranslate);
        this.voiceService.changeLang(langVoice);
  }

  /** Add Commands */
  private prepareVoiceCommand() {
    // Loop for add command in each lang of application
    let langs = this.translateService.getLangs();
    for(let entry of langs){
      this.translateService.use(entry);
      let codeVoice = this.getStringTranslation("codeLangVoice");

      // Reading mode (default)
      this.voiceService.addCommand(
        [this.getStringTranslation("readId")],
        this.getStringTranslation("readDescri"),
        () => this.readCommand()
      );

      // Searching mode
      this.voiceService.addCommand(
        this.getStringTranslations("searchId"),
        this.getStringTranslation("searchDescri"),
        (i: number, wildcard: string) => this.searchCommand(i, wildcard)
      );

      // React to insults command
      this.voiceService.addCommand(
        this.getStringTranslations("offendId"),
        this.getStringTranslation("offendDescri"),
        (i: number) => this.offendCommand(i)
      );

      // Switch Lang command
      this.voiceService.addCommand(
        [this.getStringTranslation("myLang")],
        this.getStringTranslation("codeLang"),
        () => this.changeLang(entry,codeVoice)
      );
    }
  }

  /** Locate click and notity the user */
  private locateClick(point: Point): void {

    this.geoService.address(point).subscribe(
      address => {
        if (address){
          this.voiceService.sayGeocodeResult(address);
        }
      }
    );

  }

  /** Notity the user of direction */
  private searchLocationClick(location: Point, touchPoint: Point): void {

    this.voiceService.say(this.geoService.directionToText(location, touchPoint));

  }

  /** Return string by id and current lang of application */
  private getStringTranslation(s: string) : string {
    return (this.translateService.get(s)as ScalarObservable<string>).value;
  }

  /** Return array of string by id and current lang of application */
  private getStringTranslations(s: string) : Array<string> {
    return (this.translateService.get(s)as ScalarObservable<Array<translations>>).value.map(object => object.value) ;
  }
}
