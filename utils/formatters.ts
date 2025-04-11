export const formatISODuration = (duration: string | undefined): string => {
  if (!duration) {
    return "";
  }

  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) {
    return duration; // Return original string if parsing fails
  }

  const hours = parseInt(matches[1] || "0");
  const minutes = parseInt(matches[2] || "0");
  const seconds = parseInt(matches[3] || "0");

  let formatted = "";
  if (hours > 0) {
    formatted += `${hours}:`;
  }
  // Always show minutes, padded if hours are present
  formatted += `${hours > 0 ? minutes.toString().padStart(2, "0") : minutes}:`;
  // Always show seconds, padded
  formatted += seconds.toString().padStart(2, "0");

  // Handle cases like PT5M (5:00) or PT30S (0:30) correctly
  if (hours === 0 && minutes === 0 && seconds > 0) {
    formatted = `0:${seconds.toString().padStart(2, "0")}`;
  } else if (hours === 0 && minutes > 0) {
    formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return formatted;
};
