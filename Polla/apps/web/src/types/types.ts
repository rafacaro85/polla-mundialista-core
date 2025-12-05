export interface User {
  id: string;
  email: string;
  fullName: string;
  nickname?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  picture?: string;
  role: string;
  // Add any other user properties you need in the frontend
}
