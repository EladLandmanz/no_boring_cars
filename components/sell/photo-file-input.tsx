"use client";

import { useRef, useState } from "react";

function fileSummary(files: FileList | null) {
  if (!files?.length) return null;
  if (files.length === 1) return files[0].name;
  return `${files.length} photos selected`;
}

export function PhotoFileInput({
  name,
  required,
  multiple,
  addLabel = multiple ? "Add photos" : "Choose photo",
}: {
  name: string;
  required?: boolean;
  multiple?: boolean;
  addLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        required={required}
        multiple={multiple}
        onChange={(event) => {
          setSummary(fileSummary(event.target.files));
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          onClick={() => inputRef.current?.click()}
        >
          {addLabel}
        </button>
        {summary ? (
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            onClick={() => {
              const input = inputRef.current;
              if (!input) return;
              input.value = "";
              setSummary(null);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      {summary ? (
        <p className="text-sm text-zinc-500">{summary}</p>
      ) : null}
    </div>
  );
}
