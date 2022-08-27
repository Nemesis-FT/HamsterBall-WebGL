bl_info = {
    "name": "SlingShot Exporter",
    "author": "Lorenzo Balugani",
    "version": (1, 1),
    "blender": (2, 80, 0),
    "location": "View3D > Toolbar > Object Adder",
    "description": "Exports selected meshes as a SlingShot Engine level",
    "warning": "",
    "wiki_url": "",
    "category": "SlingShot Exporter",
}

import bpy
import os
import json


import bpy

from bpy.props import (StringProperty, BoolProperty,
                       PointerProperty,
                       )

from bpy.types import (Panel,
                       PropertyGroup,
                       )


# ------------------------------------------------------------------------
#    Scene Properties
# ------------------------------------------------------------------------

class MyProperties(PropertyGroup):

    name: StringProperty(
        name="Scene name?",
        description="Name of the scene for the SlingShotLevel",
        default="scene.json",
        maxlen=1024,
    )
    phys: BoolProperty(
        name="Run Phys sim?",
        description="A bool property",
        default = True
    )



# ------------------------------------------------------------------------
#    Panel in Object Mode
# ------------------------------------------------------------------------

class OBJECT_PT_CustomPanel(Panel):
    bl_label = "SlingShot Exporter"
    bl_idname = "OBJECT_PT_custom_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "SlingShot Exporter"
    bl_context = "objectmode"

    @classmethod
    def poll(self,context):
        return context.object is not None

    def draw(self, context):
        layout = self.layout
        scene = context.scene
        mytool = scene.my_tool

        layout.prop(mytool, "name")
        layout.prop(mytool, "phys")
        layout.separator()
        row = layout.row()
        row.operator("wm.myop", icon='CUBE', text="Export")

class WM_OT_myOp(bpy.types.Operator):
    """Open the scene creation wizard"""
    bl_label = "Set scene name"
    bl_idname = "wm.myop"

    text = bpy.props.StringProperty(name="Enter Name", default="scene.json")

    def execute(self, context):

        # export to blend file location
        basedir = os.path.dirname(bpy.data.filepath)

        if not basedir:
            raise Exception("Blend file is not saved")

        view_layer = bpy.context.view_layer

        obj_active = view_layer.objects.active
        selection = bpy.context.selected_objects
        scenedata = {"name": context.scene.my_tool.name, "phys": context.scene.my_tool.phys, "objs": []}

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
                "alias": name,
                "path": "Models/" + name + ".obj",
                "player": "true" if name.startswith("Player") else "false",
                "active": "true" if name.startswith("Player") else "false",
                "screen": "true" if name.startswith("Screen") else "false",
                "collider": collider,
                "coords": {"x": obj.location[0], "y": obj.location[1] * -1 if name == "Player" else obj.location[1],
                           "z": obj.location[2]}
            })

            bpy.ops.export_scene.obj(filepath=fn + ".obj", use_selection=True)

            obj.select_set(False)

        fn = os.path.join(basedir, context.scene.my_tool.name+".json")
        with open(fn, 'w') as f:
            json.dump(scenedata, f)

        view_layer.objects.active = obj_active

        for obj in selection:
            obj.select_set(True)
        return {"FINISHED"}

# ------------------------------------------------------------------------
#    Registration
# ------------------------------------------------------------------------

classes = (
    MyProperties,
    OBJECT_PT_CustomPanel,
    WM_OT_myOp
)

def register():
    from bpy.utils import register_class
    for cls in classes:
        register_class(cls)

    bpy.types.Scene.my_tool = PointerProperty(type=MyProperties)

def unregister():
    from bpy.utils import unregister_class
    for cls in reversed(classes):
        unregister_class(cls)
    del bpy.types.Scene.my_tool


if __name__ == "__main__":
    register()
