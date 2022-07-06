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
}