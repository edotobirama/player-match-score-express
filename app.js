const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const db_path = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDb = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
  }
}

initializeDb()

app.get('/players/', async (request, response) => {
  const query = `
        SELECT * 
        FROM player_details;
    `
  const tempObj = await db.all(query)
  let respObj = tempObj.map(x => {
    return {
      playerId: x.player_id,
      playerName: x.player_name,
    }
  })
  response.send(respObj)
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const query = `
        SELECT * 
        FROM player_details
        WHERE player_id = ${playerId};
    `
  const tempObj = await db.get(query)
  const respObj = {
    playerId: tempObj.player_id,
    playerName: tempObj.player_name,
  }
  response.send(respObj)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const query = `
        UPDATE player_details
        SET player_name = "${playerName}"
        WHERE player_id = ${playerId};
    `
  await db.get(query)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const query = `
        SELECT * 
        FROM match_details
        WHERE match_id = ${matchId};
    `
  const tempObj = await db.get(query)
  const respObj = {
    matchId: tempObj.match_id,
    match: tempObj.match,
    year: tempObj.year,
  }
  response.send(respObj)
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const query = `
        SELECT match_details.match_id AS matchId , match ,year
        FROM (player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id) AS t JOIN match_details ON 
        match_details.match_id = player_match_score.match_id
        WHERE player_details.player_id = ${playerId};
    `
  const tempObj = await db.all(query)

  response.send(tempObj)
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const query = `
        SELECT player_details.player_id AS playerId , player_details.player_name AS playerName 
        FROM player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE player_match_score.match_id = ${matchId};
    `
  const tempObj = await db.all(query)

  response.send(tempObj)
})

app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const {playerId} = request.params
  const query = `
        SELECT player_details.player_id AS playerId , player_details.player_name AS playerName ,sum(player_match_score.score) AS totalScore, sum(player_match_score.fours) AS totalFours, sum(player_match_score.sixes) AS totalSixes
        FROM player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        GROUP BY player_details.player_id
        HAVING player_details.player_id = ${playerId};
        
    `
  const tempObj = await db.get(query)

  response.send(tempObj)
})

module.exports = app
