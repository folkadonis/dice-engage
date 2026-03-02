"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSession = exports.useSupabase = void 0;
exports.default = SupabaseProvider;
var auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
var navigation_1 = require("next/navigation");
var react_1 = require("react");
var Context = (0, react_1.createContext)(undefined);
function SupabaseProvider(_a) {
    var children = _a.children, session = _a.session;
    var supabase = (0, auth_helpers_nextjs_1.createClientComponentClient)();
    var router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(function () {
        var subscription = supabase.auth.onAuthStateChange(function (_, _session) {
            if ((_session === null || _session === void 0 ? void 0 : _session.access_token) !== (session === null || session === void 0 ? void 0 : session.access_token)) {
                router.refresh();
            }
        }).data.subscription;
        return function () {
            subscription.unsubscribe();
        };
    }, [router, supabase, session]);
    return (<Context.Provider value={{ supabase: supabase, session: session }}>
      <>{children}</>
    </Context.Provider>);
}
var useSupabase = function () {
    var context = (0, react_1.useContext)(Context);
    if (context === undefined) {
        throw new Error("useSupabase must be used inside SupabaseProvider");
    }
    return context.supabase;
};
exports.useSupabase = useSupabase;
var useSession = function () {
    var context = (0, react_1.useContext)(Context);
    if (context === undefined) {
        throw new Error("useSession must be used inside SupabaseProvider");
    }
    return context.session;
};
exports.useSession = useSession;
