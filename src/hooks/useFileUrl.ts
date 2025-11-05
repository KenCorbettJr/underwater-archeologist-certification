import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useFileUrl(storageId: Id<"_storage"> | undefined) {
  return useQuery(
    api.fileStorage.getFileUrl,
    storageId ? { storageId } : "skip"
  );
}
