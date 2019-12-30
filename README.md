# gitee-webhook-pro

Gitee allows you to register **[Webhooks](https://gitee.com/help/categories/40)** for your repositories. Each time an event occurs on your repository, whether it be pushing code, filling issues or creating pull requests, the webhook address you register can be configured to be pinged with details.

This library is a fork of [github-webhook-handler](https://github.com/rvagg/github-webhook-handler) and [gitee-webhook-middleware](https://github.com/Victor-H5/gitee-webhook-middleware) . It is a small handler (or "middleware" if you must) for Node.js web servers that handles all the logic of receiving and verifying webhook requests from Gitee.

if you have any questions, please submit an issue.

## Install

`npm install gitee-webhook-pro` 

or

`yarn add gitee-webhook-pro`

## Example

```js
var http = require('http')
var createHandler = require('gitee-webhook-pro')
// multiple-handlers 支持传入数组对象形式，监听一个端口根据path判断来执行不同的脚本（也可以传入一个对象）
var handler = createHandler([
  {
      path: '/front',
      token: 'mytoken'
  },
   {
      path: '/backend',
      token: 'mytoken'
  }
])
function run_cmd(cmd, args, callback) {
  var spawn = require('child_process').spawn;
  var child = spawn(cmd, args);
  var resp = "";
  child.stdout.on('data', function(buffer) { resp += buffer.toString(); });        
  child.stdout.on('end', function() { callback (resp) });
}
http.createServer(function(req, res) {
  handler(req, res, function(err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(6666)

handler.on('error', function(err) {
  console.error('Error:', err.message)
})

handler.on('*', function(event) {
  console.log(event.event)
  console.log(event.payload)
  console.log(event.protocol)
  console.log(event.host)
  console.log(event.url)
})

handler.on('Push Hook', function(event) {
  console.log(event)
  if (event.url === '/front'){ run_cmd('sh', ['./front.sh'], function (text) { console.log(text) }) }
  if (event.url === '/backend'){ run_cmd('sh', ['./backend.sh'], function (text) { console.log(text) }) }
})

```

## License

MIT