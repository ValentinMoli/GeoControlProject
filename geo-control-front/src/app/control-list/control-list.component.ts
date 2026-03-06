import { Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Control } from '../../types/control.type';
import { ControlsService } from '../services/controls.service';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-control-list',
    imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
    templateUrl: './control-list.component.html',
    styleUrls: ['./control-list.component.scss']
})
export class ControlListComponent implements OnInit {
  private controlsService = inject(ControlsService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);
  
  @ViewChild('helpDialog') helpDialog!: TemplateRef<unknown>;
  
  controls = signal<Control[]>([]);

  ngOnInit() {
    this.loadControls();
  }

  openHelpDialog() {
    this.dialog.open(this.helpDialog, {
      width: '400px'
    });
  }

  openAddControlDialog(control?: Control) {
    import('./add-control/add-control.component').then(m => {
      const dialogRef = this.dialog.open(m.AddControlComponent, {
        data: control,
        disableClose: true,
        panelClass: 'custom-dialog-container'
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.loadControls();
        }
      });
    });
  }

  onControlClick(control: Control) {
    if (this.authService.isAdmin()) {
      this.openAddControlDialog(control);
    }
  }

  private loadControls() {
    this.controlsService.getControls().subscribe({
      next: (data: Control[]) => {
        if (this.authService.isAdmin()) {
          this.controls.set(data);
        } else {
          const currentUserId = this.authService.getCurrentUserId();
          this.controls.set(data.filter(control => control.assignedUserId === currentUserId));
        }
      },
      error: (err: any) => console.error('Error fetching controls:', err)
    });
  }

  getStatusClass(control: Control): string {
    const now = new Date();
    const expiresAt = new Date(control.expiresAt);
    
    const status = control.status.toLowerCase();
    const isCompleted = status === 'completed';

    // Para ver si vence HOY, comparamos AÑO, MES y DÍA locales sin importar la hora
    const isToday = 
      now.getFullYear() === expiresAt.getFullYear() &&
      now.getMonth() === expiresAt.getMonth() &&
      now.getDate() === expiresAt.getDate();

    // Para ver si YA SE VENCIÓ ANTERIORMENTE (días atrás)
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiresDateOnly = new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate());
    
    const isExpiredBeforeToday = expiresDateOnly < todayDateOnly;
    const isPastExactHour = expiresAt < now;

    // Si la fecha límite COMPLETA (con hora exacta incluida) ya se rebasó
    const isStrictlyExpired = isExpiredBeforeToday || (isToday && isPastExactHour);

    // 1. Si está completado
    if (isCompleted) {
      if (isStrictlyExpired) return 'completed-expired'; // Rojo oscuro
      return 'completed'; // Verde normal ("a tiempo")
    }

    // 2. Si el backend ya lo marcó explícitamente como expirado
    if (status === 'expired') return 'expired-before'; // Rojo

    // 3. Status pendiente:
    if (isExpiredBeforeToday) return 'expired-before'; // Rojo
    if (isToday) return 'expired-today'; // AMARILLO/NARANJA (advertencia todo el día)
    return 'pending'; // AZUL
  }

  getCircleClass(control: Control): string {
    return this.getStatusClass(control);
  }
}
