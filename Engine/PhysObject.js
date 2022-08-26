import {PlayerController} from "./PlayerController.js";
export class PhysObject {
    constructor(mesh, alias, isActive, isPlayer, offsets, collider) {
        this.mesh = mesh;
        this.alias = alias;
        this.isActive = isActive === "true";
        this.speed = {x: 0.0, y: 0.0, z: 0.0};
        this.accel = {x: 0.0, y: 0.0, z: 0.0};
        this.position = {x: offsets.x, y: offsets.y, z: offsets.z}
        this.positions = this.mesh.positions
        this.isPlayer = isPlayer === "true";
        this.collider = collider
        this.level_over = false;
        this.mirror = alias === "Mirror";
        if(!this.isActive)
            this.boundingBox = this.compute_bounds()
        if (this.isPlayer) {
            this.pc = new PlayerController(this)
        }
        this.rotationRads = {x:0, y:0}
        //this.compute_position()
    }

    compute_phys(physobjs) {
        if (this.isActive) {
            let check = this.is_colliding(physobjs)
            this.accel.y = -0.001;

            if (check.coll) {
                if (check.ramp) {
                    this.accel.z = 0.0005
                    this.accel.y = 0;
                }
                if (check.data.y.top && this.accel.y >= 0) {
                    this.accel.y = this.speed.y = 0
                }
                if (check.data.y.bottom && this.accel.y <= 0) {
                    this.accel.y = this.speed.y = 0
                }
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
            //console.debug(this.position.y, this.compute_bounds().min.y)
            this.speed.x += this.accel.x;
            this.speed.y += this.accel.y;
            this.speed.z += this.accel.z;
            let bounds = this.compute_bounds()
            this.position.x = (bounds.max.x+bounds.min.x)/2;
            this.position.y = (bounds.max.y+bounds.min.y)/2;
            this.position.z = (bounds.max.z+bounds.min.z)/2;
            let i = 0;
            while (i < this.mesh.positions.length) {
                this.mesh.positions[i] += parseFloat(this.speed.z);
                this.mesh.positions[i + 1] += parseFloat(this.speed.x);
                this.mesh.positions[i + 2] += parseFloat(this.speed.y);
                i = i + 3;
            }
        }
    }

    is_colliding(physobjs) {
        let res = this.compute_bounds()
        let coll = false
        let colliders = [];
        let ramp = false;
        for (const obj in physobjs) {

            let target
            if (physobjs[obj].isPlayer){
                target = physobjs[obj].compute_bounds()
            }
            else{
                target = physobjs[obj].boundingBox;
            }
            if (physobjs[obj].alias !== this.alias && this.isActive) {
                if ((res.min.x <= target.max.x && res.max.x >= target.min.x) &&
                    (res.min.y <= target.max.y && res.max.y >= target.min.y) &&
                    (res.min.z <= target.max.z && res.max.z >= target.min.z) && physobjs[obj].collider!=="skybox" && physobjs[obj].collider!=="death") {
                    colliders.push(physobjs[obj])
                    coll = true;
                    if (physobjs[obj].collider === "ramp") {

                        let angular = (target.max.y - target.min.y) / (target.min.z - target.max.z )
                        let y_in_point = angular * res.min.z + target.max.y+0.5;
                        if(res.min.y<=y_in_point){
                            let i = 0
                            while (i < this.mesh.positions.length) {
                                this.mesh.positions[i + 2] += y_in_point-res.min.y;
                                i = i + 3;
                            }
                            ramp = true;
                        }
                        else{
                            colliders.pop();
                            coll = false;
                        }

                    }
                    if(physobjs[obj].collider==="goal"){
                        if(physobjs[obj].boundingBox.max.y<this.position.y && !this.level_over){
                            this.level_over = true;
                            window.dispatchEvent(new CustomEvent('level_complete'))
                        }
                    }

                }
                if(physobjs[obj].collider==="death" && target.min.y > res.min.y){
                    let scene = localStorage.getItem("level")
                    window.dispatchEvent(new CustomEvent('loadlevel_pre', { detail:{scene: scene}}))
                }
            }
        }
        let data = {x: {top: false, bottom: false}, y: {top: false, bottom: false}, z: {top: false, bottom: false}}
        for (const obj in colliders) {
            if (colliders[obj].collider === "box") {
                if (colliders[obj].position.x <= this.position.x) {
                    data.x.bottom = true;
                }
                if (colliders[obj].position.x > this.position.x) {
                    data.x.top = true;
                }
                if (colliders[obj].position.y <= this.position.y) {
                    data.y.bottom = true;
                }
                if (colliders[obj].position.y > this.position.y) {
                    data.y.top = true;
                }
                if (colliders[obj].position.z <= this.position.z) {
                    data.z.bottom = true;
                }
                if (colliders[obj].position.z > this.position.z) {
                    data.z.top = true;
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
        let xpos = []
        let ypos = []
        let zpos = []
        let i = 0;
        while (i < this.mesh.positions.length) {
            zpos.push(this.mesh.positions[i])
            ypos.push(this.mesh.positions[i + 2])
            xpos.push(this.mesh.positions[i + 1])
            i = i + 3;
        }
        return {
            max: {x: Math.max(...xpos), y: Math.max(...ypos), z: Math.max(...zpos)},
            min: {x: Math.min(...xpos), y: Math.min(...ypos), z: Math.min(...zpos)}
        }
    }


    render(deltaTime, gl, light, program, tar, mirrorText, camera_override=null, mirror_mode=false) {

        let positionLocation = gl.getAttribLocation(program, "a_position");
        let normalLocation = gl.getAttribLocation(program, "a_normal");
        let texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.positions), gl.STATIC_DRAW);
        this.normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.normals), gl.STATIC_DRAW);
        this.texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.text_coords), gl.STATIC_DRAW);
        gl.uniform3fv(gl.getUniformLocation(program, "diffuse"), (this.mesh.diffuse ? this.mesh.diffuse : [0.8, 0.8, 0.8]));
        gl.uniform3fv(gl.getUniformLocation(program, "ambient"), (this.mesh.ambient ? this.mesh.ambient : [1, 1, 1]));
        gl.uniform3fv(gl.getUniformLocation(program, "specular"), (this.mesh.specular ? this.mesh.specular : [0.5, 0.5, 0.5]));
        gl.uniform3fv(gl.getUniformLocation(program, "emissive"), (this.mesh.emissive ? this.mesh.emissive : [0, 0, 0]));
        gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight"), light.ambientLight);
        gl.uniform3fv(gl.getUniformLocation(program, "u_colorLight"), light.colorLight);
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), (this.mesh.shininess ? this.mesh.shininess : 359.999993));
        gl.uniform1f(gl.getUniformLocation(program, "opacity"), (this.mesh.opacity ? this.mesh.opacity : 1.45));
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        const size = 3;          // 3 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
        gl.enableVertexAttribArray(normalLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);
        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.vertexAttribPointer(texcoordLocation, size - 1, type, normalize, stride, offset);
        let fieldOfViewRadians = degToRad(70);

        // Compute the projection matrix
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        //  zmin=0.125;
        let zmin = 0.1;
        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, 2000);

        let cameraPosition = [4.5 + tar[0], -4.5 + tar[1], 4.5 + tar[2]];
        let up = [0, 0, 1];

        // Compute the camera's matrix using look at.
        let cameraMatrix = null;
        if(camera_override){
            cameraMatrix= m4.lookAt([1, 3.5, 11], tar, up);
        }
        else{
            cameraMatrix= m4.lookAt(cameraPosition, tar, up);
        }

        // Make a view matrix from the camera matrix.
        let viewMatrix = m4.inverse(cameraMatrix);

        let matrixLocation = gl.getUniformLocation(program, "u_world");
        let textureLocation = gl.getUniformLocation(program, "diffuseMap");
        let viewMatrixLocation = gl.getUniformLocation(program, "u_view");
        let projectionMatrixLocation = gl.getUniformLocation(program, "u_projection");
        let lightWorldDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
        let viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");

        gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

        // set the light position
        gl.uniform3fv(lightWorldDirectionLocation, m4.normalize([-1, 3, 5]));

        // set the camera/view position
        gl.uniform3fv(viewWorldPositionLocation, cameraPosition);

        // Tell the shader to use texture unit 0 for diffuseMap
        gl.uniform1i(textureLocation, 0);

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }

        function radToDeg(r) {
            return r * 180 / Math.PI;
        }

        function degToRad(d) {
            return d * Math.PI / 180;
        }

        let vertNumber = this.mesh.numVertices;
        drawScene(deltaTime, this.mesh, this.mirror, mirrorText, mirror_mode)


        // Draw the scene.
        function drawScene(deltaTime, mesh, mirror, mirrorText) {
            if(mirror){
                gl.bindTexture(gl.TEXTURE_2D, mirrorText);
            }
            else{
                if(!mirror_mode){
                    gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
                }
                else{
                    gl.bindTexture(gl.TEXTURE_2D, mesh.texture_mirror);
                }

            }
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.enable(gl.DEPTH_TEST);

            let matrix = m4.identity();

            gl.uniformMatrix4fv(matrixLocation, false, matrix);

            gl.drawArrays(gl.TRIANGLES, 0, vertNumber);
        }
    }
}