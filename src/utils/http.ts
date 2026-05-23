export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return json({ message }, status);
}

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
