const WEBHOOK_URL = 'https://hook.eu1.make.com/ltgg54tqfiycktex9gv359ykxjpwj2sq'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { rating, feedback } = JSON.parse(event.body)
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, feedback }),
    })
    return { statusCode: 200, body: 'ok' }
  } catch {
    return { statusCode: 500, body: 'error' }
  }
}
