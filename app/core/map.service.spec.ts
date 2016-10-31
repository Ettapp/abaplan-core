import { OptionMap, MapType } from './map';
import { MapService }   from './map.service';
import {InMemoryDataService } from './in-memory-data.service';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';

import {HttpModule} from '@angular/http';

import { inject, async, TestBed} from '@angular/core/testing';
import 'rxjs/add/operator/map'

describe('MapService', () => {
    // Before each, import module and providers
    beforeEach(() => {
      TestBed.configureTestingModule({
            imports: [HttpModule, InMemoryWebApiModule.forRoot(InMemoryDataService)],
            providers: [MapService]
        }
      );
    });

    // Test for Observable
    it('should get map #2',
        async(inject([MapService], (service: MapService) => {
            // Return promise
            return new Promise((pass, fail) => {
              service.map(2).subscribe(
                  // Pass
                 (map : OptionMap) => {
                     expect(map).toBeDefined();
                 },
                 // Fail
                 (error) => {
                     fail(error);
                 });
             });

       }))
    );

    it('should get maps',
        async(inject([MapService], (service: MapService) => {
            // Return promise
            return new Promise((pass, fail) => {
              service.maps().subscribe(
                  // Pass
                 (maps : OptionMap[]) => {
                     expect(maps).toBeDefined();
                     expect(maps.length).toBeGreaterThan(1);
                 },
                 // Fail
                 (error) => {
                     fail(error);
                 });
             });

       }))
    );
});
