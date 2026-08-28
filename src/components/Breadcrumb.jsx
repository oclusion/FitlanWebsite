import { Link } from "react-router-dom";

// items: [{ label, to? }] — los que tienen `to` son links; el último (sin `to`)
// es la página actual.
// Contenedor <div> (no <nav>) a propósito: la maqueta tiene un selector `nav {}`
// global que posiciona cualquier <nav> como el menú mobile.
const Breadcrumb = ({ items }) => (
  <div className="breadcrumb-nav" role="navigation" aria-label="Ruta de navegación">
    {items.map((item, i) => (
      <span key={i} className="breadcrumb-crumb">
        {item.to ? (
          <Link to={item.to}>{item.label}</Link>
        ) : (
          <span aria-current="page">{item.label}</span>
        )}
        {i < items.length - 1 ? (
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
        ) : null}
      </span>
    ))}
  </div>
);

export default Breadcrumb;
