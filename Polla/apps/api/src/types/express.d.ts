// src/types/express.d.ts
import { User } from '../database/entities/user.entity'; // Import your User entity

declare global {
  namespace Express {
    // Extend the Request interface to include a user property
    interface Request {
      user?: User & { userId?: string; id?: string }; // Or whatever properties your JWT strategy adds
    }
  }
}
