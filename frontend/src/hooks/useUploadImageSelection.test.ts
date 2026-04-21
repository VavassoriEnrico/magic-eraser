import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it as test, vi } from "vitest";

import { useUploadImageSelection } from "./useUploadImageSelection";

function createFileList(files: File[]) {
  return {
    ...files,
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: function* iterator() {
      yield* files;
    },
  } as unknown as FileList;
}

describe("useUploadImageSelection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("stores only image files and generates preview urls", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:photo.png");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const imageFile = new File(["image"], "photo.png", { type: "image/png" });
    const textFile = new File(["text"], "notes.txt", { type: "text/plain" });
    const { result } = renderHook(() => useUploadImageSelection());

    act(() => {
      result.current.onSelectUploadFiles(createFileList([imageFile, textFile]));
    });

    expect(result.current.uploadFiles).toEqual([imageFile]);
    expect(result.current.uploadPreviewUrls).toEqual(["blob:photo.png"]);
    expect(createObjectURL).toHaveBeenCalledWith(imageFile);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  test("clears files, revokes preview urls and resets the input value", () => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:photo.png");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const imageFile = new File(["image"], "photo.png", { type: "image/png" });
    const { result } = renderHook(() => useUploadImageSelection());

    act(() => {
      result.current.onSelectUploadFiles(createFileList([imageFile]));
    });

    const input = document.createElement("input");
    input.value = "selected";

    act(() => {
      (
        result.current.uploadInputRef as unknown as {
          current: HTMLInputElement | null;
        }
      ).current = input;
      result.current.clearUploadFiles();
    });

    expect(result.current.uploadFiles).toEqual([]);
    expect(result.current.uploadPreviewUrls).toEqual([]);
    expect(input.value).toBe("");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:photo.png");
  });

  test("revokes preview urls on unmount", () => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:photo.png");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const imageFile = new File(["image"], "photo.png", { type: "image/png" });
    const { result, unmount } = renderHook(() => useUploadImageSelection());

    act(() => {
      result.current.onSelectUploadFiles(createFileList([imageFile]));
    });

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:photo.png");
  });
});
