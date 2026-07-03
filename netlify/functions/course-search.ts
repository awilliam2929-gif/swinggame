import { searchCoursesRemote } from '../../server/searchCoursesRemote'

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export default async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: HEADERS,
    })
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: HEADERS,
    })
  }

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return new Response(JSON.stringify([]), { status: 200, headers: HEADERS })
  }

  try {
    const results = await searchCoursesRemote(q)
    return new Response(JSON.stringify(results), { status: 200, headers: HEADERS })
  } catch {
    return new Response(JSON.stringify({ error: 'Search unavailable' }), {
      status: 502,
      headers: HEADERS,
    })
  }
}
