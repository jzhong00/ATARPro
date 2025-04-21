export interface UserProfile {
  id: string; // Should match the auth.users.id
  is_subscribed: boolean; // Correct field name from public.users table
  // Add other fields from your 'users' table if needed
} 