"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AccountForm;
var react_1 = require("react");
var avatar_1 = require("./avatar");
var auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
var sdk_web_1 = require("@dittofeed/sdk-web");
function AccountForm(_a) {
    var _this = this;
    var session = _a.session;
    var supabase = (0, auth_helpers_nextjs_1.createClientComponentClient)();
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), fullname = _c[0], setFullname = _c[1];
    var _d = (0, react_1.useState)(null), username = _d[0], setUsername = _d[1];
    var _e = (0, react_1.useState)(null), website = _e[0], setWebsite = _e[1];
    var _f = (0, react_1.useState)(null), avatar_url = _f[0], setAvatarUrl = _f[1];
    var user = session === null || session === void 0 ? void 0 : session.user;
    var getProfile = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error, status_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, supabase
                            .from("profiles")
                            .select("full_name, username, website, avatar_url")
                            .eq("id", user === null || user === void 0 ? void 0 : user.id)
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error, status_1 = _a.status;
                    if (error && status_1 !== 406) {
                        throw error;
                    }
                    if (data) {
                        setFullname(data.full_name);
                        setUsername(data.username);
                        setWebsite(data.website);
                        setAvatarUrl(data.avatar_url);
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _b.sent();
                    alert("Error loading user data!");
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [user, supabase]);
    (0, react_1.useEffect)(function () {
        getProfile();
    }, [user, getProfile]);
    function updateProfile(_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var userId, updatedUser, error, error_2;
            var username = _b.username, website = _b.website, avatar_url = _b.avatar_url;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, 3, 4]);
                        setLoading(true);
                        userId = user === null || user === void 0 ? void 0 : user.id;
                        updatedUser = {
                            id: userId,
                            full_name: fullname,
                            username: username,
                            website: website,
                            avatar_url: avatar_url,
                            updated_at: new Date().toISOString(),
                        };
                        // Emit an identify event to Dittofeed when a user updates their profile
                        sdk_web_1.DittofeedSdk.identify({
                            userId: userId,
                            traits: updatedUser,
                        });
                        return [4 /*yield*/, supabase.from("profiles").upsert(updatedUser)];
                    case 1:
                        error = (_c.sent()).error;
                        if (error)
                            throw error;
                        alert("Profile updated!");
                        return [3 /*break*/, 4];
                    case 2:
                        error_2 = _c.sent();
                        alert("Error updating the data!");
                        return [3 /*break*/, 4];
                    case 3:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="form-widget">
      <avatar_1.default uid={user.id} url={avatar_url} size={150} onUpload={function (url) {
            setAvatarUrl(url);
            updateProfile({ fullname: fullname, username: username, website: website, avatar_url: url });
        }}/>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={session === null || session === void 0 ? void 0 : session.user.email} disabled/>
      </div>
      <div>
        <label htmlFor="fullName">Full Name</label>
        <input id="fullName" type="text" value={fullname || ""} onChange={function (e) { return setFullname(e.target.value); }}/>
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" value={username || ""} onChange={function (e) { return setUsername(e.target.value); }}/>
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input id="website" type="url" value={website || ""} onChange={function (e) { return setWebsite(e.target.value); }}/>
      </div>

      <div>
        <button className="button primary block" onClick={function () {
            return updateProfile({ fullname: fullname, username: username, website: website, avatar_url: avatar_url });
        }} disabled={loading}>
          {loading ? "Loading ..." : "Update"}
        </button>
      </div>

      <div>
        <form action="/auth/signout" method="post">
          <button className="button block" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>);
}
