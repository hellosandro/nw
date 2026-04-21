// Vercel Edge Function — proxies Google Sheets CSV server-side (no CORS issues)
export const config = { runtime: 'edge' };

const SHEETS = {
  config: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGec_ewoWxtdcEXP05iJm4v2LHOoyW5sZc2bSBRVMzX7vlJIX8duf1JD--qMhpihBVgHMnHJxrgwkL/pub?gid=1620319001&single=true&output=csv',
  wines:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGec_ewoWxtdcEXP05iJm4v2LHOoyW5sZc2bSBRVMzX7vlJIX8duf1JD--qMhpihBVgHMnHJxrgwkL/pub?gid=1993474932&single=true&output=csv',
  faces:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGec_ewoWxtdcEXP05iJm4v2LHOoyW5sZc2bSBRVMzX7vlJIX8duf1JD--qMhpihBVgHMnHJxrgwkL/pub?gid=1521558789&single=true&output=csv'
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get('sheet') || 'config';
  const url = SHEETS[sheet];

  if (!url) {
    return new Response('Unknown sheet', { status: 404 });
  }

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error('upstream ' + res.status);
    const text = await res.text();

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (e) {
    return new Response('Error fetching sheet: ' + e.message, { status: 502 });
  }
}
