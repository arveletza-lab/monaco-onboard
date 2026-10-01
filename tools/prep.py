# Genera data/monaco.json, los datos del mapa de Mónaco Onboard.
#
# Entradas (bajarlas a esta misma carpeta, tools/):
#   mc-1929.geojson  trazado del circuito (línea central GPS), de bacinger/f1-circuits (MIT):
#                    https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mc-1929.geojson
#   monaco.osm.pbf   extracto de OpenStreetMap de Mónaco (© colaboradores de OpenStreetMap, ODbL):
#                    https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/test/data/monaco.osm.pbf
#
# Requiere: pip install osmium numpy scipy matplotlib
# Uso, desde la raíz del proyecto:  python tools/prep.py
#
# Primero extrae del .pbf (con osmium) la costa, los edificios, los parques, la vegetación y las piscinas,
# proyectados a metros locales, y los guarda en tools/osm.json y tools/osm2.json. Después calcula las
# máscaras de mar y de verde (celdas de 4 m), las alturas de los edificios, las piscinas y los árboles,
# y escribe data/monaco.json, más una vista previa de las máscaras en tools/mask.png.
# Salida: track (línea central en metros, x = este, y = norte), grid, sea/green (filas comprimidas
# por longitud de racha), b (edificios), pools y trees.
#
# Ojo: extract_osm() es una reconstrucción. El paso que generó los osm.json/osm2.json originales no se
# conservó, y con este .pbf el resultado no es idéntico al data/monaco.json del repo: el trazado y el mar
# coinciden, los edificios casi (unos 3770 contra 3698), pero hay muchas menos áreas verdes (el extracto de
# OSRM es viejo y tiene poca vegetación cargada) y más piscinas. Si ya tenés osm.json y osm2.json en esta
# carpeta, el script los usa tal cual y saltea la extracción.
import os
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
GEOJSON=os.path.join(HERE,'mc-1929.geojson')
PBF=os.path.join(HERE,'monaco.osm.pbf')
OSM1=os.path.join(HERE,'osm.json')
OSM2=os.path.join(HERE,'osm2.json')
OUT=os.path.join(ROOT,'data','monaco.json')
MASK_PNG=os.path.join(HERE,'mask.png')

def extract_osm():
    """Writes osm.json (coast, parks, bl) and osm2.json (lands, pools) from the .pbf, in local metres."""
    import json,math,osmium
    lat0,lon0=43.7365,7.4255;CX=math.cos(math.radians(lat0))*111320;CY=110574
    xy=lambda lon,lat:[round((lon-lon0)*CX,2),round((lat-lat0)*CY,2)]
    GREEN_LANDS=('forest','wood','scrub','grassland','grass','meadow')
    # the .pbf also covers the French towns around: buildings and pools are kept only when centred on the map area
    inbox=lambda pts:-1400<=sum(p[0] for p in pts)/len(pts)<=1600 and -1400<=sum(p[1] for p in pts)/len(pts)<=1750
    class H(osmium.SimpleHandler):
        def __init__(s):
            super().__init__();s.coast=[];s.parks=[];s.bl=[];s.lands=[];s.pools=[]
        def way(s,w):
            if w.tags.get('natural')=='coastline':
                pts=[xy(n.lon,n.lat) for n in w.nodes if n.location.valid()]
                if len(pts)>1: s.coast.append(pts)
        def area(s,a):
            t={k:v for k,v in a.tags}
            for ring in a.outer_rings():
                pts=[xy(n.lon,n.lat) for n in ring if n.location.valid()]
                if len(pts)<3: continue
                if 'building' in t and inbox(pts): s.bl.append({'p':pts,'t':t})
                if t.get('leisure') in ('park','garden'): s.parks.append(pts)
                lt=t.get('landuse') or t.get('natural')
                if lt in GREEN_LANDS: s.lands.append([lt,pts])
                if t.get('leisure')=='swimming_pool' and inbox(pts): s.pools.append(pts)
    h=H();h.apply_file(PBF,locations=True)
    json.dump({'coast':h.coast,'parks':h.parks,'bl':h.bl},open(OSM1,'w',encoding='utf-8'),ensure_ascii=False)
    json.dump({'lands':h.lands,'pools':h.pools},open(OSM2,'w',encoding='utf-8'),ensure_ascii=False)
    print('osm: coast',len(h.coast),'buildings',len(h.bl),'parks',len(h.parks),'lands',len(h.lands),'pools',len(h.pools))

if not (os.path.exists(OSM1) and os.path.exists(OSM2)): extract_osm()

import json,math,numpy as np,random,base64
from scipy import ndimage
from scipy.spatial import cKDTree
from matplotlib.path import Path
random.seed(7)
lat0,lon0=43.7365,7.4255;CX=math.cos(math.radians(lat0))*111320;CY=110574
co=np.array(json.load(open(GEOJSON,encoding='utf-8'))['features'][0]['geometry']['coordinates'])
TX=(co[:,0]-lon0)*CX;TY=(co[:,1]-lat0)*CY
if math.hypot(TX[0]-TX[-1],TY[0]-TY[-1])<0.5: TX,TY=TX[:-1],TY[:-1]
track=np.stack([TX,TY],1)
# dense track for distance queries (closed)
dense=[]
for i in range(len(track)):
    a,b=track[i],track[(i+1)%len(track)];n=max(1,int(np.hypot(*(b-a))))
    for k in range(n): dense.append(a+(b-a)*k/n)
dense=np.array(dense);kd=cKDTree(dense)
cum=np.concatenate([[0],np.cumsum(np.hypot(*np.diff(np.vstack([track,track[:1]]),axis=0).T))])
L=cum[-1];print('len',L)
d=json.load(open(OSM1,encoding='utf-8'));d2=json.load(open(OSM2,encoding='utf-8'))
# ---- masks grid
X0,X1,Y0,Y1,C=-1400,1600,-1400,2400,4
nx,ny=int((X1-X0)/C),int((Y1-Y0)/C)
bar=np.zeros((ny,nx),bool)
def mark_line(p):
    p=np.array(p)
    for a,b in zip(p[:-1],p[1:]):
        n=int(np.hypot(*(b-a))/1.0)+1
        for k in range(n+1):
            q=a+(b-a)*k/n;i=int((q[0]-X0)/C);j=int((q[1]-Y0)/C)
            if 0<=i<nx and 0<=j<ny: bar[j,i]=True
for c in d['coast']: mark_line(c)
lab,nl=ndimage.label(~bar)
seed=lab[int((-900-Y0)/C),int((900-X0)/C)]
sea=(lab==seed)
sea=ndimage.binary_dilation(sea,iterations=1)&~ndimage.binary_erosion(~bar,iterations=0)|sea  # close barrier line cells next to sea
sea=sea|(bar&ndimage.binary_dilation(lab==seed))
print('sea frac',sea.mean())
green=np.zeros((ny,nx),bool)
gx,gy=np.meshgrid(X0+(np.arange(nx)+.5)*C,Y0+(np.arange(ny)+.5)*C)
P=np.stack([gx.ravel(),gy.ravel()],1)
greens=d['parks']+[p for t,p in d2['lands'] if t in('forest','scrub','grassland','grass','meadow')]
for poly in greens:
    if len(poly)<3: continue
    pa=np.array(poly);bb=(pa.min(0),pa.max(0))
    m=(P[:,0]>=bb[0][0])&(P[:,0]<=bb[1][0])&(P[:,1]>=bb[0][1])&(P[:,1]<=bb[1][1])
    if m.any():
        idx=np.where(m)[0];ins=Path(pa).contains_points(P[idx]);green.ravel()[idx[ins]]=True
def rle(m):
    out=[]
    for row in m:
        v=0;cnt=0;r=[]
        for x in row:
            if x==v: cnt+=1
            else: r.append(cnt);v=x;cnt=1
        r.append(cnt);out.append(r)
    return out
# ---- buildings
seadist=ndimage.distance_transform_edt(~sea)
def area(p):
    p=np.array(p);return abs(np.sum(p[:,0]*np.roll(p[:,1],-1)-np.roll(p[:,0],-1)*p[:,1]))/2
tun0,tun1=560,900
def s_of(pt):
    dd,i=kd.query(pt);return dd,i
# s for dense index
dcum=np.concatenate([[0],np.cumsum(np.hypot(*np.diff(dense,axis=0).T))])
blds=[];drop=0;over=0
def zone(x,y):
    if y<-480 and x<150: return 'rock'
    if x<-380 and y<-300: return 'fontvieille'
    if y>650: return 'beausoleil'
    if x>350 and y>550: return 'larvotto'
    if x<-150 and y<300: return 'condamine'
    return 'mc'
for b in d['bl']:
    p=b['p']
    if p[0]==p[-1]: p=p[:-1]
    if len(p)<3: continue
    A=area(p)
    if A<25: continue
    pa=np.array(p);cen=pa.mean(0)
    # distance of polygon to track: sample edges
    samp=[]
    for a,c in zip(pa,np.roll(pa,-1,axis=0)):
        n=max(1,int(np.hypot(*(c-a))/2))
        for k in range(n): samp.append(a+(c-a)*k/n)
    samp=np.array(samp+[cen]);dd,ii=kd.query(samp);md=dd.min();si=dcum[ii[dd.argmin()]]
    if 1.5<md<7.5 and not (tun0-20<=si<=tun1+20):
        vd,vi=kd.query(pa)
        for k in range(len(pa)):
            if vd[k]<8.5:
                q=dense[vi[k]];v=pa[k]-q;n=np.hypot(*v) or 1;pa[k]=q+v/n*8.5
        samp=[]
        for a,c in zip(pa,np.roll(pa,-1,axis=0)):
            n=max(1,int(np.hypot(*(c-a))/2))
            for k in range(n): samp.append(a+(c-a)*k/n)
        samp=np.array(samp);dd,ii=kd.query(samp);md=dd.min()+2.5;A=area(pa)
    inside=Path(pa).contains_point(dense[ii[dd.argmin()]]) if md<3 else False
    t=b['t'];name=t.get('name','')
    lv=t.get('building:levels')
    z=zone(*cen)
    tunnel=False
    if md<5+2.0 or inside:
        if tun0-20<=si<=tun1+20: tunnel=True;over+=1
        else: drop+=1;continue
    rnd=random.random()
    jj=int((cen[1]-Y0)/C);ii_=int((cen[0]-X0)/C)
    sd=seadist[jj,ii_]*C if 0<=jj<ny and 0<=ii_<nx else 999
    if lv:
        try: fl=float(lv)
        except: fl=6
    elif A<60: fl=random.choice([2,3])
    elif A<180: fl=random.randint(3,6)
    else:
        base={'rock':3,'fontvieille':10,'beausoleil':6,'larvotto':9,'condamine':7,'mc':7}[z]
        fl=base+random.randint(-1,2)
        if z in('fontvieille','larvotto') and A>600 and rnd<0.35: fl=random.randint(14,32)
        elif z=='condamine' and cen[0]<-420 and A>600 and rnd<0.25: fl=random.randint(12,22)
        elif z=='mc' and md>110 and A>900 and rnd<0.12: fl=random.randint(12,20)
        elif z=='beausoleil' and A>700 and rnd<0.1: fl=random.randint(10,16)
        if sd<70 and z in('mc','condamine','rock') : fl=min(fl,random.randint(2,4))
        if md<45: fl=min(fl,random.randint(7,10))
    h=fl*3.1+1.5
    kind='std'
    nm=name.lower()
    if 'casino de monte' in nm: kind='casino';h=22
    elif 'hôtel de paris' in nm: kind='classic';h=26
    elif 'palais princier' in nm: kind='palace';h=16
    elif 'musée océano' in nm: kind='classic';h=24
    elif 'église' in nm or 'chapelle' in nm or 'church' in t.get('building',''): kind='church';h=12
    elif 'odéon' in nm or 'odeon' in nm: h=170
    if tunnel: kind='fairmont';h=min(max(h,24),32)
    blds.append({'p':[[round(x,1),round(y,1)] for x,y in pa.tolist()],'h':round(h,1),'k':kind,'z':z,'a':round(A)})
print('buildings',len(blds),'dropped',drop,'over tunnel',over)
# pools
pools=[[[round(x,1),round(y,1)] for x,y in p] for p in d2['pools']]
# trees in greens (not on buildings, not near track)
bpaths=[Path(np.array(b['p'])) for b in blds]
trees=[]
gi=np.argwhere(green)
random.shuffle(gi:=list(map(tuple,gi)))
cnt=0
for (j,i) in gi:
    if cnt>2600: break
    if random.random()<0.55: continue
    x=X0+(i+random.random())*C;y=Y0+(j+random.random())*C
    if sea[j,i]: continue
    if kd.query([x,y])[0]<9: continue
    trees.append([round(x,1),round(y,1)]);cnt+=1
out={'track':[[round(x,2),round(y,2)] for x,y in track.tolist()],'grid':[X0,Y0,C,nx,ny],'sea':rle(sea),'green':rle(green),'b':blds,'pools':pools,'trees':trees}
s=json.dumps(out,separators=(',',':'))
open(OUT,'w').write(s);print('bytes',len(s))
# preview
import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
plt.figure(figsize=(10,12));plt.imshow(sea*2+green,origin='lower',extent=[X0,X1,Y0,Y1],cmap='viridis')
plt.plot(TX,TY,'r-');plt.savefig(MASK_PNG,dpi=60)
