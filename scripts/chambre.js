class Chambre {
    constructor(name) {
        const roomSize = Maison.getRoomSize(name);

        this.name = name;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.width = Math.getRandomInRange(roomSize[0], roomSize[1]);
        this.height = Math.getRandomInRange(roomSize[0], roomSize[1]);
        this.spawnDirection = null;
        this.parent = null;
        this.children = [];
        this._placed = true; // if this is skipped, set to false. Used in item placement
    }

    addChild(child) {
    	if(child !== false) {
            child.parent = this;
            this.children.push(child);
        }
    }

    get placed() {
        return this._placed;
    }

    set placed(isPlaced) {
        this._placed = isPlaced;
        this.children.forEach(child => child.placed = isPlaced);
    }
}
