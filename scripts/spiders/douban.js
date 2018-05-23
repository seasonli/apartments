const cheerio = require('cheerio')
const mongoose = require('mongoose')
const requestPromise = require('request-promise')

const ApartmentModel = require('../../models/Apartment')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/apartments')

async function getApartments(pageOffset) {
  const ops = {
    method: 'GET',
    uri: `http://www.douban.com/group/shanghaizufang/discussion?start=${pageOffset}`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    }
  }

  const res = await requestPromise(ops)

  const $ = cheerio.load(res)

  const list = []

  $('.article tr').map((i, el) => {
    const $a = $(el).find('td a')

    if (!$a.html()) {
      return
    }

    const title = $a.attr('title')
    const link = $a.attr('href')
    const vendorId = link.match(/(\d+)/)[1]

    list.push({vendorName: 'douban', vendorId, title, link})
  })

  return list
}

async function main() {
  const limit = 25
  const pendingTime = 3000

  let pageOffset = 0

  while (pageOffset < 5000) {
    console.log(`[get apartments start], offset => ${pageOffset}\n`)

    const list = await getApartments(pageOffset)
    console.log(`[get apartments finished], list => ${list.map(item => '\n' + item.title)}\n`)

    const docs = await ApartmentModel.insertMany(list)

    console.log(`[pending ${pendingTime}ms]\n`)
    await new Promise(resolve => setTimeout(() => {
      resolve()
    }, pendingTime))

    pageOffset += limit
  }
}

main()
