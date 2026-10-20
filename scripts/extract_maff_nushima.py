#!/usr/bin/env python3
"""Import MAFF's 2023 Hyogo fishing-community boundaries.
Usage: python scripts/extract_maff_nushima.py /path/to/MB0001_2023_28.zip
Dependencies: pyshp, shapely, pyproj. Download URL is in the output source record.
"""
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform, unary_union
from shapely import make_valid

ROOT=Path(__file__).resolve().parents[1]
URL='https://www.maff.go.jp/j/tokei/census/fc/database/mapdata/MB0001_2023_28.zip'
PAGE='https://www.maff.go.jp/j/tokei/census/fc/database/mapdata/index.html'
COLORS={'001':'#ed9a45','002':'#5bb7de','003':'#d07dbd','004':'#a5c965','999':'#9b9fa6'}

def extract(archive):
    content=archive.read_bytes()
    z=zipfile.ZipFile(io.BytesIO(content));prefix='MB0001_2023_28/shuraku'
    crs=CRS.from_wkt(z.read(prefix+'.prj').decode())
    project=Transformer.from_crs(crs,4326,always_xy=True).transform
    reader=shapefile.Reader(shp=io.BytesIO(z.read(prefix+'.shp')),shx=io.BytesIO(z.read(prefix+'.shx')),dbf=io.BytesIO(z.read(prefix+'.dbf')),encoding='cp932')
    groups={};retained=0
    for rec in reader.iterShapeRecords():
        p=rec.record.as_dict()
        # Select the named official fishing district, not a spatial approximation.
        if (p['PREF'],p['CITY'],p['GAREA'])!=('28','224','261'):continue
        assert p['GAREA_NAME']=='沼島' and p['CITY_NAME']=='南あわじ市'
        group=groups.setdefault(p['KEY'],{'properties':p,'geometries':[]})
        group['geometries'].append(make_valid(transform(project,shape(rec.shape.__geo_interface__))))
        retained+=1
    features=[]
    for key,group in sorted(groups.items()):
        p=group['properties'];p.update({'name':p['GCOM_NAME']+' · '+p['GAREA_NAME'],'censusYear':2023,'color':COLORS[p['GCOM']],'category':'Other area (not a named fishing community)' if p['GCOM']=='999' else 'Fishing community'})
        geometry=unary_union(group['geometries'])
        assert geometry.is_valid and geometry.geom_type in ['Polygon','MultiPolygon']
        features.append({'type':'Feature','id':key,'properties':p,'geometry':mapping(geometry)})
    assert len(features)==5 and retained==6
    target=ROOT/'data/nushima/maff-fishing-communities-2023.geojson'
    target.write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':'))+'\n')
    record={'publisher':'Ministry of Agriculture, Forestry and Fisheries (MAFF), Statistics Department','dataset':'2023 Fisheries Census fishing-community boundaries (漁業集落境界)','dataYear':2023,'sourcePageUpdated':'2025-11-04','retrievedAt':'2026-10-20','sourcePage':PAGE,'archiveUrl':URL,'archiveSha256':hashlib.sha256(content).hexdigest(),'sourceCRS':crs.to_string(),'outputCRS':'EPSG:4326','encoding':'CP932','sourceFeatureCount':len(reader),'selectedSourceFeatures':retained,'namedCommunityCount':4,'outputFeatureCount':len(features),'selection':{'PREF':'28','CITY':'224','GAREA':'261'},'processing':'Selected official Nushima district by attributes; transformed JGD2011 to WGS84; repaired geometry; grouped the two other-area records by official KEY into one multipart feature. Preserved source attributes. No clipping, simplification or invented boundaries. Added display names, census year, category labels and colours.','licence':'MAFF website terms (Public Data License 1.0); attribution and disclosure of processing','licenceUrl':'https://www.maff.go.jp/j/use/link.html','attribution':'Processed from MAFF 2023 Fisheries Census fishing-community boundaries (農林水産省ウェブサイトを加工して作成).','communities':[f['properties'] for f in features]}
    (ROOT/'data/nushima/maff-source.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    print(f'{retained} source records → {len(features)} hoverable shapes (4 named communities + other area)')

if __name__=='__main__':extract(Path(sys.argv[1]))
