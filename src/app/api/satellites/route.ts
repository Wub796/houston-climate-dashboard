import { NextRequest, NextResponse } from 'next/server';

const SOURCES = [
    { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle", type: "active" },
    { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle", type: "active" },
    { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle", type: "active" },
    { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle", type: "debris" },
    { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=tle", type: "debris" },
];

export async function GET() {
    const results = await Promise.allSettled(
        SOURCES.map(({ url, type }) =>
            fetch(url, {
                headers: { 'User-Agent': 'houston-satellite-tracker/1.0' }
            })
                .then(res => res.text())
                .then(data => ({ data, type }))
        )
    );

    const payloads = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<{ data: string; type: string }>).value);

    return NextResponse.json(payloads, {
        headers: { 'Cache-Control': 's-maxage=300' } // cache 5 min on Vercel edge
    });
}