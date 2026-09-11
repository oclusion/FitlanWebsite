import { useEffect, useRef, useState } from "react";
import { IoShareSocialOutline, IoLogoWhatsapp, IoLogoFacebook, IoLogoTwitter, IoLinkOutline } from "react-icons/io5";

// Reemplaza navigator.share(): en desktop (Mac/Windows) el share sheet nativo
// del navegador solo lista lo que esté registrado como extensión del sistema
// (Mail, Notes, AirDrop, Reminders...) — nunca WhatsApp/Facebook/X, que es lo
// que se quiere compartir acá. Instagram no tiene un intent de compartir por
// URL (solo desde su propia app), así que no se incluye como opción directa
// — igual se puede compartir ahí copiando el link.
const ShareMenu = ({ url, text, wrapperClassName = "", triggerClassName = "share-menu-trigger", ariaLabel = "Compartir", children }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  const shareText = text ? `${text} ${url}` : url;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setOpen(false);
    alert("Link copiado");
  };

  return (
    <div className={`share-menu-wrapper ${wrapperClassName}`} ref={wrapperRef}>
      <button type="button" className={triggerClassName} onClick={() => setOpen((v) => !v)} aria-label={ariaLabel}>
        {children ?? <IoShareSocialOutline />}
      </button>
      {open ? (
        <div className="share-menu">
          <a
            className="share-menu-item"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <IoLogoWhatsapp /> WhatsApp
          </a>
          <a
            className="share-menu-item"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <IoLogoFacebook /> Facebook
          </a>
          <a
            className="share-menu-item"
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <IoLogoTwitter /> X
          </a>
          <button type="button" className="share-menu-item" onClick={handleCopy}>
            <IoLinkOutline /> Copiar link
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ShareMenu;
