var shipTypes = require('./shipTypes');
var Ship = require('./shipFactory');
var Gameboard = require('./gameboardFactory');

function placeMyShips(reqbody, player) {
	// create a temporary board to check collisions and use single dispatch
	// we pass in our own board so we can use the methods on the class
	const ships = [];

    reqbody.ships.forEach((aShip) => {
        const ship = new Ship(aShip.name, aShip.position);
        ships.push(ship);
    });

    player.ships = ships;
    player.gameBoard = new Gameboard(reqbody.gameBoard.board);
}

module.exports = placeMyShips;
