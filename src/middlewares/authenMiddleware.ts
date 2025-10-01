import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { type CustomRequest, type UserPayload } from "../libs/types.js";

// interface CustomRequest extends Request {
//   user?: any; // Define the user property
//   token?: string; // Define the token property
// }

export const authenticateToken = (
  req: CustomRequest, // using a custom request
  res: Response,
  next: NextFunction
) => {
  
  // 1. check Request if "authorization" header exists
  //    and contains "Bearer ...JWT-Token..."
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required",
    });
  }

  // 2. extract the "...JWT-Token..." if available
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token is required",
    });
  }

  // 3. verify token using JWT_SECRET_KEY and
  //    get payload "user" = { username, studentId, role }
  const jwt_secret = process.env.JWT_SECRET || "this_is_my_secret";


  jwt.verify(token, jwt_secret, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
        error: err,
      });
    }

    // 4. Attach "user" payload and "token" to the custom request
    req.user = payload as UserPayload;
    req.token = token;

    // 5. Proceed to next middleware or route handler
    next();
  });

};