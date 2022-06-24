//FileName : firebaseJs.ts
/// <reference types="node" />
'use strict';
import { ConfigurationHelper } from './configurationHelper';
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
import { FirebaseApp, FirebaseError, FirebaseOptions } from 'firebase/app';
import {
    IFirebaseJs,
    IFirebaseJsData,
    IFirebaseJsDataDatabaseValue,
    IFirebaseJsDataFirestoreValue,
    IFirebaseUiConfigSimple,
    IFirebaseWindow
} from './interfaces';
export class FirebaseJs implements IFirebaseJs {
    constructor(dotNetObjectReference: DotNet.DotNetObject, firebaseApp: FirebaseApp) {
        this.dotNetFirebaseAuthReference = dotNetObjectReference;
        this.app = firebaseApp;
        this.auth = null;
        this.config = firebaseApp.options;
        this.data = {
            allowAnonymous: false,
            anonymousUser: null,
            anonymousUserData: null,
            signedInUid: null,
            lastUid: null,
            isOnlineForDatabase: (): IFirebaseJsDataDatabaseValue => {
                return {
                    state: 'online',
                    last_changed: dbServerTimestamp()
                };
            },
            isOnlineForFirestore: (): IFirebaseJsDataFirestoreValue => {
                return {
                    state: 'online',
                    last_changed: firestoreServerTimestamp()
                };
            },
            isOfflineForDatabase: (): IFirebaseJsDataDatabaseValue => {
                return {
                    state: 'offline',
                    last_changed: dbServerTimestamp()
                };
            },
            isOfflineForFirestore: (): IFirebaseJsDataFirestoreValue => {
                return {
                    state: 'offline',
                    last_changed: firestoreServerTimestamp()
                };
            },
            presenceActive: false
        };
        this.database = null;
        this.firestore = null;
        this.firebaseJs = null;
        this.googleProvider = null;
        this.ui = null;
        this.uiConfig = null;
        this.uiConfigFromStorage = null;
        if (this.dotNetFirebaseAuthReference !== null) {
            console.log('Firebase already initialized, skipping');
            return;
        }
        try {
            // Initialize Firebase
            this.dotNetFirebaseAuthReference = dotNetObjectReference;
            const firebaseConfigJsonDiv: HTMLElement | null =
                document.getElementById('firebaseConfig');
            if (firebaseConfigJsonDiv === null) {
                console.error('firebaseConfig div not found');
                return;
            }
            this.config = JSON.parse(atob(firebaseConfigJsonDiv.innerText));
            const firebaseUiConfigJsonDiv: HTMLElement | null =
                document.getElementById('firebaseUiConfig');
            if (firebaseUiConfigJsonDiv === null) {
                console.error('firebaseUiConfig div not found');
                return;
            }
            this.uiConfigFromStorage = JSON.parse(
                atob(firebaseUiConfigJsonDiv.innerText)
            );
            if (this.uiConfigFactory === null) {
                throw new Error('could not parse uiConfig from storage');
            }
            const uiConfig: firebaseUiAuth.Config = this.uiConfigFactory();
            this.auth = getAuth();
            this.database = getDatabase();
            this.firestore = getFirestore(this.app);
            this.googleProvider = new GoogleAuthProvider();
            console.log(`Firebase app "${this.app.name}" loaded`);
            console.log('firebaseui loading');
            this.ui = new firebaseUiAuth.AuthUI(this.auth);
            console.log('firebaseui loaded', this.ui);
            this.ui.start('#firebaseui-auth-container', uiConfig);
            console.log('firebaseui started', uiConfig);
            if (this.data.allowAnonymous) {
                async () => {
                    await this.signInAnonymously();
                };
            }
        } catch (e) {
            console.error(e);
        }
        if (this.auth === null) {
            throw new Error('auth is null');
        }
        try {
            // add observer to auth state changed
            onAuthStateChanged(this.auth, this.authStateChanged);
        } catch (e) {
            console.error('Error setting up auth state listener', e);
        }
    }
    data: IFirebaseJsData;
    app: FirebaseApp | null;
    auth: Auth | null;
    config: FirebaseOptions;
    database: Database | null;
    dotNetFirebaseAuthReference: DotNet.DotNetObject | null;
    firestore: Firestore | null;
    firebaseJs: FirebaseJs | null;
    googleProvider: GoogleAuthProvider | null;
    ui: firebaseUiAuth.AuthUI | null;
    uiConfigFromStorage: IFirebaseUiConfigSimple | null;
    uiConfig: firebaseUiAuth.Config | null;
    activatePresence() {
        if (this.data.presenceActive) {
            return;
        }
        this.rtdbAndLocalFsPresence();
        this.fsListenOnline();
        this.data.presenceActive = true;
    }
    async authStateChanged(user: User | null): Promise<void> {
        console.log('authStateChanged', user);
        if (!this.isInitialized() || this.dotNetFirebaseAuthReference === null) {
            return;
        }
        console.log('invoking C# OnAuthStateChanged', user);
        await this.dotNetFirebaseAuthReference.invokeMethodAsync(
            'OnAuthStateChanged',
            user
        );
        console.log('auth state changed invoked');
        if (user !== null && user !== undefined) {
            if (this.data.signedInUid === null && !this.data.presenceActive) {
                this.activatePresence();
            }
            this.data.lastUid = this.data.signedInUid;
            this.data.signedInUid = user.uid;
        } else {
            if (this.data.signedInUid !== null) {
                this.data.lastUid = this.data.signedInUid;
                this.data.signedInUid = null;
            }
        }
    }
    async createUserWithEmail(email: string, password: string): Promise<string> {
        if (!this.isInitialized() || this.auth === null) {
            return Promise.reject();
        }
        let userJsonData: string | null = null;
        await createUserWithEmailAndPassword(this.auth, email, password)
            .then(async (userCredential) => {
                userJsonData = JSON.stringify(userCredential.user);
                await this.authStateChanged(userCredential.user);
                this.activatePresence();
            })
            .catch((e) => {
                console.error(e);
            });
        if (userJsonData === null) {
            return Promise.reject();
        }
        console.log(userJsonData);
        return Promise.resolve(userJsonData);
    }
    fsListen(): void {
        if (this.data.presenceActive || this.firestore === null) {
            return;
        }
        console.log('fsListen');
        // [START fs_onsnapshot]
        firestoreOnSnapshot(
            firestoreCollection(this.firestore, '/status/'),
            function (snapshot: firestoreQuerySnapshot<firestoreDocumentData>): void {
                //let isOnline = snapshot.data().state === 'online';
                // ... use isOnline
            }
        );
        // [END fs_onsnapshot]
    }
    fsListenOnline() {
        if (this.data.presenceActive || this.firestore === null) {
            return;
        }
        console.log('fsListenOnline');
        // [START fs_onsnapshot_online]
        firestoreOnSnapshot(
            firestoreQuery(
                firestoreCollection(this.firestore, '/status/'),
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
    }
    isInitialized() {
        return (
            this.dotNetFirebaseAuthReference !== undefined &&
            this.dotNetFirebaseAuthReference !== null &&
            this.auth !== null
        );
    }
    async loginWithEmail(email, password): Promise<string> {
        if (!this.isInitialized() || this.auth === null) {
            return Promise.reject();
        }
        let userJsonData: string | null = null;
        await signInWithEmailAndPassword(this.auth, email, password)
            .then(async (userCredential) => {
                // Signed in
                userJsonData = JSON.stringify(userCredential.user);
                await this.authStateChanged(userCredential.user);
                console.log('loginWithEmail: starting presence');
                this.activatePresence();
            })
            .catch(async (error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error(error);
                await this.authStateChanged(null);
            });
        if (userJsonData === null) {
            return Promise.reject();
        }
        console.log(userJsonData);
        return Promise.resolve(userJsonData);
    }
    async loginWithGooglePopup(): Promise<string> {
        if (!this.isInitialized() || this.auth === null || this.googleProvider === null) {
            return Promise.reject();
        }
        let userJsonData: string | null = null;
        await signInWithPopup(this.auth, this.googleProvider)
            .then(async (result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential === null) {
                    return Promise.reject();
                }
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                userJsonData = JSON.stringify(user);
                await this.authStateChanged(result.user);
                console.log('loginWithGooglePopup: starting presence');
                this.activatePresence();
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
                await this.authStateChanged(null);
            });
        if (userJsonData === null) {
            return Promise.reject();
        }
        console.log(userJsonData);
        return Promise.resolve(userJsonData);
    }
    async rtdbPresence() {
        if (
            this.data.presenceActive ||
            this.auth === null ||
            this.auth.currentUser === null ||
            this.database === null
        ) {
            return;
        }
        console.log('rtdbPresence');
        // [START rtdb_presence]
        // Fetch the current user's ID from Firebase Authentication.
        const uid = this.auth.currentUser.uid;
        console.log('rtdbPresence:uid', uid);

        // Create a reference to the special '.info/connected' path in
        // Realtime Database. This path returns `true` when connected
        // and `false` when disconnected.
        const infoRef = dbRef(this.database, '.info/connected');
        const self = this;
        dbOnValue(infoRef, async (snapshot) => {
            console.log('dbOnValue:snapshot', snapshot);
            // If we're not currently connected, don't do anything.
            if (snapshot.val() == false) {
                return;
            }
            // Create a reference to this user's specific status node.
            // This is where we will store data about being online/offline.
            if (this.database === null) {
                return;
            }
            const userStatusDatabaseRef = dbRef(this.database, '/status/' + uid);
            const connection = dbPush(userStatusDatabaseRef);

            // If we are currently connected, then use the 'onDisconnect()'
            // method to add a set which will only trigger once this
            // client has disconnected by closing the app,
            // losing internet, or any other means.
            await dbOnDisconnect(connection)
                .set(this.data.isOfflineForDatabase())
                .then(function () {
                    console.log('dbOnDisconnect, under snapshot', snapshot);
                    // The promise returned from .onDisconnect().set() will
                    // resolve as soon as the server acknowledges the onDisconnect()
                    // request, NOT once we've actually disconnected:
                    // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

                    // We can now safely set ourselves as 'online' knowing that the
                    // server will mark us as offline once we lose connection.
                    dbSet(userStatusDatabaseRef, self.data.isOnlineForDatabase());
                });
        });
        // [END rtdb_presence]
    }
    async rtdbAndLocalFsPresence() {
        if (
            this.data.presenceActive ||
            this.auth === null ||
            this.auth.currentUser === null ||
            this.database === null ||
            this.firestore === null
        ) {
            return;
        }
        console.log('rtdbAndLocalFsPresence');
        // [START rtdb_and_local_fs_presence]
        // [START_EXCLUDE]
        const uid = this.auth.currentUser.uid;
        console.log('rtdbAndLocalFsPresence:uid', uid);
        // [END_EXCLUDE]
        const userStatusFirestoreRef = firestoreDoc(this.firestore, '/status/' + uid);
        // Firestore uses a different server timestamp value, so we'll
        // create two more constants for Firestore state.
        const infoRef = dbRef(this.database, '.info/connected');
        const self = this;
        dbOnValue(infoRef, async (snapshot) => {
            console.log('rtdbAndLocalFsPresence:dbOnValue:snapshot', snapshot);
            if (this.database === null) {
                return;
            }
            const userStatusDatabaseRef = dbRef(this.database, '/status/' + uid);
            if (snapshot.val() == false) {
                // Instead of simply returning, we'll also set Firestore's state
                // to 'offline'. This ensures that our Firestore cache is aware
                // of the switch to 'offline.'
                dbSet(userStatusDatabaseRef, this.data.isOfflineForDatabase());
                firestoreSetDoc(
                    userStatusFirestoreRef,
                    this.data.isOfflineForFirestore()
                );
                return;
            }
            const connection = dbPush(userStatusDatabaseRef);
            await dbOnDisconnect(connection)
                .set(this.data.isOfflineForDatabase())
                .then(function () {
                    console.log(
                        'rtdbAndLocalFsPresence:dbOnDisconnect:snapshot',
                        snapshot
                    );
                    dbSet(userStatusDatabaseRef, self.data.isOnlineForDatabase());
                    firestoreSetDoc(
                        userStatusFirestoreRef,
                        self.data.isOnlineForFirestore()
                    );
                });
        });
        // [END rtdb_and_local_fs_presence]
    }
    async sendEmailVerification(): Promise<boolean> {
        if (
            !this.isInitialized() ||
            this.auth === null ||
            this.auth.currentUser === null
        ) {
            return Promise.reject();
        }
        let sent: boolean | null = null;
        let caughtError = null;
        await sendEmailVerification(this.auth.currentUser)
            .then(() => {
                // Email verification sent!
                // ...
                sent = true;
            })
            .catch((error) => {
                caughtError = error;
                sent = false;
            });
        if (sent === null || sent === false) {
            return Promise.reject(caughtError);
        }
        return sent;
    }
    async sendEmailPasswordReset(email): Promise<boolean> {
        if (!this.isInitialized() || this.auth === null) {
            return Promise.reject();
        }
        let reset: boolean | null = null;
        let caughtError = null;
        await sendPasswordResetEmail(this.auth, email)
            .then(async () => {
                reset = true;
            })
            .catch((error) => {
                caughtError = error;
                reset = false;
            });
        if (reset === null || reset === false) {
            return Promise.reject(caughtError);
        }
        return Promise.resolve(reset);
    }
    async setDatabaseUserStatus(user: User, status: boolean) {
        if (this.database === null) {
            return;
        }
        const userStatusDatabaseRef = dbRef(this.database, '/status/' + user.uid);
        dbSet(
            userStatusDatabaseRef,
            status ? this.data.isOnlineForDatabase() : this.data.isOfflineForDatabase()
        );
    }
    setFirestoreUserStatus(user: User, status: boolean) {
        if (this.firestore === null) {
            return;
        }
        const userStatusFirestoreRef = firestoreDoc(
            this.firestore,
            '/status/' + user.uid
        );
        firestoreSetDoc(
            userStatusFirestoreRef,
            status ? this.data.isOnlineForFirestore() : this.data.isOfflineForFirestore()
        );
    }
    setUserStatus(user: User, status: boolean) {
        this.setDatabaseUserStatus(user, status);
        this.setFirestoreUserStatus(user, status);
    }
    async signInAnonymously() {
        if (!this.isInitialized() || this.auth === null) {
            return;
        }
        if (!this.data.allowAnonymous) {
            console.log('signInAnonymously: disabled. returning.');
            return;
        }
        console.log('signInAnonymously');
        const self = this;
        await signInAnonymously(this.auth)
            .then(async function () {
                if (self.auth === null) {
                    return;
                }
                self.data.anonymousUser = self.auth.currentUser;
                console.log('signInAnonymously: starting presence');
                self.activatePresence();
            })
            .catch(function (err) {
                console.warn(err);
                console.warn(
                    'Please enable Anonymous Authentication in your Firebase project!'
                );
            });
    }
    async signOut() {
        if (
            !this.isInitialized() ||
            this.auth === null ||
            this.auth.currentUser === null
        ) {
            return false;
        }
        this.setUserStatus(this.auth.currentUser, false);
        let result: boolean | null = null;
        let caughtError = null;
        await signOut(this.auth)
            .then(() => {
                // Sign-out successful.
                result = true;
            })
            .catch((error) => {
                // An error happened.
                caughtError = error;
                result = false;
            });
        if (result === null || result === false) {
            return Promise.reject(caughtError);
        }
        return result;
    }
    uiConfigFactory() {
        const _signInOptions: string[] = [
            GoogleAuthProvider.PROVIDER_ID,
            FacebookAuthProvider.PROVIDER_ID,
            TwitterAuthProvider.PROVIDER_ID,
            GithubAuthProvider.PROVIDER_ID,
            EmailAuthProvider.PROVIDER_ID,
            PhoneAuthProvider.PROVIDER_ID
        ];
        if (this.data.allowAnonymous) {
            _signInOptions.push(firebaseUiAuth.AnonymousAuthProvider.PROVIDER_ID);
        }
        if (this.uiConfigFromStorage === null) {
            throw new Error('uiConfigFromStorage is null');
        }
        const self = this;
        return {
            callbacks: {
                signInSuccessWithAuthResult: function (
                    authResult: any,
                    redirectUrl: string
                ) {
                    // Process result. This will not trigger on merge conflicts.
                    // On success redirect to signInSuccessUrl.
                    return true;
                },
                // signInFailure callback must be provided to handle merge conflicts which
                // occur when an existing credential is linked to an anonymous user.
                signInFailure: function (error: firebaseUiAuth.AuthUIError) {
                    return Promise.resolve();
                }
            },
            signInSuccessUrl: this.uiConfigFromStorage.signInSuccessUrl,
            signInOptions: _signInOptions,
            // tosUrl and privacyPolicyUrl accept either url string or a callback
            // function.
            // Terms of service url/callback.
            tosUrl: this.uiConfigFromStorage.tosUrl,
            // Privacy policy url/callback.
            privacyPolicyUrl: this.uiConfigFromStorage.privacyPolicyUrl,
            autoUpgradeAnonymousUsers: false
        };
    }
    async updateProfile(userData): Promise<void> {
        if (
            !this.isInitialized() ||
            this.auth === null ||
            this.auth.currentUser === null
        ) {
            return Promise.reject();
        }
        let updated: boolean | null = null;
        let caughtError = null;
        await updateProfile(this.auth.currentUser, userData)
            .then(async () => {
                // Profile updated!
                // ...
                updated = true;
            })
            .catch((error) => {
                caughtError = error;
                console.error(error);
                // An error occurred
                // ...
                updated = false;
            });
        if (updated === null || updated === false) {
            return Promise.reject(caughtError);
        }
        return Promise.resolve();
    }
}
