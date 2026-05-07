"use client";

import { useEffect, useRef, useState } from "react";

import type { SwaggerUiModule } from "swagger-ui-dist";

type SwaggerDocsClientProps = {
  specUrl: string;
};

export function SwaggerDocsClient({ specUrl }: SwaggerDocsClientProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | undefined;

    async function loadSwaggerUi() {
      try {
        const swaggerUiModule = await import("swagger-ui-dist");
        const swaggerUi = (
          "default" in swaggerUiModule
            ? swaggerUiModule.default
            : swaggerUiModule
        ) as SwaggerUiModule;

        if (!isMounted || !containerRef.current) {
          return;
        }

        setHasLoadError(false);
        containerRef.current.replaceChildren();

        const ui = swaggerUi.SwaggerUIBundle({
          url: specUrl,
          domNode: containerRef.current,
          deepLinking: true,
          defaultModelsExpandDepth: -1,
          displayRequestDuration: true,
          docExpansion: "list",
          filter: true,
          tryItOutEnabled: false,
          presets: [
            swaggerUi.SwaggerUIBundle.presets.apis,
            swaggerUi.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
        });

        cleanup = () => {
          ui?.destroy?.();
          containerRef.current?.replaceChildren();
        };
      } catch (error) {
        console.error("Failed to load Swagger UI", error);
        if (isMounted) {
          setHasLoadError(true);
        }
      }
    }

    void loadSwaggerUi();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [specUrl]);

  return (
    <div className="space-y-4">
      {hasLoadError ? (
        <p className="rounded-3xl border border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          The interactive docs could not load in this browser. You can still use
          the raw{" "}
          <a
            className="underline decoration-amber-500 underline-offset-2"
            href={specUrl}
          >
            OpenAPI document
          </a>
          .
        </p>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
