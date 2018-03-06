class Render2D {
    constructor(maison, options = {maxWidth: 50, maxHeight: 50, maxStories: 3}) {
        this.maison = maison;
        this.container = options['container'] || document.getElementById("display");
        this.display = new ROT.Display();

        this.container.appendChild(this.display.getContainer());
        this._resizeTerminal(this.display);

        // Make sure max sizes don't exceed the display width and height, make room for a status bar.
        let termWidth = this.display.getOptions().width;
        let termHeight = this.display.getOptions().height;
        options.maxWidth = options.maxWidth <= termWidth ? options.maxWidth : termWidth;
        options.maxHeight = options.maxHeight < termHeight ? options.maxHeight : termHeight - 1;

        // Assign option properties to this instance
        Object.assign(this, options);

        try {
            this.tiles = this._setUpTiles(['n', 'e', 's', 'w'].random());
        } catch(e) {
            console.log("RNG SEED: ", ROT.RNG.getSeed())
            throw e;
        }

        // Used to determine which z-level to render to the 'console'
        this.renderZ = 0;

        window.addEventListener('resize', this._resizeTerminal.bind(this, this.display));
        window.addEventListener('keydown', this._handleKeydown.bind(this));
    }

    render() {
        let width = this.tiles[this.renderZ].length,
            height = this.tiles[this.renderZ][0].length,
            termWidth = this.display.getOptions().width,
            termHeight = this.display.getOptions().height,
            offsetWidth = (termWidth - width) / 2,
            tile;

        if(height > termHeight || width > termWidth) debugger;

        // Clean display
        this.display.clear();

        for (var x  = 0; x < width; x ++) {
            for (var y = 0; y < height; y++) {
                tile = this.tiles[this.renderZ][x][y];
                if(!tile) debugger;
                this.display.draw(x + offsetWidth, y, tile._char, tile._foreground, tile._background);
            }
        }

        // Status line
        this.display.drawText(0, termHeight - 1, `Viewing z-level ${this.renderZ} of ${this.tiles.length - 1}`)
    }


    /**
     * _setUpTiles - Given a Maison graph, generate a 2D grid of tiles.
     * The process is as follows:
     * 1) Create a queue with the first item being the root node of the graph
     * 2) Begin looping through the queue, shifting the first item of the array off
     * 3) For each room in the queue, check to see if placing it would exceed
     *    the maximum width or height. If it would, put it on the next floor, or skip it.
     * 4) Loop through possible 'spawnDirections', and for each direction check to see if
     *    the house tiles need to be shifted if the room is placed 'n' or 'w',
     *    and check to make sure there is not an existing room in the area the new
     *    room would be placed. If a suitable location can't be found, skip the room.
     * 5) If the room can be placed, then add the room tiles to the house tiles.
     * 6) Add the current room's children to the queue, and set their x, y, and z
     *    coordinates to be the same as the parent (to allow relative positioning to the parent)
     *
     * @param   {String} direction The direction the house will face. Determines
     *                             which directions are possible for rooms to spawn.
     * @returns {Array}            A three-dimensional array of tiles such that tiles[z][x][y] = tile
     */
    _setUpTiles(direction) {
        // The array of tiles to be returned
        let house = [];

        // This will be an array of rooms to do next.
        let queue = [this.maison.graph];

        // Process queue til empty
        while(queue.length > 0) {
            let room = queue.shift();
            let x, y, z;
            let possibleDirections = this.maison.possibleDirections[direction].randomize();
            let existingRoom = false;
            let currentDirection, exceedsMax, tryAbove;

            if(room.parent) {
                // First, check that adding the new room does not exceed the maximum limits
                tryAbove = room.z > room.parent.z;
                exceedsMax = this._exceedsMax(room, tryAbove);

                // If it does, try to put it on the z-level above, else, skip it
                if(exceedsMax && room.z + 1 <= this.maxStories) {
                    room.z++;

                    // Put it in the back of the queue
                    queue.push(room);
                    continue;
                } else if(exceedsMax) {
                    room.placed = false;
                    continue;
                }

                if(tryAbove)
                    possibleDirections.push("up");

                // TODO: support rooms being placed directly above their parent
                // Find a good spawn direction, and shift tiles accordingly
                while(possibleDirections.length) {
                    currentDirection = possibleDirections.pop();

                    // Because a room could be tacked on to the north or west, x,y coordinate 0,0 can
                    // change. Rooms to the south and east of their ancestor are not a problem; just
                    // stick the 'cursor' at a brand new x or y coordinate. But if it's to the north
                    // or west, the whole thing needs to be shifted down or to the right, and then
                    // the new room added to the new 0,y or x,0 coordinates.
                    switch(currentDirection) {
                        case 'n':
                            room.y -= room.height - 1; // plus one so the rooms will share a wall

                            if(room.y < 0) {
                                if(this._exceedsTotalHeight(room.height, house)){
                                    existingRoom = true;
                                    break;
                                } else {
                                    house = this._shiftTilesSouth(room.height, house);
                                    this.maison.adjustY(room.height);
                                }
                            }

                            existingRoom = this._roomCheck(room.x, room.y, room.width, room.height - 1, house[room.z]);
                            break;
                        case 'w':
                            room.x -= room.width - 1; // plus one so the room.parents will share a wall

                            if(room.x < 0) {
                                if(this._exceedsTotalWidth(room.width, house)) {
                                    existingRoom = true;
                                    break;
                                } else {
                                    house = this._shiftTilesEast(room.width, house);
                                    this.maison.adjustX(room.width);
                                }
                            }

                            existingRoom = this._roomCheck(room.x, room.y, room.width - 1, room.height, house[room.z]);
                            break;
                        case 'e':
                            room.x += room.parent.width - 1; // minus one so the room.parents will share a wall

                            existingRoom = this._roomCheck(room.x + 1, room.y, room.width, room.height, house[room.z]);
                            break;
                        case 's':
                            room.y += room.parent.height - 1; // minus one so the rooms will share a wall

                            existingRoom = this._roomCheck(room.x, room.y + 1, room.width, room.height, house[room.z]);
                            break;
                        case 'up':
                            existingRoom = this._roomCheck(room.x, room.y, room.width, room.height, house[room.z]);
                            break;
                        default:
                            throw new Error("There are no more possible directions. This should not be possible...heh heh.");
                    }

                    // A room was found, so try another direction
                    if(existingRoom === true) {
                        // No longer trying to place room above, so re-check
                        // to make sure adding the room will not exceed the max.
                        // If it will, break out and skip this room.
                        if(currentDirection == "up" && this._exceedsMax(room)) {
                            room.placed = false;
                            break;
                        } else {
                            room.x = room.parent.x;
                            room.y = room.parent.y;

                            continue;
                        }
                    } else {
                        room.spawnDirection = currentDirection;
                        break;
                    }
                }

                // If a place could not be found, increment the z level, and
                // put it in the back of the queue. If attempting to place the
                // room directly above its parent, it has failed so skip room.
                if(room.spawnDirection === undefined || room.spawnDirection === null) {
                    if(currentDirection == 'up')
                        continue;

                    room.x = room.parent.x;
                    room.y = room.parent.y;
                    room.z++;

                    queue.push(room);
                    continue;
                }
            }

            // Render room tiles
            let roomTiles = this._renderRoom(room, direction);
            x = room.x,
            y = room.y,
            z = room.z;

            // Initialize the z-level, if not set already.
            if(!house[z]) {
                if(z === 0)
                    house[z] = new Array(roomTiles.length);
                else
                    house[z] = new Array(house[z - 1].length); // Make the new z level the same length as the level beneathe it
            }

            for(var i = 0, roomX = x; i < roomTiles.length; i++, roomX++) {
                if(!house[z][roomX])
                    house[z][roomX] = new Array(roomTiles[i].length);

                for(var j = 0, roomY = y; j < roomTiles[i].length; j++, roomY++) {
                    // Don't overwrite an existing room tile
                    if(!house[z][roomX][roomY] || house[z][roomX][roomY].getName() == 'grass' || house[z][roomX][roomY].getName() == 'air')
                        house[z][roomX][roomY] = roomTiles[i][j];
                }
            }

            // Fill in missing spaces with grass
            house = this._spaceFill(house);

            // Put room's children in the queue
            if(room.children.length > 0) {
                // Pick direction to branch from
                for (var k = 0; k < room.children.length; k++) {
                    // Set all children's coordinates to match their parent,
                    // so that when a spawn direction is chosen, the child can
                    // be placed relative to the parent.
                    room.children[k].x = room.x;
                    room.children[k].y = room.y;
                    room.children[k].z = room.z;

                    queue.push(room.children[k]);
                }
            }
            consoleLogGrid(house[room.z], '_char');
        }

        // One last time, fill out any missing tiles with air or grass
        house = this._spaceFill(house);

        // Place doors
        house = this._placeDoors(house);

        // Place stairs
        house = this._placeStairs(house);

        // Now that the locations of all rooms have been set and adjusted, place items in each room
        // this._placeItems(this.graph);

        // for (var z = 0; z < house.length; z++) {
        //     console.log(z);
        //     _consoleLogGrid(house[z], '_char');
        // }
        // this._testZeroIndex(house, [room, house]);
        return house;
    }


    /**
     * _renderRoom - Given an instance of a Chambre, creates an array of room tiles.
     *
     * @param   {Chambre} room
     * @param   {type}    direction If the room is the 'foyer', this is used to place the front door.
     * @returns {Array}             Two-dimensional array, such that tiles[x][y] == tile
     */
    _renderRoom(room, direction) {
        var w = room.width;
        var h = room.height;
        var horizontalWall = TileRepository.create('indoor wall-horizontal');
        var verticalWall = TileRepository.create('indoor wall-vertical');
        var floor = TileRepository.create('floor');
        var tiles = new Array(w); // Initialize the x-length

        for (var x = 0; x < w; x++) {
            // Initialize the y-length if it doesn't exist yet.
            if(!tiles[x])
                tiles[x] = new Array(h);

            for (var y = 0; y < h; y++) {
                if(y === 0 || y === h - 1)
                    tiles[x][y] = horizontalWall;
                else if(x === 0 || x === w - 1)
                    tiles[x][y] = verticalWall;
                else
                    tiles[x][y] = floor;
            }
        }

        // If it's the foyer, place the front door
        if(room.name == 'foyer') {
            var doorX, doorY;
            switch(direction) {
                case 'n': // Rooms will be spawning south, so put the door at the north
                    doorX = Math.getRandomInRange(room.x + 1, room.width - 2);
                    doorY = room.y;
                    break;
                case 'e': // Rooms will be spawning west, so put door at the east
                    doorX = room.width - 1;
                    doorY = Math.getRandomInRange(room.y + 1, room.height - 2);
                    break;
                case 's':
                    doorX = Math.getRandomInRange(room.x + 1, room.width - 2);
                    doorY = room.height - 1;
                    break;
                case 'w':
                    doorX = room.x;
                    doorY = Math.getRandomInRange(room.y + 1, room.height - 2);
                    break;
                default:
                    break;
            }
            tiles[doorX][doorY] = TileRepository.create('door');
        }

        return tiles;
    }


    /**
     * _shiftTilesSouth - unshift() a patch of grass/air to every row based on
     * room height, and then adjusts every room in the maison instance accordingly.
     * Might need to refactor this to do every z-level, instead of working on only 1.
     *
     * @param   {Number} amount Number of rows to shift onto the beginning of the array
     * @param   {Array}  tiles  Array of tile arrays to be shifted
     * @returns {Array}
     */
    _shiftTilesSouth(amount, tiles) {
        let tile;

        // If tiles doesn't exist, no need to shift
        if(!tiles)
            return tiles;

        for(let z = 0; z < tiles.length; z++) {
            if(!tiles[z][0]) debugger;
            for(let x = 0; x < tiles[z].length; x++) {
                for(let y = 0; y < amount; y++) {
                    tile = (z === 0) ? TileRepository.create('grass') : TileRepository.create('air');
                    tiles[z][x].unshift(tile);
                }
            }
        }

        return tiles;
    }

    /**
     * _shiftTilesEast - unshift() a column of grass/air to every column based
     * on room width, and then adjusts every room in the maison instance accordingly.
     * Might need to refactor this to do every z-level, instead of working on only 1.
     *
     * @param   {Number} amount Number of columns to shift onto the beginning of the array
     * @param   {Array}  tiles  Array of tile arrays to be shifted
     * @returns {Array}
     */
    _shiftTilesEast(amount, tiles) {
        let tile;

        // If tiles doesn't exist, no need to shift
        if(!tiles)
            return tiles;

        for(let z = 0; z < tiles.length; z++) {
            if(!tiles[z][0]) debugger;
            for(let x = 0; x < amount; x++) {
                tiles[z].unshift(new Array(tiles[z][0].length));

                for(let y = 0; y < tiles[z][0].length; y++) {
                    tile = (z === 0) ? TileRepository.create('grass') : TileRepository.create('air');
                    // Always use index of 0 since we're adding the array to the beginning
                    tiles[z][0][y] = tile;
                }
            }
        }

        return tiles;
    }

    _spaceFill(grid) {
        for (var z = 0; z < grid.length; z++) {
            // If there are varying heights, find the highest column
            if(!grid[z].reduce) debugger;
            var height = grid[z].reduce(function(prev, curr) {
                if(typeof prev === 'object') prev = prev.length;
                if(typeof curr === 'object') curr = curr.length;
                return Math.max(prev, curr);
            }, 0);
            for (var x = 0; x < grid[z].length; x++) { // grid[z].length == width
                if(!grid[z][x])
                    grid[z][x] = new Array(height);

                for (var y = 0; y < height; y++) {
                    if(!grid[z][x][y]) {
                        var tile = (z === 0) ? TileRepository.create('grass') : TileRepository.create('air');
                        grid[z][x][y] = tile;
                    }
                }
            }
        }
        return grid;
    }

    _placeDoors(tiles) {
        let rooms = [this.maison.graph];
        let room, roomXY, childXY, commonXY, lowestX, highestX, lowestY, highestY, doorXY;
        function minMaxXY(m, c, prev, curr) {
            return Math[m](prev, Number(curr.split(",")[c]));
        }
        const minX = minMaxXY.bind(this, 'min', 0);
        const maxX = minMaxXY.bind(this, 'max', 0);
        const minY = minMaxXY.bind(this, 'min', 1);
        const maxY = minMaxXY.bind(this, 'max', 1);

        while(rooms.length) {
            room = rooms.shift();
            roomXY = this._listXY(room.x, room.y, room.width, room.height);

            room.children.forEach(child => {
                if(!child.placed) return;

                // Don't try to place doors between rooms on different
                // z-levels, but make sure they are added to the queue
                if(room.z > child.z || room.z < child.z) {
                    rooms.push(child);
                    return;
                }

                commonXY = []; // Remove any previous coords

                childXY = this._listXY(child.x, child.y, child.width, child.height);
                for(let i = 0; i < roomXY.length; i++) {
                    if(childXY.indexOf(roomXY[i]) > -1)
                        commonXY.push(roomXY[i]);
                }

                // Make sure door isn't placed in a corner by eliminating the least and greatest x or y coordinates, depending on spawn direction
                if(child.spawnDirection == 'n' || child.spawnDirection == 's') {
                    lowestX = commonXY.reduce(minX, commonXY[0].split(",")[0]);
                    highestX = commonXY.reduce(maxX, commonXY[0].split(",")[0]);

                    // Remove the extreme x tiles from the list
                    for(let i = 0; i < commonXY.length; i++) {
                        if(commonXY[i].split(",")[0] == lowestX || commonXY[i].split(",")[0] == highestX)
                            commonXY.splice(i, 1);
                    }
                } else {
                    lowestY = commonXY.reduce(minY, commonXY[0].split(",")[1]);
                    highestY = commonXY.reduce(maxY, commonXY[0].split(",")[1]);

                    // Remove the extreme y tiles from the list
                    for (let i = 0; i < commonXY.length; i++) {
                        if(commonXY[i].split(",")[1] == lowestY || commonXY[i].split(",")[1] == highestY)
                            commonXY.splice(i, 1);
                    }
                }

                doorXY = commonXY.random().split(",");
                tiles[room.z][doorXY[0]][doorXY[1]] = TileRepository.create("door");

                rooms.push(child);
                // consoleLogGrid(tiles[room.z], '_char');
            });
        }

        return tiles;
    }


    /**
     * _placeStairs - Intelligently places stairs so that all z-levels are accessible
     *
     * @TODO Refactor to places stairs for all rooms that have children on higher z-levels
     * @param   {Array} tiles Three-dimensional array of tiles such that tiles[z][x][y] = tile.
     * @returns {Array}       Altered tiles.
     */
    _placeStairs(tiles) {
        let queue = [this.maison.graph];
        let room, roomXY, childXY, commonXY, parts, x, y;

        while(queue.length) {
            room = queue.shift();
            roomXY = this._listXY(room.x, room.y, room.width, room.height);
            room.children.forEach(child => {
                commonXY = [];

                if(!child.placed) return;

                if(child.z > room.z) {
                    childXY = this._listXY(child.x, child.y, child.width, child.height);
                    childXY.forEach(coord => {
                        if(roomXY.indexOf(coord) > -1)
                            commonXY.push(coord);
                    });

                    commonXY.some(coord => {
                        parts = coord.split(",");
                        x = parts[0];
                        y = parts[1];

                        if(!tiles[room.z + 1]) debugger;
                        if(tiles[room.z][x][y].getName() == 'floor' && tiles[room.z + 1][x][y].getName() == 'floor') {
                            tiles[room.z][x][y] = TileRepository.create('stairsUp');
                            tiles[room.z + 1][x][y] = TileRepository.create('stairsDown');
                            return true;
                        } else {
                            return false;
                        }
                    });
                }

                queue.push(child);
            });
        }

        return tiles;
    }

    /**
     * roomCheck - Scan given tiles for any tiles that are not 'air' or 'grass'
     *
     * @param   {Number} startX
     * @param   {Number} startY
     * @param   {Number} width
     * @param   {Number} height
     * @param   {Array}  tiles An array of arrays of tiles, such that tiles[x][y] == tile
     * @returns {Boolean}
     */
    _roomCheck(startX, startY, width, height, tiles) {
        var roomFound = false;

        if(!tiles) // z level doesn't exist yet, so obvs, no room
            return roomFound;

        for (var x = 0, tilesX = startX; x < width; x++, tilesX++) {
            for (var y = 0, tilesY = startY; y < height; y++, tilesY++) {
                if(!tiles[tilesX])
                    continue;

                if(tiles[tilesX][tilesY] && tiles[tilesX][tilesY].getName() != 'grass' && tiles[tilesX][tilesY].getName() != 'air') {
                    consoleLogGrid(tiles, "_char", false, false, tilesX, tilesY);
                    roomFound = true;
                    break;
                }
            }
            if(roomFound)
                break;
        }

        return roomFound;
    }

    _resizeTerminal() {
        let parent = this.display.getContainer().parentElement;

        // Set size of display based on parent size
        let size = this.display.computeSize(parent.clientWidth, parent.clientHeight);
        this.display.setOptions({width: size[0], height: size[1]});
    }

    _handleKeydown(e) {
        switch(e.key) {
            case '>':
                this.renderZ = this.renderZ <= 0 ? 0 : this.renderZ - 1;
                break;
            case '<':
                this.renderZ = this.renderZ >= this.tiles.length - 1 ? this.tiles.length - 1 : this.renderZ + 1;
                break;
            default:
                break;
        }

        this.render();
    }

    /**
     * _listXY - Utility for creating a list of x,y coordinates given a starting
     *           X, a starting Y, a width and a height.
     *
     * @param   {Number} startX Starting X coordinate
     * @param   {Number} startY Starting Y coordinate
     * @param   {Number} width  How wide on the grid to go
     * @param   {Number} height How deep on the grid to go
     * @returns {Array}         An array of strings with the format "x,y"
     */
    _listXY(startX, startY, width, height) {
        var list = [];
        for (let x = 0; x < width; x++, startX++) {
            for(let y = 0, initialY = startY; y < height; y++, initialY++) {
                list.push(startX + "," + initialY);
            }
        }
        return list;
    }


    /**
     * _getFloorTiles - Loop through a two-dimensional array of tiles and return
     * all the tiles that have the name 'floor'
     *
     * @param   {Array} tiles  An array of arrays of tiles, such that tiles[x][y] == tile
     * @returns {Array}        An array of string coordinates "x,y" of floor tile locations
     */
    _getFloorTiles(tiles) {
        let floorTiles = [];
        for(let x = 0; x < tiles.length; x++) {
            if(!tiles[x])
                continue;
            for(let y = 0; y < tiles[x].length; y++) {
                if(tiles[x][y] && tiles[x][y].getName() == 'floor')
                    floorTiles.push(x + "," + y);
            }

        }

        return floorTiles;
    }

    _exceedsMax(room, onlyAbove = false) {
        if(onlyAbove) {
            return (
                room.z > this.maxStories ||
                room.x + room.width > this.maxWidth ||
                room.y + room.height > this.maxHeight
            )
        } else {
            return (
                room.z > this.maxStories ||
                room.x + room.parent.width + room.width > this.maxWidth ||
                room.y + room.parent.height + room.height > this.maxHeight
            );
        }
    }

    _exceedsTotalWidth(width, tiles) {
        for(let z = 0; z < tiles.length; z++) {
            if(width + tiles[z].length > this.maxWidth)
                return true;
        }
    }

    _exceedsTotalHeight(height, tiles) {
        for(let z = 0; z < tiles.length; z++) {
            for(let x = 0; x < tiles[z].length; x++) {
                if(height + tiles[z][x].length > this.maxHeight)
                    return true;
            }
        }
    }
}
