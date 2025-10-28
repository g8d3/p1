import CryptoJS from 'crypto-js'

// Simple encryption key - in production, this should be derived from user password
const ENCRYPTION_KEY = 'dex-terminal-key-2024'

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function hash(text: string): string {
  return CryptoJS.SHA256(text).toString()
}