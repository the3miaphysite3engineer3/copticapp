declare module "next/dist/lib/metadata/types/metadata-interface" {
  export type ResolvingMetadata = import("next").ResolvingMetadata;
  export type ResolvingViewport = import("next").ResolvingViewport;
}
declare module "next/dist/lib/metadata/types/metadata-interface.js" {
  export * from "next/dist/lib/metadata/types/metadata-interface";
}

declare module "next/dist/build/segment-config/app/app-segment-config" {
  export type InstantConfigForTypeCheckInternal = Record<string, unknown>;
}
declare module "next/dist/build/segment-config/app/app-segment-config.js" {
  export * from "next/dist/build/segment-config/app/app-segment-config";
}

declare module "next/server.js" {
  export * from "next/server";
}

declare module "next/types.js" {
  export type ResolvingMetadata = import("next/dist/lib/metadata/types/metadata-interface.js").ResolvingMetadata;
  export type ResolvingViewport = import("next/dist/lib/metadata/types/metadata-interface.js").ResolvingViewport;
}
