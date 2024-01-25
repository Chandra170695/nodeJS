const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

app.get("/players/:playersId/", async (request, response) => {
  const { playersId } = request.params;
  const getPlayerQuery = `SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playersId};`;
  const player = await db.get(getPlayerQuery);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const particularMatch = await db.get(getMatchQuery);
  response.send({
    matchId: particularMatch.match_id,
    match: particularMatch.match,
    year: particularMatch.year,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name='${playerName}'
    WHERE
      player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchIdQuery = `
    SELECT
        player_match_score.match_id
    FROM
        player_match_score NATURAL JOIN match_details
    WHERE
        player_id = ${playerId};`;

  const matches = await db.all(getMatchIdQuery);
  const allMatchDetails = [];
  for (let eachMatch of matches) {
    const { match_id } = eachMatch;
    const specificMatchesQuery = `SELECT 
            *
        FROM 
            match_details
        WHERE
            match_id = ${match_id};`;
    let matchDetails = await db.get(specificMatchesQuery);
    allMatchDetails.push({
      matchId: matchDetails.match_id,
      match: matchDetails.match,
      year: matchDetails.year,
    });
  }
  response.send(allMatchDetails);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerIdQuery = `
    SELECT
      player_match_score.player_id
    FROM
      player_match_score NATURAL JOIN match_details
    WHERE
      match_id = ${matchId};`;
  const playerIdDetails = await db.all(getPlayerIdQuery);
  const allPlayerDetails = [];
  for (let eachPlayer of playerIdDetails) {
    const { player_id } = eachPlayer;
    const specificPlayersQuery = `SELECT 
            *
        FROM 
            player_details
        WHERE
            player_id = ${player_id};`;
    let playerDetails = await db.get(specificPlayersQuery);
    allPlayerDetails.push({
      playerId: playerDetails.player_id,
      playerName: playerDetails.player_name,
    });
  }

  response.send(allPlayerDetails);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStats = `SELECT 
    player_match_score.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
  FROM
    player_match_score INNER JOIN player_details ON
    player_match_score.player_id = player_details.player_id
  WHERE player_match_score.player_id = ${playerId};`;

  const playerScores = await db.all(playerStats);
  response.send(playerScores);
});
module.exports = app;
