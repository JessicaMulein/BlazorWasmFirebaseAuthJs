import { initializeApp } from 'firebase/app';
import {
    getAuth, onAuthStateChanged, signOut, updateProfile,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, sendPasswordResetEmail, 
    signInWithPopup, GoogleAuthProvider
} from 'firebase/auth';
import { getDatabase, ref as dbRef } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { } from 'firebase/functions';
import { } from 'firebase/messaging';
import { } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const _firebaseJs = {
    data: {
        signedInUid: null,
        isOnlineForDatabase: null,
        isOnlineForFirestore: null,
        isOfflineForDatabase: null,
        isOfflineForFirestore: null
    },
    app: null,
    auth: null,
    database: null,
    functions: null,
    firestore: null,
    provider: null,
    dotNetFirebaseAuthReference: null,
    firebaseConfig: null,
    firebaseInitialize: async function (dotNetObjectReference) {
        if (_firebaseJs !== undefined && _firebaseJs.dotNetFirebaseAuthReference !== null) {
            console.log("Firebase already initialized, skipping");
            return;
        }
        // Initialize Firebase
        _firebaseJs.dotNetFirebaseAuthReference = dotNetObjectReference;
        var firebaseConfigJsonDiv = document.getElementById("firebaseConfig");
        _firebaseJs.firebaseConfig = JSON.parse(atob(firebaseConfigJsonDiv.innerText));
        _firebaseJs.app = initializeApp(_firebaseJs.firebaseConfig);
        _firebaseJs.auth = getAuth();
        _firebaseJs.database = getDatabase();
        //_firebaseJs.functions = getfunctions(_firebaseJs.app);
        _firebaseJs.firestore = getFirestore(_firebaseJs.app);
        _firebaseJs.provider = new GoogleAuthProvider();
        // set up constants for later
        /*
        _firebaseJs.data.isOnlineForDatabase = {
            state: 'online',
            last_changed: _firebaseJs.database.ServerValue.TIMESTAMP,
        };
        _firebaseJs.data.isOnlineForFirestore = {
            state: 'online',
            last_changed: _firebaseJs.firestore.FieldValue.serverTimestamp(),
        };
        _firebaseJs.data.isOfflineForDatabase = {
            state: 'offline',
            last_changed: _firebaseJs.database.ServerValue.TIMESTAMP,
        };
        _firebaseJs.data.isOfflineForFirestore = {
            state: 'offline',
            last_changed: _firebaseJs.firestore.FieldValue.serverTimestamp(),
        };
        */

        try {
            console.log(`Firebase app "${_firebaseJs.app.name}" loaded`);
        } catch (e) {
            console.error(e);
        }
        // add observer to auth state changed
        onAuthStateChanged(_firebaseJs.auth, _firebaseJs.firebaseAuthStateChanged);
    },
    firebaseIsInitialized: function () {
        return (
            _firebaseJs !== undefined &&
            (_firebaseJs.dotNetFirebaseAuthReference !== undefined) &&
            (_firebaseJs.dotNetFirebaseAuthReference !== null));
    },
    firebaseAuthStateChanged: async function (user) {
        console.log("auth state changed", arguments);
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        console.log("invoking OnAuthStateChanged", user);
        await _firebaseJs.dotNetFirebaseAuthReference.invokeMethodAsync('OnAuthStateChanged', user);
        console.log("auth state changed invoked, updating presence");
        if (user !== null && user !== undefined) {
            //_firebaseJs.firebasePresenceConnect();
        } else {
            if (_firebaseJs.data.signedInUid !== null) {
                //_firebaseJs.firebasePresenceGoOffline(_firebaseJs.data.signedInUid);
                _firebaseJs.data.signedInUid = null;
            }
        }
    },
    firebaseUpdateProfile: async function (userData) {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        var updated = null;
        await updateProfile(_firebaseJs.auth.currentUser, userData).then(async () => {
            // Profile updated!
            // ...
            updated = true;
        }).catch((error) => {
            console.error(error);
            // An error occurred
            // ...
            updated = false;
        });
        return updated;
    },
    firebaseSendEmailVerification: async function () {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        var sent = null;
        await sendEmailVerification(_firebaseJs.auth.currentUser)
            .then(() => {
                // Email verification sent!
                // ...
                sent = true;
            }).catch((error) => {
                sent = false;
            });
        return sent;
    },
    firebaseSendEmailPasswordReset: async function () {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        var reset = null;
        await sendPasswordResetEmail(_firebaseJs.auth, email).then(async () => {
            reset = true;
        }).catch((error) => {
            reset = false;
        });
        return reset;
    },
    firebaseCreateUser: async function (email, password) {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        var userJsonData = null;
        await createUserWithEmailAndPassword(_firebaseJs.auth, email, password).then(async (userCredential) => {
            userJsonData = JSON.stringify(userCredential.user);
            await _firebaseJs.firebaseAuthStateChanged(userCredential.user);
        }).catch((e) => {
            console.error(e)
        });
        console.log(userJsonData);
        return userJsonData;
    },
    firebaseLoginUser: async function (email, password) {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        var userJsonData = null;
        await signInWithEmailAndPassword(_firebaseJs.auth, email, password)
            .then(async (userCredential) => {
                // Signed in 
                userJsonData = JSON.stringify(userCredential.user);
                await _firebaseJs.firebaseAuthStateChanged(userCredential.user);
            })
            .catch(async (error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error(error)
                await _firebaseJs.firebaseAuthStateChanged(null);

            });
        console.log(userJsonData);
        return userJsonData;
    },
    firebaseLoginWithGooglePopup: async function () {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return;
        }
        var userJsonData = null;
        signInWithPopup(_firebaseJs.auth, provider)
            .then(async (result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                userJsonData = JSON.stringify(user);
                await _firebaseJs.firebaseAuthStateChanged(result.user);
            }).catch(async (error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.log(error);
                await _firebaseJs.firebaseAuthStateChanged(null);
            });
        console.log(userJsonData);
        return userJsonData;
    },
    firebaseSignOut: async function () {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return false;
        }
        var result = null;
        signOut(_firebaseJs.auth).then(() => {
            // Sign-out successful.
            result = true;
        }).catch((error) => {
            // An error happened.
            result = false;
        });
        return result;
    },
    firebaseValidateToken: async function (idToken) {
        if (!_firebaseJs.firebaseIsInitialized()) {
            return false;
        }
        var result = null;
        _firebaseJs.auth
            .verifyIdToken(idToken)
            .then((decodedToken) => {
                result = decodedToken;
            })
            .catch((error) => {
                // Handle error
                result = false;
            });
        return result;
    },
    /*
    firebasePresenceGoOnline: function (uid) {
        var userStatusDatabaseRef = dbRef('/status/' + uid);
        var userStatusFirestoreRef = _firebaseJs.firestore.doc('/status/' + uid);
        userStatusDatabaseRef.set(_firebaseJs.data.isOnlineForDatabase);
        userStatusFirestoreRef.set(_firebaseJs.data.isOnlineForFirestore);
        _firebaseJs.data.signedInUid = uid;
    },
    firebasePresenceGoOffline: function (uid) {
        if (uid === null || uid === undefined) {
            uid = _firebaseJs.data.signedInUid;
        }
        if (uid === null) {
            return;
        }
        
        var userStatusDatabaseRef = dbRef('/status/' + uid);
        var userStatusFirestoreRef = _firebaseJs.firestore.doc('/status/' + uid);
        userStatusDatabaseRef.set(_firebaseJs.data.isOfflineForDatabase);
        userStatusFirestoreRef.set(_firebaseJs.data.isOfflineForFirestore);
        _firebaseJs.data.signedInUid = null;
    },
    firebasePresenceConnect: function () {
        // Fetch the current user's ID from Firebase Authentication.
        var user = _firebaseJs.auth.currentUser;
        if (user === undefined || user === null) {
            return;
        }
        var uid = user.uid;
        _firebaseJs.firebasePresenceGoOnline(uid);

        // Create a reference to this user's specific status node.
        // This is where we will store data about being online/offline.
        var userStatusDatabaseRef = dbRef('/status/' + uid);

        // Create a reference to the special '.info/connected' path in 
        // Realtime Database. This path returns `true` when connected
        // and `false` when disconnected.
        dbRef('.info/connected').on('value', function (snapshot) {
            if (snapshot.val() == false) {
                // Instead of simply returning, we'll also set Firestore's state
                // to 'offline'. This ensures that our Firestore cache is aware
                // of the switch to 'offline.'
                userStatusFirestoreRef.set(_firebaseJs.data.isOfflineForFirestore);
                return;
            };

            userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
                userStatusDatabaseRef.set(_firebaseJs.data.isOnlineForDatabase);

                // We'll also add Firestore set here for when we come online.
                userStatusFirestoreRef.set(_firebaseJs.data.isOnlineForFirestore);
            });
        });
    },
    // Create a new function which is triggered on changes to /status/{uid}
    // Note: This is a Realtime Database trigger, *not* Firestore.
    onUserStatusChanged: dbRef('/status/{uid}').onUpdate(
        async (change, context) => {
            // Get the data written to Realtime Database
            const eventStatus = change.after.val();

            // Then use other event data to create a reference to the
            // corresponding Firestore document.
            const userStatusFirestoreRef = _firebaseJs.firestore.doc(`status/${context.params.uid}`);

            // It is likely that the Realtime Database change that triggered
            // this event has already been overwritten by a fast change in
            // online / offline status, so we'll re-read the current data
            // and compare the timestamps.
            const statusSnapshot = await change.after.ref.once('value');
            const status = statusSnapshot.val();
            functions.logger.log(status, eventStatus);
            // If the current timestamp for this data is newer than
            // the data that triggered this event, we exit this function.
            if (status.last_changed > eventStatus.last_changed) {
                return null;
            }

            // Otherwise, we convert the last_changed field to a Date
            eventStatus.last_changed = new Date(eventStatus.last_changed);

            // ... and write it to Firestore.
            return userStatusFirestoreRef.set(eventStatus);
        })
    */
};

window.firebaseJs = _firebaseJs;

export default { firebaseJs: _firebaseJs }