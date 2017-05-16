import {Injectable} from "@angular/core";

import * as tokml from 'tokml';
import * as geoJson from 'geojson';
import * as fileSaver from 'file-saver';

interface Point{name:string | undefined,lat:number | undefined,lng:number | undefined};


@Injectable()
export class KmlService {

  private datas : Array<Point> = [];
  private lastPoint : Point = {name:undefined,lat:undefined,lng:undefined};
  private isDeletable : Boolean = false;

  constructor() {
   }

  private emtpylastPoint(){
    this.lastPoint.lng = undefined;
    this.lastPoint.lat = undefined;
    this.lastPoint.name = undefined;
  }

  public currentPoint(longitude:number,latitude:number):void{
    this.lastPoint.lat = latitude;
    this.lastPoint.lng = longitude;
  }

  public addCurrentPoint(name:string):Boolean{
    if(this.lastPoint.lng == undefined)
      return false;

    this.datas.push({name:name,lat:this.lastPoint.lat,lng:this.lastPoint.lng});
    this.emtpylastPoint();
    this.isDeletable = true;
    return true;
  }

  public deletLastPoint():Boolean{
    if(!this.isDeletable)
      return false;

    this.datas.slice(0,this.datas.length-2);
    this.isDeletable = false;
    return true;
  }

  public toKml(nameFile:string):Boolean{
    if(this.datas.length <1)
      return false;

    let geojsonObject = geoJson.parse(this.datas, {Point: ['lat', 'lng']});
    let kmlNameDescription = tokml(geojsonObject, {
          documentName: 'Initeraire'
    });

    let file = new Blob([kmlNameDescription], { type: 'text/kml;charset=utf-8' });
    fileSaver.saveAs(file, nameFile+'.kml');
    return true;
  }

  public endCurrentSession():void{
    this.datas = [];
    this.emtpylastPoint();
    this.isDeletable = false;
  }

}
