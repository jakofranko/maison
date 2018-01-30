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
        this.placed = true; // if this is skipped, set to false. Used in item placement
        this.parent = null;
        this.children = [];
    }

    addChild(child) {
    	if(child !== false) {
            child.parent = this;
            this.children.push(child);
        }
    }
}
