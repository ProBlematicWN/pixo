import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext.jsx";

function SettingsPage({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();

  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState("");

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/user/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const u = data.user;
        if (!u) return;

        setEmail(u.email || "");
        setUsername(u.username || "");

        if (u.lang === "ru" || u.lang === "en") setLang(u.lang);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/");
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:5000/api/user/${user.id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, lang }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Save error");
      return;
    }

    onUserUpdate?.(data.user);
    alert(lang === "ru" ? "Сохранено!" : "Saved!");
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (newPass !== confirmPass) {
      alert(lang === "ru" ? "Пароли не совпадают" : "Passwords do not match");
      return;
    }

    const res = await fetch(
      `http://localhost:5000/api/user/${user.id}/change-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Password change error");
      return;
    }

    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    alert(lang === "ru" ? "Пароль изменён!" : "Password changed!");
  };

  return (
    <div>
      {/* Левые кнопки */}
      <div className="top-left">
        <Link to="/user">
          <button className="button active">{t("common.upload")}</button>
        </Link>
        <Link to="/gallery">
          <button className="button active">{t("common.gallery")}</button>
        </Link>
      </div>

      {/* Правые кнопки */}
      <div className="top-right">
        <button className="button disabled">{t("common.profile")}</button>
        <button className="button active desk-bth" onClick={handleLogoutClick}>
          {t("common.logout")}
        </button>
        <button className="button active burger">☰</button>
      </div>

      <div className="page-center">
        <div className="settings-container">
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : (
            <>
              {/* Блок №1 — Основные настройки */}
              <div className="settings-area">
                <h2>{t("settings.title")}</h2>

                <form onSubmit={saveProfile}>
                  <label htmlFor="email">{t("settings.email")}</label>
                  <input
                    type="email"
                    id="email"
                    placeholder={t("settings.emailPh")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <label htmlFor="lang">{t("settings.language")}</label>
                  <select
                    id="lang"
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>

                  <button type="submit" className="button-active">
                    {t("common.save")}
                  </button>
                </form>
              </div>

              {/* Блок №2 — Изменение пароля */}
              <div className="settings-area">
                <h2>{t("settings.passwordTitle")}</h2>

                <form onSubmit={changePassword}>
                  <label htmlFor="old-pass">{t("settings.oldPassword")}</label>
                  <input
                    type="password"
                    id="old-pass"
                    placeholder={t("settings.oldPasswordPh")}
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                  />

                  <label htmlFor="new-pass">{t("settings.newPassword")}</label>
                  <input
                    type="password"
                    id="new-pass"
                    placeholder={t("settings.newPasswordPh")}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />

                  <label htmlFor="confirm-pass">{t("settings.confirmPassword")}</label>
                  <input
                    type="password"
                    id="confirm-pass"
                    placeholder={t("settings.confirmPasswordPh")}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />

                  <button type="submit" className="button-active">
                    {t("common.change")}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
