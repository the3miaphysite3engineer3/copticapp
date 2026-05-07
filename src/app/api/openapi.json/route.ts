import { getPublicOpenApiDocument } from "@/features/api-docs/lib/publicOpenApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

/**
 * Returns the generated public OpenAPI document as a static public API
 * response.
 */
export function GET() {
  return publicApiJsonResponse(getPublicOpenApiDocument());
}

/**
 * Returns the CORS preflight response for the public OpenAPI document
 * endpoint.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
