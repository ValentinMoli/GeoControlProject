import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profession } from '../../types/profession.type';

@Injectable({
  providedIn: 'root'
})
export class ProfessionsService {
  private apiUrl = 'http://localhost:7214/api/professions';

  constructor(private http: HttpClient) {}

  getProfessions(): Observable<Profession[]> {
    return this.http.get<Profession[]>(this.apiUrl);
  }

  createProfession(name: string): Observable<Profession> {
    return this.http.post<Profession>(this.apiUrl, { name });
  }

  updateProfession(id: number, name: string): Observable<Profession> {
    return this.http.put<Profession>(`${this.apiUrl}/${id}`, { name });
  }

  deleteProfession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
