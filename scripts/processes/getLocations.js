const mongoose = require('mongoose')
const requestPromise = require('request-promise')

const ApartmentModel = require('../../models/Apartment')
const LocatedApartmentModel = require('../../models/LocatedApartment')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/apartments')

async function getLocations(apartments) {
  const ops = {
    method: 'POST',
    uri: `http://api.bosonnlp.com/ner/analysis?sensitivity=2`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Token': 'FdbuAVcB.25835.WarfYwR9fWKK'
    },
    body: apartments.map(item => item.title),
    json: true
  }

  const res = await requestPromise(ops)

  res.forEach((item, i) => {
    const { word, entity } = item

    const locations = []

    entity.forEach(item => {
      if (item[2] === 'location') {
        let location = ''
        const start = item[0]
        const end = item[1]

        word.forEach((item, j) => {
          if (j >= start && j <= end) {
            location += item
          }
        })

        locations.push(location)
      }
    })

    apartments[i].locations = locations
  })

  return apartments
}

async function main() {
  let pageOffset = 480
  const limit = 30
  const pendingTime = 5000

  while (1) {
    let apartments = await ApartmentModel.find().skip(pageOffset).limit(limit)

    if (apartments.length === 0) {
      break
    }

    apartments = apartments.map(item => {
      const { _id, title, vendorId, vendorName, link } = item

      return {
        title,
        vendorId,
        vendorName,
        link
      }
    })

    console.log(`[get apartments locations start], titles => \n${apartments.map(item => item.title).join('\n')}\n`)

    apartments = await getLocations(apartments)
    console.log(`[get apartments locations start], locations => \n${apartments.map(item => item.locations.join('|')).join('\n')}\n`)

    const docs = await LocatedApartmentModel.insertMany(apartments)

    await new Promise(resolve => setTimeout(() => {
      resolve()
    }, pendingTime))

    pageOffset += apartments.length
  }
}

main().then(() => {
  console.log(`[task finished]`)
})
