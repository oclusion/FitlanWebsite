// Puerto de ExercisesList.jsx (rn-starter). El backend guarda cada ejercicio
// de un step como texto libre con el formato "<repeticiones> - <detalle>"
// (ej. "4 veces - Postura del niño 20 segundos"). Si no trae el separador,
// se muestra todo como detalle.
const parseExercise = (text) => {
  const separatorIndex = text.indexOf(" - ");
  if (separatorIndex === -1) return { count: "", detail: text };
  return { count: text.slice(0, separatorIndex), detail: text.slice(separatorIndex + 3) };
};

const ExercisesList = ({ exercises }) => {
  if (!exercises?.length) return null;

  return (
    <div className="exercises-list">
      {exercises.map((exercise, index) => {
        const { count, detail } = parseExercise(exercise);
        return (
          <div key={index} className="exercises-list-row">
            <span className="exercises-list-count">{count}</span>
            <span className="exercises-list-detail">{detail}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ExercisesList;
