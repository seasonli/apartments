const mongoose = require('mongoose')
const requestPromise = require('request-promise')

const ApartmentModel = require('../../models/Apartment')
const GeoApartmentModel = require('../../models/GeoApartment.js')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/apartments')

async function getGeo(apartments) {
  const uuid = Math.random()

  const ops = {
    method: 'GET',
    url: `http://restapi.amap.com/v3/geocode/geo?key=f4e1405b4d460fd07e403a4141b1075f&address=${encodeURIComponent(apartments[0].title)}&city=${encodeURIComponent('上海')}`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    },
    json: true
  }

  const res = await requestPromise(ops)
  const geo = res.geocodes[0]

  return [{
    ...apartments[0],
      geo
  }]
}

async function main() {
  let pageOffset = 0
  const limit = 1
  const pendingTime = 10

  while (1) {
    let apartments = await ApartmentModel.find().skip(pageOffset).limit(limit)

    if (apartments.length === 0) {
      break
    }

    apartments = apartments.map(item => {
      const {
        title, vendorId, vendorName, link
      } = item

      return {
        title,
        vendorId,
        vendorName,
        link
      }
    })

    console.log(`[get apartments locations start], titles => \n${apartments.map(item => item.title).join('\n')}`)

    apartments = await getGeo(apartments)
    console.log(`[get apartments locations start], locations => \n${apartments.map(item => JSON.stringify(item.geo))}\n`)

    await GeoApartmentModel.insertMany(apartments)

    await new Promise(resolve => setTimeout(() => {
      resolve()
    }, pendingTime))

    pageOffset += apartments.length
  }
}

main().then(() => {
  console.log(`[task finished]`)
})
