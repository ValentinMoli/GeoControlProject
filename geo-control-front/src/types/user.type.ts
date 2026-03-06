export interface User {
  id: number;
  email?: string;
  role: number;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  professionId: number;
  professionName?: string;
}

export interface CreateUserRequest {
  password?: string;
  email?: string;
  role: number;
  fullName: string;
  professionId?: number;
}

export interface UpdateUserRequest {
  password?: string;
  role: number;
  fullName: string;
  email?: string;
  isActive: boolean;
  professionId?: number;
}
