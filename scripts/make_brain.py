"""
Membuat model otak + hipokampus (.glb) dari data riset terbuka:
- permukaan otak: template MNI ICBM152 2009 (mni152_2009.mz3)
- hipokampus kiri & kanan: label volume di ruang MNI (hippo.nii.gz, hippolr.nii.gz)
Keduanya dari repo NiiVue (github.com/niivue/niivue, BSD-2-Clause).
Jalankan: pip install trimesh nibabel scikit-image scipy fast_simplification
          python scripts/make_brain.py <folder berisi mni152_2009.mz3, hippo.nii.gz, hippolr.nii.gz>
"""
import gzip, os, struct, sys
import numpy as np, nibabel as nib, trimesh
from scipy.ndimage import gaussian_filter, zoom
from skimage.measure import marching_cubes

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), "..", "public", "models", "otak-hipokampus.glb")

def read_mz3(p):
    b = open(p, "rb").read()
    if b[:2] == b"\x1f\x8b":
        b = gzip.decompress(b)
    _, attr, nf, nv, nskip = struct.unpack("<HHIII", b[:16])
    o = 16 + nskip
    F = np.frombuffer(b, np.int32, nf * 3, o).reshape(-1, 3); o += nf * 12
    V = np.frombuffer(b, np.float32, nv * 3, o).reshape(-1, 3)
    return V.astype(np.float64), F.astype(np.int64)

# otak: sederhanakan ke ±160 ribu segitiga (tetap detail, ringan untuk render)
V, F = read_mz3(os.path.join(src, "mni152_2009.mz3"))
brain = trimesh.Trimesh(V, F, process=True)
brain = brain.simplify_quadric_decimation(face_count=160000)
trimesh.smoothing.filter_taubin(brain, iterations=6)

# hipokampus: permukaan dari label volume, dihaluskan
img = nib.load(os.path.join(src, "hippo.nii.gz"))
vol = ((img.get_fdata() > 0) | (nib.load(os.path.join(src, "hippolr.nii.gz")).get_fdata() > 0)).astype(np.float32)
Z = 3  # perhalus grid 2 mm -> ±0,7 mm supaya permukaan tidak berundak
vol = gaussian_filter(zoom(vol, Z, order=1), 0.9 * Z)
verts, faces, _, _ = marching_cubes(vol, 0.4)
verts = nib.affines.apply_affine(img.affine, verts * (np.array(img.shape) - 1) / (np.array(vol.shape) - 1))
hip = trimesh.Trimesh(verts, faces[:, ::-1], process=True)
trimesh.smoothing.filter_taubin(hip, iterations=20)
if hip.volume < 0:
    hip.invert()

# MNI (x kanan, y depan, z atas) -> three.js (x kanan, y atas, z ke kamera = depan)
def to_three(m):
    v = m.vertices.copy()
    m.vertices = np.stack([v[:, 0], v[:, 2], v[:, 1]], 1)
    m.invert()  # tukar sumbu membalik orientasi segitiga
    return m
brain, hip = to_three(brain), to_three(hip)
c = brain.bounds.mean(0)
s = 2.0 / brain.extents.max()
for m in (brain, hip):
    m.apply_translation(-c)
    m.apply_scale(s)
brain.visual.vertex_colors = np.tile([236, 196, 190, 255], (len(brain.vertices), 1)).astype(np.uint8)
hip.visual.vertex_colors = np.tile([255, 190, 60, 255], (len(hip.vertices), 1)).astype(np.uint8)

scene = trimesh.Scene()
scene.add_geometry(brain, node_name="otak", geom_name="otak")
scene.add_geometry(hip, node_name="hipokampus", geom_name="hipokampus")
os.makedirs(os.path.dirname(out), exist_ok=True)
scene.export(out)
print("faces otak", len(brain.faces), "hipokampus", len(hip.faces))
print("pusat hipokampus (unit three):", hip.bounds.mean(0).round(3), "ukuran", hip.extents.round(3))
print("ukuran otak:", brain.extents.round(3))
print(os.path.abspath(out), os.path.getsize(out) // 1024, "KB")
