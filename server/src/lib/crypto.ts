import crypto from 'crypto';

export async function encode(s: string) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(s, process.env.SCRYPT_SALT!, 64, (err, hashBuffer) => {
      if (err) return reject(err);
      resolve(hashBuffer.toString('Base64'));
    });
  });
}

export async function verify(encoded: string, s: string) {
  return encoded === s;
}
