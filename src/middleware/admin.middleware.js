
import crypto from "crypto";

const requireAdmin = (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers["x-admin-key"];

  if (!adminKey || !providedKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access.",
    });
  }

  const expected = Buffer.from(adminKey);
  const received = Buffer.from(providedKey);

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid admin key.",
    });
  }

  next();
};

export default requireAdmin;
