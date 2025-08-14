import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include 'user' property
declare global {
  namespace Express {
	interface Request {
	  user?: any;
	}
  }
}

export const guestAuth = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) return res.status(401).json({ message: "Token not provided" });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
		req.user = decoded;
		next();
	} catch (err) {
		res.status(401).json({ message: "Invalid token" });
	}
};
