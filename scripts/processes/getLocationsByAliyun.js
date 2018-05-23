const mongoose = require('mongoose')
const requestPromise = require('request-promise')
const crypto = require('crypto')
const url = require('url')

const ApartmentModel = require('../../models/Apartment')
const LocatedApartmentModel = require('../../models/LocatedApartment')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/apartments')

function md5(buffer) {
  let hash

  hash = crypto.createHash('md5')
  hash.update(buffer)

  return hash.digest('base64')
}

function sha1(stringToSign, secret) {
  let signature

  return signature = crypto.createHmac('sha1', secret).update(stringToSign).digest().toString('base64')
}

async function getLocations(apartments) {
  const uuid = Math.random()

  const ops = {
    method: 'POST',
    url: `http://nlp.cn-shanghai.aliyuncs.com/nlp/api/entity/ecommerce`,
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'date': new Date().toUTCString(),
      'host': 'nlp.cn-shanghai.aliyuncs.com',
      'x-acs-signature-nonce': uuid,
      'x-acs-signature-method': 'HMAC-SHA1'
    },
    body: JSON.stringify({
      text: apartments[0].title
    })
  }

  const body = ops.body
  const bodymd5 = md5(Buffer.from(body))
  const headerStringToSign = `${ops.method}\n${ops.headers.accept}\n${bodymd5}\n${ops.headers['content-type']}\n${ops.headers.date}\nx-acs-signature-method:HMAC-SHA1\nx-acs-signature-nonce:${uuid}\n`
  const resourceStringToSign = '/nlp/api/entity/ecommerce'
  const stringToSign = headerStringToSign + resourceStringToSign
  const signature = sha1(stringToSign, '9m79WSf8aJCxKsiLcJWgJsASCx9jsC')
  const authHeader = 'acs ' + 'LTAISPq3y2Jk0vd3:' + signature

  ops.headers['content-md5'] = bodymd5
  ops.headers.Authorization = authHeader

  const res = await requestPromise(ops)

  const words = JSON.parse(res).data

  const locations = []

  let lastIsLocation = false

  words.forEach(item => {
    let word = ''

    if (item.tag === '地点地域') {
      if (!lastIsLocation) {
        if (word) {
          locations.push(word)
        }

        word = item.word
      } else {
        word += item.word
      }
    }

    if (word) {
      locations.push(word)
    }
  })

  return [{
    ...apartments[0],
    locations
  }]
}

async function main() {
  let pageOffset = 0
  const limit = 1
  const pendingTime = 300

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

    console.log(`[get apartments locations start], titles => \n${apartments.map(item => item.title).join('\n')}`)

    apartments = await getLocations(apartments)
    console.log(`[get apartments locations start], locations => \n${apartments.map(item => item.locations.join('|')).join('\n')}\n`)

    await LocatedApartmentModel.insertMany(apartments)

    await new Promise(resolve => setTimeout(() => {
      resolve()
    }, pendingTime))

    pageOffset += apartments.length
  }
}

main().then(() => {
  console.log(`[task finished]`)
})
