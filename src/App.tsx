import { useMemo, useState } from "react";
import {
  getRMZAccessStatus,
  isValidEcashAddress,
  type RMZAccessStatus
} from "@xolosarmy/tonalli-core";
import { ChronikAdapter } from "./lib/chronikAdapter";
import "./App.css";

type CheckState = "idle" | "loading" | "success" | "error";

function App() {
  const adapter = useMemo(() => new ChronikAdapter(), []);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<RMZAccessStatus | null>(null);
  const [state, setState] = useState<CheckState>("idle");
  const [message, setMessage] = useState("");

  async function handleVerify() {
    const cleanAddress = address.trim();

    setStatus(null);
    setMessage("");

    if (!isValidEcashAddress(cleanAddress)) {
      setState("error");
      setMessage("Invalid or ambiguous eCash address. Please use a valid ecash: address.");
      return;
    }

    try {
      setState("loading");
      const result = await getRMZAccessStatus(cleanAddress, adapter);
      setStatus(result);
      setState("success");

      if (result === "holder") {
        setMessage("Welcome to the Guardianía. RMZ access key detected.");
      } else if (result === "non-holder") {
        setMessage("Access denied. This address does not currently hold RMZ.");
      } else {
        setMessage("Unable to verify this address.");
      }
    } catch {
      setState("error");
      setMessage("Verification failed. Please try again.");
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="eyebrow">xolosArmy Network</div>
        <h1 className="portalTitle">Guardianía RMZ Access Portal</h1>
        <p className="subtitle">
          Verify your RMZ access key on eCash Mainnet.
        </p>

        <div className="thesis">
          <span>XEC is the money.</span>
          <span>RMZ is the key.</span>
          <span>Culture is the network.</span>
        </div>
      </section>

      <section className="card">
        <label htmlFor="address">eCash address</label>
        <div className="inputRow">
          <input
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="ecash:q..."
            autoComplete="off"
          />
          <button onClick={handleVerify} disabled={state === "loading"}>
            {state === "loading" ? "Verifying..." : "Verify RMZ"}
          </button>
        </div>

        {message && (
          <div className={`result ${status === "holder" ? "holder" : state === "error" ? "error" : "denied"}`}>
            <div className="resultLabel">
              {status === "holder"
                ? "HOLDER"
                : status === "non-holder"
                  ? "NON-HOLDER"
                  : state === "error"
                    ? "ERROR"
                    : "UNKNOWN"}
            </div>
            <p>{message}</p>
          </div>
        )}

        <p className="note">
          Guardianía uses <strong>tonalli-core v0.1.0</strong> for CashAddr checksum validation and RMZ access-key verification.
        </p>
      </section>
    </main>
  );
}

export default App;
