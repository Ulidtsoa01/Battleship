// callback refers to the computer turn, so that it only executes when this function completes
function humanTurn(
	{ dispatch, index, computer, computerTurn, players, checkWinner, playSound }
) {

	const processFireShotData = (data) => {
		// {hit: true/false, sunk: true/false, hitShip:{...}, won: true/false}
		let sound;
		if (data.hit) {
			sound = 'shotHit';
			const newShips = [...computer.ships];
			const hitShip = newShips.find(
				(ship) => ship.name === data.hitShip.name
			);
			hitShip.hit(index);
			dispatch({
				type: 'SET_SHIP_HITS',
				payload: { player: 'computer', ship: hitShip, hits: hitShip.hits },
			});
			if (data.sunk) {
				dispatch({
					type: 'SET_MESSAGE',
					payload: `You fire a shot into enemy waters ...... you sunk their ${hitShip.name}!`,
				});
				if (data.won) {
					// handle winning situation
					setTimeout(() => {
						console.log(`${players.human.name} won!!!`)
						dispatch({
							type: 'SET_MESSAGE',
							payload: `The winner is ...... ${players.human.name}!`,
						});
						dispatch({type: 'SET_WINNER', payload: players.human.name});
					}, 2500);
				}
			} else {
				dispatch({
					type: 'SET_MESSAGE',
					payload: "You fire a shot into enemy waters ...... it's a hit!",
				});
			}
		} else {
			sound = 'shotMiss';
			dispatch({
				type: 'SET_MESSAGE',
				payload: 'You fire a shot into enemy waters ...... and miss.',
			});
		}

		playSound(sound);
		dispatch({
			type: 'FIRE_SHOT',
			payload: { player: 'human', location: index },
		});		
		dispatch({ type: 'SET_TURN', payload: 1 }); // opponent turn
		/* move to getOpponentShot in EnemyWatersGrid
		// handle enemy turn (TODO: if not computer, it might not come back right away)
		if (!data.won) {
			setTimeout(getOpponentShotFunc, 1700);
		}
		*/
	};

	let fireShotFunc = () => {
		fetch('/server/fireShot', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({"name": players.human.name, "location": index})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(processFireShotData);
			} else {
				console.log(`Unknown error with status ${response.status}`);
			}
		}).catch(error => {console.log(error);});
	};

	// don't allow if there's a winner
	//console.log(players);
	if (!checkWinner(players)) { // TODO: better way to check winner. A win field in Player?
		// initialize mutable sound variable, allow outcomes to mutate
		//const computerBoard = computer.gameBoard;
		playSound('fireShot');
		setTimeout(fireShotFunc, 0);
	}
}

export default humanTurn;
