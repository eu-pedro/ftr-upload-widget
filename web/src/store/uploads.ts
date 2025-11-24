import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { uploadFileToStorage } from "../http/upload";
import { CanceledError } from "axios";
import { useShallow } from "zustand/shallow";
import { compressImage } from "../utils/compress-image";

export type Upload = {
  name: string;
  file: File;
  abortController?: AbortController;
  status: "progress" | "success" | "error" | "canceled";
  uploadSizeInBytes: number;
  compressedSizeInBytes?: number;
  originalSizeInBytes: number;
  remoteUrl?: string;
};

type UploadState = {
  uploads: Map<string, Upload>;
};

type Actions = {
  addUploads: (files: File[]) => void;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => void;
};

enableMapSet();

export const useUploads = create<UploadState & Actions>()(
  immer((set, get) => {
    function updatedUpload(uploadId: string, data: Partial<Upload>) {
      const upload = get().uploads.get(uploadId);

      if (!upload) return;

      set((state) => {
        state.uploads.set(uploadId, { ...upload, ...data });
      });
    }

    async function processUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);

      if (!upload) return;

      const abortController = new AbortController()

      updatedUpload(uploadId, {
        uploadSizeInBytes: 0,
        compressedSizeInBytes: undefined,
        remoteUrl: undefined,
        abortController,
        status: "progress",
      });

      try {
        const compressedFile = await compressImage({
          file: upload.file,
          maxHeight: 1000,
          maxWidth: 1000,
          quality: 0.8,
        });

        updatedUpload(uploadId, {
          compressedSizeInBytes: compressedFile.size,
        });

        const { url } = await uploadFileToStorage(
          {
            file: upload.file,
            onProgress(sizeInBytes) {
              updatedUpload(uploadId, {
                uploadSizeInBytes: sizeInBytes,
              });
            },
          },
          { signal: upload.abortController?.signal }
        );

        updatedUpload(uploadId, {
          status: "success",
          remoteUrl: url,
        });
      } catch (error) {
        if (error instanceof CanceledError) {
          updatedUpload(uploadId, {
            status: "canceled",
          });

          return;
        }

        updatedUpload(uploadId, {
          status: "error",
        });
      }
    }

    function cancelUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);

      if (!upload) return;

      upload.abortController?.abort("aborted");
    }

    function retryUpload(uploadId: string) {
      processUpload(uploadId);
    }

    function addUploads(files: File[]) {
      for (const file of files) {
        const uploadId = crypto.randomUUID();
        const abortController = new AbortController();

        const upload: Upload = {
          name: file.name,
          file,
          abortController,
          status: "progress",
          originalSizeInBytes: file.size,
          uploadSizeInBytes: 0,
        };

        set((state) => {
          state.uploads.set(uploadId, upload);
        });

        processUpload(uploadId);
      }
    }

    return {
      uploads: new Map(),
      addUploads,
      cancelUpload,
      retryUpload,
    };
  })
);

export const usePendingUploads = () => {
  return useUploads(
    useShallow((store) => {
      const isThereAnyPendingUploads = Array.from(store.uploads.values()).some(
        (upload) => upload.status === "progress"
      );

      if (!isThereAnyPendingUploads) {
        return {
          isThereAnyPendingUploads,
          globalPercentage: 100,
        };
      }

      const { total, uploaded } = Array.from(store.uploads.values()).reduce(
        (acc, upload) => {
          if (upload.compressedSizeInBytes) {
            acc.uploaded += upload.uploadSizeInBytes;
          }

          acc.total +=
            upload.compressedSizeInBytes || upload.originalSizeInBytes;
          return acc;
        },
        { total: 0, uploaded: 0 }
      );

      const globalPercentage = Math.min(
        Math.round((uploaded * 100) / total),
        100
      );

      return {
        isThereAnyPendingUploads,
        globalPercentage,
      };
    })
  );
};
