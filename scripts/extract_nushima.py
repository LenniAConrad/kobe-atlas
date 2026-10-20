#!/usr/bin/env python3
"""Clip downloaded MLIT shapefiles to Nushima; see data/nushima-sources.json.
Usage: python scripts/extract_nushima.py RAW_DIRECTORY
Dependencies: pyshp, shapely, pyproj. Originals are not committed.
Preserves source attributes and records input CRS + SHA-256 for reproducibility.
"""
import hashlib
import json
import sys
from pathlib import Path
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping, box
from shapely.ops import transform
from shapely import make_valid

AOI = box(134.805, 34.15, 134.84, 34.185)
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/nushima'
NAMES = {'N03':'N03_004','P29':'P29_004','P04':'P04_002','P14':'P14_008','A27':'A27_004','A32':'A32_004','C09':'C09_002','N09':'N09_006','P20':'P20_002','A19':'A19_009'}
LAND = {'0100':('Rice fields','#d4ce66'),'0200':('Other agriculture','#dbc18b'),'0500':('Forest','#4e8d58'),'0600':('Wasteland','#b4ac82'),'0700':('Buildings','#dc806f'),'0901':('Roads','#aaa5a0'),'0902':('Railways','#6b6875'),'1000':('Other land','#cab7a2'),'1100':('Rivers / lakes','#69b9df'),'1400':('Beach','#eedb9b'),'1500':('Sea','#a8d6e7'),'1600':('Golf courses','#99b66f')}

def rounded(value):
    if isinstance(value,float): return round(value,7)
    if isinstance(value,(list,tuple)): return [rounded(x) for x in value]
    if isinstance(value,dict): return {k:rounded(v) for k,v in value.items()}
    return value

def extract(raw):
    OUT.mkdir(exist_ok=True)
    records=[]
    for path in sorted(raw.rglob('*.shp')):
        dataset=path.relative_to(raw).parts[0]
        prj=path.with_suffix('.prj')
        # Older KSJ archives omit .prj; their official metadata specifies JGD2000.
        crs=CRS.from_wkt(prj.read_text()) if prj.exists() else CRS.from_epsg(4612) if dataset in {'C02-2014','C09','C23','N09'} else None
        if crs is None:raise ValueError('Missing documented CRS: '+str(path))
        to_wgs=Transformer.from_crs(crs,4326,always_xy=True).transform
        from_wgs=Transformer.from_crs(4326,crs,always_xy=True).transform
        bbox=transform(from_wgs,AOI).bounds
        cpg=path.with_suffix('.cpg')
        enc=cpg.read_text().strip() if cpg.exists() else 'cp932'
        reader=shapefile.Reader(str(path),encoding=enc)
        features=[]
        for record in reader.iterShapeRecords(bbox=bbox):
            props=record.record.as_dict()
            geometry=make_valid(transform(to_wgs,shape(record.shape.__geo_interface__)))
            # Preserve the complete Nushima ferry connection, not passing shipping routes.
            if dataset=='N09' and geometry.geom_type.endswith('LineString'):
                if not any('沼島' in str(v) for v in props.values()):continue
            else:
                if not geometry.intersects(AOI):continue
                geometry=geometry.intersection(AOI)
            if geometry.is_empty:continue
            field=NAMES.get(dataset[:3]);name=props.get(field) if field else None
            if dataset=='N09' and geometry.geom_type=='Point':name=props.get('N09_004')
            props['name']=name or props.get('OBJ_NAME') or dataset
            if dataset.startswith('L03-b'):
                code=props['L03b_002']
                if code=='1500':continue # Open sea is the background, not a land-use class.
                props['category'],props['color']=LAND.get(code,('Unclassified','#aaaaaa'))
                props['name']=props['category']+' · '+props['L03b_001']
            features.append({'type':'Feature','properties':props,'geometry':rounded(mapping(geometry))})
        slug=dataset.lower()+'-'+path.stem.lower()
        if features:
            (OUT/(slug+'.geojson')).write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':'))+'\n')
        records.append({'dataset':dataset,'input':str(path.relative_to(raw)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'crs':crs.to_string(),'sourceFeatureCount':len(reader),'retainedFeatureCount':len(features),'file':'data/nushima/'+slug+'.geojson' if features else None})
        print(dataset,path.stem,len(features))
    (OUT/'processing.json').write_text(json.dumps({'clipBounds':[134.805,34.15,134.84,34.185],'method':'Transform from source CRS to EPSG:4326; repair invalid geometry; intersect island envelope; preserve source attributes; round to 7 decimals. N09 retains full routes whose attributes name Nushima. Sea class 1500 excluded from land-use display. No geometry simplification.','inputs':records},ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':extract(Path(sys.argv[1]))
