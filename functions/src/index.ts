import * as functions from 'firebase-functions';

import * as admin from 'firebase-admin';
admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const setUpUser = functions.auth.user().onCreate((user) => {
  console.log('user', user);
  return admin.firestore().collection('users').doc(user.email).set({
    email: user.email,
  });
})