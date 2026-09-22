import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { appEnv } from "../../core/config/env";
import { resolveListingMediaUrl } from "../auctions/utils/listingMedia";
import { splitLines, type ListingFormState } from "./listingForm";
export const MAX_PHOTOS = 30,
  MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export function uploadPhoto(
  file: File,
  progress: (value: number) => void,
  signal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/account/listing-photos");
    xhr.withCredentials = true;
    xhr.timeout = 60000;
    xhr.ontimeout = () => reject(new Error("Upload timed out. Retry this photo."));
    xhr.setRequestHeader("Content-Type", file.type);
    if (appEnv.devAdminHeadersEnabled) {
      xhr.setRequestHeader("x-dev-admin", "1");
      xhr.setRequestHeader("x-dev-session-id", "dashboard-dev");
    }
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once: true });
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) progress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onloadend = () => signal.removeEventListener("abort", abort);
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and retry."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300) throw new Error(data.error || "Upload failed.");
        if (typeof data.url !== "string") throw new Error("The upload returned no photo.");
        resolve(data.url);
      } catch (e) {
        reject(e);
      }
    };
    xhr.send(file);
  });
}
type Pending = { id: string; file: File; preview: string; percent: number; error?: string };
export default function ListingPhotos({
  form,
  setForm,
  onBusyChange,
  disabled,
}: {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const previews = useRef(new Set<string>());
  const mounted = useRef(true);
  const callback = useRef(onBusyChange);
  callback.current = onBusyChange;
  const photos = [
    ...new Set([
      ...splitLines(form.images),
      ...(form.thumbnailUrl && !splitLines(form.images).includes(form.thumbnailUrl)
        ? [form.thumbnailUrl]
        : []),
    ]),
  ];
  const cover = form.thumbnailUrl || photos[0];
  useEffect(() => {
    mounted.current = true;
    const urls = previews.current;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
      callback.current?.(false);
    };
  }, []);
  function updatePhotos(next: string[]) {
    setForm((f) => ({
      ...f,
      images: next.join("\n"),
      thumbnailUrl: next.includes(f.thumbnailUrl) ? f.thumbnailUrl : next[0] || "",
    }));
  }
  async function run(items: Pending[]) {
    if (controller.current || disabled) return;
    const ctrl = new AbortController();
    controller.current = ctrl;
    setBusy(true);
    callback.current?.(true);
    for (const item of items) {
      if (ctrl.signal.aborted) break;
      try {
        setPending((p) => p.map((x) => (x.id === item.id ? { ...x, error: undefined } : x)));
        const url = await uploadPhoto(
          item.file,
          (percent) => {
            if (mounted.current)
              setPending((p) => p.map((x) => (x.id === item.id ? { ...x, percent } : x)));
          },
          ctrl.signal,
        );
        if (!mounted.current) break;
        setForm((f) => ({
          ...f,
          images: [...splitLines(f.images), url].join("\n"),
          thumbnailUrl: f.thumbnailUrl || splitLines(f.images)[0] || url,
        }));
        setPending((p) => p.filter((x) => x.id !== item.id));
        URL.revokeObjectURL(item.preview);
        previews.current.delete(item.preview);
      } catch (e) {
        if (mounted.current)
          setPending((p) =>
            p.map((x) =>
              x.id === item.id
                ? { ...x, error: e instanceof Error ? e.message : "Upload failed" }
                : x,
            ),
          );
      }
    }
    controller.current = null;
    if (mounted.current) {
      setBusy(false);
      callback.current?.(false);
    }
  }
  function add(files: File[]) {
    if (busy || disabled) return;
    const issues: string[] = [];
    const next: Pending[] = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        issues.push(`${file.name}: choose JPG, PNG, or WebP.`);
        continue;
      }
      if (!file.size || file.size > MAX_PHOTO_BYTES) {
        issues.push(`${file.name}: image must be 10 MB or smaller.`);
        continue;
      }
      if (photos.length + pending.length + next.length >= MAX_PHOTOS) {
        issues.push("A property can have up to 30 photos.");
        break;
      }
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      next.push({ id: crypto.randomUUID(), file, preview, percent: 0 });
    }
    setErrors(issues);
    setPending((p) => [...p, ...next]);
    void run(next);
  }
  return (
    <div>
      <div
        className="listing-photo-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(Array.from(e.dataTransfer.files));
        }}
      >
        <strong>Add property photos</strong>
        <p>Drop images here, or choose files. JPG, PNG or WebP · 10 MB each · up to 30 photos.</p>
        <input
          ref={input}
          aria-label="Upload property photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || disabled}
          onChange={(e) => {
            add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>
      {errors.map((message) => (
        <p className="listing-error" role="alert" key={message}>
          {message}
        </p>
      ))}
      <div className="listing-photos">
        {photos.map((url, index) => (
          <article key={url}>
            <img src={resolveListingMediaUrl(url)} alt={`Property photo ${index + 1}`} />
            <strong>{cover === url ? "Cover photo" : `Photo ${index + 1}`}</strong>
            <div>
              <button
                type="button"
                disabled={busy || disabled || cover === url}
                onClick={() =>
                  setForm((f) => ({ ...f, thumbnailUrl: url, images: photos.join("\n") }))
                }
              >
                Set as cover
              </button>
              <button
                type="button"
                disabled={busy || disabled || index === 0}
                aria-label={`Move photo ${index + 1} earlier`}
                onClick={() => {
                  const next = [...photos];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  updatePhotos(next);
                }}
              >
                ←
              </button>
              <button
                type="button"
                disabled={busy || disabled || index === photos.length - 1}
                aria-label={`Move photo ${index + 1} later`}
                onClick={() => {
                  const next = [...photos];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  updatePhotos(next);
                }}
              >
                →
              </button>
              <button
                type="button"
                disabled={busy || disabled}
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => updatePhotos(photos.filter((p) => p !== url))}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
        {pending.map((item) => (
          <article key={item.id}>
            <img src={item.preview} alt={item.file.name} />
            <strong>{item.file.name}</strong>
            {item.error ? (
              <>
                <p role="alert" className="listing-error">
                  {item.error}
                </p>
                <button type="button" disabled={busy || disabled} onClick={() => void run([item])}>
                  Retry upload
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPending((p) => p.filter((x) => x.id !== item.id));
                    URL.revokeObjectURL(item.preview);
                    previews.current.delete(item.preview);
                  }}
                >
                  Remove failed upload
                </button>
              </>
            ) : (
              <>
                <progress value={item.percent} max={100} />
                <small>
                  {item.percent === 100 ? "Processing photo…" : `Uploading ${item.percent}%`}
                </small>
              </>
            )}
          </article>
        ))}
      </div>
      <p className="listing-hint">
        Photo selections, order and cover are kept when you save the listing. Removing a photo here
        does not delete historical submission records.
      </p>
    </div>
  );
}
