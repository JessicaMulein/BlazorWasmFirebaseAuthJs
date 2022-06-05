const path = require('path');
const webpack = require('webpack');

module.exports = (env, args) => ({
    resolve: {
        extensions: ['.ts', '.js']
    },
    devtool: args.mode === 'development' ? 'inline-source-map' : 'none',
    // The entry point file described above
    entry: path.resolve(__dirname, './src/firebaseJs.ts'),
    // The location of the build folder described above
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'firebaseJs-bundle.js',
        library: "$",
        libraryTarget: "umd",
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: "babel-loader",
            },
        ],
    },
    mode: "development",
    // Optional and for development only. This provides the ability to
    // map the built code back to the original source format when debugging.
    devtool: 'eval-source-map',
});
