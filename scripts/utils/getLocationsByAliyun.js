const requestPromise = require('request-promise')
const crypto = require('crypto')
const url = require('url')

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

module.exports = getLocations
