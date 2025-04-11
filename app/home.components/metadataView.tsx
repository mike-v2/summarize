import { VideoMetadata } from "@/types";
import { formatISODuration } from "@/utils/formatters";

export default function MetadataView({
  metadata,
}: {
  metadata: VideoMetadata;
}) {
  const formattedDate = new Date(metadata.publishedAt).toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
  const formattedDuration = formatISODuration(metadata.duration);

  return (
    <div className="mb-6 bg-white p-4 max-w-2xl rounded-lg shadow-md flex-shrink-0">
      <p className="text-lg font-semibold mb-3">{metadata.title}</p>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1">
          <span>🗓️</span>
          <span>{formattedDate}</span>
        </span>

        {formattedDuration && (
          <span className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{formattedDuration}</span>
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 line-clamp-4">
        {metadata.description}
      </p>
    </div>
  );
}
