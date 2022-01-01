const router = require('express').Router()
const { Game } = require('../db/models')

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]

let X = 'john'

const threeInARow = ({ game }, user) => {
    const plays = Object.entries(game).filter(i => i[1] && i[1].includes(user)).map(([i]) => +i)
    return winPatterns.map(t => t.every(s => plays.includes(s))).some(Boolean)
}
const numMovesMade = ({ game }) => game.filter(Boolean).length
const checkWin = (game, user) => { if (threeInARow(game, user)) game.result = user }
const checkCats = (game) => { if (!game.result && numMovesMade(game) === 9) game.result = 'cats' }
const userIsNext = (game, user) => {
    if (!game) return null
    const { x, xIsNext } = game
    return user === x ? xIsNext : !xIsNext
}
const isValidSquare = ({ game }, square) => !game[square] && square > -1 && square < 9
const makeMove = (game, user, square) => {
    const newGame = [...game.game]
    newGame[square] = user + "-" + numMovesMade(game)
    game.game = newGame
}
const takeTurn = async (game, user, square) => {
    if (userIsNext(game, user) && isValidSquare(game, square)) {
        makeMove(game, user, square)
        checkWin(game, user)
        checkCats(game)
        await game.save()
    }
}

const xOrO = (bool) => bool ? 'X' : 'O'
const userMarker = (game, user) => xOrO(game.x === user.split("-")[0])
const turnKey = (game) => xOrO(game.xIsNext)
const mapTurnToXorO = (game, user) => user ? userMarker(game, user) : 'N'
const mapGameToXsAndOs = (game) => game.game.map(user => mapTurnToXorO(game, user))
const formatGame = (game) => turnKey(game) + mapGameToXsAndOs(game).join("")

router.get('/reset', async (req, res) => {
    try {
        await Game.destroy({ where: {}, truncate: true })
        res.send([])
    }
    catch (err) {
        console.log(err)
    }
})

router.get('/games', async (req, res) => {
    try {
        const games = await Game.findAll()
        res.send(games)
    }
    catch (err) {
        console.log(err)
    }
})

router.get('/stats', async (req, res) => {
    try {
        const games = await Game.findAll()
        const john = games.filter(game => game.result === 'john').length
        const lee = games.filter(game => game.result === 'lee').length
        const cats = games.filter(game => game.result === 'cats').length
        res.send({
            total: games.length,
            john,
            lee,
            cats,
        })
    }
    catch (err) {
        console.log(err)
    }
})

router.get('/:user', async ({ params: { user } }, res) => {
    try {
        const [game, newGame] = await Game.findOrCreate({ where: { result: null } })
        if (newGame) {
            game.x = X
            X = X === 'john' ? 'lee' : 'john'
            await game.save()
        }
        res.send(userIsNext(game, user) ? formatGame(game) : null)
    }
    catch (err) {
        console.log(err)
    }
})

router.get('/:user/:square', async ({ params: { user, square } }, res) => {
    try {
        const game = await Game.findOne({ where: { result: null } })
        takeTurn(game, user, square)
        res.send(game ? formatGame(game) : null)
    }
    catch (err) {
        console.log(err)
    }
})


module.exports = router
