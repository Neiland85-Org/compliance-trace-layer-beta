import { useState } from "react";

export function useCommandConsole() {
  const [logs, setLogs] = useState([]);

  const appendLog = (entry) => {
    setLogs((prev) => [
      { id: Date.now(), timestamp: new Date().toLocaleTimeString(), ...entry },
      ...prev,
    ]);
  };

  const generateTransaction = () => {
    const hash = Math.random().toString(36).substring(2, 15);
    appendLog({
      type: "transaction",
      message: `Transaction created`,
      details: { transaction_id: `TX-${Math.floor(Math.random() * 99999)}`, hash },
    });
  };

  const verifyBlock = () => {
    appendLog({
      type: "verify",
      message: "Block verification completed",
      details: { status: "verified", block: `BLK-${Math.floor(Math.random() * 5000)}` },
    });
  };

  const generateReport = () => {
    appendLog({
      type: "report",
      message: "Carbon report generated",
      details: { offset: `${Math.floor(Math.random() * 50)} tons CO₂` },
    });
  };

  const deployProtocol = () => {
    appendLog({
      type: "deploy",
      message: "Protocol successfully deployed to network",
      details: { version: "v1.0.8-beta", node: "Gaia-Net" },
    });
  };

  return {
    logs,
    generateTransaction,
    verifyBlock,
    generateReport,
    deployProtocol,
  };
}
