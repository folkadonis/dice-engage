"use client";
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
exports.default = DittofeedProvider;
var sdk_web_1 = require("@dittofeed/sdk-web");
var react_1 = require("react");
var supabase_provider_1 = require("./supabase-provider");
// Initialize the sdk with a writeKey on startup, which is used to identify your
// workspace. This key can be found at
// https://dittofeed.com/dashboard/settings
if (process.env.NEXT_PUBLIC_DITTOFEED_WRITE_KEY) {
    sdk_web_1.DittofeedSdk.init({
        writeKey: process.env.NEXT_PUBLIC_DITTOFEED_WRITE_KEY,
        host: process.env.NEXT_PUBLIC_DITTOFEED_HOST,
    });
}
function DittofeedProvider(_a) {
    var children = _a.children;
    var supabase = (0, supabase_provider_1.useSupabase)();
    (0, react_1.useEffect)(function () {
        var subscription = supabase.auth.onAuthStateChange(function (event, session) {
            var _a;
            if (session && event === "SIGNED_IN") {
                // Emit an identify event to Dittofeed when a user signs in
                var user = session.user;
                var firstAuthenticatedAt = (_a = user.amr[user.amr.length - 1]) === null || _a === void 0 ? void 0 : _a.timestamp;
                var traits = __assign(__assign({}, user), { firstAuthenticatedAt: firstAuthenticatedAt });
                sdk_web_1.DittofeedSdk.identify({
                    userId: user.id,
                    traits: traits,
                });
            }
        }).data.subscription;
        return function () {
            subscription.unsubscribe();
        };
    }, [supabase]);
    return <>{children}</>;
}
