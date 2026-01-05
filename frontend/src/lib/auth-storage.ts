const TOKEN_KEY = "token";

type TokenSubscriber = (token: string | null) => void;

const subscribers = new Set<TokenSubscriber>();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  subscribers.forEach((subscriber) => subscriber(token));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  subscribers.forEach((subscriber) => subscriber(null));
}

export function subscribe(callback: TokenSubscriber): () => void {
  const handler = (event: StorageEvent): void => {
    if (event.key === TOKEN_KEY) {
      callback(event.newValue);
    }
  };

  subscribers.add(callback);
  window.addEventListener("storage", handler);

  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", handler);
  };
}
