import { Component, inject, signal, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../../types/user.type';
import { UsersService } from '../services/users.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { AddUserDialogComponent } from './add-user-dialog/add-user-dialog.component';
import { ProfessionsDialogComponent } from './professions-dialog/professions-dialog.component';

@Component({
    selector: 'app-profile',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatTableModule
    ],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  usersService = inject(UsersService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  authState$ = this.authService.authState$;
  currentUser = signal<User | null>(null);
  profileError = signal<string | null>(null);
  users = signal<User[]>([]);
  displayedColumns: string[] = ['fullName', 'email', 'professionName', 'role', 'status', 'actions'];

  ngOnInit() {
    this.loadUsers();
    
    // Cargar datos del usuario actual para mostrar en la tarjeta
    this.authState$.subscribe(auth => {
      if (auth && auth.userId) {
        this.usersService.getUser(Number(auth.userId)).subscribe({
          next: (user: User) => {
            this.currentUser.set(user);
            this.profileError.set(null);
          },
          error: () => {
            this.profileError.set('No se pudo cargar el perfil.');
          }
        });
      }
    });
  }

  loadUsers() {
    this.usersService.getUsers().subscribe((users: any[]) => {
      this.users.set(users);
    });
  }

  openAddUserDialog() {
    this.openUserDialog();
  }

  editUser(user: User) {
    this.openUserDialog(user);
  }

  private openUserDialog(user?: User) {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      data: user // Pasa el usuario si es edición, o undefined si es nuevo
    });

    dialogRef.afterClosed().subscribe((result: boolean | any) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User) {
    if (confirm(`¿Está seguro de borrar el usuario ${user.fullName}?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error('Error deleting user', err)
      });
    }
  }

  reactivateUser(user: User) {
    if (confirm(`¿Está seguro de reactivar el usuario ${user.fullName}?`)) {
      this.usersService.reactivateUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error('Error reactivating user', err)
      });
    }
  }

  openProfessionsDialog() {
    const dialogRef = this.dialog.open(ProfessionsDialogComponent);
    dialogRef.afterClosed().subscribe(() => {
      this.loadUsers();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
