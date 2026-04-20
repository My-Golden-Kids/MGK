const LOCAL_IMAGE_PREFIXES = ['/hospital/', '/expense/', '/images/pet/'];

export function toRenderableImageSrc(source: string) {
  if (!source) {
    return source;
  }

  if (!LOCAL_IMAGE_PREFIXES.some((prefix) => source.startsWith(prefix))) {
    return source;
  }

  const params = new URLSearchParams({ path: source });
  return `/api/local-image?${params.toString()}`;
}
