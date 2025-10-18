import express from "express";
import crypto from "crypto";

const router = express.Router();
let mockDB = [];

router.post("/create", (req, res) => {
  const { transaction_id } = req.body;
  const hash = crypto.createHash("sha256").update(transaction_id + Date.now()).digest("hex");
  const record = { transaction_id, hash, status: "verified", timestamp: new Date() };
  mockDB.push(record);
  res.json(record);
});

router.get("/verify/:hash", (req, res) => {
  const result = mockDB.find(r => r.hash === req.params.hash);
  if (result) return res.json({ verified: true, record: result });
  res.status(404).json({ verified: false });
});

router.get("/check", (req, res) => {
  res.json({ kyc: "passed", aml: "clean" });
});

export default router;
