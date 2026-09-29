import { useEffect, useState } from "react";

// País → Estado → Ciudad, homologado con los selects en cascada del panel
// admin (mismo paquete, country-state-city — ver README backend). El backend
// guarda nombres en texto plano (country/state/city), no códigos ISO, así
// que acá adentro se resuelve el isoCode buscándolo por nombre en el mismo
// dataset del que salió la opción — siempre consistente porque el valor
// viene de ahí mismo, nunca de texto libre.
//
// El dataset completo de country-state-city pesa ~9MB sin comprimir — importado
// arriba de todo terminaba en el bundle principal, afectando a cualquiera que
// visite el sitio sin tocar nunca un select de ubicación. Import dinámico: Vite
// lo separa en su propio chunk, que solo se descarga cuando este componente
// realmente se monta (Registro, o "Editar" en /cuenta).
//
// `value` = { country, state, city } (nombres, puede venir vacío/undefined).
// `onChange(next)` recibe el objeto completo ya actualizado — el caller solo
// tiene que guardarlo tal cual (setForm/setState).
const LocationSelect = ({ value, onChange, idPrefix = "location" }) => {
  const [lib, setLib] = useState(null);
  const { country = "", state = "", city = "" } = value ?? {};

  useEffect(() => {
    let cancelled = false;
    import("country-state-city").then((mod) => {
      if (!cancelled) setLib(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!lib) {
    return <select className="form-control" disabled aria-label="País"><option>Cargando países...</option></select>;
  }

  const { Country, State, City } = lib;
  const countries = Country.getAllCountries();
  const selectedCountry = countries.find((c) => c.name === country);
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [];
  const selectedState = states.find((s) => s.name === state);
  // dedupe por nombre — el dataset repite ciudades con el mismo nombre (otra
  // lat/long) dentro del mismo estado, y el <option> necesita valores únicos.
  const cities = selectedCountry && selectedState
    ? [...new Map(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map((ct) => [ct.name, ct])).values()]
    : [];

  const handleCountryChange = (event) => {
    const next = countries.find((c) => c.isoCode === event.target.value);
    onChange({ country: next?.name ?? "", state: "", city: "" });
  };

  const handleStateChange = (event) => {
    const next = states.find((s) => s.isoCode === event.target.value);
    onChange({ country, state: next?.name ?? "", city: "" });
  };

  const handleCityChange = (event) => {
    onChange({ country, state, city: event.target.value });
  };

  return (
    <>
      <select
        className="form-control"
        id={`${idPrefix}-country`}
        value={selectedCountry?.isoCode ?? ""}
        onChange={handleCountryChange}
        aria-label="País"
      >
        <option value="">País</option>
        {countries.map((c) => (
          <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
        ))}
      </select>

      {selectedCountry && states.length > 0 ? (
        <select
          className="form-control"
          id={`${idPrefix}-state`}
          value={selectedState?.isoCode ?? ""}
          onChange={handleStateChange}
          aria-label="Estado"
        >
          <option value="">Estado</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
      ) : null}

      {selectedState && cities.length > 0 ? (
        <select
          className="form-control"
          id={`${idPrefix}-city`}
          value={city}
          onChange={handleCityChange}
          aria-label="Ciudad"
        >
          <option value="">Ciudad</option>
          {cities.map((ct) => (
            <option key={ct.name} value={ct.name}>{ct.name}</option>
          ))}
        </select>
      ) : null}
    </>
  );
};

export default LocationSelect;
