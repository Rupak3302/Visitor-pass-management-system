export const getVisitorPhotoUrl = (photoUrl) => {
  if (!photoUrl) return '';

  const normalized = photoUrl.trim();

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  if (normalized.startsWith('/uploads/')) {
    return `http://localhost:5000${normalized}`;
  }

  return `http://localhost:5000/uploads/${normalized}`;
};
