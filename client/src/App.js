import React from 'react';
import GameWindow from './components/game_window/GameWindow';
import HeaderComponent from './components/header/Header';
import {
	StyledApp,
	Header,
	GameWindowContainer,
} from './components/styled_components/appStyles';
import GameController from './GameController';

function App() {
	return (
		<GameController id="controller">
			<StyledApp id="styledapp">
				<HeaderComponent id="header">
					<Header />
				</HeaderComponent>
				<GameWindowContainer id="gwcontainer">
					<GameWindow id="gw" />
				</GameWindowContainer>
			</StyledApp>
		</GameController>
	);
}

export default App;
