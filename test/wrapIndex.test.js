/**
 * @flow
 * @prettier
 */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { wrapIndex } from '../src/layoutColumns'

describe(`wrapIndex`, function () {
  for (const [s, maxWidth, expected] of [
    ['abc-def', 5, 4],
    ['abcdefghijk', 5, 5],
    ['abcdef', 5, 5],
    ['abcd', 5, 4],
    ['', 5, 0],
    ['      ', 5, 5],
    ['-=-=2=3', 5, 4],
    ['abc def', 5, 4],
    ['abc  def', 5, 5],
    ['ab def', 5, 3],
    ['AbcDef', 5, 3],
    ['Abc0ef', 5, 4],
    ['Abc05f', 5, 5],
    ['Abc 3-fjklskjdf', 10, 4],
  ]) {
    it(`${s} ${maxWidth} ${expected}`, function () {
      expect(wrapIndex(s, maxWidth)).to.equal(expected)
    })
  }
})
