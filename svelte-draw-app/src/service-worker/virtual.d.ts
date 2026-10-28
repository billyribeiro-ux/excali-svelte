declare module "virtual:sw-lazy-chunks" {
  import type { LazyChunkManifest } from "./lazy-chunks.ts";
  const lazyChunks: LazyChunkManifest;
  export default lazyChunks;
}
