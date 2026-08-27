export const difficultyLabels = {
  BEGINNER: "Nivel Básico",
  INTERMEDIATE: "Nivel Intermedio",
  ADVANCED: "Nivel Avanzado",
};

export const formatDifficulty = (level) => difficultyLabels[level] ?? level;

export const firstName = (fullName) => fullName?.trim().split(/\s+/)[0] ?? "";

export const formatDuration = (seconds) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins} min` : `${secs} seg`;
};
