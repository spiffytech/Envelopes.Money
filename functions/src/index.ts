/* tslint:disable:no-var-requires */
const entries = require('object.entries');
const values = require('object.values');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:curly */

if (!Object.entries) entries.shim();
if (!Object.values) values.shim();

admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const setUpUser = functions.auth.user().onCreate((user) => {
  /* tslint:disable-next-line:no-console */
  console.log('user', user);
  return admin.firestore().collection('users').doc(user.email).set({
    email: user.email,
  });
});