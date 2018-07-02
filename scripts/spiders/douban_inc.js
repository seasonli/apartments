const cheerio = require('cheerio')
const mongoose = require('mongoose')
const requestPromise = require('request-promise')

const GeoApartmentModel = require('../../models/GeoApartment')
const getGeoByAMap = require('../utils/getGeoByAMap')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/apartments')

async function getApartments(pageOffset) {
  const ops = {
    method: 'GET',
    uri: `http://www.douban.com/group/shanghaizufang/discussion?start=${pageOffset}`,
    headers: {
      Cookie: 'dbcl2="4488641:+ZS00vhF/iE"',
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

    const title = $a.attr('title').trim()
    const link = $a.attr('href').trim()
    const vendorId = link.match(/(\d+)/)[1].trim()

    list.push({
      vendorName: 'douban',
      vendorId,
      title,
      link
    })
  })

  return list
}

async function main() {
  const limit = 25
  const pendingTime = 2000

  let pageOffset = 0

  while (pageOffset < 5000) {
    try {
      console.log(`[get apartments start], offset => ${pageOffset}`)

      let list = await getApartments(pageOffset)
      const docs = await GeoApartmentModel.find({
        $or: [{
          title: {
            $in: list.map(item => item.title)
          }
        }, {
          link: {
            $in: list.map(item => item.link)
          }
        }]
      }, ['link'])

      list = list.filter(item => {
        return docs.map(item => item.title).indexOf(item.title) < 0 && docs.map(item => item.link).indexOf(item.link) < 0
      })
      const uniquedList = []

      list.forEach(item => {
        if (uniquedList.map(item => item.title).indexOf(item.title) < 0) {
          uniquedList.push(item)
        }
      })
      console.log(`[get apartments and remove dupulicated finished], list => `)
      if (uniquedList.length > 0) {
        console.log(`${uniquedList.map(item => item.title).join('\n')}`)
      }

      const apartments = await getGeoByAMap(uniquedList)
      await GeoApartmentModel.insertMany(apartments)

      pageOffset += limit
    } catch (ex) {
      console.log(`[Exception] => ${ex}`)
    } finally {
      console.log(``)

      await new Promise(resolve => setTimeout(() => {
        resolve()
      }, pendingTime))
    }
  }
}

main()
