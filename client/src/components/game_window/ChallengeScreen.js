import React, { useState, useContext, useEffect } from 'react';
import Player from '../../factories/playerFactory';
import {
	InitWindow,
	PlayerForm,
} from '../styled_components/gameControllerStyles';
import { store } from '../../GameController';

function ChallengeScreen({ setDismount, dismount, playBgSound, checkIfMusicPaused }) {
	const { state, dispatch } = useContext(store);
	const [opponents, setOpponents] = useState('');
	const [selected, setSelected] = useState('');
	const [error, setError] = useState('');

	const getChallengeStatus = () => {
		//console.log(`calling getChallengeStatus in ChallengeScreen for ${state.myname}`);
		fetch('/server/getChallengeStatus', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: state.myname})
		}).then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					console.log(`getChallengeStatus in ChallengeScreen returned with: ${JSON.stringify(data)}` );
					if (data.status === 'Idle' || data.status === 'Won' || data.status === 'Lost') {						
						setTimeout(getChallengeStatus, 5000); // check again in 5 seconds
					} else if (data.status === 'Challenged') {
						console.log(`getChallengeStatus says I am challenged by ${data.opponent}`);
						// move to ChallengedByScreen
						dispatch({ type: 'SET_CHALLENGEDBY', payload: data.opponent });
						dispatch({ type: 'SET_TIMELINE', payload: 'challengedby' });
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
		console.log(`useEffect like componentDidMount called in ChallengeScreen`);
		console.log(`user name is ${state.myname}`);
		setTimeout(() => {
			fetch('/server/getChallengeableOpponents', {
				method: 'POST',
				headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
				body: JSON.stringify({name: state.myname})
			}).then(response => {
				if (response.status === 200) {
					response.json().then(data => {
						console.log(`getChallengeableOpponents returned with: ${JSON.stringify(data)}` );
						setOpponents(data.opponents);
						getChallengeStatus();
					});
				} else { setError(`Unknown error with status ${response.status}`); }
			})
			.catch(error => {setError(error);});
		}, 0);
	}, []);

/*
	useEffect(() => {
		// runs anytime the component is updated
		console.log(`useEffect in ChallengeScreen with opponents:`);
		console.log(opponents);
	});
*/

	const handleChange = (e) => {
		//console.log(`handleChange called with ${e.target.value}`);
		setSelected(e.target.value);
	};

	const handleFocus = () => {
		if (checkIfMusicPaused()) {
			playBgSound('music');
		}
	};

	const handleSubmit = (e) => {
		// do not refresh page
		e.preventDefault();
		let chosenOne = selected ? selected : opponents[0];
		console.log(`handleSubmit called with ${chosenOne}`);
		fetch('/server/challenge', {
			method: 'POST',
			headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
			body: JSON.stringify({name: state.myname, opponent: chosenOne})
		}).then(response => {
			// handle the response
			//console.log(response);
			if (response.status === 200) {
				response.json().then(data => {
					console.log("challenge in handleSubmit returned with: ${data}");
					dispatch({ type: 'SET_CHALLENGING', payload: chosenOne });
					setDismount(true);
				});
			} else { setError(`Unknown error with status ${response.status}`); }
		})
		.catch(error => {setError(error);});
	};

	// this triggers if the component is fading out into next app state
	const handleAnimationEnd = () => {
		console.log(`handleAnimationEnd called in ChallengeScreen with dismount=${dismount}`);
		if (dismount) {
			setDismount(false);
			dispatch({ type: 'SET_TIMELINE', payload: 'challenging' });
		}
	};

	return (
		<InitWindow>
			<PlayerForm
				style={{ animation: dismount ? 'fadeout 1.5s' : 'fadein 6s ease-in' }}
				onSubmit={handleSubmit}
				onAnimationEnd={handleAnimationEnd}
			>
				<label htmlFor='opponents'>Choose your opponent:</label>
				<select name="opponents" id="opponents" onChange={handleChange}>
					{opponents ? opponents.map((oppo) => {
						return <option key={oppo}>{oppo}</option>
					}) : null}
				</select>
				{/* displays errors if name is invalid */}
				<p style={{ color: 'red' }}>{error}</p>
				<button type='submit'>Challenge</button>
			</PlayerForm>
		</InitWindow>
	);
}

export default ChallengeScreen;
