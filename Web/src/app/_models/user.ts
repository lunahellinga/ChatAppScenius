export interface User {
  userName: string,
  displayName: string,
  token: string
}

export interface Credential {
  credentialId: Uint8Array;
  publicKey: Uint8Array;
}
