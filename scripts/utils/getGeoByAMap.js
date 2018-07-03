const requestPromise = require('request-promise')

async function getGeo(apartments) {
  let apartments_part_0 = apartments.slice(0, 10)
  let apartments_part_1 = apartments.slice(10)
  let ops = {
    method: 'POST',
    url: `http://restapi.amap.com/v3/batch?key=f4e1405b4d460fd07e403a4141b1075f`,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    },
    body: {
      ops: apartments_part_0.map(item => ({
        url: `/v3/geocode/geo?key=f4e1405b4d460fd07e403a4141b1075f&address=${encodeURIComponent(item.title)}&city=${encodeURIComponent('上海')}`
      }))
    },
    json: true
  }
  let res_0 = await requestPromise(ops)

  ops.body.ops = apartments_part_1.map(item => ({
    url: `/v3/geocode/geo?key=f4e1405b4d460fd07e403a4141b1075f&address=${encodeURIComponent(item.title)}&city=${encodeURIComponent('上海')}`
  }))
  let res_1 = await requestPromise(ops)

  res_0 = res_0.length ? res_0 : []
  res_1 = res_1.length ? res_1 : []

  const res = res_0.concat(res_1)

  apartments.forEach((item, i) => {
    item.geo = res[i].body.geocodes ? res[i].body.geocodes[0] : {}
  })

  return apartments
}

module.exports = getGeo
