import {PlayerController} from "./PlayerController.js";

export class PhysObject {
    constructor(mesh, alias, isActive, isPlayer, offsets) {
        this.mesh = mesh;
        this.alias = alias;
        this.isActive = isActive==="true";
        this.speed = {x: 0.0, y: 0.0, z: 0.0};
        this.accel = {x: 0.0, y: 0.0, z: 0.0};
        this.position = {x:offsets.x, y:offsets.y, z:offsets.z}
        this.isPlayer = isPlayer==="true";
        if(this.isPlayer){
            this.pc = new PlayerController(this)
        }
        this.compute_position()
        console.debug(this)
    }

    compute_phys(physobjs) {
        if(this.isActive){
            let check = this.is_colliding(physobjs)
            
            if(check.coll){
                //console.debug(check, this.accel);
                if(check.data.x.top && this.accel.x>=0){
                    //this.accel.x = this.speed.x = 0
                }
                if(check.data.x.bottom && this.accel.x<=0){
                    //this.accel.x = this.speed.x = 0
                }
                if(check.data.y.top && this.accel.y>=0){
                    this.accel.y = this.speed.y = 0
                }
                if(check.data.y.bottom && this.accel.y<=0){
                    this.accel.y = this.speed.y = 0
                }
                if(check.data.z.top && this.accel.z>=0){
                    //this.accel.z = this.speed.z = 0
                }
                if(check.data.z.bottom && this.accel.z<=0){
                    //this.accel.z = this.speed.z = 0
                }
            }
            else{
                this.accel.y = -0.001;
            }
            let attrition = 0.00001;
            if(this.accel.x<-attrition){
                this.accel.x += attrition;
            }
            else if(this.accel.x>attrition){
                this.accel.x -= attrition;
            }
            else if(this.accel.x>-attrition && this.accel.x <attrition ){
                this.speed.x = this.accel.x = 0;
            }
            if(this.accel.z<-attrition){
                this.accel.z += attrition;
            }
            else if(this.accel.z>attrition){
                this.accel.z -= attrition;
            }
            else if(this.accel.z>-attrition && this.accel.z <attrition ){
                this.speed.z = this.accel.z = 0;
            }
            //console.debug(this.accel)
            // add section for input control
            this.speed.x += this.accel.x;
            this.speed.y += this.accel.y;
            this.speed.z += this.accel.z;
            this.position.x += this.speed.x;
            this.position.y += this.speed.y;
            this.position.z += this.speed.z;
            let i = 0;
            while(i<this.mesh.positions.length){
                this.mesh.positions[i] += parseFloat(this.speed.z);
                this.mesh.positions[i+1] += parseFloat(this.speed.x);
                this.mesh.positions[i+2] += parseFloat(this.speed.y);
                i=i+3;
            }
            //this.compute_position();
        }
    }

    is_colliding(physobjs){
        let res = this.compute_bounds()
        let coll = false
        let colliders = [];
        for(const obj in physobjs){
            let target = physobjs[obj].compute_bounds()
            if(physobjs[obj].alias !== this.alias){
                if((res.min.x <= target.max.x && res.max.x >= target.min.x) &&
                    (res.min.y <= target.max.y && res.max.y >= target.min.y) &&
                    (res.min.z <= target.max.z && res.max.z >= target.min.z)){
                    coll = true;
                    colliders.push(physobjs[obj])
                }
                // Se la box è sotto/sopra, collisione su Y, se la box è su x allora stop su x etc
            }
        }
        let data = {x: {top:false, bottom:false}, y:{top:false, bottom:false}, z:{top:false, bottom:false}}
        for(const obj in colliders){
            if(colliders[obj].position.x<=this.position.x){
                data.x.bottom=true;
            }
            if(colliders[obj].position.x>this.position.x){
                data.x.top=true;
            }
            if(colliders[obj].position.y<=this.position.y){
                data.y.bottom=true;
            }
            if(colliders[obj].position.y>this.position.y){
                data.y.top=true;
            }
            if(colliders[obj].position.z<=this.position.z){
                data.z.bottom=true;
            }
            if(colliders[obj].position.z>this.position.z){
                data.z.top=true;
            }
        }
        return {coll:coll, data:data};
    }

    compute_bounds(){
        let xpos = []
        let ypos = []
        let zpos = []
        let i = 0;
        while(i<this.mesh.positions.length){
            zpos.push(this.mesh.positions[i])
            ypos.push(this.mesh.positions[i+1])
            xpos.push(this.mesh.positions[i+2])
            i=i+3;
        }
        return {max:{x:Math.max(...xpos), y:Math.max(...ypos), z:Math.max(...zpos)},
                min:{x:Math.min(...xpos), y:Math.min(...ypos), z:Math.min(...zpos)}}
    }

    set_accel(accel) {
        if (this.isActive) {
            this.accel = accel;
        }
    }

    compute_position(){
        let i=0;
        while(i<this.mesh.positions.length){
            this.mesh.positions[i] += parseFloat(this.position.z);
            this.mesh.positions[i+1] += parseFloat(this.position.x);
            this.mesh.positions[i+2] += parseFloat(this.position.y);
            i=i+3;
        }

    }

    render(gl, light, program, tar){

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
        gl.uniform3fv(gl.getUniformLocation(program, "diffuse" ), this.mesh.diffuse );
        gl.uniform3fv(gl.getUniformLocation(program, "ambient" ), this.mesh.ambient);
        gl.uniform3fv(gl.getUniformLocation(program, "specular"), this.mesh.specular );
        gl.uniform3fv(gl.getUniformLocation(program, "emissive"), this.mesh.emissive );
        gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight" ), light.ambientLight );
        gl.uniform3fv(gl.getUniformLocation(program, "u_colorLight" ), light.colorLight );

        gl.uniform1f(gl.getUniformLocation(program, "shininess"), this.mesh.shininess);
        gl.uniform1f(gl.getUniformLocation(program, "opacity"), this.mesh.opacity);
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
        gl.vertexAttribPointer(texcoordLocation, size-1, type, normalize, stride, offset);
        let fieldOfViewRadians = degToRad(70);

        // Compute the projection matrix
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        //  zmin=0.125;
        let zmin=0.1;
        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, 200);

        let cameraPosition = [4.5+tar[0], -4.5+tar[1], 4.5+tar[2]];
        let up = [0, 0, 1];

        // Compute the camera's matrix using look at.
        let cameraMatrix = m4.lookAt(cameraPosition, tar, up);

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
        drawScene(0)
        // Draw the scene.
        function drawScene(time) {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.DEPTH_TEST);
            let matrix = m4.identity();
            gl.uniformMatrix4fv(matrixLocation, false, matrix);
            gl.drawArrays(gl.TRIANGLES, 0, vertNumber);
        }
    }
}