const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  vendorName: {
    type: String,
    required: true
  },
  vendorId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  locations: {
    type: Array,
    required: true,
    default: []
  },
  createTime: {
    type: Date,
    default: Date.now
  }
})

schema.index({
  title: 1,
  createTime: 1
})

module.exports = mongoose.model('located_apartments', schema)
