import React, { useState, useContext, useEffect } from 'react';
import Player from '../../factories/playerFactory';
import {
	ChallengeWindow,
	ChallengeForm,
	ChallengeLabel,
} from '../styled_components/gameControllerStyles';
import { store } from '../../GameController';

function WaitAfterChallengeScreen({ setDismount, dismount, playBgSound, checkIfMusicPaused }) {
	const { state, dispatch } = useContext(store);
	const { challenging, myname } = state;
	const [error, setError] = useState('');
	const [waitMessage, setWaitMessage] = useState('');

	const resetChallengeStatus = () => {
		console.log(`calling resetChallengeStatus after rejected for ${state.myname}`);
		fetch('/server/resetChallengeStatus', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: state.myname})
		}).then(response => {
			// handle the response
			//console.log(response);
			if (response.status === 200) {
				response.json().then(data => {
					console.log("resetChallengeStatus returned with: ${data}");
				});
			} else { console.log(`Unknown error after rejected with status ${response.status}`); }
		})
		.catch(error => {console.log(error);});
	};

	const getChallengeStatus = () => {
		console.log(`calling getChallengeStatus after challenge for ${state.myname}`);
		fetch('/server/getChallengeStatus', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: state.myname})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					console.log(`getChallengeStatus after challenge returned with: ${JSON.stringify(data)}`);
					if (data.status === 'Challenging') {
						// check again in 5 seconds
						setTimeout(getChallengeStatus, 5000);
					} else if (data.status === 'Rejected') {
						console.log(`getChallengeStatus says challenge rejected by ${data.opponent}`);
						// move to ChallengeScreen
						setWaitMessage(`Your challenge was rejected by ${data.opponent}`);
						setTimeout(() => {
							resetChallengeStatus();
							setDismount(false);
							dispatch({ type: 'SET_TIMELINE', payload: 'challenge' });
						}, 5000);
					} else if (data.status === 'Accepted') {
						console.log(`getChallengeStatus says challenge accepted by ${data.opponent}`);
						// move to ChallengeScreen
						setWaitMessage(`Your challenge was accepted by ${data.opponent}`);
						setTimeout(() => {
							resetChallengeStatus();
							setDismount(false);
							const human = new Player(myname);
							const computer = new Player('Computer');
							dispatch({ type: 'SET_PLAYERS', payload: { human, computer } });
									dispatch({ type: 'SET_OPPONENT', payload: data.opponent });
							dispatch({ type: 'SET_TIMELINE', payload: 'setup' });
						}, 5000);
					} else {
						console.log(`Status (${data.status}) is no longer Idle. Stopped getting more challenge status.`);
					}
				});
			} else { setError(`Unknown error with status ${response.status}`); }
		})
		.catch(error => {setError(error);});
	};

	useEffect(() => {
		// like componentDidMount, should only be called once
		setWaitMessage(`Challening ${challenging} ...`);
		setTimeout(getChallengeStatus, 500);
	}, []);
/*
	useEffect(() => {
		// runs anytime the component is updated
		console.log(`useEffect in ChallengeScreen with opponents:`);
		console.log(opponents);
	});
*/

	const handleFocus = () => {
		if (checkIfMusicPaused()) {
			playBgSound('music');
		}
	};

	// this triggers if the component is fading out into next app state
	const handleAnimationEnd = () => {
		console.log(`handleAnimationEnd called in WaitAfterChallengeScreen with dismount=${dismount}`);
		//if (dismount) dispatch({ type: 'SET_TIMELINE', payload: 'setup' });
	};

	return (
		<ChallengeWindow>
			<ChallengeForm
				style={{ animation: dismount ? 'fadeout 1.5s' : 'fadein 6s ease-in' }}
				onAnimationEnd={handleAnimationEnd}
			>
				<ChallengeLabel >{waitMessage}</ChallengeLabel>
			</ChallengeForm>
		</ChallengeWindow>
	);
}

export default WaitAfterChallengeScreen;
