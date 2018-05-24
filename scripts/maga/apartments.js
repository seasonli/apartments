const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const GeoApartmentModel = require('../../models/GeoApartment.js')
const Json2csvParser = require('json2csv').Parser
const opn = require('opn')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/apartments')

async function main() {
  const docs = await GeoApartmentModel.find({
    'geo': {
      $ne: {}
    }
  })

  const fields = ['geo.district', 'title', 'link']
  const opts = {
    fields
  }

  try {
    const parser = new Json2csvParser(opts)
    const csv = parser.parse(docs)
    const filePath = path.resolve(process.cwd(), 'apartments.csv')

    fs.writeFileSync(filePath, csv)

    opn(`file://${filePath}`, {
      app: 'numbers'
    })

  } catch (err) {
    console.error(err)

    return
  }
}

main()
