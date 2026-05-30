"use client";

import { useActionState, useEffect, useRef } from "react";

import { createChurchAction } from "@/actions/churches";
import type { ChurchActionState } from "@/actions/churches";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { StatusNotice } from "@/components/StatusNotice";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateChurchForm() {
  const [state, formAction, isPending] = useActionState<ChurchActionState, FormData>(createChurchAction, null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      detailsRef.current?.removeAttribute("open");
    }
  }, [state]);

  function handleNameInput(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = formRef.current?.querySelector<HTMLInputElement>("[name=slug]");
    if (slugInput && !slugInput.dataset.dirty) {
      slugInput.value = slugify(e.target.value);
    }
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary className="bg-accent hover:bg-accent/90 cursor-pointer list-none rounded-lg px-4 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
        Create Church
      </summary>

      <form
        ref={formRef}
        action={formAction}
        className="border-line absolute right-0 top-full z-10 mt-2 w-80 space-y-4 rounded-lg border bg-white p-4 shadow-lg"
      >
        <FormField htmlFor="name" label="Church name">
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input-base"
            placeholder="St. Mary Coptic Orthodox Church"
            onChange={handleNameInput}
          />
        </FormField>

        <FormField htmlFor="slug" label="Slug">
          <input
            id="slug"
            name="slug"
            type="text"
            required
            className="input-base"
            placeholder="st-mary-coptic"
            onChange={(e) => {
              e.target.dataset.dirty = "true";
            }}
          />
        </FormField>

        <FormField htmlFor="description" label="Description (optional)">
          <textarea
            id="description"
            name="description"
            rows={2}
            className="textarea-base resize-y"
            placeholder="A brief description of your church"
          />
        </FormField>

        <div className="flex gap-2">
          <FormField htmlFor="city" label="City" className="flex-1">
            <input
              id="city"
              name="city"
              type="text"
              className="input-base"
              placeholder="Cairo"
            />
          </FormField>

          <FormField htmlFor="country" label="Country" className="flex-1">
            <input
              id="country"
              name="country"
              type="text"
              className="input-base"
              placeholder="Egypt"
            />
          </FormField>
        </div>

        <Button type="submit" disabled={isPending} fullWidth>
          {isPending ? "Creating..." : "Create Church"}
        </Button>

        {state?.error ? (
          <StatusNotice tone="error">{state.error}</StatusNotice>
        ) : null}
      </form>
    </details>
  );
}
