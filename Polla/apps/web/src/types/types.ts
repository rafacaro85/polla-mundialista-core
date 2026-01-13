export interface User {
  id: string;
  email: string;
  fullName: string;
  nickname?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  picture?: string;
  role: string;
  isVerified?: boolean;
  hasPaid?: boolean;
  // Add any other user properties you need in the frontend
}
