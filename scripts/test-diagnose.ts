import { readFileSync } from 'fs'

const base64 = readFileSync('/home/z/my-project/scripts/test-leaf.png').toString('base64')

const res = await fetch('http://localhost:3000/api/diagnose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: base64,
    mimeType: 'image/png',
    note: 'My tomato plant leaves have spots',
    language: 'en',
  }),
})

const data = await res.json()
console.log('HTTP', res.status)
console.log(JSON.stringify(data, null, 2))
