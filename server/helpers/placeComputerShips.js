var shipTypes = require('./shipTypes');
var Ship = require('./shipFactory');
var Gameboard = require('./gameboardFactory');

function placeComputerShips() {
	// create a temporary board to check collisions and use single dispatch
	// we pass in our own board so we can use the methods on the class
	const tempBoard = new Gameboard();
	const ships = [];

	let index = 0;

	shipTypes.forEach((shipType) => {
		const ship = new Ship(
			shipType.name,
			tempBoard.findRandomShipLocation(shipType) // when uncomment this, uncomment the axis code in findRandomShipLocation as well
			//tempBoard.findFixedShipLocation(shipType, index)
		);
		index += 10;
		ship.position.forEach((pos) => (tempBoard.board[pos].hasShip = ship.name));
		ships.push(ship);
	});

	return {ships: ships, gameBoard: tempBoard};
}

module.exports = placeComputerShips;
