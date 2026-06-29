import { createContext, useContext } from 'react';

// Holds the auth token + logout handler so any page can reach them without prop
// drilling through the router.
export const AuthContext = createContext({ token: null, logout: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
