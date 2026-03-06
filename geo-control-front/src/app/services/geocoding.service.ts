import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NominatimResult } from '../../types/geocoding.type';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private http = inject(HttpClient);
  private readonly NAMING_URL = 'https://nominatim.openstreetmap.org/search';

  searchAddress(query: string): Observable<NominatimResult[]> {
    const params = {
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1',
      countrycodes: 'ar'
    };

    return this.http.get<NominatimResult[]>(this.NAMING_URL, { params });
  }

  reverse(lat: number, lon: number): Observable<any> {
    const url = 'https://nominatim.openstreetmap.org/reverse';
    const params = {
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json'
    };
    return this.http.get<any>(url, { params });
  }
}
