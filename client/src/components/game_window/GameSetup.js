import React, { useState, useEffect, useContext } from 'react';
import {
	SetupWindow,
	SetupTitle,
	AxisButton,
	GridOverlayContainer,
} from '../styled_components/gameControllerStyles';
import ShipPlacementGrid from './ShipPlacementGrid';
import CellSelectorGrid from './CellSelectorGrid';
import shipTypes from '../../game_helpers/shipTypes';
import placePlayerShip from '../../game_helpers/placePlayerShip';
import placeComputerShips from '../../game_helpers/placeComputerShips';
import { store } from '../../GameController';

function GameSetup({ dismount, setDismount, fadeOutMusic }) {
	const { state, dispatch } = useContext(store);
	const { players, timeline, opponent } = state;
	const [currentShip, setCurrentShip] = useState(0);
	const [setupTitle, setSetupTitle] = useState('');
	const [axis, setAxis] = useState('x');
	const [loading, setLoading] = useState(true);

	const getOpponentBoard = () => {
		fetch('/server/getOpponentBoard', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: players.human.name})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					console.log(`getOpponentBoard returned with: ${JSON.stringify(data)}` );
					if (data.ready) {
						placeComputerShips(dispatch, data.opponentBoard);
						setDismount(true);
						dispatch({ type: 'SET_TURN', payload: data.myturn ? 0 : 1 });
						dispatch({ type: 'SET_TIMELINE', payload: 'game start' });
					} else {
						setTimeout(getOpponentBoard, 5000); // check again in 5 seconds
					}
				});
			} else {
				console.log(`Unknown error from getOpponentBoard with status ${response.status}`);
			}
		}).catch(error => { console.log(error);});
	};

	const placeMyShips = (player) => {
		fetch('/server/placeMyShips', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: players.human.name, ships: players.human.ships, gameBoard: players.human.gameBoard})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					console.log(`placeMyShips returned with: ${JSON.stringify(data)}` );
					// TODO: show a message to tell user to wait for opponent
					getOpponentBoard();
				});
			} else {
				console.log(`Unknown error from placeMyShips with status ${response.status}`);
			}
		}).catch(error => { console.log(error);});
    };

	useEffect(() => {
		// like componentDidMount, should only be called once
		let msg = `${players.human.name}, Place Your ${shipTypes[currentShip].name}`;
		setSetupTitle(msg);
	}, []);

	// using a new loading state to avoid race conditions between the render
	// and setDismount. this causes the animation to load incorrectly.
	// this method allows the component to always render with
	// the animation starting from being completely faded
	useEffect(() => {
		if (loading) {
			setDismount(false);
			setLoading(false);
		}
	}, [setDismount, loading]);

	useEffect(() => {
		//console.log("useEffect: " + JSON.stringify(state.players));
		if (state.players.human.ships.length >= 5 && timeline !== 'ships placed') {
			//console.log("5 ships now. Time to send it to the server.");
			//console.log(state.players.human);
			dispatch({ type: 'SET_TIMELINE', payload: 'ships placed' });
			console.log('Placing ships...')
			placeMyShips(players.human);

			//placeComputerShips(dispatch, state.players.computer.gameBoard);
			//setDismount(true);
		}
	}, [dispatch,state.players.human,setDismount]);

	const handleAnimationEnd = () => {
		// allow for the fadeout
		console.log(`GameSetup.handleAnimationEnd called with dismount==${dismount}`);
		if (dismount) {
			dispatch({ type: 'SET_TIMELINE', payload: 'game start' });
		}
	};

	const handlePlaceShip = (location) => {
		const { name, gameBoard } = players.human;
		const locationArray = gameBoard.createLocationArray(
			location,
			shipTypes[currentShip],
			axis
		);
		// returns true if there are no collisions
		if (gameBoard.checkCollisions(locationArray)) {
			placePlayerShip({
				player: players.human,
				locationArray,
				currentShip,
				dispatch,
			});
			// check if this is the last ship to be placed
			if (currentShip >= 4) {
				fadeOutMusic();
				let msg = `Waiting for ${opponent} to finish placing ships ...`;
				setSetupTitle(msg);
			} else {
				let msg = `${players.human.name}, Place Your ${shipTypes[currentShip + 1].name}`;
				setSetupTitle(msg);
				setCurrentShip(currentShip + 1);
			}
		}
	};

	return (
		!loading && (
			<SetupWindow
				onAnimationEnd={handleAnimationEnd}
				style={{ animation: dismount ? 'fadeout 2s' : 'fadein 2s' }}
				id="SetupWindow"
			>
				<SetupTitle id="SetupTitle">
					{setupTitle}
				</SetupTitle>
				<AxisButton onClick={() => setAxis(axis === 'x' ? 'y' : 'x')} id="AxisButton">
					AXIS: {axis}
				</AxisButton>
				<GridOverlayContainer id="GridOverlapContainer">
					{/* for ship placement */}
					<ShipPlacementGrid id="ShipPlacementGrid" />
					{/* cells for click handlers */}
					<CellSelectorGrid
						currentShip={currentShip}
						axis={axis}
						handlePlaceShip={handlePlaceShip}
						id="CellSelectorGrid"
					/>
				</GridOverlayContainer>
			</SetupWindow>
		)
	);
}

export default GameSetup;
