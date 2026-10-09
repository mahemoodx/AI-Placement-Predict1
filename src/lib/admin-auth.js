import { ADMIN } from "@/config/admin";

// In-memory session only — no localStorage / sessionStorage / IndexedDB.
// A page refresh wipes this module state and returns the admin to /login.
let loggedIn = false;

export function isAdminLoggedIn() {
  return loggedIn;
}

export function checkAdminCredentials(email, password) {
  return String(email).trim().toLowerCase() === ADMIN.email.toLowerCase() && password === ADMIN.password;
}

export function loginAdmin() {
  loggedIn = true;
}

export function logoutAdmin() {
  loggedIn = false;
}
