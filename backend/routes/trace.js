/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.

This project is not affiliated with TRAYCER, TRACYER, or any external framework.
*/
import express from "express";
import crypto from "crypto";

const router = express.Router();
let mockDB = [];

router.post("/create", (req, res) => {
  const { transaction_id } = req.body;
  
  // Validar existencia y tipo
  if (transaction_id === undefined || transaction_id === null || typeof transaction_id !== 'string') {
    return res.status(400).json({
      error: "transaction_id is required and must be a string",
      code: "INVALID_INPUT"
    });
  }
  
  // Validar longitud
  if (transaction_id.length === 0 || transaction_id.length > 100) {
    return res.status(400).json({
      error: "transaction_id must be between 1 and 100 characters",
      code: "INVALID_LENGTH",
      received: transaction_id.length
    });
  }
  
  // Validar formato
  if (!/^[a-zA-Z0-9_-]+$/.test(transaction_id)) {
    return res.status(400).json({
      error: "transaction_id contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed",
      code: "INVALID_FORMAT"
    });
  }
  
  // Sanitización
  const sanitizedTransactionId = transaction_id.trim();
  
  // Lógica existente
  const hash = crypto.createHash("sha256").update(sanitizedTransactionId + Date.now()).digest("hex");
  const record = { transaction_id: sanitizedTransactionId, hash, status: "verified", timestamp: new Date() };
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
