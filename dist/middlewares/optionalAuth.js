"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const optionalAuth = () => {
    return (req, _res, next) => {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        req.isLoggedIn = false;
        if (token) {
            try {
                let decoded;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
                    req.user = { id: decoded.id, type: "admin" };
                }
                catch (_a) {
                    decoded = jsonwebtoken_1.default.verify(token, process.env.GUEST_SECRET);
                    req.user = { id: decoded.id, type: "guest" };
                }
                req.isLoggedIn = true;
            }
            catch (_b) {
                req.isLoggedIn = false;
            }
        }
        next();
    };
};
exports.optionalAuth = optionalAuth;
