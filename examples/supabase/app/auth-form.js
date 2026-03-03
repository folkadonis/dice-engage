"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthForm;
var auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
var auth_ui_react_1 = require("@supabase/auth-ui-react");
var auth_ui_shared_1 = require("@supabase/auth-ui-shared");
function AuthForm() {
    var supabase = (0, auth_helpers_nextjs_1.createClientComponentClient)();
    return (<auth_ui_react_1.Auth supabaseClient={supabase} view="magic_link" appearance={{ theme: auth_ui_shared_1.ThemeSupa }} theme="dark" showLinks={false} providers={[]} redirectTo="http://localhost:3001/auth/callback"/>);
}
