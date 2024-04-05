var express = require('express');
var placeComputerShips = require('../helpers/placeComputerShips');
var placeMyShips = require('../helpers/placeMyShips');
var computerAI = require('../helpers/computerAI');

var router = express.Router();

let data = {users: {}};
// data = {
//   users: {
//     TONG: {
//       lastAccess: date,
//       status: enum, // Idle, Challeging, Challenged, Accepted, Rejected, PlacingShips, Playing, Won, Lost
//       opponent: , // all upper case, except computer
//       myturn: boolean
//
//       ships: {},
//       gameBoard: {
//         board: []
//       },
//       computer: {
//         ships: {},
//         gameBoard: {
//           board: []
//         }
//       }
//     }
//   }
// }

router.post('/getOpponentBoard', function(req, res) {
  // {name}
  // return {ready, myturn, opponentBoard: {ships, gameBoard}}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  if (context.opponentName === 'COMPUTER') {
    context.userData.myturn = true;
    res.send({ready: true, myturn: true, opponentStatus: 'Playing', opponentBoard: context.userData.computer});
    return;
  }

  if (context.opponentData.status !== 'Playing') {
    res.send({ready: false, message: `${context.opponentName} is not ready to play yet`});
    return;
  }

  res.send({ready: true, myturn: context.userData.myturn, opponentBoard: {ships: context.opponentData.ships, gameBoard: context.opponentData.gameBoard}});
});

router.post('/getChallengeStatus', function(req, res) {
  // {name}
  // return {status, opponent}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context)) {
    return;
  }

  //userData.lastAccess = Date.now();
  res.send({status: context.userData.status, opponent: context.userData.opponent});
});

// only Rejected user can be reset right now
router.post('/resetChallengeStatus', function(req, res) {
  // {name}
  // return {oldStatus, status}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context)) {
    return;
  }

  let oldStatus = context.userData.status;
  if (oldStatus != 'Rejected' && oldStatus != 'Accepted') {
    res.status(406).send({message: `User ${context.userName} was not Accepted or Rejected`});
    return;
  }

  context.userData.status = (oldStatus === 'Rejected') ? 'Idle' : 'PlacingShips';

  //userData.lastAccess = Date.now();
  res.send({status: context.userData.status, oldStatus: oldStatus});
});

router.post('/getChallengeableOpponents', function(req, res) {
  // {name}
  // return {opponents: []}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context)) {
    return;
  }

  let opponents = Object.entries(data.users).reduce((result, user) => {
    if (user[0] != context.userName && isUserAvailable(user[1].status)) {      
      result.push(user[0]);
    }
    return result;
  }, []);
  opponents.push('computer');

  //console.log(opponents);
  res.send({opponents: opponents});
});

router.post('/acceptChallenge', function(req, res) {
  // {name}
  // return {status, opponent}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  if (context.userData.status !== 'Challenged') {
    res.status(405).send({message: `User ${context.userName} is not being challenged`});
    return;
  }

  //userData.lastAccess = Date.now();
  context.userData.status = 'PlacingShips';
  context.opponentData.status = 'Accepted';
  context.userData.myturn = true;
  context.opponentData.myturn = false;

  res.send({status: 'PlacingShips', opponent: context.opponentName, message: 'All set, let the game begin'});
});

router.post('/rejectChallenge', function(req, res) {
  // {name}
  // return {status, opponent}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  if (context.userData.status != 'Challenged') {
    res.status(405).send({message: `User ${context.userName} is not being challenged`});
    return;
  }

  if (context.opponentData.status != 'Challenging' || context.opponentData.opponent != context.userName) {
    res.status(405).send({message: `User ${context.opponentName} is not challenging you`});
    return;
  }

  //userData.lastAccess = Date.now();
  context.userData.status = 'Idle';
  context.opponentData.status = 'Rejected';

  res.send({status: 'Idle', opponent: context.opponentName, message: 'You rejected the challenge.'});
});

router.post('/challenge', function(req, res) {
  // {name, opponent}
  // return {status: accepted/rejected/waiting}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context)) {
    return;
  }

  let userStatus = context.userData.status;
  if (!isUserAvailable(userStatus)) {
    res.status(405).send({message: `User ${context.userName} is busy`});
    return;
  }

  let opponentName = reqbody.opponent.toUpperCase();
  if (opponentName == 'COMPUTER') {
    //userData.lastAccess = Date.now();
    context.userData.status = 'Accepted';
    context.userData.opponent = opponentName;
    res.send({status: 'Accepted', opponent: opponentName});
    return;
  }

  let opponentData = data.users[opponentName];
  if (!opponentData) {
    res.status(404).send({message: `User ${opponentName} not found`});
    return false;
  }

  if (!isUserAvailable(opponentData.status)) {
    res.status(405).send({message: `User ${opponentName} is busy`});
    return;
  }

  //userData.lastAccess = Date.now();
  context.userData.status = 'Challenging';
  context.userData.opponent = opponentName;

  opponentData.status = 'Challenged';
  opponentData.opponent = context.userName;

  res.send({status: 'Challenging', opponent: opponentName});
});
/*
router.post('/getEnemyShot', function(req, res) {
  // {name}
  // return {location: location, hit: true/false, sunk: true/false, hitShip:{...}, won: true/false}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  let userData = context.userData;
  //userData.lastAccess = Date.now;
  let location = computerAI(userData);
  let result = {location: location};

  const myBoard = userData.gameBoard;
  myBoard.fireShot(location);
  let hitShipName = myBoard.checkIfShotHit(location);

  if (!hitShipName) {
    result.hit = false;
  } else {
    result.hit = true;
    const hitShip = userData.ships.find(
      (ship) => ship.name === hitShipName
    );
    hitShip.hit(location);
    result["hitShip"] = hitShip;

    result["sunk"] = hitShip.isSunk();
    if (result["sunk"]) {
      if (userData.ships.every((ship) => ship.isSunk())) {
        result["won"] = true;
        userData.status = 'Idle';
      }
    }
  }

  res.send(result);
});
*/

router.post('/resetStatusAfterGame', function(req, res) {
  // {name}
  // return {status, oldStatus}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context)) {
    return;
  }

  let oldStatus = context.userData.status;
  if (oldStatus != 'Won' && oldStatus != 'Lost') {
    res.status(406).send({message: `User ${context.userName} was not Won or Lost`});
    return;
  }

  context.userData.status = 'Idle';

  //userData.lastAccess = Date.now();
  res.send({status: context.userData.status, oldStatus: oldStatus});
});

const applyShot = (location, player) => {
  // return {hit: true/false, sunk: true/false, hitShip:{...}, won: true/false}
  let result = {location: location};
  const gameBoard = player.gameBoard;
  gameBoard.fireShot(location);
  let hitShipName = gameBoard.checkIfShotHit(location);

  if (!hitShipName) {
    result.hit = false;
    return result;
  }

  result.hit = true;
  const hitShip = player.ships.find(
    (ship) => ship.name === hitShipName
  );
  hitShip.hit(location);
  result["hitShip"] = hitShip;

  result["sunk"] = hitShip.isSunk();
  if (result["sunk"]) {
    if (player.ships.every((ship) => ship.isSunk())) {
      result["won"] = true;
    }
  }
  return result;
};

router.post('/getOpponentShot', function(req, res) {
  // {name}
  // return {ready, over, opponentShot: {location: location, hit: true/false, sunk: true/false, hitShip:{...}, won: true/false}}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  if (context.userData.status === 'Won' || context.userData.status === 'Lost') {
    res.send({ready: false, over: true});
    return;
  }

  // if opponent is computer, generate shot now
  if (context.opponentName === 'COMPUTER') {
    let location = computerAI(context.userData);
    let result = applyShot(location, context.userData);
    context.userData.opponentShot = result;
    context.userData.myturn = true;
    if (result.won) {
      context.userData.status = 'Lost';
    }
    res.send({ready: true, opponentShot: result});
    return;
  }

  if (!context.userData.myturn) {
    res.send({ready: false});
    return;
  }

  if (context.userData.opponentShot.won) {
    context.userData.status = 'Lost';
  }

  res.send({ready: true, opponentShot: context.userData.opponentShot});
});

router.post('/fireShot', function(req, res) {
  // {name, location}
  // return {hit: true/false, sunk: true/false, hitShip:{...}, won: true/false}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  if (!reqbody.location && reqbody.location !== 0) {
    res.status(400).send({message: "Missing location"});
    return;
  }

  let result;
  if (context.opponentName === 'COMPUTER') {
    result = applyShot(reqbody.location, context.userData.computer);
  } else {
    result = applyShot(reqbody.location, context.opponentData);
    context.opponentData.opponentShot = result;
    context.opponentData.myturn = true;
  }

  context.userData.myturn = false;

  if (result.won) {
    context.userData.status = 'Won';
  }

  res.send(result);
});
/*
router.post('/placeServerComputerShips', function(req, res) {
  //console.log(req);
  let reqbody = req.body;
  if (!reqbody.name) {
    res.status(400).send({message: "Missing user name"});
  } else {
    //userData.lastAccess = Date.now;
    let userData = data.users[reqbody.name.toUpperCase()];
    if (userData) {
      let computerInfo = placeComputerShips();
      //console.log(computerInfo);
      userData.computer = computerInfo;
      res.send({message: "Ships placed for computer successfully", computer: computerInfo});
    } else {
      res.status(404).send({message: `User ${req.body.name} not found`});
    }
  }
});
*/
router.post('/placeMyShips', function(req, res) {
  // {name, ships, gameBoard}
  let context = {};
  let reqbody = req.body;
  if (!addUserData(reqbody, res, context) || !addOpponentData(reqbody, res, context)) {
    return;
  }

  //userData.lastAccess = Date.now;
  placeMyShips(reqbody, context.userData);
  context.userData.status = 'Playing';

  if (context.opponentName === 'COMPUTER') {
    context.userData.computer = placeComputerShips();
    context.userData.myturn = true;
  }

  res.send({status: context.userData.status, message: "My ships placed successfully"});
});

let resetUser = (userData) => {
  //userData.lastAccess = Date.now();
  userData.status = "Idle";
  //userData.ships = [];
  delete userData["gameBoard"];
  delete userData["computer"];
};

router.post('/login', function(req, res) {
  let reqbody = req.body;
  if (!reqbody.name) {
    res.status(400).send({message: "Missing user name"});
    return;
  }
  let userName = reqbody.name.toUpperCase();
  if (data.users.hasOwnProperty(userName)) {
    let userData = data.users[userName];
    if (userData.status && !isUserAvailable(userData.status)) {
      console.log(userData);
      res.status(409).send({ message: `${userName} already logged in and cannot be reset` });
    }
    resetUser(data.users[userName]);
    res.send({ message: `${userName} already logged in but reset now` });
  } else {
    data.users[userName] = {status: 'Idle'};
    //userData.lastAccess = Date.now();
    res.send({ message: `Login successful for ${userName}` });
  }
});

router.post('/logout', function(req, res) {
  //console.log(req);
  let userName = req.body.user;
  //console.log(userName);
  if (data.users.hasOwnProperty(userName)) {
    delete data.users[userName];
    console.log(data.users);
    res.send({ message: `${userName} removed` });
  } else {
    res.status(404).send({ message: `${userName} deos not exist` });
  }
});

router.get('/', function(req, res, next) {
  console.log(req);
  res.send({ mode: 'Server reached' });
});

const addUserData = (reqbody, res, context) => {
  if (!reqbody.name) {
    res.status(400).send({message: "Missing user name"});
    return false;
  }

  context.userName = reqbody.name.toUpperCase();
  context.userData = data.users[context.userName];
  if (!context.userData) {
    res.status(404).send({message: `User ${reqbody.name} not found`});
    return false;
  }

  return true;
};

const addOpponentData = (reqbody, res, context) => {
  context.opponentName = context.userData.opponent;
  if (!context.opponentName) {
    res.status(410).send({message: `Opponent missing for user ${context.userName}`});
    return false;
  }

  if (context.opponentName === 'COMPUTER') {
    return true;
  }

  context.opponentData = data.users[context.opponentName];
  if (!context.opponentData) {
    res.status(404).send({message: `User ${context.opponentName} not found`});
    return false;
  }

  return true;
};

const isUserAvailable = (status) => {
  return status === 'Idle' || status === 'Won' || status === 'Lost' ||  status === 'Rejected' ;
};

module.exports = router;
