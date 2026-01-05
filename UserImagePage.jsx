import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
// ✅ поменяй путь/имя под твой проект:
import { useLang } from "../LanguageContext.jsx";

function UserImagePage({ onLogout }) {
  const { id } = useParams();
  const { t } = useLang();

  const [img, setImg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/image/${id}`)
      .then((r) => r.json())
      .then((data) => setImg(data.image || null))
      .catch(() => setImg(null));
  }, [id]);

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/");
  };

  return (
    <div>
      <div className="top-left">
        <Link to="/user">
          <button className="button active">{t("common.upload")}</button>
        </Link>
        <Link to="/gallery">
          <button className="button active">{t("common.gallery")}</button>
        </Link>
      </div>

      <div className="top-right">
        <Link to="/settings">
          <button className="button active desk-bth">{t("common.profile")}</button>
        </Link>

        <button className="button active desk-bth" onClick={handleLogoutClick}>
          {t("common.logout")}
        </button>

        <button className="button active burger">☰</button>
      </div>

      <div className="image-main">
        <div className="image-block">
          <p className="image-title">{img?.title || t("common.untitled")}</p>

          <div className="image-buttons">
            <button
              className="share-button"
              onClick={async () => {
                if (!img?.url) return;
                await navigator.clipboard.writeText(img.url);
                alert(t("image.linkCopied"));
              }}
            >
              {t("common.share")}
            </button>

            <button className="share-button" onClick={() => alert(t("common.later"))}>
              {t("common.manage")}
            </button>
          </div>

          <div className="image-placeholder">
            {img?.url ? (
              <img
                src={img.url}
                alt={img.title || t("common.photo")}
                className="uploaded-image"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserImagePage;
