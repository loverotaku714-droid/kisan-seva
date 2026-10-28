// Sanity test for fallback-advice word matching (punctuation + unicode)
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function hasWord(q, word) {
  const norm = q.replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
  if (word.endsWith('*')) {
    return new RegExp(`(^|\\s)${escapeRe(word.slice(0, -1))}`).test(norm)
  }
  return ` ${norm} `.includes(` ${word} `)
}

const tests = [
  ['What is the tomato price?', 'price', true],
  ['What is the tomato price?', 'tomato', true],
  ['ಮಳೆ ಬರುತ್ತಾ?', 'ಮಳೆ*', true],
  ['ಈಗ ಮಳೆ ಬರುತ್ತಾ ಇಲ್ಲವೇ?', 'ಮಳೆ*', true],
  ['मंडी भाव क्या है?', 'मंडी', true],
  ['मेरी फसल में कीड़े लग गए', 'कीड़*', true],
  ['cotton rate।', 'rate*', true],
  ['hello', 'price', false],
  ['what is the cotton price today?', 'rice', false],
  ['i want to return the pump', 'tur', false],
]

let pass = 0
for (const [q, w, want] of tests) {
  const got = hasWord(q, w)
  if (got === want) { pass++; console.log('PASS', JSON.stringify(w), 'in', JSON.stringify(q)) }
  else console.log('FAIL', JSON.stringify(w), 'in', JSON.stringify(q), '->', got, 'want', want)
}
console.log(`${pass}/${tests.length} passed`)
