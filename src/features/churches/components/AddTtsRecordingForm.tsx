"use client";

import { useActionState, useState } from "react";

import { addTtsRecordingToDatasetAction } from "@/actions/churches";
import type { ChurchActionState } from "@/actions/churches";
import { Button } from "@/components/Button";
import { StatusNotice } from "@/components/StatusNotice";

export function AddTtsRecordingForm({
  churchId,
  datasetId,
  organizations,
}: {
  churchId: string;
  datasetId: string;
  organizations: { id: string; name: string }[];
}) {
  const [copticText, setCopticText] = useState("");
  const [state, formAction, isPending] = useActionState<ChurchActionState, FormData>(
    addTtsRecordingToDatasetAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="datasetId" value={datasetId} />

      <div>
        <label htmlFor="orgId" className="block text-sm font-semibold text-ink">
          Organization
        </label>
        <select
          id="orgId"
          name="orgId"
          required
          className="select-base mt-1"
          defaultValue=""
        >
          <option value="" disabled>
            Select an organization...
          </option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="copticText"
          className="block text-sm font-semibold text-ink"
        >
          Coptic text
        </label>
        <textarea
          id="copticText"
          name="copticText"
          required
          rows={3}
          className="textarea-base mt-1 resize-y"
          placeholder="ⲡⲉⲛⲓⲱⲧ ⲉⲧϧⲉⲛ ⲛⲓⲫⲏⲟⲩⲓ..."
          value={copticText}
          onChange={(e) => setCopticText(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="englishText"
          className="block text-sm font-semibold text-ink"
        >
          English translation (optional)
        </label>
        <textarea
          id="englishText"
          name="englishText"
          rows={2}
          className="textarea-base mt-1 resize-y"
          placeholder="Our Father who art in heaven..."
        />
      </div>

      <Button type="submit" disabled={isPending || !copticText.trim()}>
        {isPending ? "Generating..." : "Generate & Add to Dataset"}
      </Button>

      {state?.error ? (
        <StatusNotice tone="error">{state.error}</StatusNotice>
      ) : null}

      {state?.success ? (
        <StatusNotice tone="success">
          TTS recording added to dataset.
        </StatusNotice>
      ) : null}
    </form>
  );
}
