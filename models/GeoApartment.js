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
  geo: {
    type: Object,
    required: true,
    default: {}
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

module.exports = mongoose.model('geo_apartments', schema)
