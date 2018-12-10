import scrypt from 'scrypt';

const scryptParameters = scrypt.paramsSync(0.1)

export async function encode(s: string) {
  return (await scrypt.kdf(s, scryptParameters)).toString('Base64')
}

export async function verify(encoded: string, s: string) {
  return scrypt.verifyKdf(Buffer.from(encoded, 'Base64'), s)
}
