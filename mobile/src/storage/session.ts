// mobile/src/storage/session.ts
//
// Session token storage using the OS keychain/keystore (expo-secure-store)
// -- not AsyncStorage, since this is an authentication credential. The
// token is the exact same JWT /api/auth/login already issues for the web
// cookie; this just gives the mobile app somewhere secure to keep it.

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bwe_session_token";

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
