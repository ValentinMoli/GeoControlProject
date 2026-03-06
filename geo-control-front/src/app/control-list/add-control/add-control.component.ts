import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter, startWith, map } from 'rxjs/operators';
import { Control, CreateControlRequest } from '../../../types/control.type';
import { User } from '../../../types/user.type';
import { NominatimResult } from '../../../types/geocoding.type';
import { Profession } from '../../../types/profession.type';
import { ControlsService } from '../../services/controls.service';
import { UsersService } from '../../services/users.service';
import { GeocodingService } from '../../services/geocoding.service';
import { ProfessionsService } from '../../services/professions.service';

@Component({
    selector: 'app-add-control',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatAutocompleteModule
    ],
    templateUrl: './add-control.component.html',
    styleUrls: ['./add-control.component.scss']
})
export class AddControlComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddControlComponent>);
  private controlsService = inject(ControlsService);
  private usersService = inject(UsersService);
  private geocodingService = inject(GeocodingService);
  private professionsService = inject(ProfessionsService);
  private data: Control | undefined = inject(MAT_DIALOG_DATA, { optional: true });

  isEditMode = false;
  editControlId?: number;

  isSubmitting = false;
  isSearching = false;
  isLoadingUsers = signal(true);
  users = signal<User[]>([]);
  professions = signal<Profession[]>([]);
  filteredAddresses!: Observable<NominatimResult[]>;

  minDate = new Date(); // Fecha mínima (hoy)

  controlForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    address: [''], 
    latitude: [-37.3217, [Validators.required]],
    longitude: [-59.1332, [Validators.required]],
    expiresAt: [null, Validators.required],
    expiresTime: ['12:00', Validators.required], 
    assignedUserId: [{ value: '', disabled: true }, [Validators.required]], 
    professionId: ['', [Validators.required]]
  }, { validators: this.futureDateTimeValidator });

  // Validador personalizado para fecha+hora futura
  futureDateTimeValidator(group: FormGroup): any {
    const date = group.get('expiresAt')?.value;
    const time = group.get('expiresTime')?.value;
    
    if (!date || !time) return null;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDate = new Date(date);
    combinedDate.setHours(hours, minutes, 0, 0);

    // Comparar con fecha actual
    if (combinedDate < new Date()) {
      return { pastDateTime: true };
    }
    return null;
  }

  // Signal computada para filtrar usuarios según profesión seleccionada
  filteredUsers = signal<User[]>([]);

  ngOnInit(): void {
    if (this.data && this.data.id) {
      this.isEditMode = true;
      this.editControlId = this.data.id;
    }

    this.loadUsers();
    this.loadProfessions();
    this.setupAutocomplete();

    // Escuchar cambios en professionId para filtrar usuarios
    this.controlForm.get('professionId')?.valueChanges.subscribe(profId => {
      if (profId) {
        const pid = Number(profId);
        const allUsers = this.users();
        const relevantUsers = allUsers.filter(u => u.professionId === pid);
        this.filteredUsers.set(relevantUsers);
        
        // Habilitar el control de usuario
        this.controlForm.get('assignedUserId')?.enable();
        // Resetear selección anterior si no es válida (opcional, o dejarla si coincide)
        this.controlForm.get('assignedUserId')?.setValue('');
      } else {
        this.filteredUsers.set([]);
        this.controlForm.get('assignedUserId')?.disable();
      }
    });

    if (this.isEditMode && this.data) {
      this.populateForm(this.data);
    }
  }

  private populateForm(control: Control) {
    const expiresAt = new Date(control.expiresAt);
    const expiresTime = `${expiresAt.getHours().toString().padStart(2, '0')}:${expiresAt.getMinutes().toString().padStart(2, '0')}`;

    this.controlForm.patchValue({
      title: control.title,
      description: control.description,
      address: control.address,
      latitude: control.latitude,
      longitude: control.longitude,
      expiresAt: expiresAt,
      expiresTime: expiresTime,
      professionId: control.professionId,
      assignedUserId: control.assignedUserId
    });
  }

  private setupAutocomplete() {
    this.filteredAddresses = this.controlForm.get('address')!.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      filter(value => typeof value === 'string' && value.length > 2),
      switchMap(value => {
        this.isSearching = true;
        return this.geocodingService.searchAddress(value).pipe(
          catchError(err => {
            console.error(err);
            this.isSearching = false;
            return of([]);
          })
        );
      }),
      map(results => {
        this.isSearching = false;
        if (!results) return [];

        // Filtrar duplicados visuales creando una "firma" de dirección
        const uniqueResults: NominatimResult[] = [];
        const seenAddresses = new Set<string>();

        results.forEach(r => {
          // Usar 'clean_display' propiedad calculada temporal o formartear aquí
          const cleanName = this.formatAddress(r);
          if (!seenAddresses.has(cleanName)) {
            seenAddresses.add(cleanName);
            // Guardamos el nombre limpio para mostrarlo en el template si queremos
            // Ojo: r.display_name sigue siendo el original.
            // Podemos monkey-patch o usar una propiedad nueva si extendemos la interfaz, 
            // pero por ahora usaremos formatAddress en el template.
            uniqueResults.push(r);
          }
        });

        return uniqueResults;
      })
    );
  }

  // Formato simple: Calle Altura, Ciudad, Provincia
  formatAddress(result: NominatimResult): string {
    const addr = result.address;
    if (!addr) return result.display_name;

    const parts = [];
    if (addr.road) parts.push(addr.road);
    if (addr.house_number) parts.push(addr.house_number);
    
    // Priorizar Ciudad > Pueblo > Villa
    const city = addr.city || addr.town || addr.village;
    if (city) parts.push(city);
    
    if (addr.state) parts.push(addr.state);
    if (addr.country) {
      // Opcional: Ocultar país si ya filtramos por AR, o dejarlo
      // parts.push(addr.country); 
    }

    return parts.length > 0 ? parts.join(', ') : result.display_name;
  }

  displayFn(result: string | NominatimResult): string {
    if (!result) return '';
    if (typeof result === 'string') return result; // Si ya es string (por patchValue), devolverlo
    
    // Si es objeto NominatimResult
    const addr = result.address;
    if (addr) {
       const parts = [];
       if (addr.road) parts.push(addr.road);
       if (addr.house_number) parts.push(addr.house_number);
       const city = addr.city || addr.town || addr.village;
       if (city) parts.push(city);
       return parts.join(', ');
    }
    return result.display_name;
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const result: NominatimResult = event.option.value;
    if (result) {
      const cleanAddress = this.formatAddress(result);
      
      // Actualizamos el formulario
      this.controlForm.patchValue({
        address: cleanAddress, // ESTO es lo importante: actualizar el campo visible
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
        // description: cleanAddress // No sobreescribir descripción si no se quiere
      });
    }
  }

  // Máscara de fecha manual (dd/mm/yyyy) con validación de rangos
  onDateInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Eliminar no numéricos
    if (value.length > 8) value = value.substring(0, 8); // Max 8 dígitos

    let formatted = '';
    if (value.length >= 2) {
      let day = parseInt(value.substring(0, 2));
      if (day > 31) day = 31;
      if (day === 0) day = 1; // Opcional: no permitir 00
      
      formatted = day.toString().padStart(2, '0');
      
      if (value.length >= 4) {
        let month = parseInt(value.substring(2, 4));
        if (month > 12) month = 12;
        if (month === 0) month = 1; // Opcional

        formatted += '/' + month.toString().padStart(2, '0');
        
        if (value.length > 4) {
          formatted += '/' + value.substring(4);
        }
      } else if (value.length > 2) {
        formatted += '/' + value.substring(2);
      }
    } else {
      formatted = value;
    }
    
    // Evitar loop infinito si el valor no cambia
    if (input.value !== formatted) {
      input.value = formatted;
    }

    // Actualizar manualmente el formControl si la fecha es válida completa
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      // Validar que sea fecha real (ej. no 31/02)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        this.controlForm.get('expiresAt')?.setValue(date);
        this.controlForm.get('expiresAt')?.setErrors(null);
      } else {
        this.controlForm.get('expiresAt')?.setErrors({ invalidDate: true });
      }
    } else {
      // Si no está completa, no es válida para el datepicker
      // Solo seteamos el error, o dejamos que el require valide si es null (pero aqui el input tiene texto)
      // Como el input tiene texto, matDatepicker puede intentar parsear y fallar.
      // Mejor no hacemos nada y dejamos que el usuario termine, 
      // pero si queremos bloquear el guardado, el required saltará si el valor interno es null.
      // Si el usuario borra todo, setValue(null).
      if (formatted.length === 0) {
        this.controlForm.get('expiresAt')?.setValue(null);
      }
    }
  }

  // Búsqueda manual (click botón o enter)
  searchAddress(): void {
    const address = this.controlForm.get('address')?.value;
    // Si es un objeto (ya seleccionado del autocomplete), no buscamos de nuevo
    if (!address || typeof address !== 'string' || address.length < 3) return; 

    this.isSearching = true;
    this.geocodingService.searchAddress(address).subscribe({
      next: (results) => {
        this.isSearching = false;
        if (results && results.length > 0) {
          const firstResult = results[0];
          this.controlForm.patchValue({
             latitude: parseFloat(firstResult.lat),
             longitude: parseFloat(firstResult.lon),
             description: firstResult.display_name
          });
        } else {
          alert('No se encontraron resultados.');
        }
      },
      error: (err) => {
        console.error(err);
        this.isSearching = false;
        alert('Error al buscar dirección.');
      }
    });
  }

  private loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users.filter(u => u.isActive));
        this.isLoadingUsers.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoadingUsers.set(false);
      }
    });
  }

  private loadProfessions(): void {
    this.professionsService.getProfessions().subscribe({
      next: (profs) => {
        this.professions.set(profs);
      },
      error: (err) => {
        console.error('Error loading professions:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.controlForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.controlForm.value;
      
      // Combinar fecha y hora
      const date: Date = formValue.expiresAt;
      const time: string = formValue.expiresTime;
      const [hours, minutes] = time.split(':').map(Number);
      
      // Crear nueva fecha combinada
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, 0, 0);

      // Formatear como string ISO pero manteniendo la hora local (sin la "Z" de UTC)
      const pad = (n: number) => n.toString().padStart(2, '0');
      const localIsoString = `${combinedDate.getFullYear()}-${pad(combinedDate.getMonth() + 1)}-${pad(combinedDate.getDate())}T${pad(combinedDate.getHours())}:${pad(combinedDate.getMinutes())}:00`;

      const request: CreateControlRequest = {
        title: formValue.title,
        description: formValue.description,
        latitude: Number(formValue.latitude),
        longitude: Number(formValue.longitude),
        address: formValue.address,
        expiresAt: localIsoString, // Usar la fecha combinada local
        assignedUserId: Number(formValue.assignedUserId),
        professionId: Number(formValue.professionId)
      };

      if (this.isEditMode && this.editControlId) {
        this.controlsService.updateControl(this.editControlId, request).subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error updating control:', error);
            this.isSubmitting = false;
            alert('Error al actualizar: ' + (error.error?.title || error.message || 'Error desconocido'));
          }
        });
      } else {
        this.controlsService.createControl(request).subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error creating control:', error);
            this.isSubmitting = false;
            alert('Error al crear el control: ' + (error.error?.title || error.message || 'Error desconocido'));
          }
        });
      }
    }
  }

  onDelete(): void {
    if (this.isEditMode && this.editControlId) {
      if (confirm('¿Está seguro de eliminar este control? Esta acción no se puede deshacer.')) {
        this.isSubmitting = true;
        this.controlsService.deleteControl(this.editControlId).subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error deleting control:', error);
            this.isSubmitting = false;
            alert('Error al eliminar el control.');
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

