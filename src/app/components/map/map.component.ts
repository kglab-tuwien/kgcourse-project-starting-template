import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  circle,
  divIcon,
  icon,
  latLng,
  marker,
  polygon,
  tileLayer,
  Map,
  Icon,
  point,
  LeafletEvent,
  polyline, layerGroup, LayerGroup
} from "leaflet";
import {HttpClient} from "@angular/common/http";
// @ts-ignore
import * as Papa from "papaparse";
import {
  concatMap,
  from,
  groupBy,
  map,
  mergeMap,
  Observable,
  of,
  Subscription, tap,
  toArray,
  zip
} from "rxjs";
import {FlatInfo} from "../../types/flat-info.type";
import {Stop} from "../../types/stop.type";
import {ShapeCsvType, ShapeType} from "../../types/shape.type";
import {StopTime, TripsPerStop} from "../../types/stop-time.type";
import {Trip} from "../../types/trip.type";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {

  @Input() shoudLoadData: boolean = true;

  layersControl = {
    baseLayers: {},
    overlays: {}
  }

  options = {
    layers: [
      //tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
      tileLayer('https://maps.wien.gv.at/basemap/bmaphidpi/normal/google3857/{z}/{y}/{x}.jpeg', {maxZoom: 19}),
    ],
    zoom: 13,
    center: latLng(48.210033, 16.363449)
  };

  tripsPerStop$!: Observable<{ [key: string]: string[] }>;
  shapesPerTrip$!: Observable<{ [key: string]: string }>;
  shapes$!: Observable<{ [key: string]: ShapeType[] }>;

  tripsPerStop: { [key: string]: string[] } = {};
  shapesPerTrip: { [key: string]: string } = {};
  shapes: { [key: string]: ShapeType[]; } = {};

  tripsPerStopSubscription!: Subscription;
  shapesPerTripSubscription!: Subscription;
  shapesSubscription!: Subscription;
  stopsSubscription: Subscription | undefined;
  flatSubscription: Subscription | undefined;


  pLayerGroup: LayerGroup = layerGroup();

  stopsLoaded = false;
  stopTimesLoaded = false;
  tripsLoaded = false;
  shapesLoaded = false;

  flatsLoaded = false;


  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    if (this.shoudLoadData) {
      const stopTimes$ = this.http
        .get('/assets/data/wienerlinien/stop_times.txt', {responseType: 'text'})
        .pipe(
          map<string, StopTime[]>(data => Papa.parse(data, {
            header: true,
            skipEmptyLines: true
          }).data)
        );

      this.tripsPerStop$ = stopTimes$
        .pipe(
          concatMap((arr) => from(arr)),
          map<StopTime, TripsPerStop>((e) => ({
            meta_stop_id: e.stop_id.substring(0, this.nthIndex(e.stop_id, ':', 3)),
            trip_id: e.trip_id,
          })),
          groupBy(data => data.meta_stop_id),
          mergeMap((group) => zip(of(group.key), group.pipe(map(el => el.trip_id), toArray()))),
          toArray(),
          map(data => data.reduce((obj: { [key: string]: string[] }, item) => {
            obj[item[0]] = item[1];
            return obj
          }, {})),
        );

      this.tripsPerStop = {};
      this.tripsPerStopSubscription = this.tripsPerStop$.subscribe((data) => {
        this.tripsPerStop = data;
        this.stopTimesLoaded = true;
      });

      this.shapesPerTrip = {};

      const trips$ = this.http
        .get('/assets/data/wienerlinien/trips.txt', {responseType: 'text'})
        .pipe(
          map<string, Trip[]>(data => Papa.parse(data, {
            header: true,
            skipEmptyLines: true
          }).data)
        );

      this.shapesPerTrip$ = trips$.pipe(
        map(data => data.reduce((obj: { [key: string]: string }, item) => {
          obj[item.trip_id] = item.shape_id;
          return obj
        }, {}))
      )

      this.shapesPerTripSubscription = this.shapesPerTrip$.subscribe((data) => {
        this.shapesPerTrip = data;
        this.tripsLoaded = true;
      })

      this.shapes = {};
      this.shapes$ = this.http
        .get('/assets/data/wienerlinien/shapes.txt', {responseType: 'text'})
        .pipe(
          map<string, ShapeCsvType[]>(data => Papa.parse(data, {
            header: true,
            skipEmptyLines: true
          }).data),
          concatMap((arr) => from(arr)),
          map<ShapeCsvType, ShapeType>((data) => ({
            shape_id: data.shape_id,
            shape_pt_lat: parseFloat(data.shape_pt_lat),
            shape_pt_lon: parseFloat(data.shape_pt_lon),
            shape_pt_sequence: parseFloat(data.shape_pt_sequence)
          })),
          groupBy((data) => data.shape_id),
          mergeMap((group) => zip(of(group.key), group.pipe(toArray()))),
          toArray(),
          map(data => data.reduce((obj: { [key: string]: ShapeType[] }, item) => {
            obj[item[0]] = item[1].sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
            return obj
          }, {})),
        )

      this.shapesSubscription = this.shapes$.subscribe((data) => {
        this.shapes = data;
        this.shapesLoaded = true;
      })
    }
  }

  ngOnDestroy() {
    if (this.stopsSubscription != undefined) {
      this.stopsSubscription.unsubscribe();
    }
    if (this.flatSubscription != undefined) {
      this.flatSubscription.unsubscribe();
    }

    this.shapesSubscription.unsubscribe();
    this.tripsPerStopSubscription.unsubscribe();
    this.shapesPerTripSubscription.unsubscribe();
  }

  nthIndex(str: string, pat: string, n: number) {
    let L = str.length, i = -1;
    while (n-- && i++ < L) {
      i = str.indexOf(pat, i);
      if (i < 0) break;
    }
    return i;
  }


  onMapReady(mapElement: Map) {
    if (this.shoudLoadData) {
      this.pLayerGroup.addTo(mapElement);

      const iconType1 = (label: string) => divIcon({
        iconSize: point(8, 8),
        className: "hover:!z-[1000] icon-stationen group relative flext items-center justify-center",
        html: `<div class="hidden group-hover:block absolute  whitespace-nowrap mt-4 -left-1/2 -ml-[50%] font-bold [text-shadow:0_4px_8px_rgba(0,0,0,0.12)]">${label}</div>`
      });

      const iconType2 = (label: string) => divIcon({
        iconSize: point(16, 16),
        className: "hover:!z-[1000] icon-unterkunft group relative flext items-center justify-center",
        html: `<div class="hidden group-hover:block absolute  whitespace-nowrap mt-4 -left-1/2 -ml-[50%] font-bold [text-shadow:0_4px_8px_rgba(0,0,0,0.12)]">${label}</div>`
      });

      const stops$: Observable<Stop[]> = this.http
        .get('/assets/data/wienerlinien/stops.txt', {responseType: 'text'})
        .pipe(
          map(data => Papa.parse(data, {
            header: true,
            skipEmptyLines: true
          }).data)
        );

      this.stopsSubscription = stops$.subscribe((data) => {
        data.forEach((entry) => {
          const location = latLng(parseFloat(entry.stop_lat), parseFloat(entry.stop_lon));
          marker(location, {
            title: entry.stop_id,
            icon: iconType1(entry.stop_name)
          }).addTo(mapElement).on('click', (e) => this.handleMarkerClick(e))
        })
        this.stopsLoaded = true;
      })

      const flats$ = this.http
        .get<FlatInfo[]>('/assets/data/flat_info.json', {responseType: 'json'});

      const formatter = new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'});

      this.flatSubscription = flats$.subscribe((data) => {
        data.forEach((entry) => {
          const location = latLng(parseFloat(entry.LATITUDE), parseFloat(entry.LONGITUDE));
          marker(location, {
            //title: entry.HEADING,
            icon: iconType2(formatter.format(parseFloat(entry.PRICE)))
          }).addTo(mapElement).on('click', (e) => {
            console.log(entry)
          })
        })
        this.flatsLoaded = true;
      })
    }
  }


  handleMarkerClick(e: LeafletEvent) {
    this.pLayerGroup.clearLayers();


    const title = e.target.options.title;
    const shortTitle = title.substring(0, this.nthIndex(title, ':', 3));

    const tripNames = this.tripsPerStop[shortTitle];

    if (tripNames == null) {
      console.log("Trips not found, have you loaded only a subset of the data?")
      return;
    }


    const shapeNames = tripNames.map((tripName: string) => this.shapesPerTrip[tripName]).filter((thing, i: number, arr) => {
      const thingName = arr.find((t) => t == thing);
      return thingName != undefined && arr.indexOf(thingName) === i;
    });

    const lines = shapeNames.map((shapeName: string) => this.shapes[shapeName]);


    lines.forEach((line) => {
      const pointList = line.map((linePoints: { shape_pt_lat: number; shape_pt_lon: number; }) => latLng(linePoints.shape_pt_lat, linePoints.shape_pt_lon));
      const el = polyline(pointList, {color: 'red'});
      this.pLayerGroup.addLayer(el);
    });


  }
}
