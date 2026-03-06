import { Component, inject, Inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../types/user.type';
import { Profession } from '../../../types/profession.type';
import { UsersService } from '../../services/users.service';
import { ProfessionsService } from '../../services/professions.service';

@Component({
    selector: 'app-add-user-dialog',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './add-user-dialog.component.html',
    styleUrls: ['./add-user-dialog.component.scss']
})
export class AddUserDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddUserDialogComponent>);
  private usersService = inject(UsersService);
  private professionsService = inject(ProfessionsService);
  private snackBar = inject(MatSnackBar);

  public data: User | null = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  professions = signal<Profession[]>([]);

  userForm: FormGroup = this.fb.group({
    password: ['', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: [2, Validators.required],
    professionId: [null]
  });

  ngOnInit() {
    this.loadProfessions();

    if (this.data) {
      this.isEditMode = true;
      this.userForm.patchValue({
        fullName: this.data.fullName,
        email: this.data.email,
        role: this.data.role,
        professionId: this.data.professionId
      });
      
      // In edit mode, password is not required (if left empty, it keeps current)
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      
      // this.userForm.get('username')?.disable();
    }
  }

  loadProfessions() {
    this.professionsService.getProfessions().subscribe({
        next: (profs) => this.professions.set(profs),
        error: (err) => console.error('Error loading professions', err)
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      if (this.isEditMode && this.data) {
        const updateRequest: UpdateUserRequest = {
          role: this.userForm.get('role')?.value,
          fullName: this.userForm.get('fullName')?.value,
          email: this.userForm.get('email')?.value,
          password: this.userForm.get('password')?.value || undefined,
          isActive: this.data.isActive,
          professionId: this.userForm.get('professionId')?.value
        };

        this.usersService.updateUser(this.data.id, updateRequest).subscribe({
          next: (updatedUser) => {
            this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(updatedUser);
          },
          error: (err) => {
            console.error('Error updating user', err);
            this.snackBar.open('Error al actualizar el usuario', 'Cerrar', { duration: 4000 });
          }
        });
      } else {
        const newUser: CreateUserRequest = {
            ...this.userForm.value,
            password: this.userForm.get('password')?.value
        };
        this.usersService.createUser(newUser).subscribe({
          next: (createdUser) => {
            this.snackBar.open('Usuario creado correctamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(createdUser);
          },
          error: (err) => {
            console.error('Error creating user', err);
            this.snackBar.open('Error al crear el usuario', 'Cerrar', { duration: 4000 });
          }
        });
      }
    }
  }
}
