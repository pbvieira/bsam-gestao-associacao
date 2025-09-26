// This hook is now just a re-export of the context hook
// All auth logic has been moved to AuthContext for global state management
export { useAuth, type UserRole, type UserProfile } from '@/contexts/AuthContext';