//This class is a refactor of code written by Professor Casciola from Unibo.

import {PhysObject} from "./PhysObject.js";

export class MeshLoader {
    constructor(list) {
        this.list = list;
    }

    async obj_loader(mesh) {
        await fetch(mesh.source)
            .then(response => response.text())
            .then(m => {
                let result = glmReadOBJ(m, new subd_mesh())
                mesh.data = result.mesh;
                mesh.fileMtl = result.fileMtl;
            })
    }

    async mtl_loader(filename, mesh) {
        await fetch(filename)
            .then(response => response.text())
            .then(mtl => {
                glmReadMTL(mtl, mesh)
            })
    }

    async texture_loader(gl, path, fileName) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType, pixel);

        if (fileName) {
            const image = new Image();
            image.onload = function () {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
                if (isPowerOf2(image.width) && isPowerOf2(image.height))
                    gl.generateMipmap(gl.TEXTURE_2D); // Yes, it's a power of 2. Generate mips.
                else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }
            };
            image.src = path + fileName;
        }
        return texture;

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }
    }
    async getData(mesh) {
        await this.obj_loader(mesh);
        if (mesh.fileMtl) {
            await this.mtl_loader(mesh.source.substring(0, mesh.source.lastIndexOf("/")) + "/" + mesh.fileMtl, mesh.data)
        }
    }

    async load(filepath, gl, isPlayer, isActive,coords, alias) {
        let mesh = [];
        mesh.source = filepath;
        await this.getData(mesh)
        Unitize(mesh.data)
        let map = mesh.data.materials[1].parameter;
        let path = mesh.source.substring(0, mesh.source.lastIndexOf("/") + 1);
        map.set("map_Kd", this.texture_loader(gl, path, map.get("map_Kd")));

        let x = [], y = [], z = [];
        let xt = [], yt = [];
        let i0, i1, i2;
        let n_vert = mesh.data.nvert;
        let n_face = mesh.data.nface;
        let n_text_coord = mesh.data.textCoords.length;
        mesh.positions = [];
        mesh.normals = [];
        mesh.text_coords = [];

        for (let i = 0; i < n_vert; i++) {
            x[i] = mesh.data.vert[i + 1].x;
            y[i] = mesh.data.vert[i + 1].y;
            z[i] = mesh.data.vert[i + 1].z;
        }
        for (let i = 0; i < n_text_coord - 1; i++) {
            xt[i] = mesh.data.textCoords[i + 1].u;
            yt[i] = mesh.data.textCoords[i + 1].v;
        }
        for (let i = 1; i <= n_face; i++) {
            i0 = mesh.data.face[i].vert[0] - 1;
            i1 = mesh.data.face[i].vert[1] - 1;
            i2 = mesh.data.face[i].vert[2] - 1;
            mesh.positions.push(x[i0], y[i0], z[i0], x[i1], y[i1], z[i1], x[i2], y[i2], z[i2]);
            i0 = mesh.data.facetnorms[i].i;
            i1 = mesh.data.facetnorms[i].j;
            i2 = mesh.data.facetnorms[i].k;
            mesh.normals.push(i0, i1, i2, i0, i1, i2, i0, i1, i2);
            i0 = mesh.data.face[i].textCoordsIndex[0] - 1;
            i1 = mesh.data.face[i].textCoordsIndex[1] - 1;
            i2 = mesh.data.face[i].textCoordsIndex[2] - 1;
            mesh.text_coords.push(xt[i0], yt[i0], xt[i1], yt[i1], xt[i2], yt[i2]);
        }
        mesh.numVertices = 3 * n_face;

        if (mesh.fileMtl == null) {
            mesh.ambient = mesh.data.materials[0].parameter.get("Ka");
            mesh.diffuse = mesh.data.materials[0].parameter.get("Kd");
            mesh.specular = mesh.data.materials[0].parameter.get("Ks");
            mesh.emissive = mesh.data.materials[0].parameter.get("Ke");
            mesh.shininess = mesh.data.materials[0].parameter.get("Ns");
            mesh.opacity = mesh.data.materials[0].parameter.get("Ni");
        } else {
            mesh.ambient = mesh.data.materials[1].parameter.get("Ka");
            mesh.diffuse = mesh.data.materials[1].parameter.get("Kd");
            mesh.specular = mesh.data.materials[1].parameter.get("Ks");
            mesh.emissive = mesh.data.materials[1].parameter.get("Ke");
            mesh.shininess = mesh.data.materials[1].parameter.get("Ns");
            mesh.opacity = mesh.data.materials[1].parameter.get("Ni");
        }
        //await this.compute_offsets(mesh, coords)
        console.debug(mesh);
        this.list.push(new PhysObject(mesh, alias, isActive, isPlayer, coords))
    }
}