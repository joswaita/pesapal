// middleware.js

import { authenticatePesapal } from "./utils.js";

export const pesapalAuthTokenMiddleware = async (req, res, next) => {
  try {
    const token = await authenticatePesapal();
    req.pesapalToken = token; // Attach the token to the request object
    next();
  } catch (error) {
    throw new Error("Failed to authenticate with Pesapal");
  }
};
