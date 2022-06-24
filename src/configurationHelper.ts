import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { FirebaseJs } from './firebaseJs';

declare global {
    interface Window {
        firebaseJs: FirebaseJs;
        firebase?: {
            apps: Array<FirebaseApp>;
        } | null;
    }
}

export class ConfigurationHelper {
    static getConfigFromPage(elementName: string): FirebaseOptions {
        const firebaseConfigJsonDiv: HTMLElement | null =
            document.getElementById(elementName);
        if (firebaseConfigJsonDiv === null) {
            throw new Error(`Unable to find element with id ${elementName}`);
        }
        return JSON.parse(atob(firebaseConfigJsonDiv.innerText));
    }
    static async getConfigFromRunningApp(): Promise<FirebaseOptions> {
        if (
            window.firebase !== undefined &&
            window.firebase !== null &&
            window.firebase.apps !== undefined &&
            window.firebase.apps.length > 0 &&
            window.firebase.apps[0] !== undefined &&
            window.firebase.apps[0] !== null
        ) {
            const _firebaseHostingApp: FirebaseApp = window.firebase.apps[0];
            if (_firebaseHostingApp.options !== undefined) {
                return Promise.resolve(_firebaseHostingApp.options);
            }
        }
        return Promise.reject();
    }
    static async GetConfigFromHosting(): Promise<FirebaseOptions> {
        const firebaseHostingMagicConfigUrl = '/__/firebase/init.json';
        let result: FirebaseOptions | null = null;
        await fetch(firebaseHostingMagicConfigUrl).then(async (response) => {
            const jsonText: string = await response.text();
            result = JSON.parse(jsonText);
        });
        if (result === null) {
            return Promise.reject(
                'Unable to fetch and parse configuration from Firebase Hosting'
            );
        }
        return Promise.resolve(result);
    }
    static async EnsureApp(configuration?: FirebaseOptions): Promise<FirebaseApp> {
        if (
            window.firebase !== undefined &&
            window.firebase !== null &&
            window.firebase.apps !== undefined &&
            window.firebase.apps.length > 0 &&
            window.firebase.apps[0] !== undefined &&
            window.firebase.apps[0] !== null
        ) {
            const _firebaseHostingApp: FirebaseApp = window.firebase.apps[0];
            return Promise.resolve(_firebaseHostingApp);
        } else if (configuration !== undefined) {
            return Promise.resolve(initializeApp(configuration));
        } else {
            return Promise.reject('failed to configure firebase');
        }
    }
    static async EnsureConfiguration(): Promise<FirebaseOptions> {
        let configToUse: FirebaseOptions = {};
        let method = 0;
        // if the config doesn't look like it is populated, try to get from Firebase hosting
        while (configToUse.apiKey === undefined || configToUse.apiKey == '') {
            try {
                switch (method++) {
                    case 0:
                        // try running app
                        // see if we can get it out of a firebase app instance (hosting init.js)
                        configToUse = await ConfigurationHelper.getConfigFromRunningApp();
                        break;
                    case 1:
                        configToUse = await ConfigurationHelper.GetConfigFromHosting();
                        break;
                    default:
                        console.error(
                            'Unable to find a firebase configuration that looks valid'
                        );
                }
            } catch (error) {
                console.error(error);
            }
        }
        return Promise.resolve(configToUse);
    }
}
