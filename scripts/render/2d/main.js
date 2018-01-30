class Render2D {
    constructor(maison, options = {}) {
        // Display width and height is in characters, so divide the width and height by the fontSize
        this.maison = maison;
        this.container = options['container'] || document.getElementById("display");
        this.display = new ROT.Display();

        this.container.appendChild(this.display.getContainer());

        this.tiles = this._setUpTiles(['n', 'e', 's', 'w'].random());
        console.log(this.tiles);

        this._resizeTerminal(display);
        window.addEventListener('resize', this._resizeTerminal.bind(this, display));
    }

    render() {
        let levels = this.tiles.length,
            width = this.tiles[0].length,
            height = this.tiles[0][0].length,
            tile;

        for (var z = 0; z < levels; z++) {
            for (var x  = 0; x < width; x ++) {
                for (var y = 0; y < height; y++) {
                    tile = this.tiles[z][x][y];
                    this.display.draw(x, y, tile._char, tile._foreground, tile._background);
                }
            }
        }
    }

    // Because a room could be tacked on to the north, x,y coordinate 0,0 is going to
    // change. Rooms to the south and east of their ancestor are not a problem; just
    // stick the 'cursor' at a brand new x or y coordinate. But if it's to the north
    // or west, the whole thing needs to be shifted down or to the right, and then
    // the new room added to the new 0,y or x,0 coordinates.
    _setUpTiles(direction) {
        // The array of tiles to be returned
    	let house = [];

    	// This will be an array of rooms to do next.
    	let queue = [this.maison.graph];

    	// Process the queue until it's empty. Processing a room will consist of the following:
    	// 1. Draw the room starting at the designated x, y, and z
    	// 2. Loop through the room's children. For each child, pick a direction that the room will be added on to, and then detect whether a room already exists in that direction. If a room exists and adding a story would not exceed the maximum story limit of a house, add an up stairs and a down stairs in the current room and give the child room the same x,y coordinates of the parent room, set all of the child rooms chidren nodes to the new z level, and then add the child to the queue. If a room exists but you cannot add a story, skip the child.
    	// 3. If a room does not exist in the projected space, then assign the x,y start location to the child based on the current child's width and height, such that when starting at x,y and then rendering the room tiles, it will connect to the door placed in step 5 as well as share a wall with the parent node.
    	// 4. If the x or y values of the new room are negative, shift the x and y values of the child and the parent until they are no longer negative while simultaneously adding spaces onto the house in the appropriate direction.
    	// 5. After the new x and y values of the child and parent are known (and if they are on the same z level), it is possible to know what x and y coordinates they will share. This should be the shared wall. After getting a list of the coordinates they will share, eliminate the extreme x or y coordinates to avoid placing a door in a corner, and then randomly pick a coordinate for a door and replace the wall tile with a door tile.
    	// 6. Add the child (with assigned x, y, and z values) to the queue of rooms to render
    	while(queue.length > 0) {
    		let room = queue.shift();
    		let possibleDirections = this.maison.possibleDirections[direction].randomize();
    		let x, y, z;
    		let existingRoom = false;

    		// Render room tiles
    		let roomTiles = this._renderRoom(room, direction);

    		// Add room tiles to our house tiles
    		x = room.x;
    		y = room.y;
    		z = room.z;

    		// Check Maison instance (this.maison) to see if a room exists
            // already at the current room's location. Depending on the room
            // spawn direction, shave off one side in order to skip the shared wall.
    		switch(room.spawnDirection) {
    			case 'n':
    				existingRoom = this.maison.roomCheck(x, y, room.width, room.height - 1, house[z]);
    				break;
    			case 'e':
    				existingRoom = this.maison.roomCheck(x + 1, y, room.width, room.height, house[z]);
    				break;
    			case 's':
    				existingRoom = this.maison.roomCheck(x, y + 1, room.width, room.height, house[z]);
    				break;
    			case 'w':
    				existingRoom = this.maison.roomCheck(x, y, room.width - 1, room.height, house[z]);
    				break;
    			default:
    				break;
    		}

    		// A room was found, so skip this room
    		if(existingRoom === true) {
    			room.placed = false;
    			continue;
    		}

    		// No existing room was found, so render on!
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

    		// Process the room's children if it has any
    		if(room.children.length > 0) {
    			// Pick direction to branch from
    			for (var k = 0; k < room.children.length; k++) {
    				// These might have changed since the last iteration. Make sure they
    				// are up-to-date with the newest location of the current room
    				x = room.x;
    				y = room.y;
    				z = room.z;

    				// Get the current child and a random spawn direction
    				var child = room.children[k];
    				var dir = possibleDirections.pop();
    				child.spawnDirection = dir;

    				// Now that a child and the direction it will spawn have been chosen:
    				// 1) Check to see if adding this child will exceed the maxWidth or maxHeight properties
    				// 2) If it will, instead stack the room on top of its parent and place stairs
    				// 3) Otherwise, shift the house tiles if necessary
    				// 4) Set the room and child x,y coordinates
    				// 5) Determine a place on the wall the rooms will share, and add a door
    				var exceedsMax = (
    					child.width + house[z].length > this.maxWidth ||
    					child.height + house[z][0].length > this.maxHeight
    				);
    				if(exceedsMax && z + 1 <= this.maxStories) {
    					// Set the child's x, y, and z levels...
    					child.x = x;
    					child.y = y;
    					child.setZ(z + 1);

    					// And push it into the queue.
    					queue.push(child);

    				} else if(!exceedsMax) {
    					switch(dir) {
    						case 'n':
    							child.x = x;
    							child.y = y - child.height + 1; // plus one so the rooms will share a wall

    							if(child.y < 0)
                                    house[z] = this._shiftTilesSouth(child.height, house[z], z);

    							break;
    						// Shift whole house 'east' by using Array.prototype.unshift()
    						case 'w':
    							child.x = room.x - child.width + 1; // plus one so the rooms will share a wall
    							child.y = room.y || 0;

    							if(child.x < 0)
    								house[z] = this._shiftTilesEast(child.width, house[z], z);

    							break;
    						case 'e':
    							child.x = room.x + room.width - 1; // minus one so the rooms will share a wall
    							child.y = room.y || 0;
    							break;
    						case 's':
    							child.x = room.x || 0;
    							child.y = room.y + room.height - 1; // minus one so the rooms will share a wall
    							break;
    						default:
    							throw new Error("There are no more possible directions. This should not be possible...heh heh.");
    					}

    					// Add the child room to the queue
    					queue.push(child);
    				} else {
    					// Adding the child would exceed maxWidth or maxHeight and it cannot be placed above the parent, so skip it
    					child.setPlaced(false);
    					continue;
    				}
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
    	// 	console.log(z);
    	// 	_consoleLogGrid(house[z], '_char');
    	// }
    	// this._testZeroIndex(house, [room, house]);
    	return house;
    };

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
    	if(room.room == 'foyer') {
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
        let options = this.display.getOptions();
        let parent = this.display.getContainer().parentElement;

        // Set size of display based on parent size
        let size = this.display.computeSize(parent.clientWidth, parent.clientHeight);
        this.display.setOptions({width: size[0], height: size[1]});

        // Set fontsize based on size of display
        let fontSize = this.display.computeFontSize(parent.clientWidth, parent.clientHeight);
        this.display.setOptions({ fontSize });
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
    };
}
