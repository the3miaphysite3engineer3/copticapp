"use client";

import { useActionState, useRef } from "react";

import { submitChurchRequestAction } from "@/actions/churches";
import type { ChurchRequestActionState } from "@/actions/churches";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { StatusNotice } from "@/components/StatusNotice";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ChurchRequestPage() {
  const [state, formAction, isPending] = useActionState<ChurchRequestActionState, FormData>(submitChurchRequestAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleNameInput(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = formRef.current?.querySelector<HTMLInputElement>("[name=slug]");
    if (slugInput && !slugInput.dataset.dirty) {
      slugInput.value = slugify(e.target.value);
    }
  }

  if (state?.success) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-3xl font-bold">Request Submitted</h1>
        <div className="border-line rounded-lg border p-6">
          <p className="mb-4">
            Your church request has been submitted. Please send the following
            confirmation link to the <strong>Coptic Compass</strong> Facebook page
            from your church&apos;s official Facebook page:
          </p>
          <div className="bg-surface rounded-lg p-4 text-sm break-all">
            <a
              href={state.confirmationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {state.confirmationUrl}
            </a>
          </div>
          <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            <strong>Next steps:</strong>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Copy the link above</li>
              <li>Go to your church&apos;s official Facebook page</li>
              <li>Send the link via Facebook Messenger to Coptic Compass</li>
              <li>Once the Coptic Compass team confirms your request, you will be able to manage your church on our platform</li>
            </ol>
          </div>
        </div>
        <a
          href="/churches"
          className="text-accent hover:underline text-sm"
        >
          &larr; Back to churches
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <a href="/churches" className="text-ink/50 hover:text-ink mb-2 block text-sm">
          &larr; Back to churches
        </a>
        <h1 className="text-3xl font-bold">Request to Add Your Church</h1>
        <p className="text-ink/60 mt-1">
          Fill out this form to request adding your Coptic Orthodox church to our platform.
          After submission, you will receive a confirmation link to send to the Coptic Compass
          Facebook page from your church&apos;s official Facebook page.
        </p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="border-line space-y-5 rounded-lg border p-6"
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
            rows={3}
            className="textarea-base resize-y"
            placeholder="A brief description of your church community"
          />
        </FormField>

        <div className="flex gap-3">
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

        <hr className="border-line" />

        <p className="text-ink/50 text-sm">Your contact information</p>

        <FormField htmlFor="requesterName" label="Your name">
          <input
            id="requesterName"
            name="requesterName"
            type="text"
            required
            className="input-base"
            placeholder="Father Markos"
          />
        </FormField>

        <FormField htmlFor="requesterEmail" label="Your email">
          <input
            id="requesterEmail"
            name="requesterEmail"
            type="email"
            required
            className="input-base"
            placeholder="father.markos@example.com"
          />
        </FormField>

        <FormField htmlFor="facebookPageUrl" label="Your church's official Facebook page URL">
          <input
            id="facebookPageUrl"
            name="facebookPageUrl"
            type="url"
            required
            className="input-base"
            placeholder="https://www.facebook.com/StMaryCairo"
          />
        </FormField>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Request"}
        </Button>

        {state?.error ? (
          <StatusNotice tone="error">{state.error}</StatusNotice>
        ) : null}
      </form>
    </div>
  );
}
