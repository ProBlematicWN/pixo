import { Link } from "react-router-dom";
import { useLang } from "../LanguageContext.jsx";

function RecoverPage() {
  const { t } = useLang();

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="top-left">
        <Link to="/">
          <button className="button active">{t("common.upload")}</button>
        </Link>
      </div>

      <div className="top-right">
        <button className="button disabled">{t("common.signIn")}</button>

        <Link to="/sign-up">
          <button className="button active">{t("common.signUp")}</button>
        </Link>
      </div>

      {/* ===== CONTENT (центр) ===== */}
      <div className="page-center">
        <div className="recover-area">
          <h2>{t("auth.recoverTitle")}</h2>

          <form onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="email">{t("auth.email")}</label>
            <input
              type="email"
              id="email"
              placeholder={t("auth.emailPh")}
            />

            <button type="submit" className="button-active">
              {t("auth.sendPassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RecoverPage;
