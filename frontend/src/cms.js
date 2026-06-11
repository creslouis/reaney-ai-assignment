export function cmsSetting(bundle, key, fallback = {}) {
  return bundle?.settings?.[key] || fallback;
}

export function cmsText(bundle, key, fieldEn, fieldKm, lang, fallback) {
  const value = cmsSetting(bundle, key, {});
  const field = lang === "km" ? fieldKm : fieldEn;
  return value?.[field] || fallback;
}
