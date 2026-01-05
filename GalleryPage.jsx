import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// ✅ поменяй путь/имя под твой проект:
import { useLang } from "../LanguageContext.jsx";

function GalleryPage({ user, onLogout }) {
  const { t } = useLang();

  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);

  // управление
  const [manageOpen, setManageOpen] = useState(false);
  const [attachMode, setAttachMode] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");

  const manageRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/gallery/${user.id}`)
      .then((r) => r.json())
      .then((data) => setImages(Array.isArray(data.images) ? data.images : []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetch(`http://localhost:5000/api/albums/${user.id}`)
      .then((r) => r.json())
      .then((data) => setAlbums(Array.isArray(data.albums) ? data.albums : []))
      .catch(() => setAlbums([]));
  }, [user?.id]);

  useEffect(() => {
    const highlightId = location.state?.highlightId;
    if (highlightId) setSelectedId(highlightId);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!manageRef.current) return;
      if (manageRef.current.contains(e.target)) return;

      setManageOpen(false);
      setAttachMode(false);
      setSelectedAlbumId("");
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const gridItems = useMemo(() => {
    const s = q.trim().toLowerCase();

    const albumsFiltered = albums.filter((a) =>
      !s ? true : (a.title || "").toLowerCase().includes(s)
    );

    const imagesNoAlbum = images.filter((img) => !img.album_id);
    const imagesFiltered = imagesNoAlbum.filter((img) =>
      !s ? true : (img.title || "").toLowerCase().includes(s)
    );

    return [
      ...albumsFiltered.map((a) => ({ type: "album", ...a })),
      ...imagesFiltered.map((img) => ({ type: "image", ...img })),
    ];
  }, [albums, images, q]);

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/");
  };

  const createAlbum = async () => {
    const title = prompt(t("gallery.promptAlbumName"));
    if (!title?.trim()) return;

    const res = await fetch("http://localhost:5000/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, title: title.trim() }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || t("gallery.createAlbumError"));
      return;
    }

    setAlbums((prev) => [data.album, ...prev]);
    setManageOpen(true);
    setAttachMode(false);
    setSelectedAlbumId("");
  };

  const startAttachToAlbum = () => {
    if (!selectedId) {
      alert(t("gallery.pickPhotoFirst"));
      return;
    }
    setAttachMode(true);
    setSelectedAlbumId("");
  };

  const attachSelectedToAlbum = async () => {
    if (!selectedId) {
      alert(t("gallery.pickPhotoFirst"));
      return;
    }
    if (!selectedAlbumId) {
      alert(t("gallery.pickAlbum"));
      return;
    }

    const res = await fetch(
      `http://localhost:5000/api/image/${selectedId}/set-album`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, album_id: selectedAlbumId }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || t("gallery.attachError"));
      return;
    }

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedId ? { ...img, album_id: selectedAlbumId } : img
      )
    );

    alert(t("gallery.attachedOk"));

    setSelectedId(null);
    setAttachMode(false);
    setSelectedAlbumId("");
    setManageOpen(false);
  };

  return (
    <div>
      {/* header */}
      <div className="top-left">
        <Link to="/user">
          <button className="button active">{t("common.upload")}</button>
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

      <div className="page-center">
        <div className="gallery-main">
          <p className="gallery-title">{t("common.gallery")}</p>

          <div className="gallery-controls">
            <input
              className="gallery-search"
              placeholder={t("common.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {/* Управление */}
            <div ref={manageRef} style={{ position: "relative" }}>
              <button
                className="share-button"
                type="button"
                onClick={() => {
                  setManageOpen((v) => !v);
                  if (!manageOpen) {
                    setAttachMode(false);
                    setSelectedAlbumId("");
                  }
                }}
              >
                {t("common.manage")}
              </button>

              {manageOpen && (
                <div className="manage-menu">
                  <button type="button" className="manage-item" onClick={createAlbum}>
                    {t("gallery.createAlbum")}
                  </button>

                  <button type="button" className="manage-item" onClick={startAttachToAlbum}>
                    {t("gallery.addToAlbum")}
                  </button>

                  {attachMode && (
                    <div className="manage-sub">
                      <select
                        className="manage-select"
                        value={selectedAlbumId}
                        onChange={(e) => setSelectedAlbumId(e.target.value)}
                      >
                        <option value="">{t("gallery.pickAlbumPlaceholder")}</option>
                        {albums.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="manage-item"
                        onClick={attachSelectedToAlbum}
                        disabled={!selectedAlbumId}
                      >
                        {t("common.add")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="gallery-items">
            {loading ? (
              <p>{t("common.loading")}</p>
            ) : gridItems.length === 0 ? (
              <p>{t("gallery.empty")}</p>
            ) : (
              gridItems.map((item) =>
                item.type === "album" ? (
                  <button
                    key={`album-${item.id}`}
                    type="button"
                    className="photo-card album-card"
                    title={item.title}
                    onDoubleClick={() => navigate(`/album/${item.id}`)}
                  >
                    <div className="album-inner">
                      <img className="album-icon" src="/folder.png" alt="album" />
                      <div className="album-title">{item.title}</div>
                    </div>
                  </button>
                ) : (
                  <button
                    key={`img-${item.id}`}
                    type="button"
                    className={`photo-card ${item.id === selectedId ? "photo-card--selected" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                    onDoubleClick={() => navigate(`/image/${item.id}`)}
                    title={item.title || t("common.untitled")}
                  >
                    <img
                      className="photo-thumb"
                      src={item.url}
                      alt={item.title || t("common.photo")}
                      loading="lazy"
                    />
                  </button>
                )
              )
            )}
          </div>

          <p style={{ opacity: 0.7, marginTop: 10 }}>
            {t("gallery.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GalleryPage;
