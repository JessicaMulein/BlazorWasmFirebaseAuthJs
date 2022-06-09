//FileName : firebaseJs.ts
/// <reference types="node" />
'use strict';
declare global {
    interface Window {
        firebaseJs: any;
    }
}

import * as firebase from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateProfile,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    GithubAuthProvider,
    EmailAuthProvider,
    PhoneAuthProvider,
    Auth,
    User,
    UserInfo,
    UserCredential
} from 'firebase/auth';
import {
    getDatabase,
    push as dbPush,
    ref as dbRef,
    serverTimestamp as dbServerTimestamp,
    set as dbSet,
    onValue as dbOnValue,
    onDisconnect as dbOnDisconnect,
    Database
} from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import {
    collection as firestoreCollection,
    doc as firestoreDoc,
    QuerySnapshot as firestoreQuerySnapshot,
    DocumentData as firestoreDocumentData,
    getFirestore,
    onSnapshot as firestoreOnSnapshot,
    query as firestoreQuery,
    serverTimestamp as firestoreServerTimestamp,
    setDoc as firestoreSetDoc,
    where as firestoreWhere,
    Firestore,
    FieldValue
} from 'firebase/firestore';
import {} from 'firebase/messaging';
import {} from 'firebase/storage';
import { auth as firebaseUiAuth } from 'firebaseui';
import { FirebaseError } from 'firebase/app';

interface IFirebaseJsDataDatabaseValue {
    state: string;
    last_changed: object;
}

interface IFirebaseJsDataFirestoreValue {
    state: string;
    last_changed: FieldValue;
}

interface IFirebaseJsData {
    signedInUid?: string;
    lastUid?: string;
    isOfflineForDatabase?: IFirebaseJsDataDatabaseValue;
    isOnlineForDatabase?: IFirebaseJsDataDatabaseValue;
    isOfflineForFirestore?: IFirebaseJsDataFirestoreValue;
    isOnlineForFirestore?: IFirebaseJsDataFirestoreValue;
}

interface IFirebaseUiConfigSimple {
    signInOptions: Array<string>;
    signInSuccessUrl: string;
    tosUrl: string;
    privacyPolicyUrl: string;
}

interface IFirebaseJs {
    data: IFirebaseJsData;
    app?: firebase.FirebaseApp;
    auth?: Auth;
    authStateChanged: (user: User) => any;
    config?: object;
    createUserWithEmail: (email: string, password: string) => Promise<string | null>;
    database?: Database;
    dotNetFirebaseAuthReference?: DotNet.DotNetObject;
    firestore?: Firestore;
    fsListen: () => any;
    fsListenOnline: () => any;
    googleProvider?: GoogleAuthProvider;
    initialize: (dotNetObjectReference: DotNet.DotNetObject) => any;
    isInitialized: () => boolean;
    loginWithEmail: (email: string, password: string) => Promise<string | null>;
    loginWithGooglePopup: () => Promise<string | null>;
    rtdbPresence: () => any;
    rtdbAndLocalFsPresence: () => any;
    sendEmailVerification: () => Promise<boolean | null>;
    sendEmailPasswordReset: (email: string) => Promise<boolean>;
    setDatabaseUserStatus: (user: UserInfo, status: boolean) => any;
    setFirestoreUserStatus: (user: UserInfo, status: boolean) => any;
    signInAnonymously: () => Promise<any>;
    signOut: () => Promise<boolean>;
    ui?: firebaseUiAuth.AuthUI;
    uiConfigFromStorage?: IFirebaseUiConfigSimple;
    uiConfig?: firebaseUiAuth.Config;
    uiConfigFactory: () => firebaseUiAuth.Config;
    updateProfile: (userData: object) => Promise<any>;
}

const _firebaseJs: IFirebaseJs = {
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
    authStateChanged: async function (user: User) {
        console.log('authStateChanged', user);
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        console.log('invoking C# OnAuthStateChanged', user);
        await _firebaseJs.dotNetFirebaseAuthReference.invokeMethodAsync(
            'OnAuthStateChanged',
            user
        );
        console.log('auth state changed invoked');
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
    createUserWithEmail: async function (email: string, password: string) {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        let userJsonData: string = null;
        await createUserWithEmailAndPassword(_firebaseJs.auth, email, password)
            .then(async (userCredential) => {
                userJsonData = JSON.stringify(userCredential.user);
                await _firebaseJs.authStateChanged(userCredential.user);
            })
            .catch((e) => {
                console.error(e);
            });
        console.log(userJsonData);
        return userJsonData;
    },
    database: null,
    dotNetFirebaseAuthReference: null,
    firestore: null,
    fsListen: function () {
        console.log('fsListen');
        // [START fs_onsnapshot]
        firestoreOnSnapshot(
            firestoreCollection(_firebaseJs.firestore, '/status/'),
            function (snapshot: firestoreQuerySnapshot<firestoreDocumentData>): void {
                //let isOnline = snapshot.data().state === 'online';
                // ... use isOnline
            }
        );
        // [END fs_onsnapshot]
    },
    fsListenOnline: function () {
        console.log('fsListenOnline');
        // [START fs_onsnapshot_online]
        firestoreOnSnapshot(
            firestoreQuery(
                firestoreCollection(_firebaseJs.firestore, '/status/'),
                firestoreWhere('state', '==', 'online')
            ),
            (snapshot: firestoreQuerySnapshot<firestoreDocumentData>) => {
                if (!snapshot.size) return;

                snapshot.docChanges().forEach(function (change) {
                    if (change.type === 'added') {
                        const msg = 'User ' + change.doc.id + ' is online.';
                        console.log(change, msg);
                    }
                    if (change.type === 'removed') {
                        const msg = 'User ' + change.doc.id + ' is offline.';
                        console.log(change, msg);
                    }
                });
            }
        );
        // [END fs_onsnapshot_online]
    },
    googleProvider: null,
    initialize: async function (dotNetObjectReference: DotNet.DotNetObject) {
        if (
            _firebaseJs !== undefined &&
            _firebaseJs.dotNetFirebaseAuthReference !== null
        ) {
            console.log('Firebase already initialized, skipping');
            return;
        }
        try {
            // Initialize Firebase
            _firebaseJs.dotNetFirebaseAuthReference = dotNetObjectReference;
            const firebaseConfigJsonDiv: HTMLElement =
                document.getElementById('firebaseConfig');
            _firebaseJs.config = JSON.parse(atob(firebaseConfigJsonDiv.innerText));
            const firebaseUiConfigJsonDiv: HTMLElement =
                document.getElementById('firebaseUiConfig');
            _firebaseJs.uiConfigFromStorage = JSON.parse(
                atob(firebaseUiConfigJsonDiv.innerText)
            );
            const uiConfig: firebaseUiAuth.Config = _firebaseJs.uiConfigFactory();
            _firebaseJs.app = firebase.initializeApp(_firebaseJs.config);
            _firebaseJs.auth = getAuth();
            _firebaseJs.database = getDatabase();
            _firebaseJs.firestore = getFirestore(_firebaseJs.app);
            _firebaseJs.googleProvider = new GoogleAuthProvider();
            console.log(`Firebase app "${_firebaseJs.app.name}" loaded`);
            // set up constants for later
            _firebaseJs.data.isOnlineForDatabase = {
                state: 'online',
                last_changed: dbServerTimestamp()
            };
            _firebaseJs.data.isOnlineForFirestore = {
                state: 'online',
                last_changed: firestoreServerTimestamp()
            };
            _firebaseJs.data.isOfflineForDatabase = {
                state: 'offline',
                last_changed: dbServerTimestamp()
            };
            _firebaseJs.data.isOfflineForFirestore = {
                state: 'offline',
                last_changed: firestoreServerTimestamp()
            };
            console.log('firebaseui loading');
            _firebaseJs.ui = new firebaseUiAuth.AuthUI(_firebaseJs.auth);
            console.log('firebaseui loaded', _firebaseJs.ui);
            _firebaseJs.ui.start('#firebaseui-auth-container', uiConfig);
            console.log('firebaseui started', uiConfig);
            await _firebaseJs.signInAnonymously();
        } catch (e) {
            console.error(e);
        }
        try {
            // add observer to auth state changed
            onAuthStateChanged(_firebaseJs.auth, _firebaseJs.authStateChanged);
        } catch (e) {
            console.error('Error setting up auth state listener', e);
        }
    },
    isInitialized: function () {
        return (
            _firebaseJs !== undefined &&
            _firebaseJs.dotNetFirebaseAuthReference !== undefined &&
            _firebaseJs.dotNetFirebaseAuthReference !== null &&
            _firebaseJs.auth !== null
        );
    },
    loginWithEmail: async function (email, password) {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        let userJsonData = null;
        await signInWithEmailAndPassword(_firebaseJs.auth, email, password)
            .then(async (userCredential) => {
                // Signed in
                userJsonData = JSON.stringify(userCredential.user);
                await _firebaseJs.authStateChanged(userCredential.user);
            })
            .catch(async (error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error(error);
                await _firebaseJs.authStateChanged(null);
            });
        console.log(userJsonData);
        return userJsonData;
    },
    loginWithGooglePopup: async function () {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        let userJsonData = null;
        signInWithPopup(_firebaseJs.auth, _firebaseJs.googleProvider)
            .then(async (result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                userJsonData = JSON.stringify(user);
                await _firebaseJs.authStateChanged(result.user);
            })
            .catch(async (error) => {
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
        let sent = null;
        await sendEmailVerification(_firebaseJs.auth.currentUser)
            .then(() => {
                // Email verification sent!
                // ...
                sent = true;
            })
            .catch((error) => {
                sent = false;
            });
        return sent;
    },
    sendEmailPasswordReset: async function (email) {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        let reset = null;
        await sendPasswordResetEmail(_firebaseJs.auth, email)
            .then(async () => {
                reset = true;
            })
            .catch(() => {
                reset = false;
            });
        return reset;
    },
    signOut: async function () {
        if (!_firebaseJs.isInitialized()) {
            return false;
        }
        let result = null;
        signOut(_firebaseJs.auth)
            .then(() => {
                // Sign-out successful.
                result = true;
            })
            .catch(() => {
                // An error happened.
                result = false;
            });
        return result;
    },
    ui: null,
    uiConfig: null,
    uiConfigFactory: function () {
        return {
            callbacks: {
                // signInFailure callback must be provided to handle merge conflicts which
                // occur when an existing credential is linked to an anonymous user.
                signInFailure: function (error: firebaseUiAuth.AuthUIError) {
                    // For merge conflicts, the error.code will be
                    // 'firebaseui/anonymous-upgrade-merge-conflict'.
                    if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
                        return Promise.resolve();
                    }
                    // The credential the user tried to sign in with.
                    const cred: UserCredential = error.credential;
                    // Copy data from anonymous user to permanent user and delete anonymous
                    // user.
                    // ...
                    // Finish sign-in after data is copied.
                    throw new Error('not implemented');
                    //return signInWithCredential(_firebaseJs.auth, Promise.resolve(cred));
                }
            },
            signInSuccessUrl: _firebaseJs.uiConfigFromStorage.signInSuccessUrl,
            signInOptions: [
                GoogleAuthProvider.PROVIDER_ID,
                FacebookAuthProvider.PROVIDER_ID,
                TwitterAuthProvider.PROVIDER_ID,
                GithubAuthProvider.PROVIDER_ID,
                EmailAuthProvider.PROVIDER_ID,
                PhoneAuthProvider.PROVIDER_ID,
                firebaseUiAuth.AnonymousAuthProvider.PROVIDER_ID
            ],
            // tosUrl and privacyPolicyUrl accept either url string or a callback
            // function.
            // Terms of service url/callback.
            tosUrl: _firebaseJs.uiConfigFromStorage.tosUrl,
            // Privacy policy url/callback.
            privacyPolicyUrl: function () {
                window.location.assign(_firebaseJs.uiConfigFromStorage.privacyPolicyUrl);
            },
            autoUpgradeAnonymousUsers: true
        };
    },
    uiConfigFromStorage: null,
    updateProfile: async function (userData) {
        if (!_firebaseJs.isInitialized()) {
            return;
        }
        let updated = null;
        await updateProfile(_firebaseJs.auth.currentUser, userData)
            .then(async () => {
                // Profile updated!
                // ...
                updated = true;
            })
            .catch((error) => {
                console.error(error);
                // An error occurred
                // ...
                updated = false;
            });
        return updated;
    },
    rtdbPresence: function () {
        console.log('rtdbPresence');
        // [START rtdb_presence]
        // Fetch the current user's ID from Firebase Authentication.
        const uid = _firebaseJs.auth.currentUser.uid;
        console.log('rtdbPresence:uid', uid);

        // Create a reference to the special '.info/connected' path in
        // Realtime Database. This path returns `true` when connected
        // and `false` when disconnected.
        const infoRef = dbRef(_firebaseJs.database, '.info/connected');
        dbOnValue(infoRef, async (snapshot) => {
            console.log('dbOnValue:snapshot', snapshot);
            // If we're not currently connected, don't do anything.
            if (snapshot.val() == false) {
                return;
            }
            // Create a reference to this user's specific status node.
            // This is where we will store data about being online/offline.
            const userStatusDatabaseRef = dbRef(_firebaseJs.database, '/status/' + uid);
            const connection = dbPush(userStatusDatabaseRef);

            // If we are currently connected, then use the 'onDisconnect()'
            // method to add a set which will only trigger once this
            // client has disconnected by closing the app,
            // losing internet, or any other means.
            dbOnDisconnect(connection)
                .set(_firebaseJs.data.isOfflineForDatabase)
                .then(function () {
                    console.log('dbOnDisconnect, under snapshot', snapshot);
                    // The promise returned from .onDisconnect().set() will
                    // resolve as soon as the server acknowledges the onDisconnect()
                    // request, NOT once we've actually disconnected:
                    // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

                    // We can now safely set ourselves as 'online' knowing that the
                    // server will mark us as offline once we lose connection.
                    dbSet(userStatusDatabaseRef, _firebaseJs.data.isOnlineForDatabase);
                });
        });
        // [END rtdb_presence]
    },
    rtdbAndLocalFsPresence: function () {
        console.log('rtdbAndLocalFsPresence');
        // [START rtdb_and_local_fs_presence]
        // [START_EXCLUDE]
        const uid = _firebaseJs.auth.currentUser.uid;
        console.log('rtdbAndLocalFsPresence:uid', uid);
        // [END_EXCLUDE]
        const userStatusFirestoreRef = firestoreDoc(
            _firebaseJs.firestore,
            '/status/' + uid
        );
        // Firestore uses a different server timestamp value, so we'll
        // create two more constants for Firestore state.
        const infoRef = dbRef(_firebaseJs.database, '.info/connected');
        dbOnValue(infoRef, async (snapshot) => {
            console.log('rtdbAndLocalFsPresence:dbOnValue:snapshot', snapshot);
            const userStatusDatabaseRef = dbRef(_firebaseJs.database, '/status/' + uid);
            if (snapshot.val() == false) {
                // Instead of simply returning, we'll also set Firestore's state
                // to 'offline'. This ensures that our Firestore cache is aware
                // of the switch to 'offline.'
                dbSet(userStatusDatabaseRef, _firebaseJs.data.isOfflineForDatabase);
                firestoreSetDoc(
                    userStatusFirestoreRef,
                    _firebaseJs.data.isOfflineForFirestore
                );
                return;
            }
            const connection = dbPush(userStatusDatabaseRef);
            dbOnDisconnect(connection)
                .set(_firebaseJs.data.isOfflineForDatabase)
                .then(function () {
                    console.log(
                        'rtdbAndLocalFsPresence:dbOnDisconnect:snapshot',
                        snapshot
                    );
                    dbSet(userStatusDatabaseRef, _firebaseJs.data.isOnlineForDatabase);
                    firestoreSetDoc(
                        userStatusFirestoreRef,
                        _firebaseJs.data.isOnlineForFirestore
                    );
                });
        });
        // [END rtdb_and_local_fs_presence]
    },
    setDatabaseUserStatus: function (user: UserInfo, status: boolean) {
        const userStatusDatabaseRef = dbRef(_firebaseJs.database, '/status/' + user.uid);
        dbSet(
            userStatusDatabaseRef,
            status
                ? _firebaseJs.data.isOnlineForDatabase
                : _firebaseJs.data.isOfflineForDatabase
        );
    },
    setFirestoreUserStatus: function (user: UserInfo, status: boolean) {
        const userStatusFirestoreRef = firestoreDoc(
            _firebaseJs.firestore,
            '/status/' + user.uid
        );
        firestoreSetDoc(
            userStatusFirestoreRef,
            status
                ? _firebaseJs.data.isOnlineForFirestore
                : _firebaseJs.data.isOfflineForFirestore
        );
    },
    signInAnonymously: async function () {
        console.log('signInAnonymously');
        signInAnonymously(_firebaseJs.auth)
            .then(async function () {
                _firebaseJs.rtdbAndLocalFsPresence();
                _firebaseJs.fsListenOnline();
            })
            .catch(function (err) {
                console.warn(err);
                console.warn(
                    'Please enable Anonymous Authentication in your Firebase project!'
                );
            });
    }
};

window.firebaseJs = window.firebaseJs || _firebaseJs;

export default { firebaseJs: _firebaseJs };
