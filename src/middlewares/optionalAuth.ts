// middlewares/optionalAuth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface OptionalAuthRequest extends Request {
	isLoggedIn?: boolean;
	user?: { id: string; type: "admin" | "guest" };
}

export const optionalAuth = () => {
	return (req: OptionalAuthRequest, _res: Response, next: NextFunction) => {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];
		req.isLoggedIn = false;

		if (token) {
			try {
				let decoded: any;
				try {
					decoded = jwt.verify(token, process.env.ADMIN_SECRET as string);
					req.user = { id: decoded.id, type: "admin" };
				} catch {
					decoded = jwt.verify(token, process.env.GUEST_SECRET as string);
					req.user = { id: decoded.id, type: "guest" };
				}
				req.isLoggedIn = true;
			} catch {
				req.isLoggedIn = false;
			}
		}
		next();
	};
};
