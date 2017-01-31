import { Component, Input } from "@angular/core";
import { MapService } from "../core/map.service";
import {OptionMap} from "../core/map";


@Component({
  selector: 'aba-modal-maps',
  templateUrl: 'modal-maps-list.component.html',
  styleUrls: ['modal-maps-list.component.css']
})
export class ModalMapComponent {

  @Input('visible') visible: boolean = false;

  private maps: OptionMap[] = [];
  private search: string = "";
  private filteredMaps: OptionMap[] = this.maps;

  constructor(private mapService: MapService) {
    mapService.maps().subscribe(
      (maps : OptionMap[]) => {
        this.maps = maps;
        this.filteredMaps = maps;
      },
      (error) => {
        console.log(error);
      }
    );

  }

  private isVisible(): boolean {
    return this.visible;
  }

  public open(): void {
    this.visible = true;
  }
  public close(): void{
    this.visible = false;
  }

  private onChange(query: string): void {
    if (query !== ""){
      this.filteredMaps = this.maps.filter( m => m.title.toLowerCase().includes(query.toLowerCase()) || m.uid.toString().includes(query));
    }else{
      this.filteredMaps = this.maps;
    }
  }

  /*
  private filteredMaps(query: string): OptionMap[] {
    console.log(query);
    return this.maps.filter( m => m.title.includes(query) || m.uid.toString().includes(query));
  }
  */
}
