export interface UserProfile {
  id: string;
  stripe_expiry_date: Date;
  session_code?: string;
} 