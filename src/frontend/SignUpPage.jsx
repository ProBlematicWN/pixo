import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext.jsx";

function SignUpPage() {
  const { t } = useLang();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("auth.enterEmailPassword"));
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || t("auth.signUpError"));
        return;
      }

      alert(t("auth.signUpSuccess"));
      navigate("/sign-in");
    } catch {
      setError(t("common.connectError"));
    }
  };

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="top-left">
        <Link to="/">
          <button className="button active">{t("common.upload")}</button>
        </Link>
      </div>

      <div className="top-right">
        <Link to="/sign-in">
          <button className="button active">{t("common.signIn")}</button>
        </Link>
        <button className="button disabled">{t("common.signUp")}</button>
      </div>

      {/* ===== CONTENT (центр) ===== */}
      <div className="page-center">
        <div className="sign-up-area">
          <h2>{t("auth.signUpTitle")}</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">{t("auth.email")}</label>
            <input
              type="email"
              id="email"
              placeholder={t("auth.emailPh")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">{t("auth.password")}</label>
            <input
              type="password"
              id="password"
              placeholder={t("auth.passwordCreatePh")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="button-active">
              {t("auth.signUpBtn")}
            </button>

            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
