import React, { useContext, useState, useEffect } from 'react';
import { store } from '../../GameController';
import {
	GameStartContainer,
	HudWindow,
	LabelContainer,
	WinAgainButton
} from '../styled_components/gameControllerStyles';

import EnemyWatersGrid from './EnemyWatersGrid';
import FriendlyWatersGrid from './FriendlyWatersGrid';
//import checkWinner from '../../game_helpers/checkWinner';

function GameStart({ setDismount, playBgSound, playSound }) {
	const { state, dispatch } = useContext(store);
	const { message, winner, myname } = state;
	const [hudMessage, setHudMessage] = useState('');
/* not good to check winner here, hit too many times
	useEffect(() => {
		console.log("About to check winner in GameStart");
		if (checkWinner(state.players)) {
			setTimeout(() => {
				dispatch({
					type: 'SET_WINNER',
					payload: checkWinner(state.players).name,
				});
			}, 2500);
		}
	});
*/
	useEffect(() => {
		// set dismount animation check in case of another playthrough
		console.log(`useEffect with setDismount called in GameStart`);
		setDismount(false);
	}, [setDismount]);

	useEffect(() => {
		// trigger type effect for messages if state changes
		if (message) handleHudSet(message);
	}, [message]);
/*
	useEffect(() => {
		dispatch({
			type: 'SET_MESSAGE',
			payload: `Awaiting orders, Admiral ${state.players.human.name}`,
		});
	}, [dispatch, state.players.human.name]);
*/
	useEffect(() => {
		playBgSound('bgSound', 0.7);
	}, [playBgSound]);

	const handleHudSet = (message) => {
		setHudMessage('');
		const messageArray = message.split('');
		let counter = 0;
		const messageDisplay = [];
		const typingMessageEmulator = setInterval(() => {
			messageDisplay.push(messageArray[counter]);
			setHudMessage(messageDisplay.join(''));
			counter++;
			if (counter >= messageArray.length) clearInterval(typingMessageEmulator);
		}, 30);
	};

	const handlePlayAgainClick = () => {
		dispatch({ type: 'RESET_GAME', payload: myname });
	};

	return (
		<>
			<GameStartContainer id="gameStartContainer">
				<HudWindow id="hudWindow">
					<p style={{ margin: 'auto' }}>{hudMessage}</p>
				</HudWindow>
				<LabelContainer row='4' id="labelContainer1">
					<h1 style={{ margin: 'auto auto 0' }}>Friendly waters</h1>
				</LabelContainer>
				<LabelContainer row='2' id="labelContainer2">
					<h1 style={{ margin: 'auto auto 0' }}>Enemy waters</h1>
				</LabelContainer>
				<FriendlyWatersGrid  id="friendlyWatersGrid"/>
				<EnemyWatersGrid playSound={playSound}  id="enemyWatersGrid"/>
				{winner ? <WinAgainButton onClick={handlePlayAgainClick}>Play Again</WinAgainButton> : null}
			</GameStartContainer>
		</>
	);
}

export default GameStart;
