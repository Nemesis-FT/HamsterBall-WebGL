import {PlayerController} from "./PlayerController.js";

/*
    The PhysObject class is the abstraction that joins meshes with physics and user interaction, and also
    handles rendering for the object itself.
 */
export class PhysObject {
    constructor(mesh, alias, isActive, isPlayer, offsets, collider, screen) {
        // Save mesh data
        this.mesh = mesh;
        // Set the alias, an ideally unique name.
        this.alias = alias;
        // Is this an active phys object (e.g. is it affected by gravity?)
        this.isActive = isActive === "true";
        // Speed, positions etc.
        this.speed = {x: 0.0, y: 0.0, z: 0.0};
        this.accel = {x: 0.0, y: 0.0, z: 0.0};
        this.position = {x: offsets.x, y: offsets.y, z: offsets.z}
        this.offsets = offsets
        this.positions = this.mesh.positions
        this.translation = {x:0, y:0, z:0}
        // Is this a player-controllable object (an actor)?
        this.isPlayer = isPlayer === "true";
        // What kind of collider does this object have?
        this.collider = collider
        this.level_over = false;
        this.rotation = {x: 0, y: 0}
        // Is this a screen?
        this.screen = screen === "true";
        if (!this.isActive)
            // If object is static, mesh bounds are pre-calculated.
            this.boundingBox = this.compute_bounds()
        if (this.isPlayer) {
            // If object is player-controllable, a controller is created.
            this.pc = new PlayerController(this)
        }
    }

    compute_phys(physobjs) {
        // Compute phys routine. If object is active, it checks for collisions and applies the correct forces to it.
        if (this.isActive) {
            let check = this.is_colliding(physobjs)
            this.accel.y = -0.001;

            if (check.coll) {
                if (check.ramp) {
                    // Add fake gravity effect on slope
                    this.accel.z = 0.0005
                    this.accel.y = 0;
                }
                if (check.data.y.top && this.accel.y >= 0) {
                    this.accel.y = this.speed.y = 0
                }
                if (check.data.y.bottom && this.accel.y <= 0) {
                    this.accel.y = this.speed.y = 0
                }
                if (check.data.x.bottom) {
                    this.accel.x = this.speed.x = this.speed.z = this.accel.z = 0
                }
                // Attrition calculation
                let attrition = 0.00004;
                if (this.accel.x < -attrition && check.coll) {
                    this.accel.x += attrition;
                } else if (this.accel.x > attrition) {
                    this.accel.x -= attrition;
                } else if (this.accel.x > -attrition && this.accel.x < attrition) {
                    this.speed.x = this.accel.x = 0;
                }
                if (this.accel.z < -attrition) {
                    this.accel.z += attrition;
                } else if (this.accel.z > attrition) {
                    this.accel.z -= attrition;
                } else if (this.accel.z > -attrition && this.accel.z < attrition) {
                    this.speed.z = this.accel.z = 0;
                }
            } else {
                this.accel.y = -0.001;
            }

            // Final speed calculations

            this.speed.x += this.accel.x;
            this.speed.y += this.accel.y;
            this.speed.z += this.accel.z;
            let bounds = this.compute_bounds()
            this.position.x = ((bounds.max.x + bounds.min.x) / 2) + this.speed.x;
            this.position.y = ((bounds.max.y + bounds.min.y) / 2) + this.speed.y;
            this.position.z = ((bounds.max.z + bounds.min.z) / 2) + this.speed.z;
            this.translation.x += this.speed.x;
            this.translation.y += this.speed.y;
            this.translation.z += this.speed.z;
        }
    }

    is_colliding(physobjs) {
        // Main collision check routine
        let res = this.compute_bounds()
        let coll = false
        let colliders = [];
        let ramp = false;
        //console.debug(this.position, res)
        for (const obj in physobjs) {
            let target
            // Lookup or compute object bounds
            if (physobjs[obj].isPlayer) {
                target = physobjs[obj].compute_bounds()

            } else {
                target = physobjs[obj].boundingBox;
            }
            // If the object is active and is not the current object
            if (physobjs[obj].alias !== this.alias && this.isActive) {
                // If its within the correct bounds and is not a skybox or a deathplane...

                if ((res.min.x <= target.max.x && res.max.x >= target.min.x) &&
                    (res.min.y <= target.max.y && res.max.y >= target.min.y) &&
                    (res.min.z <= target.max.z && res.max.z >= target.min.z)) {
                    // Add object to collider list
                    colliders.push(physobjs[obj])
                    // Set flag to true
                    coll = true;
                    if (physobjs[obj].collider === "ramp") {
                        // If element is a ramp, compute the angular coefficient and limit Y of object
                        let angular = (target.max.y - target.min.y) / (target.min.z - target.max.z)
                        let y_in_point = angular * res.min.z + target.max.y + 0.5;
                        if (res.min.y <= y_in_point) {
                            // If beyond limit Y of slope, put it on top of it.
                            this.translation.y += y_in_point - res.min.y;
                            this.position.y += y_in_point -res.min.y;
                            // Set flag to true
                            ramp = true;
                        } else {
                            colliders.pop();
                            coll = false;
                        }

                    }
                    if (physobjs[obj].collider === "goal") {
                        // If its touching a goal, then end the level
                        if (physobjs[obj].boundingBox.max.y < this.position.y && !this.level_over) {
                            this.level_over = true;
                            window.dispatchEvent(new CustomEvent('level_complete'))
                        }
                    }

                }
                if (physobjs[obj].collider === "death" && target.min.y > res.min.y) {
                    // If its beyond the deathplane, reload the level (keep the timer intact).
                    let scene = localStorage.getItem("level")
                    window.dispatchEvent(new CustomEvent('loadlevel_pre', {detail: {scene: scene}}))
                }
            }
        }
        let data = {x: {top: false, bottom: false}, y: {top: false, bottom: false}, z: {top: false, bottom: false}}
        for (const obj in colliders) {
            // Attempt to precise collision detection (which axis is colliding?)
            if (colliders[obj].collider === "box") {
                if (colliders[obj].position.y <= this.position.y) {
                    data.y.bottom = true;
                }
                if (colliders[obj].position.y > this.position.y) {
                    data.y.top = true;
                }
                if (colliders[obj].boundingBox.max.y > this.position.y) {
                    data.x.top = data.x.bottom = data.z.top = data.z.bottom = true;
                    data.y.top = data.y.bottom = false;
                }
            } else {
                data.y.bottom = true;
            }
        }
        return {
            coll: coll
            ,
            data: data, ramp
        };
    }

    compute_bounds() {
        // Function that computes the bounds of an object.
        if (this.isPlayer) {
            return {
                max: {x: this.position.x+1, y: this.position.y+1, z: this.position.z+1},
                min: {x: this.position.x-1, y: this.position.y-1, z: this.position.z-1}
            }
        }
        let xpos = []
        let ypos = []
        let zpos = []
        let i = 0;
        while (i < this.positions.length) {
            zpos.push(this.positions[i])
            ypos.push(this.positions[i + 2])
            xpos.push(this.positions[i + 1])
            i = i + 3;
        }
        return {
            max: {x: Math.max(...xpos), y: Math.max(...ypos), z: Math.max(...zpos)},
            min: {x: Math.min(...xpos), y: Math.min(...ypos), z: Math.min(...zpos)}
        }
    }

    render(gl, light, program, tar, mirrorText, camera_override = null, mirror_mode = false, rotation) {
        let positionLocation = gl.getAttribLocation(program, "a_position");
        let normalLocation = gl.getAttribLocation(program, "a_normal");
        let texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
        // Binds and creates the position buffer for this object.
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.positions), gl.STATIC_DRAW);
        // Binds and creates the normals buffer for this object.
        this.normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.normals), gl.STATIC_DRAW);
        // Binds and creates the texture coordinates buffer for this object.
        this.texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.text_coords), gl.STATIC_DRAW);
        // Sets up the diffuse, ambient, specular, emissive, light properties, shininess and opacity of the object. If none are found, default values are loaded.
        gl.uniform3fv(gl.getUniformLocation(program, "diffuse"), (this.mesh.diffuse ? this.mesh.diffuse : [0.8, 0.8, 0.8]));
        gl.uniform3fv(gl.getUniformLocation(program, "ambient"), (this.mesh.ambient ? this.mesh.ambient : [1, 1, 1]));
        gl.uniform3fv(gl.getUniformLocation(program, "specular"), (this.mesh.specular ? this.mesh.specular : [0.5, 0.5, 0.5]));
        gl.uniform3fv(gl.getUniformLocation(program, "emissive"), (this.mesh.emissive ? this.mesh.emissive : [0, 0, 0]));
        gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight"), light.ambientLight);
        gl.uniform3fv(gl.getUniformLocation(program, "u_colorLight"), light.colorLight);
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), (this.mesh.shininess ? this.mesh.shininess : 359.999993));
        gl.uniform1f(gl.getUniformLocation(program, "opacity"), (this.mesh.opacity ? this.mesh.opacity : 1.45));
        // Enables the positionbuffer
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        const size = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        // Sets up buffer attributes.
        gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
        // Enables the normal buffer
        gl.enableVertexAttribArray(normalLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);
        // Enables the textcoord buffer
        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.vertexAttribPointer(texcoordLocation, size - 1, type, normalize, stride, offset);
        // Sets up the field of view
        let fieldOfViewRadians = degToRad(70);

        // Calculates the aspect ratio and computes the projection matrix
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let zmin = 0.1;
        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, 2000);
        // Sets up the camera position with an offset and as a target the player.
        let cameraPosition = [4.5 + tar[0], -4.5 + tar[1], 4.5 + tar[2]];
        let up = [0, 0, 1];

        let cameraMatrix = null;
        if (camera_override) {
            // Overrides the camera matrix, with custom values (e.g. a camera that's not the default one)
            cameraMatrix = m4.lookAt([camera_override.position.x, camera_override.position.z, camera_override.position.y * -1], tar, up);

        } else {
            cameraMatrix = m4.lookAt(cameraPosition, tar, up);
        }

        // The view matrix is obtained by inversion of the camera matrix
        let viewMatrix = m4.inverse(cameraMatrix);

        // Set uniforms in shader program.
        let matrixLocation = gl.getUniformLocation(program, "u_world");
        let textureLocation = gl.getUniformLocation(program, "diffuseMap");
        let viewMatrixLocation = gl.getUniformLocation(program, "u_view");
        let projectionMatrixLocation = gl.getUniformLocation(program, "u_projection");
        let lightWorldDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
        let viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");

        gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        // Sets light position
        gl.uniform3fv(lightWorldDirectionLocation, m4.normalize([-100, 300, 500]));
        // Sets rotation matrix
        if(rotation) {
            const rotMatX = m4.xRotation(this.translation.x * -1);
            const rotMatZ = m4.yRotation(this.translation.z);
            const rotMat = m4.multiply(rotMatX, rotMatZ);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_normalMatrix'), false, rotMat)
        }
        else{
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_normalMatrix'), false, m4.identity())
        }
        // Sets offsets
        if(this.isPlayer){
            gl.uniform3fv(gl.getUniformLocation(program, "offsets"), [this.offsets.x, this.offsets.z, this.offsets.y])
        }
        else{
            gl.uniform3fv(gl.getUniformLocation(program, "offsets"), [0, 0, 0])
        }



        // Sets the camera position
        gl.uniform3fv(viewWorldPositionLocation, cameraPosition);

        // Tell the shader to use texture unit 0 for diffuseMap
        gl.uniform1i(textureLocation, 0);
        // Sets up translation vector
        let translation = gl.getUniformLocation(program, "translation")
        if (this.isPlayer) {
            gl.uniform3f(translation, this.translation.z, this.translation.x, this.translation.y)
        }
        else{
            gl.uniform3f(translation, 0, 0, 0)
        }

        function degToRad(d) {
            return d * Math.PI / 180;
        }

        let vertNumber = this.mesh.numVertices;
        // Call to drawScene
        drawScene(this.mesh, this.screen, mirrorText)

        function drawScene(mesh, mirror, mirrorText) {
            // Draw the scene, using textures and binding them when's appropriate.
            if (mirror) {
                gl.bindTexture(gl.TEXTURE_2D, mirrorText);
            } else {
                if (!mirror_mode) {
                    gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, mesh.texture_mirror);
                }

            }
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.enable(gl.DEPTH_TEST);

            let matrix = m4.identity();

            gl.uniformMatrix4fv(matrixLocation, false, matrix);
            // Draw arrays contents on the canvas.
            gl.drawArrays(gl.TRIANGLES, 0, vertNumber);
        }
    }
}
