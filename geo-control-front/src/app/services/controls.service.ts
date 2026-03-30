import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Control, CreateControlRequest } from '../../types/control.type';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ControlsService {
  private apiUrl = `${environment.apiUrl}/controls`;
  private controlChangedSource = new Subject<void>();
  controlChanged$ = this.controlChangedSource.asObservable();

  constructor(private http: HttpClient) {}

  getControls(): Observable<Control[]> {
    return this.http.get<Control[]>(this.apiUrl);
  }

  createControl(control: CreateControlRequest): Observable<Control> {
    return this.http.post<Control>(this.apiUrl, control).pipe(
      tap(() => this.controlChangedSource.next())
    );
  }

  updateControl(id: number, control: CreateControlRequest): Observable<Control> {
    return this.http.put<Control>(`${this.apiUrl}/${id}`, control).pipe(
      tap(() => this.controlChangedSource.next())
    );
  }

  completeControl(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/complete`, {}).pipe(
      tap(() => this.controlChangedSource.next())
    );
  }

  deleteControl(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.controlChangedSource.next())
    );
  }
}
