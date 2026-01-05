import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
// ✅ поменяй путь/имя под твой проект:
import { useLang } from "../LanguageContext.jsx";

function AlbumPage({ user, onLogout }) {
  const { id } = useParams(); // album_id
  const navigate = useNavigate();
  const { t } = useLang();

  const [album, setAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/album/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAlbum(data.album || null);
        setImages(Array.isArray(data.images) ? data.images : []);
      })
      .catch(() => {
        setAlbum(null);
        setImages([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return images;
    return images.filter((x) => (x.title || "").toLowerCase().includes(s));
  }, [images, q]);

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/");
  };

  return (
    <div>
      {/* top-left */}
      <div className="top-left">
        <Link to="/user">
          <button className="button active">{t("common.upload")}</button>
        </Link>
        <Link to="/gallery">
          <button className="button active">{t("common.gallery")}</button>
        </Link>
      </div>

      {/* top-right */}
      <div className="top-right">
        <Link to="/settings">
          <button className="button active desk-bth">{t("common.profile")}</button>
        </Link>

        <button className="button active desk-bth" onClick={handleLogoutClick}>
          {t("common.logout")}
        </button>

        <button className="button active burger">☰</button>
      </div>

      {/* main */}
      <div className="page-center">
        <div className="gallery-main">
          <p className="gallery-title">
            {album?.title || t("album.untitled")}
          </p>

          <div className="gallery-controls">
            <input
              type="text"
              className="gallery-search"
              placeholder={t("common.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <button
              className="share-button"
              type="button"
              onClick={() => alert(t("common.later"))}
            >
              {t("common.manage")}
            </button>

            <button
              className="share-button"
              type="button"
              onClick={() => alert(t("common.later"))}
            >
              {t("common.share")}
            </button>
          </div>

          <div className="gallery-items">
            {loading ? (
              <p>{t("common.loading")}</p>
            ) : filtered.length === 0 ? (
              <p>{t("album.empty")}</p>
            ) : (
              filtered.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className="photo-card"
                  onDoubleClick={() => navigate(`/image/${img.id}`)}
                  title={img.title || t("common.untitled")}
                >
                  <img
                    className="photo-thumb"
                    src={img.url}
                    alt={img.title || t("common.photo")}
                    loading="lazy"
                  />
                </button>
              ))
            )}
          </div>

          <p style={{ opacity: 0.7, marginTop: 10 }}>
            {t("album.hintOpen")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AlbumPage;
