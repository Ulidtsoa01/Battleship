import React, { useState, useContext, useEffect } from 'react';
import Player from '../../factories/playerFactory';
import {
	ChallengeWindow,
	ChallengeForm,
	ChallengeLabel,
	ChallengeRejectButton,
	ChallengeAcceptButton,
} from '../styled_components/gameControllerStyles';
import { store } from '../../GameController';

function ChallengedByScreen({ setDismount, dismount, playBgSound, checkIfMusicPaused }) {
	const { state, dispatch } = useContext(store);
	const { challengedby, myname } = state;
	const [error, setError] = useState('');

	useEffect(() => {
		// like componentDidMount, should only be called once
		console.log(`Challenged by ${challengedby}`);
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

	const handleSubmit = (e) => {
		// do not refresh page
		e.preventDefault();
		console.log('handleSubmit called in ChallengedByScreen');

		fetch('/server/acceptChallenge', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: myname})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					console.log(`acceptChallenge returned with: ${JSON.stringify(data)}` );
					const human = new Player(myname);
					const computer = new Player('Computer');
					dispatch({ type: 'SET_PLAYERS', payload: { human, computer } });
					dispatch({ type: 'SET_OPPONENT', payload: data.opponent });
					setDismount(true);
				});
			} else { setError(`Unknown error with status ${response.status}`); }
		})
		.catch(error => {setError(error);});
	};

	const handleReject = () => {
		fetch('/server/rejectChallenge', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: myname})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					console.log(`rejectChallenge returned with: ${JSON.stringify(data)}` );
					dispatch({ type: 'SET_TIMELINE', payload: 'challenge' });
					//setDismount(true);
				});
			} else { setError(`Unknown error with status ${response.status}`); }
		})
		.catch(error => {setError(error);});
	};

	// this triggers if the component is fading out into next app state
	const handleAnimationEnd = () => {
		if (dismount) {
			console.log('handleAnimationEnd called in ChallengedByScreen with dismount set to true');
			setDismount(false);
			dispatch({ type: 'SET_TIMELINE', payload: 'setup' });
		}
	};

	return (
		<ChallengeWindow>
			<ChallengeForm
				style={{ animation: dismount ? 'fadeout 1.5s' : 'fadein 6s ease-in' }}
				onSubmit={handleSubmit}
				onAnimationEnd={handleAnimationEnd}
			>
				<ChallengeLabel >Challened by {challengedby} ...</ChallengeLabel>
				<ChallengeRejectButton type='button' onClick={handleReject}>Reject</ChallengeRejectButton>
				<ChallengeAcceptButton type='submit'>Accept</ChallengeAcceptButton>
			</ChallengeForm>
		</ChallengeWindow>
	);
}

export default ChallengedByScreen;
