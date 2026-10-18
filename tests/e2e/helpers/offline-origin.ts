import { createServer } from 'node:http'

export async function createOfflineOrigin(upstreamUrl: string) {
  let online = true
  const server = createServer(async (request, response) => {
    if (!online) {
      request.socket.destroy()
      return
    }

    const requested = new URL(request.url ?? '/', 'http://localhost')
    const target = new URL(upstreamUrl)
    target.pathname = requested.pathname
    target.search = requested.search

    try {
      const upstream = await fetch(target)
      response.statusCode = upstream.status
      const contentType = upstream.headers.get('content-type')
      if (contentType) response.setHeader('content-type', contentType)
      response.end(Buffer.from(await upstream.arrayBuffer()))
    } catch (error) {
      console.error(
        'Offline test origin could not fetch the production asset.',
        error,
      )
      response.writeHead(502).end('Production asset request failed.')
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('The offline test origin did not receive a TCP port.')
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    disconnect() {
      online = false
      server.closeAllConnections()
    },
    async close() {
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    },
  }
}
