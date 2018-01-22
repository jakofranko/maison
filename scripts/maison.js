class Maison {
    constructor(options) {
        const defaults = {
            maxRooms: {
                // Max number of rooms
        		"kitchen": 1,
        		"dining room": 1,
        		"living room": 1,
        		"bedroom": 3,
        		"bathroom": 2,
        		"office": 1,
        		"hall": 3 // If halls aren't limited, they will just spawn an infinite number of halls and closets
            },
            maxStories: 1,
            maxWidth: 10,
            maxHeight: 10,
            roomNum: [],
            livingLocations: [],
            items: {}
        }

    	Object.assign(this, defaults, options);

        // Non-configurables
        this.rooms = [
            'foyer',		// 0
            'dining room',	// 1
            'living room',	// 2
            'kitchen',		// 3
            'office',		// 4
            'hall',			// 5
            'bathroom',		// 6
            'bedroom',		// 7
            'closet',		// 8
        ];

        this.roomSizes = {
        	'foyer': [3, 4], // roomName: [min, max]
        	'dining room': [8, 10],
        	'living room': [8, 10],
        	'kitchen': [8, 10],
        	'office': [7, 10],
        	'hall': [3, 5],
        	'bathroom': [5, 7],
        	'bedroom': [7, 11],
        	'closet': [3, 3],
        };

        this.possibleDirections = {
        	// Depending on which way a house is facing, it may only branch in any 3 given directions
        	'n': ['s', 'e', 'w'],
        	's': ['n', 'e', 'w'],
        	'e': ['n', 's', 'w'],
        	'w': ['n', 's', 'e']
        };

        // Used for generating the initial graph
        this.grammar = {
        	'foyer': [1, 2, 3, 4, 5],
        	'dining room': [2, 3, 5],
        	'living room': [1, 3, 4, 5],
        	'kitchen': [1, 2, 5],
        	'office': [8],
        	'hall': [1, 2, 3, 4, 5, 6, 7, 8],
        	'bathroom': [8],
        	'bedroom': [8],
        	'closet': false
        };

    	// Set initial number of rooms, to be incremented as they are added
    	this.roomNum = [];
    	for (var i = 0; i < this.rooms.length; i++)
    		this.roomNum[this.rooms[i]] = 0;
    }

    generate(name) {
    	// Create a new room
    	var room = new Chambre(name);

    	if(this.grammar[name] === false) {
    		return room;
    	} else {
    		// Pick a random number of connections up to 3 or the number
    		// of connections that room can have, whichever is less
    		var numPossibleChildren = this.grammar[name].length;
    		var numChildren = Math.min(3, numPossibleChildren);
    		for (var i = 0; i < numChildren; i++) {
    			var randomChild = this._getRandomChild(name);

    			if(randomChild) {
    				// Increment the room number, and do it before we recurse
    				this.roomNum[randomChild]++;
    				room.addChild(this.generate(randomChild));
    			}
    		}

    		return room;
    	}
    }

    // Get a new array from the possible room children based on what rooms aren't at their max.
    // Puts together an array of valid room indexes, and then returns the corresponding room string.
    // Will only return rooms that have not exceeded their maximum limit.
    _getRandomChild(room) {
    	var possibleChildren = [];
    	this.grammar[room].forEach(function(val, index) {
    		var roomName = this.rooms[val];
    		if(!this.maxRooms[roomName] || this.roomNum[roomName] <= this.maxRooms[roomName])
    			possibleChildren.push(val);
    	}, this);

    	var child;
    	if(possibleChildren.length > 0)
    		child = possibleChildren.random();
    	else
    		child = false;

    	if(child === false)
    		return false;
    	else
    		return this.rooms[child];
    };

    static getRoomSize(name) {
        const roomSizes = {
        	'foyer': [3, 4], // roomName: [min, max]
        	'dining room': [8, 10],
        	'living room': [8, 10],
        	'kitchen': [8, 10],
        	'office': [7, 10],
        	'hall': [3, 5],
        	'bathroom': [5, 7],
        	'bedroom': [7, 11],
        	'closet': [3, 3],
        };

        return roomSizes[name];
    }
}
