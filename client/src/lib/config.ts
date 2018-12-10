if (!process.env.VUE_APP_ENDPOINT) {
  throw new Error('Missing VUE_APP_ENDPOINT');  // HTTP API endpoint
}

export const endpoint = process.env.VUE_APP_ENDPOINT;
