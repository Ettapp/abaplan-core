import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { OpendataCHProvider, TransportProvider } from "./opendataProvider";

import Point = require("esri/geometry/Point");

@Injectable()
export class TransportService {
  public currentPoint: Point;

  private transportProvider: TransportProvider = new OpendataCHProvider(
    this.http,
  );

  constructor(private http: Http) {}

  public stationsNearby(): Observable<any | undefined> {
    return this.transportProvider.getStationsNearby(this.currentPoint);
  }

  public closerStationFilter(station: string): Observable<any | undefined> {
    return this.transportProvider.getStationInfo(station);
  }
}
