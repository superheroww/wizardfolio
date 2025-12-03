export function getAnonId(): string | null {
  if (typeof window === "undefined" || typeof window.crypto === "undefined") {
    return null;
  }

  const storedId = window.localStorage.getItem("wf_anon_id");
  if (storedId) {
    return storedId;
  }

  const newId = window.crypto.randomUUID();
  window.localStorage.setItem("wf_anon_id", newId);
  return newId;
}
