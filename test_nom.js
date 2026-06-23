import fetch from "node-fetch";

async function test() {
    const val = [
        { name_3: 'Wonokromo', name_2: 'Surabaya' },
        { name_3: 'Kebomas', name_2: 'Gresik' },
        { name_3: 'Kamal', name_2: 'Bangkalan' }
    ];
    for(const k of val) {
        const qs = [
            `${k.name_3}`,
            `${k.name_3} District`,
            `${k.name_3} Subdistrict`
        ];
        
        let ok = false;
        for(const q of qs) {
            const u = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&polygon_geojson=1`;
            const r = await fetch(u, {headers:{'User-Agent':'Mock'}});
            const d = await r.json();
            const b = d?.find(x => x.class==='boundary' && x.type==='administrative');
            if(b && b.geojson) { console.log(k.name_3, 'FOUND', q); ok=true; break; }
            await new Promise(r => setTimeout(r, 1100));
        }
        if(!ok) console.log(k.name_3, 'FAIL');
    }
}
test();
