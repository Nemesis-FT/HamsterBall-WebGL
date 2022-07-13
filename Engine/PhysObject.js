export class PhysObject {
    constructor(mesh, alias, isActive) {
        this.mesh = mesh;
        this.alias = alias;
        this.isActive = isActive;
        this.speed = {x: 0.0, y: 0.0, z: 0.0};
        this.accel = {x: 0.0, y: 0.0, z: 0.0};
    }

    compute_phys() {
        if(this.isActive){
            if(this.is_colliding()){
                // put accel and speed to 0 on desired axis
            }
        }
    }

    is_colliding(){
        // Compute collisions with other meshes
    }

    set_accel(accel) {
        if (this.isActive) {
            this.accel = accel;
        }
    }

    render(gl, light){
        let program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"])
        gl.useProgram(program);
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
        var fieldOfViewRadians = degToRad(30);
        var modelXRotationRadians = degToRad(0);
        var modelYRotationRadians = degToRad(0);

        // Compute the projection matrix
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        //  zmin=0.125;
        var zmin=0.1;
        var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, 200);

        var cameraPosition = [4.5, 4.5, 2];
        var up = [0, 0, 1];
        var target = [0, 0, 0];

        // Compute the camera's matrix using look at.
        var cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        var matrixLocation = gl.getUniformLocation(program, "u_world");
        var textureLocation = gl.getUniformLocation(program, "diffuseMap");
        var viewMatrixLocation = gl.getUniformLocation(program, "u_view");
        var projectionMatrixLocation = gl.getUniformLocation(program, "u_projection");
        var lightWorldDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
        var viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");

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

        var then = 0;
        var vertNumber = this.mesh.numVertices;

        requestAnimationFrame(drawScene);

        // Draw the scene.
        function drawScene(time) {
            // convert to seconds
            time *= 0.001;
            // Subtract the previous time from the current time
            var deltaTime = time - then;
            // Remember the current time for the next frame.
            then = time;

            // Tell WebGL how to convert from clip space to pixels
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            //gl.enable(gl.CULL_FACE);
            gl.enable(gl.DEPTH_TEST);

            // Animate the rotation
            //modelYRotationRadians += -0.7 * deltaTime;
            //modelXRotationRadians += -0.4 * deltaTime;

            // Clear the canvas AND the depth buffer.
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var matrix = m4.identity();
            matrix = m4.xRotate(matrix, modelXRotationRadians);
            matrix = m4.yRotate(matrix, modelYRotationRadians);

            // Set the matrix.
            gl.uniformMatrix4fv(matrixLocation, false, matrix);

            // Draw the geometry.
            gl.drawArrays(gl.TRIANGLES, 0, vertNumber);

            requestAnimationFrame(drawScene);
        }
    }
}