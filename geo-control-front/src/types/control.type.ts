export interface Control {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  imageBase64?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  assignedUserId: number;
  professionId: number;
  assignedUserName?: string;
  profession?: { id: number; name: string };
}

export interface CreateControlRequest {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address: string;
  expiresAt: string;
  assignedUserId: number;
  professionId: number;
}
