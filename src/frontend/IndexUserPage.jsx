import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLang } from "../LanguageContext.jsx";

function IndexUserPage({ user, onLogout }) {
  const { t } = useLang();

  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openFilePicker = () => {
    if (loading) return;
    inputRef.current?.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!user?.id) {
      alert(t("common.noUserId"));
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      fd.append("user_id", user.id);

      const res = await fetch("http://localhost:5000/api/upload-user", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || t("common.uploadError"));
        return;
      }

      const imageId = data?.image?.id;
      navigate("/gallery", { state: { highlightId: imageId } });
    } catch {
      alert(t("common.connectError"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/");
  };

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="top-left">
        <button
          className="button active"
          onClick={openFilePicker}
          disabled={loading}
        >
          {loading ? t("guest.uploading") : t("common.upload")}
        </button>

        <Link to="/gallery">
          <button className="button active">{t("common.gallery")}</button>
        </Link>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onFileSelected}
        />
      </div>

      <div className="top-right">
        <Link to="/settings">
          <button className="button active desk-bth">
            {t("common.profile")}
          </button>
        </Link>

        <button
          className="button active desk-bth"
          onClick={handleLogoutClick}
        >
          {t("common.logout")}
        </button>

        <button className="button active burger">☰</button>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="page-center">
        <div className="center">
          <h1>Pixo</h1>

          <button
            className="button active central-button"
            onClick={openFilePicker}
            disabled={loading}
          >
            {loading ? t("guest.uploading") : t("common.upload")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IndexUserPage;
