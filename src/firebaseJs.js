import { initializeApp } from 'firebase/app';
import {
    getAuth, onAuthStateChanged, signOut, updateProfile,
    createUserWithEmailAndPassword,
    sendEmailVerification, sendPasswordResetEmail, 
    signInWithEmailAndPassword,
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    GithubAuthProvider,
    EmailAuthProvider,
    PhoneAuthProvider
} from 'firebase/auth';
import {
    getDatabase,
    push as dbPush,
    ref as dbRef,
    serverTimestamp as dbServerTimestamp,
    set as dbSet,
    onValue as dbOnValue,
    onDisconnect as dbOnDisconnect} from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import {
    collection as firestoreCollection,
    doc as firestoreDoc,
    getFirestore,
    onSnapshot as firestoreOnSnapshot,
    query as firestoreQuery,
    serverTimestamp as firestoreServerTimestamp,
    setDoc as firestoreSetDoc,
    where as firestoreWhere
} from 'firebase/firestore';
import { } from 'firebase/messaging';
import { } from 'firebase/storage';
import { auth as firebaseUiAuth } from 'firebaseui';

const _firebaseJs = {
    data: {
        signedInUid: null,
        lastUid: null,
        isOnlineForDatabase: null,
        isOnlineForFirestore: null,
        isOfflineForDatabase: null,
        isOfflineForFirestore: null
    },
    app: null,
    auth: null,
    authStateChanged: async function (user) {
        console.log("auth state changed", arguments);
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        console.log("invoking OnAuthStateChanged", user);
        await _firebaseJs.dotNetFirebaseAuthReference.invokeMethodAsync('OnAuthStateChanged', user);
        console.log("auth state changed invoked, updating presence");
        if (user !== null && user !== undefined) {
            _firebaseJs.data.signedInUid = user.uid;
        } else {
            if (_firebaseJs.data.signedInUid !== null) {
                _firebaseJs.data.lastUid = _firebaseJs.data.signedInUid;
                _firebaseJs.data.signedInUid = null;
            }
        }
    },
    config: null,
    createUserWithEmail: async function (email, password) {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        var userJsonData = null;
        await createUserWithEmailAndPassword(_firebaseJs.auth, email, password).then(async (userCredential) => {
            userJsonData = JSON.stringify(userCredential.user);
            await _firebaseJs.authStateChanged(userCredential.user);
        }).catch((e) => {
            console.error(e)
        });
        console.log(userJsonData);
        return userJsonData;
    },
    database: null,
    dotNetFirebaseAuthReference: null,
    firestore: null,
    fsListen: function () {
        // [START fs_onsnapshot]
        firestoreOnSnapshot(
            userStatusFirestoreRef,
            (doc) => {
                var isOnline = doc.data().state == 'online';
                // ... use isOnline
            });
        // [END fs_onsnapshot]
    },
    statusCollection: null,
    fsListenOnline: function () {
        // [START fs_onsnapshot_online]
        firestoreOnSnapshot(
            firestoreQuery(
                _firebaseJs.statusCollection,
                firestoreWhere('state', '==', 'online')),
            (snapshot) => {
                if (!snapshot.size)
                    return;

                snapshot
                    .docChanges()
                    .forEach(function (change) {
                        if (change.type === 'added') {
                            var msg = 'User ' + change.doc.id + ' is online.';
                            console.log(msg);
                        }
                        if (change.type === 'removed') {
                            var msg = 'User ' + change.doc.id + ' is offline.';
                            console.log(msg);
                        }
                    });
            });
        // [END fs_onsnapshot_online]
    },
    googleProvider: null,
    initialize: async function (dotNetObjectReference) {
        if (_firebaseJs !== undefined && _firebaseJs.dotNetFirebaseAuthReference !== null) {
            console.log("Firebase already initialized, skipping");
            return;
        }
        try {
            // Initialize Firebase
            _firebaseJs.dotNetFirebaseAuthReference = dotNetObjectReference;
            var firebaseConfigJsonDiv = document.getElementById("firebaseConfig");
            _firebaseJs.config = JSON.parse(atob(firebaseConfigJsonDiv.innerText));
            _firebaseJs.app = initializeApp(_firebaseJs.config);
            _firebaseJs.auth = getAuth();
            _firebaseJs.database = getDatabase();
            _firebaseJs.firestore = getFirestore(_firebaseJs.app);
            _firebaseJs.googleProvider = new GoogleAuthProvider();
            console.log(`Firebase app "${_firebaseJs.app.name}" loaded`);

            // set up firebaseui auth
            _firebaseJs.signInOptions = [
                // Leave the lines as is for the providers you want to offer your users.
                GoogleAuthProvider.PROVIDER_ID,
                FacebookAuthProvider.PROVIDER_ID,
                TwitterAuthProvider.PROVIDER_ID,
                GithubAuthProvider.PROVIDER_ID,
                EmailAuthProvider.PROVIDER_ID,
                PhoneAuthProvider.PROVIDER_ID,
                firebaseUiAuth.AnonymousAuthProvider.PROVIDER_ID
            ];
            // set up constants for later
            _firebaseJs.data.isOnlineForDatabase = {
                state: 'online',
                last_changed: dbServerTimestamp(),
            };
            _firebaseJs.data.isOnlineForFirestore = {
                state: 'online',
                last_changed: firestoreServerTimestamp(),
            };
            _firebaseJs.data.isOfflineForDatabase = {
                state: 'offline',
                last_changed: dbServerTimestamp(),
            };
            _firebaseJs.data.isOfflineForFirestore = {
                state: 'offline',
                last_changed: firestoreServerTimestamp(),
            };
            console.log("firebaseui loading")
            _firebaseJs.ui = new firebaseUiAuth.AuthUI(_firebaseJs.auth);
            console.log("firebaseui loaded", _firebaseJs.ui);
            _firebaseJs.ui.start('#firebaseui-auth-container', _firebaseJs.uiConfig);
            console.log("firebaseui started", _firebaseJs.uiConfig);
            await _firebaseJs.signInAnonymously();
            _firebaseJs.statusCollection = firestoreCollection(_firebaseJs.firestore, '/status/');
        } catch (e) {
            console.error(e);
        }
        try {
            // add observer to auth state changed
            onAuthStateChanged(_firebaseJs.auth, _firebaseJs.authStateChanged);
        }
        catch (e)
        {
            console.error("Error setting up auth state listener", e);
        }
    },
    isInitialized: function () {
        return (
            _firebaseJs !== undefined &&
            (_firebaseJs.dotNetFirebaseAuthReference !== undefined) &&
            (_firebaseJs.dotNetFirebaseAuthReference !== null) &&
            _firebaseJs.auth._isInitialized);
    },
    loginWithEmail: async function (email, password) {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        var userJsonData = null;
        await signInWithEmailAndPassword(_firebaseJs.auth, email, password)
            .then(async (userCredential) => {
                // Signed in 
                userJsonData = JSON.stringify(userCredential.user);
                await _firebaseJs.authStateChanged(userCredential.user);
            })
            .catch(async (error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error(error)
                await _firebaseJs.authStateChanged(null);

            });
        console.log(userJsonData);
        return userJsonData;
    },
    loginWithGooglePopup: async function () {
        if (!_firebaseJs.isInitialized()) {
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
                await _firebaseJs.authStateChanged(result.user);
            }).catch(async (error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.log(error);
                await _firebaseJs.authStateChanged(null);
            });
        console.log(userJsonData);
        return userJsonData;
    },
    sendEmailVerification: async function () {
        if (!_firebaseJs.isInitialized()) {
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
    sendEmailPasswordReset: async function () {
        if (!_firebaseJs.isInitialized()) {
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
    signOut: async function () {
        if (!_firebaseJs.isInitialized()) {
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
    ui: null,
    uiConfig: function () {
        return {
            signInSuccessUrl: '/',
            signInOptions: _firebaseJs.signInOptions,
            // tosUrl and privacyPolicyUrl accept either url string or a callback
            // function.
            // Terms of service url/callback.
            tosUrl: '/terms-of-service',
            // Privacy policy url/callback.
            privacyPolicyUrl: function () {
                window.location.assign('/privacy');
            }
        };
    },
    updateProfile: async function (userData) {
        if (!_firebaseJs.isInitialized()) {
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
    validateToken: async function (idToken) {
        if (!_firebaseJs.isInitialized()) {
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
    rtdbPresence: function () {
        // [START rtdb_presence]
        // Fetch the current user's ID from Firebase Authentication.
        var uid = _firebaseJs.auth.currentUser.uid;
        console.log("rtdbPresence:uid", uid);

        // Create a reference to this user's specific status node.
        // This is where we will store data about being online/offline.
        var userStatusDatabaseRef = dbRef(_firebaseJs.database, '/status/' + uid);

        // We'll create two constants which we will write to
        // the Realtime database when this device is offline
        // or online.

        // Create a reference to the special '.info/connected' path in
        // Realtime Database. This path returns `true` when connected
        // and `false` when disconnected.
        var infoRef = dbRef(_firebaseJs.database, '.info/connected');
        dbOnValue(infoRef, async (snapshot) => {
            // If we're not currently connected, don't do anything.
            if (snapshot.val() == false) {
                return;
            };
            var connection = dbPush(userStatusDatabaseRef);

            // If we are currently connected, then use the 'onDisconnect()'
            // method to add a set which will only trigger once this
            // client has disconnected by closing the app,
            // losing internet, or any other means.
            dbOnDisconnect(connection)
                .set(_firebaseJs.data.isOfflineForDatabase)
                .then(function () {
                    // The promise returned from .onDisconnect().set() will
                    // resolve as soon as the server acknowledges the onDisconnect() 
                    // request, NOT once we've actually disconnected:
                    // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

                    // We can now safely set ourselves as 'online' knowing that the
                    // server will mark us as offline once we lose connection.
                    userStatusDatabaseRef.set(_firebaseJs.data.isOnlineForDatabase);
                });
        });
        // [END rtdb_presence]
    },
    rtdbAndLocalFsPresence: function () {
        // [START rtdb_and_local_fs_presence]
        // [START_EXCLUDE]
        var uid = _firebaseJs.auth.currentUser.uid;
        console.log("rtdbAndLocalFsPresence:uid", uid);
        var userStatusDatabaseRef = dbRef(_firebaseJs.database, '/status/' + uid);
        // [END_EXCLUDE]
        var userStatusFirestoreRef = firestoreDoc(_firebaseJs.firestore, '/status/' + uid);
        // Firestore uses a different server timestamp value, so we'll
        // create two more constants for Firestore state.
        var infoRef = dbRef(_firebaseJs.database, '.info/connected');
        dbOnValue(infoRef, async (snapshot) => {
            if (snapshot.val() == false) {
                // Instead of simply returning, we'll also set Firestore's state
                // to 'offline'. This ensures that our Firestore cache is aware
                // of the switch to 'offline.'
                dbSet(userStatusDatabaseRef, _firebaseJs.data.isOfflineForDatabase);
                firestoreSetDoc(userStatusFirestoreRef, _firebaseJs.data.isOfflineForFirestore);
                return;
            };
            var connection = dbPush(userStatusDatabaseRef);
            dbOnDisconnect(connection)
                .set(_firebaseJs.data.isOfflineForDatabase)
                .then(function () {
                    dbSet(userStatusDatabaseRef, _firebaseJs.data.isOnlineForDatabase);
                    firestoreSetDoc(userStatusFirestoreRef, _firebaseJs.data.isOnlineForFirestore);
                });
            });
        // [END rtdb_and_local_fs_presence]
    },
    signInAnonymously: async function () {
        signInAnonymously(_firebaseJs.auth).then(async function () {
            _firebaseJs.rtdbAndLocalFsPresence();
            _firebaseJs.fsListenOnline();
        }).catch(function (err) {
            console.warn(err);
            console.warn('Please enable Anonymous Authentication in your Firebase project!');
        });
    },
    signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: null,
};

window.firebaseJs = _firebaseJs;

export default { firebaseJs: _firebaseJs }