const requestPromise = require('request-promise')

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

module.exports = getLocations
