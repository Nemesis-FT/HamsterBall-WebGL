import bpy
import os
import json

# export to blend file location
basedir = os.path.dirname(bpy.data.filepath)

if not basedir:
    raise Exception("Blend file is not saved")

view_layer = bpy.context.view_layer

obj_active = view_layer.objects.active
selection = bpy.context.selected_objects
scenedata = {"name":"Level", "objs":[]}


bpy.ops.object.select_all(action='DESELECT')

for obj in selection:

    obj.select_set(True)
    # some exporters only use the active object
    view_layer.objects.active = obj

    name = bpy.path.clean_name(obj.name)
    fn = os.path.join(basedir, name)
    collider = "box"
    if name.startswith("Ramp"):
        collider = "ramp"
    elif name.startswith("DeathPlane"):
        collider = "death"
    elif name.startswith("Skybox"):
        collider = "skybox"
    elif name.startswith("Goal"):
        collider = "goal"
    scenedata["objs"].append({
        "alias":name,
        "path":"Models/"+name+".obj",
        "player": "true" if name=="Player" else "false",
        "active": "true" if name=="Player" else "false",
        "collider": collider,
        "coords": {"x": obj.location[0], "y":obj.location[1]*-1 if name=="Player" else obj.location[1], "z": obj.location[2]}
    })

    bpy.ops.export_scene.obj(filepath=fn + ".obj", use_selection=True)

    obj.select_set(False)

fn = os.path.join(basedir, "scene.json")
with open(fn, 'w') as f:
    json.dump(scenedata, f)

view_layer.objects.active = obj_active

for obj in selection:
    obj.select_set(True)