var shipTypes = require('./shipTypes');

class Ship {
	constructor(name, position) {
		this.name = name;
		this.position = position;
		this.hits = [];
	}
	hit(index) {
		this.hits.push(index);
	}
	isSunk() {
		return this.position.every((occupiedCell) =>
			this.hits.includes(occupiedCell)
		);
	}
}

module.exports = Ship;
