import {MeshLoader} from "./MeshLoader.js";
import {UI} from "./UI/UI.js"
import {Button} from "./UI/Button.js"
import {LevelSelectButton} from "./UI/LevelSelectButton.js";
import {StartButton} from "./UI/StartButton.js";
import {ScreenButton} from "./UI/ScreenButton.js";


let ui;
let btn
let btn1
let btn2
let levels = ["level1.json", "level2.json"]
let offset = 0;
let last_update = 0;
let old_reflection = null;
let old_image = null;
let flag

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
}

export class Engine {
    constructor(id) {
        this.curr_time = 0;
        this.meshlist = []
        this.gl = null;
        this.ext = null;
        this.time_offset = 0;
        this.scene_curr = null;
        this.code = Math.floor(Math.random() * 10);
        console.debug("SlingShot Engine booting up...")
        this.canvas = document.getElementById(id);
        this.die = false;
        this.nextlevel = "";
        this.advance_timer = true;
        window.addEventListener('loadlevel_pre', async (e) => {
            this.die = true
            this.nextlevel = e.detail.scene
        })
        window.addEventListener('level_complete', async (e) => {
            this.advance_timer = false;
            let time = this.curr_time - this.time_offset
            if (time === 0) {
                return;
            }
            ui.draw('18pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: 20
            }, "Level completed in " + time + "s.")
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
        this.mirror_canvas = document.getElementById("mirror")
        this.mirror_gl = this.mirror_canvas.getContext("webgl", {preserveDrawingBuffer: true})
        this.mirror_enabled = false;

        if (!this.gl) {
            alert("This browser does not support opengl acceleration.")
            return;
        }
        this.meshlist = [];
        this.scene = null;
        this.loader = new MeshLoader(this.meshlist)
        this.ui = new UI("ui")
        ui = this.ui
        this.btn = new LevelSelectButton("", {
            coordinates: {x: this.gl.canvas.width / 2, y: this.gl.canvas.height / 2},
            width: 500,
            height: 50
        }, ui.canvas, ui.ctx, ["Standard Race", "Ramp Race"])
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
    }

    async generate_reflection() {

        function addImageProcess(src){
            return new Promise((resolve, reject) => {
                let img = new Image()
                img.onerror = reject
                img.src = src
                img.onload = () => resolve(img)
            })
        }

        function flipImage(image, ctx, flipH, flipV) {
            var scaleH = flipH ? -1 : 1, // Set horizontal scale to -1 if flip horizontal
                scaleV = flipV ? -1 : 1, // Set verical scale to -1 if flip vertical
                posX = flipH ? ctx.canvas.width * -1 : 0, // Set x position to -100% if flip horizontal
                posY = flipV ? ctx.canvas.height * -1 : 0; // Set y position to -100% if flip vertical

            ctx.save(); // Save the current state
            ctx.scale(scaleH, scaleV); // Set scale to flip the image

            ctx.drawImage(image, posX, posY, ctx.canvas.width, ctx.canvas.height); // draw the image
            ctx.restore(); // Restore the last saved state
        };

        if (this.scene_curr.name === "menu") return this.gl.createTexture();
        let pixels = new Uint8Array(this.mirror_gl.drawingBufferWidth * this.mirror_gl.drawingBufferHeight * 4);
        this.mirror_gl.readPixels(0, 0, this.mirror_gl.drawingBufferWidth, this.mirror_gl.drawingBufferHeight, this.mirror_gl.RGBA, this.mirror_gl.UNSIGNED_BYTE, pixels);


        let canvas = document.getElementById("2d")
        let context = canvas.getContext("2d")
        context.fillRect(0,0, context.canvas.width, context.canvas.height)
        context.scale(-1, 1);
        var idata = context.createImageData(canvas.width, canvas.height);
        idata.data.set(pixels)
        context.putImageData(idata, 0, 0)

        //var dataUri_pre = canvas.toDataURL();
        //let image_pre = await addImageProcess(dataUri_pre)
        //flipImage(image_pre, context, 1, 0)
        let dataUri = canvas.toDataURL();
        let image = await addImageProcess(dataUri)


        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = this.gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType, pixel);

        try {
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
            if (this.gl.getError() !== 0) {
                console.debug(image)
                this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, old_image);
            } else {
                old_image = image
            }
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.mirror_gl.clear(this.mirror_gl.DEPTH_BUFFER_BIT | this.mirror_gl.COLOR_BUFFER_BIT);
        }
        catch (e){

        }
        return texture;

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }
    }

    async load_scene(scene) {
        this.scene = scene;
        this.scene_curr = scene;
        console.debug(" Loading scene...")
        for (const obj of scene.objs) {
            await this.loader.load(obj.path, this.gl, this.mirror_gl, obj.player, obj.active, obj.coords, obj.alias, obj.collider, obj.screen)
        }
        console.debug(" Scene loaded.")
    }

    render = async (time = 0) => {
        //this.generate_reflection()
        if (time === 0) {
            if (this.scene_curr.name !== "menu") {
                this.btn.disable()
                this.btn1.disable()
                this.btn2.disable()
            } else {
                this.btn.enable()
                this.btn1.enable()
                this.btn2.enable()
            }
        }
        this.btn1.levelId = this.btn.idx;

        let program = webglUtils.createProgramFromScripts(this.gl, ["3d-vertex-shader", "3d-fragment-shader"])
        let program2 = webglUtils.createProgramFromScripts(this.mirror_gl, ["3d-vertex-shader", "3d-fragment-shader"])
        let flag = false

        this.delta = time - this.curr_time;
        let camera_coords = this.find_actor_coords()
        if (!this.die) {
            this.gl.useProgram(program);
            let reflection = null
            if (this.mirror_enabled) {
                let screens = this.find_screens()
                reflection = await this.generate_reflection()
                this.mirror_gl.useProgram(program2);
                await this.meshlist.forEach(elem => {
                    elem.render(this.delta, this.mirror_gl, {
                        ambientLight: [0.2, 0.2, 0.2],
                        colorLight: [1.0, 1.0, 1.0]
                    }, program2, camera_coords, null, (screens ? screens[0]:{position:{x:1,z:3.5,y:-11}}), true);
                })
            }
            await this.meshlist.forEach(elem => {
                if(elem.mirror && !this.mirror_enabled){
                    return;
                }
                elem.render(this.delta, this.gl, {
                    ambientLight: [0.2, 0.2, 0.2],
                    colorLight: [1.0, 1.0, 1.0]
                }, program, camera_coords, reflection);
            })

        }
        let actor = this.find_actor()
        actor.pc.handler()
        if (this.scene_curr.phys && !this.die && time - last_update > 16) {
            actor.compute_phys(this.meshlist)
            last_update = time
        }
        if (this.scene_curr.name !== "menu") {
            this.mirror_enabled = localStorage.getItem("mirrors") === "true"
            if (this.advance_timer) {
                this.curr_time = time - offset;
            }
            ui.clear()
            ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 20}, this.scene_curr.name)
            ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 40}, ((this.curr_time) / 1000).toFixed(3))
            if (!this.advance_timer) {
                ui.draw('18pt Calibri', "red", {x: this.gl.canvas.width / 2, y: 60}, "Level complete!")
            }
        } else {
            localStorage.setItem("level", levels[this.btn1.levelId])
            this.mirror_enabled = this.btn2.value;
            if (this.mirror_enabled) {
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
            }, "Powered by SlingShot Engine.")
            ui.draw('14pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: this.gl.canvas.height - 15
            }, "This program and its engine were developed by Lorenzo Balugani.")
            ui.draw('14pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: this.gl.canvas.height
            }, "This is not a commercial product. The hamsterball trademark is property of Raptisoft.")
        }
        if (!this.die) {
            this.animId = window.requestAnimationFrame(this.render)
        } else {
            console.debug("Killing engine...")

            window.dispatchEvent(new CustomEvent('loadlevel', {detail: {scene: this.nextlevel}}))
            this.meshlist = []
            this.curr_time = -1
            window.cancelAnimationFrame(this.animId)
        }

    }

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

    find_screens(){
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
        if (this.scene_curr.name !== "menu") {
            return [actor.mesh.positions[0], actor.mesh.positions[1], actor.mesh.positions[2]]
        }
        return [actor.position.x, actor.position.z, actor.position.y]
    }


}