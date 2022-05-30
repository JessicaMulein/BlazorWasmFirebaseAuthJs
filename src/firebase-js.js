// Module Manager for registering the modules of the chart
import { ModuleManager } from 'igniteui-webcomponents-core';
// Bullet Graph Module
import { IgcRadialGaugeCoreModule } from 'igniteui-webcomponents-gauges';
import { IgcRadialGaugeModule } from 'igniteui-webcomponents-gauges';

import { firebase, initializeApp } from 'firebase/app';
import {
    getAuth, onAuthStateChanged, signOut, updateProfile,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, sendPasswordResetEmail, 
    signInWithPopup, GoogleAuthProvider
} from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

///// --- radial gauge demo code
ModuleManager.register(
    IgcRadialGaugeCoreModule,
    IgcRadialGaugeModule
);
window.updateValue = function (value) {
    var rg = document.getElementById("rg");
    rg.value = value;
}
///// --- radial gauge demo code

const firebaseJs = {
    app: null,
    auth: null,
    database: null,
    provider: null,
    dotNetFirebaseAuthReference: null,
    firebaseConfig: null
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*
 * https://firebase.google.com/docs/projects/api-keys?msclkid=50c2da1bd15411ec864a2051a4985260
 * API keys for Firebase are different from typical API keys
 * Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources; that can only be done with Firebase Security Rules (to control which users can access resources) and App Check (to control which apps can access resources).
 *
 * Usually, you need to fastidiously guard API keys (for example, by using a vault service or setting the keys as environment variables); however, API keys for Firebase services are ok to include in code or checked-in config files.
 *
 * Although API keys for Firebase services are safe to include in code, there are a few specific cases when you should enforce limits for your API key; for example, if you're using Firebase ML, Firebase Authentication with the email/password sign-in method, or a billable Google Cloud API. Learn more about these cases later on this page.
 */
// window.firebaseConfig comes from FirebaseAuth component div

window.firebaseInitialize = async function (dotNetObjectReference) {
    if (firebaseJs !== undefined && firebaseJs.dotNetFirebaseAuthReference !== null) {
        console.log("Firebase already initialized, skipping");
        return;
    }
    // Initialize Firebase
    firebaseJs.dotNetFirebaseAuthReference = dotNetObjectReference;
    var firebaseConfigJsonDiv = document.getElementById("firebaseConfig");
    firebaseJs.firebaseConfig = JSON.parse(atob(firebaseConfigJsonDiv.innerText));
    firebaseJs.app = initializeApp(firebaseJs.firebaseConfig);
    firebaseJs.auth = getAuth()
    firebaseJs.database = getDatabase();
    firebaseJs.provider = new GoogleAuthProvider();

    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.firestore().doc('/foo/bar').get().then(() => { });
    // firebase.functions().httpsCallable('yourFunction')().then(() => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    // firebase.analytics(); // call to activate
    // firebase.analytics().logEvent('tutorial_completed');
    // firebase.performance(); // call to activate
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    
    try {
        console.log(`Firebase app "${firebaseJs.app.name}" loaded`);
    } catch (e) {
        console.error(e);
    }
    // add observer to auth state changed
    onAuthStateChanged(firebaseJs.auth, window.firebaseAuthStateChanged);
};

window.firebaseIsInitialized = function () {
    return (
        firebaseJs !== undefined &&
        (firebaseJs.dotNetFirebaseAuthReference !== undefined) &&
        (firebaseJs.dotNetFirebaseAuthReference !== null));
};

window.firebaseAuthStateChanged = async function (user) {
    console.log("auth state changed", arguments);
    if (!window.firebaseIsInitialized()) {
        return;
    }
    console.log(user);
    await firebaseJs.dotNetFirebaseAuthReference.invokeMethodAsync('OnAuthStateChanged', user);
    console.log("auth state changed invoked");
};

window.firebaseUpdateProfile = async function (userData) {
    if (!window.firebaseIsInitialized()) {
        return;
    }
    var updated = null;
    await updateProfile(firebaseJs.auth.currentUser, userData).then(async () => {
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
};

window.firebaseSendEmailVerification = async function () {
    if (!window.firebaseIsInitialized()) {
        return;
    }
    var sent = null;
    await sendEmailVerification(firebaseJs.auth.currentUser)
        .then(() => {
            // Email verification sent!
            // ...
            sent = true;
        }).catch((error) => {
            sent = false;
        });
    return sent;
}

window.firebaseSendEmailPasswordReset = async function () {
    if (!window.firebaseIsInitialized()) {
        return;
    }
    var reset = null;
    await sendPasswordResetEmail(firebaseJs.auth, email).then(async () => {
        reset = true;
    }).catch((error) => {
        reset = false;
    });
    return reset;
}

window.firebaseCreateUser = async function (email, password) {
    if (!window.firebaseIsInitialized()) {
        return;
    }
    var userJsonData = null;
    await createUserWithEmailAndPassword(firebaseJs.auth, email, password).then(async (userCredential) => {
        userJsonData = JSON.stringify(userCredential.user);
        await window.firebaseAuthStateChanged(userCredential.user);
    }).catch((e) => {
        console.error(e)
    });
    console.log(userJsonData);
    return userJsonData;
};

window.firebaseLoginUser = async function (email, password) {
    if (!window.firebaseIsInitialized()) {
        return;
    }
    var userJsonData = null;
    await signInWithEmailAndPassword(firebaseJs.auth, email, password)
        .then(async (userCredential) => {
            // Signed in 
            userJsonData = JSON.stringify(userCredential.user);
            await window.firebaseAuthStateChanged(userCredential.user);
        })
        .catch(async (error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(error)
            await window.firebaseAuthStateChanged(null);
            
        });
    console.log(userJsonData);
    return userJsonData;
};

window.firebaseLoginWithGooglePopup = async function () {
    if (!window.firebaseIsInitialized()) {
        return;
    }
    var userJsonData = null;    
    signInWithPopup(firebaseJs.auth, provider)
        .then(async (result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            userJsonData = JSON.stringify(user);
            await window.firebaseAuthStateChanged(result.user);
        }).catch(async (error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.log(error);
            await window.firebaseAuthStateChanged(null);
        });
    console.log(userJsonData);
    return userJsonData;
};

window.firebaseSignOut = async function () {
    if (!window.firebaseIsInitialized()) {
        return false;
    }
    var result = null;
    signOut(firebaseJs.auth).then(() => {
        // Sign-out successful.
        result = true;
    }).catch((error) => {
        // An error happened.
        result = false;
    });
    return result;
}

window.firebaseValidateToken = async function (idToken) {
    if (!window.firebaseIsInitialized()) {
        return false;
    }
    var result = null;
    firebaseJs.auth
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            result = decodedToken;
        })
        .catch((error) => {
            // Handle error
            result = false;
        });
    return result;
}

export default { firebaseJs }