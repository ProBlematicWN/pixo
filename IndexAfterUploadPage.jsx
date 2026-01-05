import { Link, useLocation } from "react-router-dom";
import { useLang } from "../LanguageContext.jsx"; // поправь путь при необходимости

function IndexAfterUploadPage() {
  const { t } = useLang();
  const location = useLocation();

  const imageUrl = location.state?.imageUrl;
  const title = location.state?.title || t("afterUpload.noTitle");

  return (
    <div>
      {/* top-left */}
      <div className="top-left">
        <Link to="/">
          <button className="button active">
            {t("common.upload")}
          </button>
        </Link>
      </div>

      {/* top-right */}
      <div className="top-right">
        <Link to="/sign-in">
          <button className="button active desk-bth">
            {t("common.signIn")}
          </button>
        </Link>

        <Link to="/sign-up">
          <button className="button active desk-bth">
            {t("common.signUp")}
          </button>
        </Link>

        <button className="button active burger">☰</button>
      </div>

      {/* main */}
      <div className="image-main">
        <div className="image-block">
          <p className="image-title">{title}</p>

          <div className="image-buttons">
            <button
              className="share-button"
              onClick={async () => {
                if (!imageUrl) return;
                await navigator.clipboard.writeText(imageUrl);
                alert(t("afterUpload.linkCopied"));
              }}
            >
              {t("common.share")}
            </button>

            <button
              className="share-button"
              onClick={() => alert(t("afterUpload.manageLater"))}
            >
              {t("common.manage")}
            </button>
          </div>

          <div className="image-placeholder">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="uploaded-image"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndexAfterUploadPage;
