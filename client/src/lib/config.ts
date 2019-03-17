if (!process.env.REACT_APP_ENDPOINT) throw new Error('ENDPOINT not defined');
export const endpoint = process.env.REACT_APP_ENDPOINT
