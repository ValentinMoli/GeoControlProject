import { AfterViewInit, Component, OnDestroy, signal, inject } from '@angular/core';

import { Subscription } from 'rxjs';
import * as maplibregl from 'maplibre-gl';
import { Profession } from '../../types/profession.type';
import { ControlsService } from '../services/controls.service';
import { ProfessionsService } from '../services/professions.service';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-map',
    imports: [],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map?: maplibregl.Map;
  private controlsService = inject(ControlsService);
  private professionsService = inject(ProfessionsService);
  private authService = inject(AuthService);
  private controlMarkers: maplibregl.Marker[] = [];
  private controlCreatedSub?: Subscription;
  isLocating = signal(true);
  
  // Mapa de ID -> Nombre de profesión
  private professionsMap = new Map<number, string>();

  ngAfterViewInit(): void {
    // 1) Cargar profesiones primero
    this.loadProfessions();

    // Suscribirse a cambios en controles para recargar los pines
    this.controlCreatedSub = this.controlsService.controlChanged$.subscribe(() => {
      console.log('🔄 Cambios en controles. Recargando pines del mapa...');
      this.loadControls();
    });

    // 2) Creamos el mapa centrado en Tandil
    this.map = new maplibregl.Map({
      container: 'map',
      style: 'http://localhost:8082/style.json',
      center: [-59.1332, -37.3217], // [lng, lat] Tandil
      zoom: 12,
      maxZoom: 18,
      minZoom: 8,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // 3) Agregamos el control de geolocalización estándar
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    });

    this.map.addControl(geolocate, 'top-right');

    // 4) Escuchamos eventos de geolocalización
    geolocate.on('geolocate', () => {
      console.log('✅ Ubicación obtenida');
      this.isLocating.set(false);
      // Forzar redibujado del mapa para evitar cortes visuales
      setTimeout(() => {
        this.map?.resize();
      }, 100);
    });

    geolocate.on('error', (e: any) => {
      console.warn('⚠️ Error al obtener ubicación:', e);
      this.isLocating.set(false);
      setTimeout(() => {
        this.map?.resize();
      }, 100);
    });

    this.map.on('load', () => {
      console.log('✅ MapLibre: mapa cargado');
      // Asegurar tamaño correcto al cargar
      this.map?.resize();
      
      // 5) Activamos automáticamente la geolocalización al cargar
      geolocate.trigger();

      // 6) Cargamos y mostramos los controles
      this.loadControls();
    });

    this.map.on('error', (e: { error: Error }) => {
      console.error('❌ MapLibre error:', e.error);
    });

    // Observador para redimensionar el mapa cuando se re-inserta en el DOM (persistencia)
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      const resizeObserver = new ResizeObserver(() => {
        this.map?.resize();
      });
      resizeObserver.observe(mapContainer);
    }
  }

  private loadProfessions(): void {
    this.professionsService.getProfessions().subscribe({
      next: (professions) => {
        professions.forEach(p => this.professionsMap.set(p.id, p.name));
        // Si los controles ya se cargaron, podríamos actualizar los popups aquí si fuera necesario,
        // pero como loadControls se llama en 'load', es probable que profesiones ya estén.
      },
      error: (err) => console.error('Error loading professions:', err)
    });
  }

  private loadControls(): void {
    this.controlsService.getControls().subscribe({
      next: (controls: any[]) => {
        console.log('📍 Controles cargados:', controls);

        // Limpiar los pines anteriores antes de agregar los nuevos
        this.controlMarkers.forEach(marker => marker.remove());
        this.controlMarkers = [];

        let filteredControls = controls;
        if (!this.authService.isAdmin()) {
          const currentUserId = this.authService.getCurrentUserId();
          filteredControls = controls.filter(control => control.assignedUserId === currentUserId);
        }

        if (filteredControls.length === 0) {
          console.warn('⚠️ No se encontraron controles.');
        }
        filteredControls.forEach((control: any) => {
          // Usar el mapa de profesiones para obtener el nombre
          const professionName = this.professionsMap.get(control.professionId) || 'General';

          const markerColor = this.getMarkerColorByStatus(control);
          const popupHtml = `
            <div style="padding: 0.5rem;">
              <span style="display: inline-block; background: #e0e0e0; color: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-bottom: 0.25rem;">
                ${professionName}
              </span>
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${control.title}</h3>
              <p style="margin: 0; font-size: 0.85rem; color: #666;">${control.description || ''}</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #333;"><strong>Dirección:</strong> ${control.address || 'Sin dirección'}</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #333;"><strong>Vencimiento:</strong> ${new Date(control.expiresAt).toLocaleDateString('es-AR')} ${new Date(control.expiresAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #333;"><strong>Asignado a:</strong> ${control.assignedUserName || 'Sin asignar'}</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: #999;">Estado: ${control.status}</p>
              ${['pending', 'expired'].includes(control.status.toLowerCase()) ? `
                <div style="margin-top: 0.75rem; text-align: center;">
                  <button id="btn-complete-${control.id}" style="background-color: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; width: 100%;">
                    Completar Trabajo
                  </button>
                </div>
              ` : ''}
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);

          // Escuchar evento 'open' para atar funcion JavaScript al boton despues de ser inyectado al DOM
          popup.on('open', () => {
            const btn = document.getElementById(`btn-complete-${control.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                // Deshabilitar botón temporalmente para evitar fakes clicks
                btn.setAttribute('disabled', 'true');
                btn.innerText = 'Completando...';
                
                this.controlsService.completeControl(control.id).subscribe({
                  next: () => {
                    popup.remove();
                    // LoadControls will automatically trigger from controlChangedSource subscription
                  },
                  error: (err) => {
                    console.error('Error completando control', err);
                    btn.removeAttribute('disabled');
                    btn.innerText = 'Completar Trabajo';
                    alert('Error al completar el trabajo');
                  }
                });
              });
            }
          });

          const marker = new maplibregl.Marker({ color: markerColor })
            .setLngLat([control.longitude, control.latitude])
            .setPopup(popup)
            .addTo(this.map!);
          
          this.controlMarkers.push(marker);
        });
      },
      error: (err: any) => {
        console.error('❌ Error cargando controles:', err);
        alert('Error al cargar los controles. Asegúrese de que la API Backend (.NET) esté corriendo en el puerto 7214.');
      }
    });
  }

  private getMarkerColorByStatus(control: any): string {
    const status = control.status.toLowerCase();

    if (status === 'completed') return '#28A745'; // Verde para completados
    if (status === 'expired') return '#DC3545'; // Rojo para vencidos

    if (status === 'pending') {
      const now = new Date();
      const expiresAt = new Date(control.expiresAt);
      
      const isExpiredToday = 
        now.getFullYear() === expiresAt.getFullYear() &&
        now.getMonth() === expiresAt.getMonth() &&
        now.getDate() === expiresAt.getDate();
      
      if (isExpiredToday) {
        return '#FFA500'; // Naranja/Amarillo para pendientes que vencen hoy
      } else {
        return '#0B80C8'; // Azul para pendientes normales
      }
    }

    return '#6C757D'; // Gris para estados desconocidos
  }

  ngOnDestroy(): void {
    if (this.controlCreatedSub) {
      this.controlCreatedSub.unsubscribe();
    }
    // Limpiar marcadores
    this.controlMarkers.forEach(marker => marker.remove());
    this.map?.remove();
  }
}
