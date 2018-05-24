const requestPromise = require('request-promise')

async function getGeo(apartments) {
  const ops = {
    method: 'POST',
    url: `http://restapi.amap.com/v3/batch?key=f4e1405b4d460fd07e403a4141b1075f`,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    },
    body: {
      ops: apartments.map(item => ({
        url: `/v3/geocode/geo?key=f4e1405b4d460fd07e403a4141b1075f&address=${encodeURIComponent(item.title)}&city=${encodeURIComponent('上海')}`
      }))
    },
    json: true
  }

  const res = await requestPromise(ops)
  apartments.forEach((item, i) => {
    item.geo = res[0].body.geocodes[0]
  })

  return apartments
}

module.exports = getGeo
