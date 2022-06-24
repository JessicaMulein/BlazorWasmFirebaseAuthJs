/// <reference types="node" />
import { FirebaseApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, User, UserInfo } from 'firebase/auth';
import { Database } from 'firebase/database';
import { FieldValue, Firestore } from 'firebase/firestore';
import { auth as firebaseUiAuth } from 'firebaseui';
export interface IFirebaseWindow {
    firebaseJs: IFirebaseJs | null;
    static initialize(dotNetObjectReference: DotNet.DotNetObject): Promise<FirebaseJs>;
}
interface IFirebaseJsDataDatabaseValue {
    state: string;
    last_changed: object;
}

interface IFirebaseJsDataFirestoreValue {
    state: string;
    last_changed: FieldValue;
}

interface IFirebaseJsData {
    allowAnonymous: boolean;
    anonymousUser?: User | null;
    anonymousUserData?: firestoreQuerySnapshot<firestoreDocumentData>;
    signedInUid?: string | null;
    lastUid?: string | null;
    presenceActive: boolean;
    isOfflineForDatabase: () => IFirebaseJsDataDatabaseValue;
    isOnlineForDatabase: () => IFirebaseJsDataDatabaseValue;
    isOfflineForFirestore: () => IFirebaseJsDataFirestoreValue;
    isOnlineForFirestore: () => IFirebaseJsDataFirestoreValue;
}

interface IFirebaseUiConfigSimple {
    signInOptions: Array<string>;
    signInSuccessUrl: string;
    tosUrl: string;
    privacyPolicyUrl: string;
}

interface IFirebaseJs {
    activatePresence: () => void;
    data: IFirebaseJsData;
    app: FirebaseApp | null;
    auth: Auth | null;
    authStateChanged: (user: User) => any;
    config: object;
    createUserWithEmail: (email: string, password: string) => Promise<string | null>;
    database: Database | null;
    dotNetFirebaseAuthReference: DotNet.DotNetObject | null;
    firestore: Firestore | null;
    fsListen: () => any;
    fsListenOnline: () => any;
    googleProvider?: GoogleAuthProvider | null;
    isInitialized: () => boolean;
    loginWithEmail: (email: string, password: string) => Promise<string | null>;
    loginWithGooglePopup: () => Promise<string | null>;
    rtdbPresence: () => any;
    rtdbAndLocalFsPresence: () => any;
    sendEmailVerification: () => Promise<boolean | null>;
    sendEmailPasswordReset: (email: string) => Promise<boolean>;
    setDatabaseUserStatus: (user: User, status: boolean) => any;
    setFirestoreUserStatus: (user: User, status: boolean) => any;
    setUserStatus: (user: User, status: boolean) => any;
    signInAnonymously: () => Promise<any>;
    signOut: () => Promise<boolean>;
    ui: firebaseUiAuth.AuthUI | null;
    uiConfigFromStorage: IFirebaseUiConfigSimple | null;
    uiConfig: firebaseUiAuth.Config | null;
    uiConfigFactory: () => firebaseUiAuth.Config;
    updateProfile: (userData: object) => Promise<any>;
}
