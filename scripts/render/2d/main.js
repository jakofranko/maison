class Render2D {
    constructor(maison, options = {maxWidth: 50, maxHeight: 50, maxStories: 3}) {
        // Display width and height is in characters, so divide the width and height by the fontSize
        this.maison = maison;
        this.container = options['container'] || document.getElementById("display");
        this.display = new ROT.Display();

        this.container.appendChild(this.display.getContainer());
        this._resizeTerminal(this.display);

        // Apply options to this instance, and make sure max sizes don't exceed
        // the display width and height. Also, make room for a status bar.
        let termWidth = this.display.getOptions().width;
        let termHeight = this.display.getOptions().height;
        options.maxWidth = options.maxWidth <= termWidth ? options.maxWidth : termWidth;
        options.maxHeight = options.maxHeight < termHeight ? options.maxHeight : termHeight - 1;
        Object.assign(this, options);

        try {
            this.tiles = this._setUpTiles(['n', 'e', 's', 'w'].random());
        } catch(e) {
            console.log("RNG SEED: ", ROT.RNG.getSeed())
            throw e;
        }

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

        // Clearn display
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
     * @param  {type} direction description
     * @returns {type}           description
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


            if(room.parent) {
                // First, check that adding the new room does not exceed the maximum limits
                let exceedsMax = (
                    house[room.z] !== undefined &&
                    (room.z > this.maxStories ||
                    room.width + house[room.z].length > this.maxWidth ||
                    room.height + house[room.z][0].length > this.maxHeight)
                );

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

                // Find a good spawn direction, and shift tiles accordingly
                while(possibleDirections.length) {
                    let currentDirection = possibleDirections.pop();

                    // Because a room could be tacked on to the north or west, x,y coordinate 0,0 can
                    // change. Rooms to the south and east of their ancestor are not a problem; just
                    // stick the 'cursor' at a brand new x or y coordinate. But if it's to the north
                    // or west, the whole thing needs to be shifted down or to the right, and then
                    // the new room added to the new 0,y or x,0 coordinates.
                    switch(currentDirection) {
                        case 'n':
                            room.y -= room.height - 1; // plus one so the rooms will share a wall

                            if(room.y < 0)
                                house[room.z] = this._shiftTilesSouth(room.height, house[room.z], room.z);

                            existingRoom = this._roomCheck(room.x, room.y, room.width, room.height - 1, house[room.z]);
                            break;
                        case 'w':
                            room.x -= room.width - 1; // plus one so the room.parents will share a wall

                            if(room.x < 0)
                                house[room.z] = this._shiftTilesEast(room.width, house[room.z], room.z);

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
                        default:
                            throw new Error("There are no more possible directions. This should not be possible...heh heh.");
                    }

                    // A room was found, so try another direction
                    if(existingRoom === true) {
                        room.x = room.parent.x;
                        room.y = room.parent.y;
                        continue;
                    } else {
                        room.spawnDirection = currentDirection;
                        break;
                    }
                }

                // TODO: handle what happens when we can't place the room on a
                // higher z-level because it exceeds the limits. This logic shouldn't be duplicated here and at the top of the loop? (exceedsMax)
                // If a place could not be found, increment the z level, and
                // put it in the back of the queue.
                if(room.spawnDirection === undefined || room.spawnDirection === null) {
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
        }

        // One last time, fill out any missing tiles with air or grass
        house = this._spaceFill(house);

        // Place doors
        // house = this._placeDoors(house);

        // Place stairs
        // house = this._placeStairs(house);

        // Now that the locations of all rooms have been set and adjusted, place items in each room
        // this._placeItems(this.graph);

        // for (var z = 0; z < house.length; z++) {
        //     console.log(z);
        //     _consoleLogGrid(house[z], '_char');
        // }
        // this._testZeroIndex(house, [room, house]);
        return house;
    }

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
     * @param  {Number} amount Number of rows to shift onto the beginning of the array
     * @param  {Array} tiles  Array of tile arrays to be shifted
     * @returns {Array}
     */
    _shiftTilesSouth(amount, tiles, z) {
        let tile;
        for(let x = 0; x < tiles.length; x++) {
            for(let y = 0; y < amount; y++) {
                tile = (z === 0) ? TileRepository.create('grass') : TileRepository.create('air');

                tiles[x].unshift(tile);

                // Adjust room and children y positions by child height
                if(x === 0) // Ensures we do this once, instead of for every row
                    this.maison.adjustY(1); // TODO: make sure this also updates the objects in the queue

            }
        }

        return tiles;
    }

    /**
     * _shiftTilesEast - unshift() a column of grass/air to every column based
     * on room width, and then adjusts every room in the maison instance accordingly.
     * Might need to refactor this to do every z-level, instead of working on only 1.
     *
     * @param  {Number} amount Number of columns to shift onto the beginning of the array
     * @param  {Array} tiles  Array of tile arrays to be shifted
     * @returns {Array}
     */
    _shiftTilesEast(amount, tiles, z) {
        let tile;
        if(!tiles || !tiles[0]) debugger;
        for(let x = 0; x < amount; x++) {
            tiles.unshift(new Array(tiles[0].length));

            for(let y = 0; y < tiles[0].length; y++) {
                tile = (z === 0) ? TileRepository.create('grass') : TileRepository.create('air');
                // Always use index of 0 since we're adding the array to the beginning
                tiles[0][y] = tile;
            }

            // Adjust room and children x positions by child width
            this.maison.adjustX(1);
        }

        return tiles;
    }

    _spaceFill(grid) {
        for (var z = 0; z < grid.length; z++) {
            // If there are varying heights, find the highest column
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
        // TODO: copied from happening per room. Should be refactored to place
        // doors based on the graph after all rooms have been placed.
        // Determine where to place the door
        var roomXY = this._listXY(room.x, room.y, room.width, room.height);
        var childXY = this._listXY(child.x, child.y, child.width, child.height);
        var commonXY = [];
        for (var l = 0; l < roomXY.length; l++)
            if(childXY.indexOf(roomXY[l]) > -1)
                commonXY.push(roomXY[l]);

        // Make sure door isn't placed in a corner by eliminating the least and greatest x or y coordinates, depending on spawn direction
        if(dir == 'n' || dir == 's') {
            var lowestX = commonXY.reduce(function(prev, curr) {
                return Math.min(prev, curr.split(",")[0]);
            }, commonXY[0].split(",")[0]);
            var highestX = commonXY.reduce(function(prev, curr) {
                return Math.max(prev, curr.split(",")[0]);
            }, commonXY[0].split(",")[0]);

            // Remove the extreme x tiles from the list
            for (var m = 0; m < commonXY.length; m++) {
                if(commonXY[m].split(",")[0] == lowestX || commonXY[m].split(",")[0] == highestX)
                    commonXY.splice(m, 1);
            }
        } else {
            var lowestY = commonXY.reduce(function(prev, curr) {
                return Math.min(prev, curr.split(",")[1]);
            }, commonXY[0].split(",")[1]);
            var highestY = commonXY.reduce(function(prev, curr) {
                return Math.max(prev, curr.split(",")[1]);
            }, commonXY[0].split(",")[1]);
            // Remove the extreme y tiles from the list
            for (var n = 0; n < commonXY.length; n++) {
                if(commonXY[n].split(",")[1] == lowestY || commonXY[n].split(",")[1] == highestY)
                    commonXY.splice(n, 1);
            }
        }

        var doorXY = commonXY.random().split(",");
        house[z][doorXY[0]][doorXY[1]] = TileRepository.create("door");
    }

    _placeStairs(tiles) {
        // TODO: should be refactored, was just cut from above code
        // If the house is more than one z level, place stairs where there is a valid floor tile on both z levels
        for (var z = 0; z < house.length; z++) {
            if(!house[z + 1])
                break;

            var floorTiles = this._getFloorTiles(house[z]);
            var randomFloor = false;
            for(var o = 0; o < floorTiles.length; o++) {
                var f = floorTiles[o].split(",");
                if(!house[z + 1][f[0]])
                    debugger;
                if(!house[z + 1][f[0]][f[1]])
                    continue;
                if(house[z + 1][f[0]][f[1]].getName() == 'floor') {
                    randomFloor = {
                        x: f[0],
                        y: f[1]
                    };
                    break;
                }
            }
            if(randomFloor !== false) {
                house[z][randomFloor.x][randomFloor.y] = TileRepository.create('stairsUp');
                house[z + 1][randomFloor.x][randomFloor.y] = TileRepository.create('stairsDown');
            }
        }
    }

    /**
     * roomCheck - Scan given tiles for any tiles that are not 'air' or 'grass'
     *
     * @param  {Number} startX
     * @param  {Number} startY
     * @param  {Number} width
     * @param  {Number} height
     * @param  {Array} tiles An array of arrays of tiles, such that tiles[x][y] == tile
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
     * @param  {Number} startX Starting X coordinate
     * @param  {Number} startY Starting Y coordinate
     * @param  {Number} width  How wide on the grid to go
     * @param  {Number} height How deep on the grid to go
     * @returns {Array}        An array of strings with the format "x,y"
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
}
