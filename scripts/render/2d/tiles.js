const TileRepository = new Repository('tiles', Tile);

TileRepository.define('null', {
    name: 'null',
    description: '(unknown)'
});
TileRepository.define('air', {
    name: 'air',
    description: 'Empty space'
});
TileRepository.define('floor', {
    name: 'floor',
    character: '.',
    walkable: true,
    blocksLight: false,
    description: 'The floor'
});
TileRepository.define('grass', {
    name: 'grass',
    character: '"',
    foreground: '#B3C67F',
    walkable: true,
    blocksLight: false,
    description: 'A patch of grass'
});
TileRepository.define('brick wall', {
    name: 'brick wall',
	character: '#',
	foreground: '#ab2e34',
	blocksLight: true,
    outerWall: true,
    description: 'A brick wall'
});
TileRepository.define('stairsUp', {
    name: 'stairsUp',
    character: '<',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'A staircase leading upwards'
});
TileRepository.define('stairsDown', {
    name: 'stairsDown',
    character: '>',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'A staircase leading downwards'
});
TileRepository.define('water', {
    name: 'water',
    character: '~',
    foreground: 'blue',
    walkable: false,
    blocksLight: false,
    description: 'Clear blue water'
});

// Road tiles
TileRepository.define('asphault', {
    name: 'asphault',
    character: '.',
    foreground: '#302e36',
    walkable: true,
    blocksLight: false,
    description: 'Asphault road'
});
TileRepository.define('two-way stripe', {
    name: 'two-way stripe',
    character: '.',
    foreground: '#d7d804',
    walkable: true,
    blocksLight: false,
    description: 'A two-way road stripe'
});

// Sidewalk
TileRepository.define('sidewalk', {
    name: 'sidewalk',
    character: '.',
    foreground: '#ada5b2',
    walkable: true,
    blocksLight: false,
    description: 'A sidewalk'
});

// Building Materials
TileRepository.define('window-vertical', {
    name: 'window-vertical',
    character: '|',
    foreground: '#aadfff',
    walkable: false,
    blocksLight: false,
    description: "A glass window"
});
TileRepository.define('window-horizontal', {
    name: 'window-horizontal',
    character: '-',
    foreground: '#aadfff',
    walkable: false,
    blocksLight: false,
    description: "A glass window"
});
TileRepository.define('indoor wall-vertical', {
    name: 'indoor wall-vertical',
    character: '|',
    foreground: '#ffffff',
    walkable: false,
    blocksLight: false,
    innerWall: true,
    description: "A wall"
});
TileRepository.define('indoor wall-horizontal', {
    name: 'indoor wall-horizontal',
    character: '-',
    foreground: '#ffffff',
    walkable: false,
    blocksLight: false,
    innerWall: true,
    description: "A wall"
});
TileRepository.define('door', {
    name: 'door',
    character: '+',
    foreground: '#8b888d',
    walkable: true,
    blocksLight: false,
    description: "A steel door"
});
TileRepository.define('glass door', {
    name: 'glass door',
    character: '+',
    foreground: '#aadfff',
    walkable: true,
    blocksLight: false,
    description: "A glass door"
});
TileRepository.define('guard rail', {
    name: 'guard rail',
    character: '#',
    foreground: 'grey',
    walkable: false,
    blocksLight: false,
    description: 'A metal guard rail'
});
