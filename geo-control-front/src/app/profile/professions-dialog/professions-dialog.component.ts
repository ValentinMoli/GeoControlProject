import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Profession } from '../../../types/profession.type';
import { ProfessionsService } from '../../services/professions.service';

@Component({
  selector: 'app-professions-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Gestión de Profesiones</h2>
      <button class="close-btn" mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="professions-list">
        @for (prof of professions(); track prof.id) {
          <div class="profession-item">
            @if (editingId() === prof.id) {
              <input
                class="input-field"
                [ngModel]="editingName()"
                (ngModelChange)="editingName.set($event)"
                (keydown.enter)="saveEdit(prof)"
                (keydown.escape)="cancelEdit()"
              />
              <div class="item-actions">
                <button mat-icon-button color="primary" (click)="saveEdit(prof)">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button (click)="cancelEdit()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            } @else {
              <span class="profession-name">{{ prof.name }}</span>
              <div class="item-actions">
                <button mat-icon-button color="primary" (click)="startEdit(prof)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteProfession(prof)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        @if (professions().length === 0) {
          <p class="empty-message">No hay profesiones registradas.</p>
        }
      </div>

      <div class="add-section">
        <input
          class="input-field"
          [ngModel]="newName()"
          (ngModelChange)="newName.set($event)"
          placeholder="Nueva profesión..."
          (keydown.enter)="createProfession()"
        />
        <button
          class="button-primary add-btn"
          [disabled]="!newName().trim()"
          (click)="createProfession()"
        >
          <mat-icon>add</mat-icon>
          Agregar
        </button>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-header {
      background: #0B80C8;
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow: hidden;

      h2 {
        margin: 0 0 8px 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: white;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        mat-icon {
          font-size: 20px;
          height: 20px;
          width: 20px;
        }
      }
    }

    mat-dialog-content {
      padding: 24px 32px;
      max-height: 60vh;
      overflow-y: auto;
      background: #ffffff;
      min-width: 380px;
    }

    .professions-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .profession-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 0.75rem;
      gap: 0.75rem;
    }

    .profession-name {
      flex: 1;
      font-size: 0.95rem;
      color: #1F2937;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .item-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .input-field {
      flex: 1;
      background-color: #F3F4F6;
      border: 1px solid #E5E7EB;
      padding: 0.5rem 0.75rem;
      border-radius: 0.75rem;
      height: 2.5rem;
      font-size: 0.9rem;
      box-sizing: border-box;
      width: 100%;
      transition: all 0.15s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

      &::placeholder {
        color: #9CA3AF;
      }

      &:focus {
        background-color: #ffffff;
        border-color: #0B80C8;
        box-shadow: 0 0 0 3px rgba(11, 128, 200, 0.1);
        outline: none;
      }
    }

    .add-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #E5E7EB;
    }

    .add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      width: 100%;
      height: 2.5rem;
      border: none;
      border-radius: 0.75rem;
      background: #0B80C8;
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

      &:hover {
        background: #0967A3;
      }

      &:disabled {
        background: #93C5E4;
        cursor: not-allowed;
      }

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }
    }

    .empty-message {
      text-align: center;
      color: #9CA3AF;
      font-size: 0.9rem;
      padding: 1rem 0;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
        padding: 16px;
      }
    }
  `]
})
export class ProfessionsDialogComponent implements OnInit {
  private professionsService = inject(ProfessionsService);
  private dialogRef = inject(MatDialogRef<ProfessionsDialogComponent>);
  private snackBar = inject(MatSnackBar);

  professions = signal<Profession[]>([]);
  editingId = signal<number | null>(null);
  editingName = signal('');
  newName = signal('');

  ngOnInit() {
    this.loadProfessions();
  }

  loadProfessions() {
    this.professionsService.getProfessions().subscribe({
      next: (profs) => this.professions.set(profs),
      error: () => this.snackBar.open('Error al cargar profesiones', 'Cerrar', { duration: 3000 }),
    });
  }

  createProfession() {
    const name = this.newName().trim();
    if (!name) return;

    this.professionsService.createProfession(name).subscribe({
      next: () => {
        this.newName.set('');
        this.loadProfessions();
        this.snackBar.open('Profesión creada', 'Cerrar', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al crear profesión', 'Cerrar', { duration: 3000 }),
    });
  }

  startEdit(prof: Profession) {
    this.editingId.set(prof.id);
    this.editingName.set(prof.name);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editingName.set('');
  }

  saveEdit(prof: Profession) {
    const name = this.editingName().trim();
    if (!name) return;

    this.professionsService.updateProfession(prof.id, name).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadProfessions();
        this.snackBar.open('Profesión actualizada', 'Cerrar', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al actualizar profesión', 'Cerrar', { duration: 3000 }),
    });
  }

  deleteProfession(prof: Profession) {
    this.professionsService.deleteProfession(prof.id).subscribe({
      next: () => {
        this.loadProfessions();
        this.snackBar.open('Profesión eliminada', 'Cerrar', { duration: 2000 });
      },
      error: (err) => {
        if (err.status === 409) {
          this.snackBar.open('Esta profesión está en uso y no se puede eliminar', 'Cerrar', { duration: 4000 });
        } else {
          this.snackBar.open('Error al eliminar profesión', 'Cerrar', { duration: 3000 });
        }
      },
    });
  }
}
