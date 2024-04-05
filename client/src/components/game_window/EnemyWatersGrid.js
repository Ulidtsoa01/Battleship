import React, { useContext, useState, useEffect } from 'react';
import {
	GameBoardGrid,
	Cell,
	SetupGridContainer,
	WatersContainer,
} from '../styled_components/gameControllerStyles';
import findShipPlacement from '../../game_helpers/findShipPlacement';
import ShotMarker from '../icons/ShotMarker';
import computerTurn from '../../game_helpers/computerTurn';
import checkWinner from '../../game_helpers/checkWinner';
import humanTurn from '../../game_helpers/humanTurn';
import { store } from '../../GameController';

function EnemyWatersGrid({ playSound }) {
	const { state, dispatch } = useContext(store);
	const { turn, winner, players, opponent } = state;
	const [shotTimeout, setShotTimeout] = useState(false);
	const computer = players.computer;
	const computerBoard = computer.gameBoard;
	const playerBoard = players.human.gameBoard;

	const processOpponentShot = (opponentShot) => {
		// {location: location, hit: true/false, sunk: true/false, hitShip:{...}, won: true/false}
		let sound;
		playSound('fireShot');
		const shotLocation = opponentShot.location;
		if (opponentShot.hit) {
			sound = 'shotHit';
			const newShips = { ...players.human }.ships;
			const hitShip = newShips.find(
				(ship) => ship.name === opponentShot.hitShip.name
			);
			hitShip.hit(shotLocation);
			// update hits on human ships
			dispatch({
				type: 'SET_SHIP_HITS',
				payload: { player: 'human', ship: hitShip, hits: hitShip.hits },
			});
			if (opponentShot.sunk) {
				dispatch({
					type: 'SET_MESSAGE',
					payload: `The enemy fires a shot into your waters ...... they sunk your ${hitShip.name}!`,
				});
				if (opponentShot.won) {
					// handle winning situation
					setTimeout(() => {
						dispatch({
							type: 'SET_MESSAGE',
							payload: `The winner is ...... ${opponent}!`,
						});
						dispatch({type: 'SET_WINNER', payload: opponent});
					}, 2500);
				}
			} else {
				dispatch({
					type: 'SET_MESSAGE',
					payload:
						"The enemy fires a shot into your waters ...... it's a hit!",
				});
			}						
		} else {
			sound = 'shotMiss';
			dispatch({
				type: 'SET_MESSAGE',
				payload: 'The enemy fires a shot into your waters ...... and misses.',
			});
		}
		// fire on that spot after message populates
		setTimeout(() => {
			playSound(sound);
			computer.fireShot(shotLocation, players.human.gameBoard);
			dispatch({ type: 'SET_TURN', payload: 0 }); // my turn
			setShotTimeout(false);
		}, 1800);
	};

	const getOpponentShot = () => {
		if (winner) {
			return;  // do not process opponent shot if I already won
		}
		console.log(`calling getOpponentShot in EnemyWatersGrid for ${players.human.name}`);
		fetch('/server/getOpponentShot', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: state.players.human.name})
		}).then(response => {
			if (response.status === 200) {
				if (winner) {
					return;  // do not process opponent shot if I already won
				}
				response.json().then(data => {
					console.log(`getOpponentShot in EnemyWatersGrid returned with: ${JSON.stringify(data)}` );
					if (data.over) {
						return; // stop checking
					} else if (!data.ready) {						
						setTimeout(getOpponentShot, 3000); // check again in 3 seconds
					} else {
						processOpponentShot(data.opponentShot);
					}
				});
			} else { console.log(`Unknown error with status ${response.status}`); }
		})
		.catch(error => {console.log(error);});
	};

	useEffect(() => {
		// like componentDidMount, should only be called once
		console.log(`useEffect like componentDidMount called in EnemyWatersGrid with turn=${turn}`);
		let msg = (turn === 0) ?
			`Awaiting orders, Admiral ${players.human.name}`
			: `Waiting for ${opponent} to take a shot ...`;
		dispatch({type: 'SET_MESSAGE', payload: msg});
	}, []);

	useEffect(() => {
		console.log(`useEffect for turn called in EnemyWatersGrid with turn=${turn}`);

		if (turn === 1) {
			setTimeout(() => {
				getOpponentShot();
			}, 2700);
		}
	}, [turn]);
	
	const handlePlayerShot = (index) => {
		if (!shotTimeout && !winner) {
			// ignore shots while HUD is sending message
			setShotTimeout(true);
			// clear message HUD
			dispatch({ type: 'RESET_MESSAGE' });
			humanTurn(
				{
					dispatch,
					index,
					computer,
					computerTurn,
					players,
					checkWinner,
					playSound,
				}
			);
		}
	};

	// create a map to populate the grid
	const fillCells = () => {
		let arr = [];
		for (let i = 0; i < 100; i++) {
			arr.push([i]);
		}
		return computerBoard.opponentBoard().map((cell, index) => {
			return (
				<Cell
					key={index}
					board='enemy'
					cursor={cell === 'empty' ? 'crosshair' : 'not-allowed'}
					onClick={() => {
						if (turn === 0 && cell === 'empty') {
							handlePlayerShot(index);
						}
					}}
					shot={cell !== 'empty'}
				>
					{cell !== 'empty' && <ShotMarker hit={cell === 'hit' ? 'hit' : ''} />}
				</Cell>
			);
		});
	};

	return (
		<WatersContainer row='3' id="enemyWatersContainer">
			<SetupGridContainer id="enemyShipSetupGridContainer">
				<GameBoardGrid id="enemyGameBoardGrid">
					{computer.ships.map((ship) => {
						if (ship.isSunk() || winner) {
							const placement = findShipPlacement(ship, computerBoard.board);
							const shipProps = {
								start: placement.start,
								axis: placement.axis,
								sunk: ship.isSunk(),
							};
							return ship.getComponentWithProps(shipProps);
						} else {
							return null;
						}
					})}
				</GameBoardGrid>
			</SetupGridContainer>
			<SetupGridContainer id="enemyFillSetupGridContainer">
				<GameBoardGrid id="enemyFillGameBoard">{fillCells()}</GameBoardGrid>
			</SetupGridContainer>
		</WatersContainer>
	);
}

export default EnemyWatersGrid;
