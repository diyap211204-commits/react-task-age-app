import { useEffect, useState } from "react";
import "./App.css";

const pad = (n) => String(n).padStart(2, "0");

// 07 - 10 - 2026
const formatDMY = (d) =>
  `${pad(d.getDate())} - ${pad(d.getMonth() + 1)} - ${d.getFullYear()}`;

// date input ko "2026-10-07" format chahiye
const toInputValue = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "2026-10-07" -> Date (timezone ki gadbad se bachne ke liye khud todke)
const parseInput = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const dayName = (d) => d.toLocaleDateString("en-US", { weekday: "long" });

const longDate = (d) =>
  d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ---------- date arithmetic: aaj ki date minus janam ki date ---------- */
const diffYMD = (birth, today) => {
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  // din negative ho to ek mahina udhaar lo (pichhle mahine ke din jodo)
  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  // mahina negative ho to ek saal udhaar lo
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
};

// agla birthday kitne din baad hai
const daysToBirthday = (birth, today) => {
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) {
    next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  return Math.round((next - today) / 86400000);
};

const RING = 2 * Math.PI * 88;

/* 0 se number tak ginti karta hai */
function CountUp({ to }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 900;

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); // dheere dheere rukta hai
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  return <>{n}</>;
}

export default function App() {
  const [today, setToday] = useState(() => new Date()); // system date
  const [dob, setDob] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleDobChange = (e) => {
    setDob(e.target.value);
    setResult(null);
    setError("");
  };

  const handleFind = () => {
    const now = new Date();
    setToday(now);

    if (!dob) {
      setResult(null);
      setError("Pick your date of birth first.");
      return;
    }

    const birth = parseInput(dob);
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (birth > todayOnly || birth.getFullYear() < 1900) {
      setResult(null);
      setError(
        birth > todayOnly
          ? "Date of birth can't be in the future."
          : "Enter a year from 1900 onwards."
      );
      return;
    }

    setError("");
    setResult({
      ...diffYMD(birth, todayOnly),
      weekday: dayName(birth),
      dobText: longDate(birth),
      nextIn: daysToBirthday(birth, todayOnly),
    });
  };

  const handleClear = () => {
    setDob("");
    setResult(null);
    setError("");
  };

  const dobLabel = dob ? formatDMY(parseInput(dob)) : "DD - MM - YYYY";

  // ring kitna bhara dikhe (saal ka kitna hissa beet gaya)
  const progress = result
    ? Math.min((result.months + result.days / 31) / 12, 1)
    : 0;
  const offset = RING * (1 - progress);

  const birthdayText = result
    ? result.nextIn === 0
      ? "Happy birthday today!"
      : `Next birthday in ${result.nextIn} ${result.nextIn === 1 ? "day" : "days"}`
    : "";

  return (
    <main className="page">
      <div className="card">
        {/* ================= left: form ================= */}
        <aside className="form-pane">
          <span className="blob b1" aria-hidden="true" />
          <span className="blob b2" aria-hidden="true" />
          <span className="blob b3" aria-hidden="true" />

          <h1>Evaluate Current Age</h1>
          <p className="sub">Find out exactly how old you are, down to the day.</p>

          <div className="field">
            <label htmlFor="dob">Enter your Date of Birth</label>
            <input
              id="dob"
              type="date"
              value={dob}
              max={toInputValue(today)}
              onChange={handleDobChange}
            />
            <span className={dob ? "chip set" : "chip"}>{dobLabel}</span>
          </div>

          <div className="field">
            <span className="field-label">System Date</span>
            <div className="today">
              <strong>{formatDMY(today)}</strong>
              <small>{longDate(today)}</small>
            </div>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="actions">
            <button className="find" onClick={handleFind}>
              Find Present Age
            </button>
            {(dob || result) && (
              <button className="clear" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </aside>

        {/* ================= right: result ================= */}
        <section className="result-pane" aria-live="polite">
          {!result ? (
            <div className="empty">
              <svg className="ring" viewBox="0 0 200 200" aria-hidden="true">
                <circle className="track" cx="100" cy="100" r="88" />
                <circle className="dash" cx="100" cy="100" r="88" />
              </svg>
              <strong>Your age will appear here</strong>
              <span>Pick a date of birth, then press Find Present Age.</span>
            </div>
          ) : (
            <div
              className="out"
              key={`${result.years}-${result.months}-${result.days}`}
            >
              <p className="kicker">Current age</p>

              <div className="ring-wrap">
                <svg className="ring" viewBox="0 0 200 200" aria-hidden="true">
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0f9e92" />
                      <stop offset="100%" stopColor="#ff6b57" />
                    </linearGradient>
                  </defs>
                  <circle className="track" cx="100" cy="100" r="88" />
                  <circle
                    className="bar"
                    cx="100"
                    cy="100"
                    r="88"
                    style={{ "--full": RING, "--off": offset }}
                  />
                </svg>
                <div className="ring-text">
                  <strong>
                    <CountUp to={result.years} />
                  </strong>
                  <span>Years</span>
                </div>
              </div>

              <div className="tiles">
                <div className="tile t-months">
                  <strong>
                    <CountUp to={result.months} />
                  </strong>
                  <span>Months</span>
                </div>
                <div className="tile t-days">
                  <strong>
                    <CountUp to={result.days} />
                  </strong>
                  <span>Days</span>
                </div>
              </div>

              <div className="born">
                <div>
                  <span>Day of birth</span>
                  <small>{result.dobText}</small>
                </div>
                <strong>{result.weekday}</strong>
              </div>

              <p className="next">{birthdayText}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}