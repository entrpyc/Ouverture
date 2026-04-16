export type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function success<T>(data: T): ActionResponse<T> {
  return { data, error: null };
}

export function failure(error: string): ActionResponse<never> {
  return { data: null, error };
}
