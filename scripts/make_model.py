"""
Membuat contoh model 3D .glb (molekul air, H2O) -> public/models/molekul-air.glb
Contoh cara memakai file .glb di kit ini. Model dari internet (Sketchfab, Poly Pizza, NASA)
dipakai dengan cara yang sama: taruh di public/models/ lalu <Model src="models/nama.glb" />.
Jalankan: pip install trimesh numpy  lalu  python scripts/make_model.py
"""
import os

import numpy as np
import trimesh

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "models")
os.makedirs(OUT, exist_ok=True)

# geometri asli H2O: ikatan O-H 0,96 Å, sudut H-O-H 104,5° (di sini diskalakan 1 Å = 1 unit)
angle = np.radians(104.5)
d = 0.96 * 1.15
h1 = np.array([np.sin(angle / 2) * d, -np.cos(angle / 2) * d, 0.0])
h2 = np.array([-np.sin(angle / 2) * d, -np.cos(angle / 2) * d, 0.0])
o = np.zeros(3)


def colored(mesh, rgba):
    mesh.visual.vertex_colors = np.tile(np.array(rgba, dtype=np.uint8), (len(mesh.vertices), 1))
    return mesh


parts = []
oxy = trimesh.creation.icosphere(subdivisions=4, radius=0.52)
parts.append(colored(oxy, [235, 64, 52, 255]))
for h in (h1, h2):
    s = trimesh.creation.icosphere(subdivisions=4, radius=0.32)
    s.apply_translation(h)
    parts.append(colored(s, [245, 245, 245, 255]))
    bond = trimesh.creation.cylinder(radius=0.09, segment=[o, h], sections=32)
    parts.append(colored(bond, [190, 196, 206, 255]))

scene = trimesh.Scene()
names = ["oksigen", "hidrogen-1", "ikatan-1", "hidrogen-2", "ikatan-2"]
for name, m in zip(names, parts):
    scene.add_geometry(m, node_name=name, geom_name=name)
path = os.path.join(OUT, "molekul-air.glb")
scene.export(path)
print("model dibuat:", os.path.abspath(path), os.path.getsize(path), "byte")
