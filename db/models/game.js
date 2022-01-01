const Sequelize = require('sequelize')
const db = require('../db')

const Game = db.define('game', {
  game: {
    type: Sequelize.JSONB,
    defaultValue: Array(9).fill(null),
  },
  x: {
    type: Sequelize.STRING
  },
  o: {
    type: Sequelize.VIRTUAL,
    get() {
      return this.getDataValue('game').find(move => move !== this.getDataValue('x'))
    }
  },
  xIsNext: {
    type: Sequelize.VIRTUAL,
    get() {
      return this.getDataValue('game').filter(Boolean).length % 2 === 0
    }
  },
  result: {
    type: Sequelize.STRING
  },
})

module.exports = Game
