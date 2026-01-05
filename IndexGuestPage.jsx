import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext.jsx"; // поправь путь, если файл лежит иначе

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function IndexGuestPage() {
  const { lang, setLang, t } = useLang();

  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const openFilePicker = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("common.onlyImages"));
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      alert(t("common.fileTooLarge"));
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);

      const res = await fetch("http://localhost:5000/api/upload-guest", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || t("common.uploadError"));
        return;
      }

      navigate("/after-upload", {
        state: {
          imageUrl: data.url,
          key: data.key,
          title: data.title,
        },
      });
    } catch {
      alert(t("common.connectError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Верх */}
      <div className="top-left">
        <button className="button active" onClick={openFilePicker}>
          {uploading ? t("guest.uploading") : t("guest.uploadPhoto")}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onFileSelected}
        />
      </div>

      <div className="top-right">
        {/* 🔤 Переключатель языка */}
        <select
          className="button active desk-bth"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label={t("guest.language")}
        >
          <option value="ru">РУ</option>
          <option value="en">EN</option>
        </select>

        <Link to="/sign-in">
          <button className="button active desk-bth">{t("common.signIn")}</button>
        </Link>

        <Link to="/sign-up">
          <button className="button active desk-bth">{t("common.signUp")}</button>
        </Link>

        <button className="button active burger">☰</button>
      </div>

      {/* Центр страницы */}
      <div className="page-center">
        <div className="center">
          <h1>Pixo</h1>

          <button className="button active central-button" onClick={openFilePicker}>
            {uploading ? t("guest.uploading") : t("guest.uploadPhoto")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IndexGuestPage;
