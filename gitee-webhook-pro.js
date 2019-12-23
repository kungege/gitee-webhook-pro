const EventEmitter = require('events')
const bl = require('bl')

function findHandler (url, arr) {
  if (!Array.isArray(arr)) {
    return arr
  }

  let ret = arr[0]
  for (let i = 0; i < arr.length; i++) {
    if (url === arr[i].path) {
      ret = arr[i]
    }
  }

  return ret
}

/**
* types check
* @param {object} options handler object
*/

function checkType (options) {
  if (typeof options !== 'object') {
    throw new TypeError('must provide an options object')
  }

  if (typeof options.path !== 'string') {
    throw new TypeError('must provide a \'path\' option')
  }

  if (typeof options.token !== 'string') {
    throw new TypeError('must provide a \'token\' option')
  }
}

function create (initOptions) {
  let options
  // validate type of options
  if (Array.isArray(initOptions)) {
    for (let i = 0; i < initOptions.length; i++) {
      checkType(initOptions[i])
    }
  } else {
    checkType(initOptions)
  }

  // make it an EventEmitter
  Object.setPrototypeOf(handler, EventEmitter.prototype)
  EventEmitter.call(handler)

  return handler

  function handler (req, res, callback) {
    let events

    options = findHandler(req.url, initOptions)

    if (typeof options.events === 'string' && options.events !== '*') {
      events = [options.events]
    } else if (Array.isArray(options.events) && options.events.indexOf('*') === -1) {
      events = options.events
    }

    if (req.url !== options.path || req.method !== 'POST') {
      return callback()
    }

    function hasError (msg) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: msg }))

      const err = new Error(msg)

      handler.emit('error', err, req)
      callback(err)
    }
    const agent = req.headers['user-agent'], // # 固定为 git-oschina-hook，可用于标识为来自 gitee 的请求
    token = req.headers['x-gitee-token'], // # 用户新建 WebHook 时提供的密码或根据提供的签名密钥计算后的签名
    event = req.headers['x-gitee-event'] //  # 标识触发的钩子类型

    if (agent !== 'git-oschina-hook')
      return hasError('Invalid User-Agent')

    if (!event)
      return hasError('No X-Gitee-Event found on request')

    if (token !== options.token)
      return hasError('The token does not match')
  
    if (events && events.indexOf(event) == -1)
      return hasError('X-Gitee-Event is not acceptable')

    req.pipe(bl(function (err, data) {
      if (err) {
        return hasError(err.message)
      }

      let obj

      try {
        obj = JSON.parse(data.toString())
      } catch (e) {
        return hasError(e)
      }

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}')

      const emitData = {
        event: event,
        payload: obj,
        protocol: req.protocol,
        host: req.headers.host,
        url: req.url,
        path: options.path
      }

      handler.emit(event, emitData)
      handler.emit('*', emitData)
    }))
  }
}


module.exports = create