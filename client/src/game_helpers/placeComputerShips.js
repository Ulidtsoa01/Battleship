import shipTypes from './shipTypes';
import Ship from '../factories/shipFactory';
import Gameboard from '../factories/gameboardFactory';

function placeComputerShips(dispatch, computer) {
	// create a temporary board to check collisions and use single dispatch
	// we pass in our own board so we can use the methods on the class
	const tempBoard = new Gameboard(computer.gameBoard.board);
	const ships = [];

	computer.ships.forEach((theShip) => {
		const ship = new Ship(
			theShip.name,
			//tempBoard.findRandomShipLocation(shipType)
			theShip.position
		);
		//ship.position.forEach((pos) => (tempBoard.board[pos].hasShip = ship.name));
		ships.push(ship);
	});

	// update board state
	dispatch({
		type: 'SET_BOARD',
		payload: {
			player: 'computer',
			board: tempBoard.board,
		},
	});
	// update ship state
	dispatch({
		type: 'SET_SHIPS',
		payload: {
			ships,
			player: 'computer',
		},
	});
}

export default placeComputerShips;
