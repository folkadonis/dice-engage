"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var vite_dev_rpc_1 = require("vite-dev-rpc");
var rpc_1 = require("./scripts/rpc");
function RpcPlugin() {
    return {
        name: "rpc",
        configureServer: function (server) {
            (0, vite_dev_rpc_1.createRPCServer)("rpc", server.ws, rpc_1.serverFunctions);
        },
    };
}
var baseBuildConfig = {
    outDir: "dist",
};
var config;
if (process.env.NODE_ENV === "production") {
    config = {
        build: __assign(__assign({}, baseBuildConfig), { rollupOptions: {
                input: "./src/prod.js",
                output: {
                    entryFileNames: "[name].js",
                    assetFileNames: "[name].css",
                },
            }, emptyOutDir: true, cssCodeSplit: false, sourcemap: false, cssMinify: true }),
    };
}
else {
    config = {
        plugins: [RpcPlugin()],
        optimizeDeps: {
            force: true,
        },
        build: __assign(__assign({}, baseBuildConfig), { lib: {
                entry: "snippetEntry.js", // Entry file for your library
                name: "_df", // Global variable when module is included via a script tag
                fileName: function (format) { return "dittofeed.".concat(format, ".js"); },
            } }),
    };
}
exports.default = (0, vite_1.defineConfig)(config);
