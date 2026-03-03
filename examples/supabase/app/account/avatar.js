'use client';
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
exports.default = Avatar;
var react_1 = require("react");
var auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
var image_1 = require("next/image");
function Avatar(_a) {
    var _this = this;
    var uid = _a.uid, url = _a.url, size = _a.size, onUpload = _a.onUpload;
    var supabase = (0, auth_helpers_nextjs_1.createClientComponentClient)();
    var _b = (0, react_1.useState)(url), avatarUrl = _b[0], setAvatarUrl = _b[1];
    var _c = (0, react_1.useState)(false), uploading = _c[0], setUploading = _c[1];
    (0, react_1.useEffect)(function () {
        function downloadImage(path) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error, url_1, error_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, supabase.storage.from('avatars').download(path)];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error) {
                                throw error;
                            }
                            url_1 = URL.createObjectURL(data);
                            setAvatarUrl(url_1);
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _b.sent();
                            console.log('Error downloading image: ', error_1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        if (url)
            downloadImage(url);
    }, [url, supabase]);
    var uploadAvatar = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var file, fileExt, filePath, uploadError, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setUploading(true);
                    if (!event.target.files || event.target.files.length === 0) {
                        throw new Error('You must select an image to upload.');
                    }
                    file = event.target.files[0];
                    fileExt = file.name.split('.').pop();
                    filePath = "".concat(uid, "-").concat(Math.random(), ".").concat(fileExt);
                    return [4 /*yield*/, supabase.storage.from('avatars').upload(filePath, file)];
                case 1:
                    uploadError = (_a.sent()).error;
                    if (uploadError) {
                        throw uploadError;
                    }
                    onUpload(filePath);
                    return [3 /*break*/, 4];
                case 2:
                    error_2 = _a.sent();
                    alert('Error uploading avatar!');
                    return [3 /*break*/, 4];
                case 3:
                    setUploading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div>
      {avatarUrl ? (<image_1.default width={size} height={size} src={avatarUrl} alt="Avatar" className="avatar image" style={{ height: size, width: size }}/>) : (<div className="avatar no-image" style={{ height: size, width: size }}/>)}
      <div style={{ width: size }}>
        <label className="button primary block" htmlFor="single">
          {uploading ? 'Uploading ...' : 'Upload'}
        </label>
        <input style={{
            visibility: 'hidden',
            position: 'absolute',
        }} type="file" id="single" accept="image/*" onChange={uploadAvatar} disabled={uploading}/>
      </div>
    </div>);
}
