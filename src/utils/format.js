export const difficultyLabels = {
  BEGINNER: "Nivel Básico",
  INTERMEDIATE: "Nivel Intermedio",
  ADVANCED: "Nivel Avanzado",
};

export const formatDifficulty = (level) => difficultyLabels[level] ?? level;

// Variante corta para las cards del feed ("Principiante" en vez de "Nivel Básico").
export const difficultyShortLabels = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Medio",
  ADVANCED: "Avanzado",
};

export const formatDifficultyShort = (level) => difficultyShortLabels[level] ?? level;

export const firstName = (fullName) => fullName?.trim().split(/\s+/)[0] ?? "";

export const formatDuration = (seconds) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins} min` : `${secs} seg`;
};
