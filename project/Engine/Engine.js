import {MeshLoader} from "./MeshLoader.js";
import {UI} from "./UI/UI.js"
import {Button} from "./UI/Button.js"
import {LevelSelectButton} from "./UI/LevelSelectButton.js";
import {StartButton} from "./UI/StartButton.js";
import {ScreenButton} from "./UI/ScreenButton.js";
import {MainMenuButton} from "./UI/MainMenuButton.js";
/*
This is the Engine class of the SlingShot Engine. It loads up meshes from a Scene type object, and then computes
the physics, reads player input and renders the scene.
 */

// Common data among engine instances.
let ui;
// Edit this to add more levels. json files must be placed under the "Models" folder with their meshes.
let levels = ["level1.json", "level2.json", "level3.json"]
let levelNames = ["Standard Race", "Ramp Race", "Narrow Race"]
let offset = 0;
let last_update = 0;
let old_image = null;

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export class Engine {
    constructor(id) {
        // Constructor for the engine. It initializes everything it needs and obtains the webgl context.
        this.curr_time = 0;
        this.meshlist = []
        this.gl = null;
        this.time_offset = 0;
        this.scene_curr = null;
        console.debug("SlingShot Engine booting up...")
        this.canvas = document.getElementById(id);
        this.die = false;
        this.nextlevel = "";
        this.advance_timer = true;
        this.time_reset = false
        // A bunch of custom event listeners. loadlevel-pre prepares loadup of a new scene, while level_complete stops
        // the timer and then puts the player back to menu, while updating high scores.
        window.addEventListener('loadlevel_pre', async (e) => {
            this.die = true
            this.nextlevel = e.detail.scene
        })
        window.addEventListener('level_complete', async (e) => {
            this.advance_timer = false;
            let time = this.curr_time - this.time_offset
            // Safety countermeasure.
            if (time <= 0) {
                return;
            }
            ui.draw('18pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: 20
            }, "Level completed in " + time + "s.")
            // Data is saved in the localstorage.
            let s = localStorage.getItem("level")
            let best = localStorage.getItem(s);
            if (!best) {
                localStorage.setItem(s, "" + time)
            } else if (time < best) {
                localStorage.setItem(s, "" + time)
                console.debug(localStorage.getItem(s))
            }
            delay(5000).then(setTimeout(function () {
                window.location.reload();
            }, 1000));

        })
        this.gl = this.canvas.getContext("webgl", {antialias: true});
        /*
        Obtains the mirror canvas, used to render a different perspective. The drawingbuffer is preserved and
        manually reset in order to capture its contents and transpose them in a 2d-context canvas.
        */
        this.screen_canvas = document.getElementById("mirror")
        this.screen_gl = this.screen_canvas.getContext("webgl", {preserveDrawingBuffer: true})
        this.screen_enabled = false;
        // Checks whether or not opengl context is available.
        if (!this.gl) {
            alert("This browser does not support opengl acceleration.")
            return;
        }
        // Initializes the meshlist, and then creates a MeshLoader object to fill it up.
        this.meshlist = [];
        this.scene = null;
        this.loader = new MeshLoader(this.meshlist)
        this.ui = new UI("ui")
        ui = this.ui
        // Buttons definitions.
        this.btn = new LevelSelectButton("", {
            coordinates: {x: this.gl.canvas.width / 2, y: this.gl.canvas.height / 2},
            width: 500,
            height: 50
        }, ui.canvas, ui.ctx, levelNames)
        this.btn1 = new StartButton("Start", {
            coordinates: {
                x: this.gl.canvas.width / 2 - this.btn.geometry.width / 4 - 10,
                y: this.btn.geometry.height + this.gl.canvas.height / 2 + 10
            },
            width: 230,
            height: 50
        }, ui.canvas, ui.ctx, this.btn.idx, levels)
        this.btn2 = new ScreenButton({
            coordinates: {
                x: this.gl.canvas.width / 2 + this.btn.geometry.width / 4 + 10,
                y: this.btn.geometry.height + this.gl.canvas.height / 2 + 10
            },
            width: 230,
            height: 50
        }, ui.canvas, ui.ctx, "Screens OFF", "Screens ON")
        this.btnMain = new MainMenuButton("Quit", {coordinates: {x:100, y:25}, width:200, height:50}, ui.canvas, ui.ctx)
    }

    async generate_reflection() {
        /*
         Reflection generation routine. It takes the rendered image on the mirror canvas,
         puts it on a 2d context canvas and then uses it as a texture.
         */
        function addImageProcess(src) {
            /*
             This function returns a promise that is used to wait for texture loading time. If not used, as soon as
             something happens on the physics side, the loadtime increases just enough to make webgl panic and blank out
             the texture.
             */
            return new Promise((resolve, reject) => {
                let img = new Image()
                img.onerror = reject
                img.src = src
                img.onload = () => resolve(img)
            })
        }

        // On the main menu, there's no need to load mirror texture data.
        if (this.scene_curr.name === "menu") return this.gl.createTexture();
        // Read the pixels from the mirror canvas.
        let pixels = new Uint8Array(this.screen_gl.drawingBufferWidth * this.screen_gl.drawingBufferHeight * 4);
        this.screen_gl.readPixels(0, 0, this.screen_gl.drawingBufferWidth, this.screen_gl.drawingBufferHeight, this.screen_gl.RGBA, this.screen_gl.UNSIGNED_BYTE, pixels);
        // Obtain 2d canvas and context
        let canvas = document.getElementById("2d")
        let context = canvas.getContext("2d")
        // Blank out the 2d canvas
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)
        var idata = context.createImageData(canvas.width, canvas.height);
        idata.data.set(pixels)
        context.putImageData(idata, 0, 0)
        // Obtain base64 image url and then load it up as an image.
        let dataUri = canvas.toDataURL();
        let image = await addImageProcess(dataUri)

        // Create a texture.
        const texture = this.gl.createTexture();
        // Bind it to the webgl context (since it has to be rendered there)
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        // Attempts to obtain texture
        try {
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            /*
            If an error occurs during texture initialization, it means that for whatever reason the image wasn't ready.
            As a contermeasure, the last image that was rendered is used.
             */

            if (this.gl.getError() !== 0) {
                console.debug(image)
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
            } else {
                old_image = image
            }
            // Applies linear texture filtering and sets up the texture wrapping.
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            // Clears the webgl_screen canvas.
            this.screen_gl.clear(this.screen_gl.DEPTH_BUFFER_BIT | this.screen_gl.COLOR_BUFFER_BIT);
        } catch (e) {
            console.debug("Image not ready for reflection...")
        }
        return texture;
    }

    async load_scene(scene) {
        // Sets internal and current scene as the ones that are provided.
        this.scene = scene;
        this.scene_curr = scene;
        ui.draw('14pt Calibri', "red", {
            x: this.gl.canvas.width / 2,
            y: this.gl.canvas.height / 2 + 150
        }, "Now loading level... Please wait.")
        console.debug(" Loading scene...")
        for (const obj of scene.objs) {
            // Loads up the meshes using the MeshLoader object.
            await this.loader.load(obj.path, this.gl, this.screen_gl, obj.player, obj.active, obj.coords, obj.alias, obj.collider, obj.screen)
        }
        console.debug(" Scene loaded.")
        this.time_reset = true
    }

    render = async (time = 0) => {
        /*
        This method is called as frequently as possible using the requestAnimationFrame function.
         */

        // Puts an offset to time in order to ensure that it starts at 0 when level is fully loaded.
        if(this.time_reset){
            if(time!==0){
                if (this.scene_curr.name !== "menu") {
                    console.debug("Not on main menu")
                    this.btn.disable()
                    this.btn1.disable()
                    this.btn2.disable()
                    this.btnMain.enable()
                } else {
                    this.btn.enable()
                    this.btn1.enable()
                    this.btn2.enable()
                    this.btnMain.disable()
                }
                this.time_reset = false
                this.time_offset = time
            }
        }
        // Update selected level id
        this.btn1.levelId = this.btn.idx;
        // Create wsgl programs for both screen and non-screen context
        let program = webglUtils.createProgramFromScripts(this.gl, ["3d-vertex-shader", "3d-fragment-shader"])
        let program2 = webglUtils.createProgramFromScripts(this.screen_gl, ["3d-vertex-shader", "3d-fragment-shader"])
        // Compute camera coords.
        let camera_coords = this.find_actor_coords()
        if (!this.die) {
            // Main rendering loop.
            this.gl.useProgram(program);
            let reflection = null
            if (this.screen_enabled) {
                // If screens are enabled, then the 2nd camera POV is computed.
                let screens = this.find_screens()
                reflection = await this.generate_reflection()
                this.screen_gl.useProgram(program2);
                await this.meshlist.forEach(elem => {
                    if(elem.collider==="death"){
                        return;
                    }
                    // The elements are rendered with camera settings override.
                    elem.render(this.screen_gl, {
                        ambientLight: [0.2, 0.2, 0.2],
                        colorLight: [1.0, 1.0, 1.0]
                    }, program2, camera_coords, null, (screens ? screens[0] : {
                        position: {
                            x: 1,
                            z: 3.5,
                            y: -11
                        }
                    }), true);
                })
            }
            // Renders the entire scene from the player's POV.
            await this.meshlist.forEach(elem => {
                // If mirrors are disabled, they do not get rendered.
                if (elem.mirror && !this.screen_enabled) {
                    return;
                }
                elem.render(this.gl, {
                    ambientLight: [0.2, 0.2, 0.2],
                    colorLight: [1.0, 1.0, 1.0]
                }, program, camera_coords, reflection);
            })
            if (this.scene_curr.name !== "menu") {
                // UI control for level mode

                this.screen_enabled = localStorage.getItem("mirrors") === "true"
                if (this.advance_timer) {
                    this.curr_time = time - this.time_offset;
                }
                ui.clear()
                this.btnMain.draw();
                ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 20}, this.scene_curr.name)
                ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 40}, ((this.curr_time) / 1000).toFixed(3))
                if (!this.advance_timer) {
                    ui.draw('18pt Calibri', "red", {x: this.gl.canvas.width / 2, y: 60}, "Level complete!")
                }
            } else {
                // Ui control for main menu.
                localStorage.setItem("level", levels[this.btn1.levelId])
                this.screen_enabled = this.btn2.value;
                if (this.screen_enabled) {
                    localStorage.setItem("mirrors", "true")
                } else {
                    localStorage.setItem("mirrors", "false")
                }
                ui.clear()
                this.btn.draw()
                this.btn1.draw()
                this.btn2.draw()
                offset = time
                ui.draw('14pt Calibri', "black", {
                    x: this.gl.canvas.width / 2,
                    y: this.gl.canvas.height / 2 - 30
                }, "Click on the button below to choose a level, then click on start.")
                let best = localStorage.getItem(levels[this.btn1.levelId])
                if (best) {
                    ui.draw('14pt Calibri', "black", {
                        x: this.gl.canvas.width / 2,
                        y: this.gl.canvas.height / 2 + 120
                    }, "Your best time is " + (best / 1000).toFixed(3) + "s")
                }

                ui.draw('14pt Calibri', "black", {
                    x: this.gl.canvas.width / 2,
                    y: this.gl.canvas.height - 30
                }, "Powered by SlingShot Engine, developed by Lorenzo Balugani.")
                ui.draw('14pt Calibri', "black", {
                    x: this.gl.canvas.width / 2,
                    y: this.gl.canvas.height - 15
                }, "This is not a commercial product. The hamsterball trademark is property of Raptisoft.")
            }
        }
        // Finds the player
        let actor = this.find_actor()
        // Checks for user input
        if(actor){
            actor.pc.handler()
            // Computes physics if necessary, ideally each 16 ms.
            if (this.scene_curr.phys && !this.die && time - last_update > 16) {
                actor.compute_phys(this.meshlist)
                last_update = time
            }
        }

        if (!this.die) {
            // Queues up for next frame
            this.animId = window.requestAnimationFrame(this.render)
        } else {
            // Engine SIGTERM handler
            console.debug("Killing engine...")
            window.dispatchEvent(new CustomEvent('loadlevel', {detail: {scene: this.nextlevel}}))
            this.meshlist = []
            this.curr_time = -1
            this.btn1.enabled = this.btn2.enabled = this.btn.enabled = this.btnMain.enabled = false
            window.cancelAnimationFrame(this.animId)
        }

    }

    // Utility functions

    find_actor() {
        let actor = null;
        for (let i = 0; i < this.meshlist.length; i++) {
            if (this.meshlist[i].isPlayer) {
                actor = this.meshlist[i]
                break;
            }
        }
        return actor;
    }

    find_screens() {
        let screens = [];
        for (let i = 0; i < this.meshlist.length; i++) {
            if (this.meshlist[i].screen) {
                screens.push(this.meshlist[i])
            }
        }
        return screens;
    }

    find_actor_coords() {
        let actor = this.find_actor()
        if (!actor) {
            return [0, 0, 0]
        }
        return [actor.position.z, actor.position.x, actor.position.y]
    }


}