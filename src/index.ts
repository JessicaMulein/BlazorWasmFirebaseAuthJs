//FileName : firebaseJs.ts
/// <reference types="node" />
'use strict';

import { ConfigurationHelper } from './configurationHelper';
import { FirebaseJs } from './firebaseJs';
import { IFirebaseWindow } from './interfaces';

const _firebaseJs: IFirebaseWindow = {
    firebaseJs: null,
    async initialize(
        dotNetFirebaseAuthReference: DotNet.DotNetObject
    ): Promise<FirebaseJs> {
        return Promise.resolve(
            new FirebaseJs(
                dotNetFirebaseAuthReference,
                await ConfigurationHelper.EnsureApp(
                    await ConfigurationHelper.EnsureConfiguration()
                )
            )
        );
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    window.firebaseJs = window.firebaseJs || _firebaseJs;
});

export default { firebaseJs: _firebaseJs.firebaseJs };
