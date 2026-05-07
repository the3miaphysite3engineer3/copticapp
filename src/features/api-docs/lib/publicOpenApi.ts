import { buildPublicOpenApiComponents } from "./publicOpenApiComponents";
import { buildPublicOpenApiPaths } from "./publicOpenApiPaths";
import {
  buildPublicOpenApiInfo,
  createPublicOpenApiContext,
  PUBLIC_OPEN_API_TAGS,
  type OpenApiDocument,
} from "./publicOpenApiShared";

/**
 * Returns the complete OpenAPI document for the public API surface, including
 * shared metadata, path definitions, and component schemas.
 */
export function getPublicOpenApiDocument(): OpenApiDocument {
  const context = createPublicOpenApiContext();

  return {
    openapi: "3.0.3",
    info: buildPublicOpenApiInfo(context),
    servers: [
      {
        url: "/",
        description: "Current deployment",
      },
    ],
    tags: PUBLIC_OPEN_API_TAGS,
    externalDocs: {
      description: "Interactive API documentation",
      url: "/api-docs",
    },
    paths: buildPublicOpenApiPaths(context),
    components: buildPublicOpenApiComponents(context),
  };
}
